import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

function fail(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

function normalizeId(id: unknown) {
  if (typeof id !== "string") return null;
  const t = id.trim();
  return t.length ? t : null;
}

async function requireUserId() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return { ok: false as const, res: fail("UNAUTHORIZED", "Unauthorized", 401) };
  return { ok: true as const, userId };
}

export async function POST(_req: NextRequest, context: RouteContext) {
  const u = await requireUserId();
  if (!u.ok) return u.res;

  const { id } = await context.params;
  const policyId = normalizeId(id);
  if (!policyId) return fail("BAD_REQUEST", "Missing id", 400);

  try {
    // Must belong to logged-in user
    const existing = await prisma.policy.findFirst({
      where: { id: policyId, userId: u.userId },
    });

    // 404 (don’t leak existence)
    if (!existing) return fail("NOT_FOUND", "Policy not found", 404);

    const copyTitle = existing.title
      ? `${existing.title} (Copy)`
      : "AI Use & Governance Policy (Copy)";

    const duplicated = await prisma.policy.create({
      data: {
        userId: u.userId,
        title: copyTitle,
        businessName: existing.businessName,
        industry: existing.industry,
        country: existing.country,
        content: existing.content,
        organizationId: existing.organizationId ?? null,
      },
    });

    return ok(duplicated, 201);
  } catch (error) {
    console.error("[POST /api/policies/[id]/duplicate]", error);
    return fail("INTERNAL_ERROR", "Failed to duplicate policy", 500);
  }
}
