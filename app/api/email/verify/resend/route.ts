import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}
function fail(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

export async function POST() {
  const session = await auth();
  const email = (session?.user as any)?.email as string | undefined;

  if (!email) return fail("UNAUTHORIZED", "Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true },
  });

  if (!user) return ok({ sent: true }); // don’t leak
  if (user.emailVerified) return ok({ sent: false, alreadyVerified: true });

  // Call internal send route via direct function? Keep it simple: duplicate minimal logic with redirectless fetch is messy in server.
  // We’ll do it directly here by importing the shared helpers.
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

  return ok({ sent: true });
}

export async function GET() {
  return fail("METHOD_NOT_ALLOWED", "Method Not Allowed", 405);
}
