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

async function safeJson(req: Request) {
  try {
    const text = await req.text();
    if (!text) return { ok: true as const, data: {} };
    return { ok: true as const, data: JSON.parse(text) };
  } catch {
    return { ok: false as const, res: fail("BAD_REQUEST", "Invalid JSON body", 400) };
  }
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

// ---------- POST /api/policies/[id]/restore ----------
export async function POST(req: NextRequest, context: RouteContext) {
  const u = await requireUserId();
  if (!u.ok) return u.res;

  const { id } = await context.params;
  const v = validateId(id);
  if (!v.ok) return v.res;

  const bodyRes = await safeJson(req);
  if (!bodyRes.ok) return bodyRes.res;

  const body = bodyRes.data;
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return fail("BAD_REQUEST", "Body must be a JSON object", 400);
  }

  const { versionId } = body as { versionId?: string };

  if (typeof versionId !== "string" || versionId.trim().length === 0) {
    return fail("BAD_REQUEST", "versionId is required", 400);
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // 1) Load current policy (must belong to user)
      const policy = await tx.policy.findFirst({
        where: { id: v.id, userId: u.userId },
        select: { id: true, version: true, content: true },
      });

      // 404 to avoid leaking existence across users
      if (!policy) {
        throw Object.assign(new Error("Policy not found"), { _code: "NOT_FOUND" });
      }

      // 2) Load requested snapshot + ensure it belongs to THIS policy
      const snapshot = await tx.policyVersion.findUnique({
        where: { id: versionId.trim() },
        select: { id: true, policyId: true, version: true, content: true },
      });

      if (!snapshot || snapshot.policyId !== policy.id) {
        throw Object.assign(new Error("Version not found for this policy"), { _code: "VERSION_NOT_FOUND" });
      }

      // 3) No-op guard
      if (snapshot.content === policy.content) {
        throw Object.assign(new Error("That version matches the current content — nothing to restore."), {
          _code: "NO_CHANGE",
        });
      }

      // 4) Snapshot current state BEFORE restoring (so restore is reversible)
      await tx.policyVersion.create({
        data: {
          policyId: policy.id,
          version: policy.version,
          content: policy.content,
        },
      });

      // 5) Restore content + bump policy.version
      const next = await tx.policy.update({
        where: { id: policy.id },
        data: {
          content: snapshot.content,
          version: { increment: 1 },
        },
      });

      return next;
    });

    return ok(updated);
  } catch (e: any) {
    console.error("[POST /api/policies/[id]/restore]", e);

    const code = e?._code;
    if (code === "NOT_FOUND") return fail("NOT_FOUND", "Policy not found", 404);
    if (code === "VERSION_NOT_FOUND") return fail("NOT_FOUND", "Version not found for this policy", 404);
    if (code === "NO_CHANGE") return fail("BAD_REQUEST", e.message, 400);

    return prismaError(e);
  }
}
