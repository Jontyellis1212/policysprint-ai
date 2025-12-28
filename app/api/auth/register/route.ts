import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const password =
      typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
      },
    });

    return NextResponse.json({ ok: true, data: user });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to create account" },
      { status: 500 }
    );
  }
}
