import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/tokens";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { token: string; password: string };

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}
function fail(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

export async function POST(req: NextRequest) {
  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    return fail("BAD_REQUEST", "Invalid JSON body", 400);
  }

  const rawToken = typeof body?.token === "string" ? body.token.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!rawToken) return fail("BAD_REQUEST", "Missing token", 400);
  if (!password || password.length < 8) {
    return fail("BAD_REQUEST", "Password must be at least 8 characters", 400);
  }

  const tokenHash = sha256(rawToken);

  const vt = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
    select: { identifier: true, expires: true, token: true },
  });

  if (!vt) return fail("INVALID_TOKEN", "Invalid or expired token", 400);

  if (vt.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token: tokenHash } }).catch(() => {});
    return fail("EXPIRED_TOKEN", "Invalid or expired token", 400);
  }

  const m = /^reset:(.+)$/.exec(vt.identifier || "");
  const email = m?.[1]?.trim().toLowerCase();
  if (!email) {
    await prisma.verificationToken.delete({ where: { token: tokenHash } }).catch(() => {});
    return fail("INVALID_TOKEN", "Invalid or expired token", 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  await prisma.verificationToken.delete({ where: { token: tokenHash } }).catch(() => {});

  return ok({ reset: true });
}

export async function GET() {
  return fail("METHOD_NOT_ALLOWED", "Method Not Allowed", 405);
}
