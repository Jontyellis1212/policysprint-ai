// app/api/stripe/sync/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id as string | undefined;

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { ok: false, error: "No Stripe customer on user" },
        { status: 400 }
      );
    }

    // Fetch subscriptions for this customer
    const subs = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
      limit: 10,
    });

    const active =
      subs.data.find((s) => s.status === "active" || s.status === "trialing") ?? null;

    // No active subscription → downgrade safely
    if (!active) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: "free",
          stripeSubscriptionId: null,
          stripeStatus: null,
          stripePriceId: null,
          currentPeriodEnd: null,
        },
      });

      return NextResponse.json({ ok: true, plan: "free" });
    }

    // ✅ Stripe period fields live on the SUBSCRIPTION ITEM (not subscription)
    const item = active.items?.data?.[0] ?? null;

    const priceId = item?.price?.id ?? null;
    const currentPeriodEnd =
      item?.current_period_end != null
        ? new Date(item.current_period_end * 1000)
        : null;

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: "pro",
        stripeSubscriptionId: active.id,
        stripeStatus: active.status,
        stripePriceId: priceId,
        currentPeriodEnd,
      },
    });

    return NextResponse.json({ ok: true, plan: "pro" });
  } catch (err: any) {
    console.error("stripe sync error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Sync failed" },
      { status: 500 }
    );
  }
}
