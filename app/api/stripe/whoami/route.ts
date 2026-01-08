import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  const keyPrefix = key.startsWith("sk_live_")
    ? "sk_live"
    : key.startsWith("sk_test_")
      ? "sk_test"
      : "unknown";

  try {
    const acct = await stripe.accounts.retrieve();
    return NextResponse.json({
      ok: true,
      keyPrefix,
      stripeAccountId: acct.id,
      livemode: (acct as any).livemode ?? null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, keyPrefix, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
