import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const email = (session?.user as any)?.email as string | undefined;

  if (!email) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Unauthorized" },
      },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      plan: true,
      oneTimePdfCredits: true,
    },
  });

  return NextResponse.json({
    ok: true,
    plan: user?.plan ?? "free",
    oneTimePdfCredits: user?.oneTimePdfCredits ?? 0,
  });
}