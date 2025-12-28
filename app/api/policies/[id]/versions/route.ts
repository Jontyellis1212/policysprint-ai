import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------- response helpers ----------
function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

function fail(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

function prismaError(e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return fail("PRISMA_ERROR", "Database request error", 500, {
      code: e.code,
      meta: e.meta,
    });
  }
  if (e instanceof Prisma.PrismaClientValidationError) {
    return fail("BAD_REQUEST", "Invalid request data", 400);
  }
  if (e instanceof Prisma.PrismaClientInitializationError) {
    return fail("DB_INIT_ERROR", "Database initialization error", 500);
  }
  return fail("INTERNAL_ERROR", "Unexpected server error", 500);
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

function validateId(id: unknown) {
  if (typeof id !== "string" || id.trim().length === 0) {
    return { ok: false as const, res: fail("BAD_REQUEST", "Missing id", 400) };
  }
  return { ok: true as const, id: id.trim() };
}

async function requireUserId() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return { ok: false as const, res: fail("UNAUTHORIZED", "Unauthorized", 401) };
  return { ok: true as const, userId };
}

// ---------- GET /api/policies/[id]/versions ----------
export async function GET(_req: NextRequest, context: RouteContext) {
  const u = await requireUserId();
  if (!u.ok) return u.res;

  const { id } = await context.params;
  const v = validateId(id);
  if (!v.ok) return v.res;

  try {
    // Ensure policy exists AND belongs to current user
    const policy = await prisma.policy.findFirst({
      where: { id: v.id, userId: u.userId },
      select: { id: true, version: true, updatedAt: true },
    });

    // 404 to avoid leaking existence
    if (!policy) return fail("NOT_FOUND", "Policy not found", 404);

    const versions = await prisma.policyVersion.findMany({
      where: { policyId: v.id },
      orderBy: { version: "desc" }, // latest snapshot first
      select: {
        id: true,
        policyId: true,
        version: true,
        content: true,
        createdAt: true,
      },
    });

    return ok({
      policyId: policy.id,
      currentVersion: policy.version,
      policyUpdatedAt: policy.updatedAt,
      versions,
    });
  } catch (e) {
    console.error("[GET /api/policies/[id]/versions]", e);
    return prismaError(e);
  }
}
