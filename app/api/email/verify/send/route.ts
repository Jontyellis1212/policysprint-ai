import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, verificationEmailTemplate, buildVerifyEmailUrl } from "@/lib/email";
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
    select: { email: true, emailVerified: true },
  });

  if (!user) {
    // Don’t leak existence
    return ok({ sent: true });
  }

  if (user.emailVerified) {
    return ok({ sent: false, alreadyVerified: true });
  }

  // Clear previous verify tokens for this identifier
  const identifier = `verify:${email}`;
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const rawToken = randomToken(32);
  const tokenHash = sha256(rawToken);

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: tokenHash,
      expires: expiresInMinutes(60 * 24), // 24h
    },
  });

  const verifyUrl = buildVerifyEmailUrl(rawToken);

  await sendEmail({
    to: email,
    subject: "Verify your email — PolicySprint",
    html: verificationEmailTemplate({ verifyUrl }),
    text: `Verify your email: ${verifyUrl}`,
  });

  return ok({ sent: true });
}

export async function GET() {
  return fail("METHOD_NOT_ALLOWED", "Method Not Allowed", 405);
}
