// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Minimal server-side PostHog capture via HTTP.
 * - Uses env vars you likely already have:
 *   POSTHOG_KEY or NEXT_PUBLIC_POSTHOG_KEY
 *   POSTHOG_HOST or NEXT_PUBLIC_POSTHOG_HOST (defaults to https://app.posthog.com)
 * - Uses `uuid` for dedupe (we pass Stripe event.id).
 */
async function posthogCapture(opts: {
  distinctId: string;
  event: string;
  properties?: Record<string, any>;
  uuid?: string;
}) {
  const apiKey = process.env.POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;

  const host =
    (process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com").replace(/\/+$/, "");

  const payload = {
    api_key: apiKey,
    event: opts.event,
    distinct_id: opts.distinctId,
    properties: {
      ...(opts.properties || {}),
      source: "stripe_webhook",
    },
    // PostHog uses `uuid` for event de-duplication
    uuid: opts.uuid,
  };

  try {
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // keepalive helps in some runtimes, harmless otherwise
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Never fail the webhook because analytics failed
    console.warn("posthog server capture failed:", err);
  }
}

// Stripe REQUIRES raw body for signature verification
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const body = await req.text();

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Stripe webhook signature failed", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.client_reference_id as string | null;
        const subscriptionId = session.subscription as string | null;

        if (!userId || !subscriptionId) break;

        // Load current user so we can detect free -> pro transition
        const existingUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!existingUser) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);

        const item = sub.items.data[0];
        const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : null;

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "pro",
            stripeSubscriptionId: sub.id,
            stripeStatus: sub.status,
            stripePriceId: item?.price?.id ?? null,
            currentPeriodEnd: periodEnd,
          },
        });

        // ✅ Only fire once when they actually become Pro (free -> pro)
        if (existingUser.plan !== "pro") {
          await posthogCapture({
            distinctId: userId,
            event: "upgrade_completed",
            uuid: event.id, // dedupe Stripe retries
            properties: {
              stripe_event_type: event.type,
              stripe_event_id: event.id,
              stripe_subscription_id: sub.id,
              stripe_status: sub.status,
              stripe_price_id: item?.price?.id ?? null,
              current_period_end: periodEnd ? periodEnd.toISOString() : null,
            },
          });
        }

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;

        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });

        if (!user) break;

        const item = sub.items.data[0];
        const active = sub.status === "active" || sub.status === "trialing";

        const nextPlan = active ? "pro" : "free";
        const nextPeriodEnd =
          active && item?.current_period_end ? new Date(item.current_period_end * 1000) : null;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: nextPlan,
            stripeStatus: sub.status,
            stripePriceId: active ? item?.price?.id ?? null : null,
            currentPeriodEnd: nextPeriodEnd,
          },
        });

        // Nice-to-have: capture transitions reliably (dedupe with Stripe event id)
        if (user.plan !== "pro" && nextPlan === "pro") {
          await posthogCapture({
            distinctId: user.id,
            event: "upgrade_completed",
            uuid: event.id,
            properties: {
              stripe_event_type: event.type,
              stripe_event_id: event.id,
              stripe_subscription_id: sub.id,
              stripe_status: sub.status,
              stripe_price_id: item?.price?.id ?? null,
              current_period_end: nextPeriodEnd ? nextPeriodEnd.toISOString() : null,
            },
          });
        } else if (user.plan === "pro" && nextPlan !== "pro") {
          await posthogCapture({
            distinctId: user.id,
            event: "subscription_downgraded",
            uuid: event.id,
            properties: {
              stripe_event_type: event.type,
              stripe_event_id: event.id,
              stripe_subscription_id: sub.id,
              stripe_status: sub.status,
            },
          });
        }

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Stripe webhook handler error", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
