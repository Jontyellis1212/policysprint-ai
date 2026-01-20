import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, resetPasswordEmailTemplate, buildResetPasswordUrl } from "@/lib/email";
import { randomToken, sha256, expiresInMinutes } from "@/lib/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { email: string };

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

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return fail("BAD_REQUEST", "Missing email", 400);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true },
  });

  // Always respond success (don’t leak existence)
  if (!user) return ok({ sent: true });

  const identifier = `reset:${email}`;
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const rawToken = randomToken(32);
  const tokenHash = sha256(rawToken);

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: tokenHash,
      expires: expiresInMinutes(60), // 60 minutes
    },
  });

  const resetUrl = buildResetPasswordUrl(rawToken);

  await sendEmail({
    to: email,
    subject: "Reset your password — PolicySprint",
    html: resetPasswordEmailTemplate({ resetUrl }),
    text: `Reset your password: ${resetUrl}`,
  });

  return ok({ sent: true });
}

export async function GET() {
  return fail("METHOD_NOT_ALLOWED", "Method Not Allowed", 405);
}
