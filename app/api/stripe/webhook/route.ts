// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Stripe REQUIRES raw body for signature verification
export async function POST(req: Request) {
  const marker = "STRIPE_WEBHOOK_HIT_v1";
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // ✅ Proof log: did we get *any* request?
  console.log(marker, "received request", {
    hasSig: !!sig,
    hasSecret: !!webhookSecret,
    url: req.url,
    method: "POST",
  });

  if (!sig || !webhookSecret) {
    console.error(marker, "missing signature or secret");
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  const body = await req.text();

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(marker, "signature failed", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(marker, "event verified", {
    type: event?.type,
    id: event?.id,
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.client_reference_id;
        const subscriptionId = session.subscription;

        console.log(marker, "checkout.session.completed", {
          userId,
          subscriptionId,
        });

        if (!userId || !subscriptionId) break;

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

        console.log(marker, "user upgraded to pro", {
          userId,
          subId: sub.id,
          status: sub.status,
          priceId: item?.price?.id ?? null,
        });

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;

        console.log(marker, event.type, {
          subId: sub?.id,
          status: sub?.status,
        });

        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });

        if (!user) break;

        const item = sub.items.data[0];
        const active = sub.status === "active" || sub.status === "trialing";

        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: active ? "pro" : "free",
            stripeStatus: sub.status,
            stripePriceId: active ? item?.price?.id ?? null : null,
            currentPeriodEnd:
              active && item?.current_period_end
                ? new Date(item.current_period_end * 1000)
                : null,
          },
        });

        console.log(marker, "user plan updated from subscription event", {
          userId: user.id,
          plan: active ? "pro" : "free",
          status: sub.status,
        });

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Stripe webhook handler error", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
