// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function posthogCapture(opts: {
  distinctId: string;
  event: string;
  properties?: Record<string, any>;
  uuid?: string;
}) {
  const apiKey = process.env.POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;

  const host =
    (
      process.env.POSTHOG_HOST ||
      process.env.NEXT_PUBLIC_POSTHOG_HOST ||
      "https://app.posthog.com"
    ).replace(/\/+$/, "");

  const payload = {
    api_key: apiKey,
    event: opts.event,
    distinct_id: opts.distinctId,
    properties: {
      ...(opts.properties || {}),
      source: "stripe_webhook",
    },
    uuid: opts.uuid,
  };

  try {
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("posthog server capture failed:", err);
  }
}

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
        const paymentStatus = session.payment_status as string | null;
        const purchaseType = (session.metadata?.purchase_type as string | undefined) || null;

        if (!userId) break;

        const existingUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!existingUser) break;

        // Subscription purchase
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const item = sub.items.data[0];
          const periodEnd = item?.current_period_end
            ? new Date(item.current_period_end * 1000)
            : null;

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

          if (existingUser.plan !== "pro") {
            await posthogCapture({
              distinctId: userId,
              event: "upgrade_completed",
              uuid: event.id,
              properties: {
                stripe_event_type: event.type,
                stripe_event_id: event.id,
                stripe_subscription_id: sub.id,
                stripe_status: sub.status,
                stripe_price_id: item?.price?.id ?? null,
                current_period_end: periodEnd ? periodEnd.toISOString() : null,
                purchase_type: purchaseType ?? "subscription_pro",
              },
            });
          }

          break;
        }

// One-time payment purchase
if (paymentStatus === "paid") {
  const creditsToGrantRaw = session.metadata?.pdf_credits_to_grant;
  const creditsToGrant = Number.parseInt(String(creditsToGrantRaw || "3"), 10);
  const safeCreditsToGrant =
    Number.isFinite(creditsToGrant) && creditsToGrant > 0 ? creditsToGrant : 3;



  await prisma.user.update({
    where: { id: userId },
    data: {
      oneTimePdfCredits: {
        increment: safeCreditsToGrant,
      },
    },
  });

  await posthogCapture({
    distinctId: userId,
    event: "one_time_pdf_pack_purchased",
    uuid: event.id,
    properties: {
      stripe_event_type: event.type,
      stripe_event_id: event.id,
      payment_status: paymentStatus,
      purchase_type: purchaseType ?? "one_time_pdf_pack",
      pdf_credits_granted: safeCreditsToGrant,
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
          active && item?.current_period_end
            ? new Date(item.current_period_end * 1000)
            : null;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: nextPlan,
            stripeStatus: sub.status,
            stripePriceId: active ? item?.price?.id ?? null : null,
            currentPeriodEnd: nextPeriodEnd,
          },
        });

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