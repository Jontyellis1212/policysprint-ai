// app/api/stripe/portal/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id as string | undefined;

    if (!userId) {
      return NextResponse.redirect(new URL("/login?next=/pricing", req.url), 303);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) {
      return NextResponse.redirect(new URL("/pricing?stripe=no-customer", req.url), 303);
    }

    const origin = new URL(req.url).origin;

    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.redirect(portal.url, 303);
  } catch (err: any) {
    console.error("stripe portal error:", err);
    return NextResponse.redirect(new URL("/pricing?stripe=portal-error", req.url), 303);
  }
}
