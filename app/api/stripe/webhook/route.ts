// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Stripe REQUIRES raw body for signature verification
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
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
    console.error("❌ Stripe webhook signature failed", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.client_reference_id;
        const subscriptionId = session.subscription;

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

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Stripe webhook handler error", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
