import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterPayload;

    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const name = body.name?.trim() || null;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "An account with this email already exists." },
        { status: 409 }
      );
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
    return NextResponse.json(
      { ok: false, error: "Failed to create account." },
      { status: 500 }
    );
  }
}
