// app/api/stripe/checkout/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/**
 * Get the public base URL we should redirect back to after Stripe.
 * - Prefer APP_URL / NEXTAUTH_URL / AUTH_URL (set in Railway)
 * - Fallback to request origin (works locally)
 */
function getBaseUrl(req: Request) {
  const envUrl =
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    "";
  if (envUrl) return envUrl.replace(/\/+$/, ""); // trim trailing slash
  return new URL(req.url).origin;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id as string | undefined;
    const email = (session?.user as any)?.email as string | undefined;

    if (!userId) {
      return NextResponse.redirect(new URL("/login?next=/pricing", req.url), 303);
    }

    const PRICE_ID = requiredEnv("STRIPE_PRICE_ID");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.redirect(
        new URL("/pricing?stripe=user-not-found", req.url),
        303
      );
    }

    // Ensure we have a Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? email ?? undefined,
        metadata: { userId },
      });

      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    const baseUrl = getBaseUrl(req);

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      allow_promotion_codes: true,

      // For webhook mapping
      client_reference_id: userId,
      metadata: { userId },

      // ✅ Redirect into the main app experience (not dashboard shell)
      success_url: `${baseUrl}/policies?stripe=success`,
      cancel_url: `${baseUrl}/pricing?stripe=cancel`,
    });

    if (!checkout.url) {
      return NextResponse.redirect(
        new URL("/pricing?stripe=no-checkout-url", req.url),
        303
      );
    }

    return NextResponse.redirect(checkout.url, 303);
  } catch (err: any) {
    console.error("stripe checkout error:", err);
    return NextResponse.redirect(new URL("/pricing?stripe=error", req.url), 303);
  }
}
