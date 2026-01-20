import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sha256, now } from "@/lib/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const rawToken = (url.searchParams.get("token") || "").trim();

  if (!rawToken) {
    return NextResponse.redirect(new URL("/verify-email?status=missing", url.origin));
  }

  const tokenHash = sha256(rawToken);

  const vt = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
    select: { identifier: true, expires: true, token: true },
  });

  if (!vt) {
    return NextResponse.redirect(new URL("/verify-email?status=invalid", url.origin));
  }

  if (vt.expires.getTime() < Date.now()) {
    // expired
    await prisma.verificationToken.delete({ where: { token: tokenHash } }).catch(() => {});
    return NextResponse.redirect(new URL("/verify-email?status=expired", url.origin));
  }

  const m = /^verify:(.+)$/.exec(vt.identifier || "");
  const email = m?.[1]?.trim().toLowerCase();

  if (!email) {
    await prisma.verificationToken.delete({ where: { token: tokenHash } }).catch(() => {});
    return NextResponse.redirect(new URL("/verify-email?status=invalid", url.origin));
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: now() },
  });

  await prisma.verificationToken.delete({ where: { token: tokenHash } }).catch(() => {});

  return NextResponse.redirect(new URL("/verify-email?status=success", url.origin));
}
