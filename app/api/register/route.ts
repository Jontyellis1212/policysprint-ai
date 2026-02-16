// app/api/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
};

/**
 * Minimal server-side PostHog capture (US Cloud compatible).
 *
 * IMPORTANT:
 * - For US PostHog Cloud, use ingestion host: https://us.i.posthog.com
 * - Modern ingestion expects a "batch" payload shape at /capture/
 *
 * Uses:
 *   POSTHOG_KEY or NEXT_PUBLIC_POSTHOG_KEY
 *   POSTHOG_HOST or NEXT_PUBLIC_POSTHOG_HOST (defaults to https://us.i.posthog.com)
 */
async function posthogCapture(opts: {
  distinctId: string;
  event: string;
  properties?: Record<string, any>;
}) {
  const apiKey = process.env.POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!apiKey) {
    console.warn("[POSTHOG] Missing POSTHOG_KEY/NEXT_PUBLIC_POSTHOG_KEY (skipping capture)");
    return;
  }

  const host = (
    process.env.POSTHOG_HOST ||
    process.env.NEXT_PUBLIC_POSTHOG_HOST ||
    "https://us.i.posthog.com"
  ).replace(/\/+$/, "");

  const payload = {
    api_key: apiKey,
    batch: [
      {
        event: opts.event,
        distinct_id: opts.distinctId,
        properties: {
          ...(opts.properties || {}),
          source: "register_api",
        },
      },
    ],
  };

  try {
    const res = await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.warn(
        `[POSTHOG] capture failed: ${res.status} ${res.statusText} host=${host} body=${txt.slice(0, 200)}`
      );
    } else {
      console.log(`[POSTHOG] capture ok: event=${opts.event} host=${host}`);
    }
  } catch (err) {
    console.warn("[POSTHOG] signup capture fetch threw:", err);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterPayload;

    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const name = body.name?.trim() || null;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ ok: false, error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    // Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ ok: false, error: "An account with this email already exists." }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user (unverified by default)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // ✅ Fire signup_completed (server-side)
    await posthogCapture({
      distinctId: user.id,
      event: "signup_completed",
      properties: {
        email_domain: email.split("@")[1] ?? null,
        has_name: Boolean(name),
      },
    });

    // Send verification email (best-effort; don’t block account creation)
    try {
      const { sendEmail, verificationEmailTemplate, buildVerifyEmailUrl } = await import("@/lib/email");
      const { randomToken, sha256, expiresInMinutes } = await import("@/lib/tokens");

      const identifier = `verify:${email}`;
      await prisma.verificationToken.deleteMany({ where: { identifier } });

      const rawToken = randomToken(32);
      const tokenHash = sha256(rawToken);

      await prisma.verificationToken.create({
        data: {
          identifier,
          token: tokenHash,
          expires: expiresInMinutes(60 * 24),
        },
      });

      const verifyUrl = buildVerifyEmailUrl(rawToken);

      await sendEmail({
        to: email,
        subject: "Verify your email — PolicySprint",
        html: verificationEmailTemplate({ verifyUrl }),
        text: `Verify your email: ${verifyUrl}`,
      });
    } catch (e) {
      console.error("[REGISTER_VERIFY_EMAIL_ERROR]", e);
    }

    return NextResponse.json({ ok: true, data: user }, { status: 201 });
  } catch (err) {
    console.error("[REGISTER_ERROR]", err);
    return NextResponse.json({ ok: false, error: "Failed to create account." }, { status: 500 });
  }
}
