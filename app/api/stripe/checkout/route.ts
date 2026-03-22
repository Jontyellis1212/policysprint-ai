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

function getBaseUrl(req: Request) {
  const envUrl =
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    "";
  if (envUrl) return envUrl.replace(/\/+$/, "");
  return new URL(req.url).origin;
}

async function ensureStripeCustomer(opts: {
  userId: string;
  email?: string;
  existingStripeCustomerId?: string | null;
}) {
  const { userId, email, existingStripeCustomerId } = opts;

  if (existingStripeCustomerId) {
    try {
      const existingCustomer = await stripe.customers.retrieve(
        existingStripeCustomerId
      );

      if (!("deleted" in existingCustomer) || existingCustomer.deleted !== true) {
        return existingStripeCustomerId;
      }
    } catch (err: any) {
      const code = err?.code || err?.raw?.code;
      if (code !== "resource_missing") {
        throw err;
      }
      console.warn(
        `Stored Stripe customer ${existingStripeCustomerId} not found in current Stripe environment. Recreating customer.`
      );
    }
  }

  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id as string | undefined;
    const email = (session?.user as any)?.email as string | undefined;

    const formData = await req.formData().catch(() => null);
    const modeRaw =
      (formData?.get("mode") as string | null) ||
      new URL(req.url).searchParams.get("mode") ||
      "subscription";

    const mode: "subscription" | "one_time" =
      modeRaw === "one_time" ? "one_time" : "subscription";

    if (!userId) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set(
        "callbackUrl",
        `/wizard?resumeCheckout=${mode}`
      );
      return NextResponse.redirect(loginUrl, 303);
    }

    const MONTHLY_PRICE_ID = requiredEnv("STRIPE_PRICE_ID");
    const ONE_TIME_PRICE_ID = requiredEnv("STRIPE_ONE_TIME_PRICE_ID");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.redirect(
        new URL("/pricing?stripe=user-not-found", req.url),
        303
      );
    }

    const stripeCustomerId = await ensureStripeCustomer({
      userId,
      email: user.email ?? email ?? undefined,
      existingStripeCustomerId: user.stripeCustomerId,
    });

    const baseUrl = getBaseUrl(req);

    const checkout =
      mode === "one_time"
        ? await stripe.checkout.sessions.create({
            mode: "payment",
            customer: stripeCustomerId,
            line_items: [{ price: ONE_TIME_PRICE_ID, quantity: 1 }],
            allow_promotion_codes: true,
            client_reference_id: userId,
            metadata: {
              userId,
              purchase_type: "one_time_pdf_pack",
              pdf_credits_to_grant: "3",
            },
            success_url: `${baseUrl}/wizard?stripe=success&mode=one_time`,
            cancel_url: `${baseUrl}/wizard?stripe=cancel&mode=one_time`,
          })
        : await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: stripeCustomerId,
            line_items: [{ price: MONTHLY_PRICE_ID, quantity: 1 }],
            allow_promotion_codes: true,
            client_reference_id: userId,
            metadata: {
              userId,
              purchase_type: "subscription_pro",
            },
            success_url: `${baseUrl}/wizard?stripe=success&mode=subscription`,
            cancel_url: `${baseUrl}/wizard?stripe=cancel&mode=subscription`,
          });

    if (!checkout.url) {
      return NextResponse.redirect(
        new URL("/wizard?stripe=no-checkout-url", req.url),
        303
      );
    }

    return NextResponse.redirect(checkout.url, 303);
  } catch (err: any) {
    console.error("stripe checkout error:", err);
    return NextResponse.redirect(new URL("/wizard?stripe=error", req.url), 303);
  }
}