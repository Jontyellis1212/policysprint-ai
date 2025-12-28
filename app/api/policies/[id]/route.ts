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

// In Next.js App Router route handlers, params may be a Promise.
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

// ---------- GET /api/policies/[id] ----------
export async function GET(_req: NextRequest, context: RouteContext) {
  const u = await requireUserId();
  if (!u.ok) return u.res;

  const { id } = await context.params;
  const v = validateId(id);
  if (!v.ok) return v.res;

  try {
    const policy = await prisma.policy.findFirst({
      where: { id: v.id, userId: u.userId },
    });

    // 404 so we don't leak whether the ID exists for other users
    if (!policy) return fail("NOT_FOUND", "Policy not found", 404);

    return ok(policy);
  } catch (e) {
    console.error("[GET /api/policies/[id]]", e);
    return prismaError(e);
  }
}

// ---------- PUT /api/policies/[id] ----------
export async function PUT(req: NextRequest, context: RouteContext) {
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

  const { title, businessName, industry, country, content, organizationId } = body as {
    title?: string | null;
    businessName?: string | null;
    industry?: string | null;
    country?: string | null;
    content?: string;
    organizationId?: string | null;
  };

  if (content !== undefined && (typeof content !== "string" || content.trim().length === 0)) {
    return fail("BAD_REQUEST", "Content must be a non-empty string", 400);
  }

  const data: any = {};
  if (title !== undefined) data.title = title;
  if (businessName !== undefined) data.businessName = businessName;
  if (industry !== undefined) data.industry = industry;
  if (country !== undefined) data.country = country;
  if (organizationId !== undefined) data.organizationId = organizationId;
  if (content !== undefined) data.content = content;

  if (Object.keys(data).length === 0) {
    return fail("BAD_REQUEST", "No fields provided to update", 400);
  }

  try {
    // Load existing policy (must belong to user) so we can snapshot current content/version.
    const existing = await prisma.policy.findFirst({
      where: { id: v.id, userId: u.userId },
      select: { id: true, version: true, content: true },
    });

    if (!existing) return fail("NOT_FOUND", "Policy not found", 404);

    const contentProvided = content !== undefined;
    const contentChanged = contentProvided && content !== existing.content;

    // Transaction: if content changes, create a PolicyVersion snapshot of the PREVIOUS state,
    // then update the policy and bump policy.version.
    const updated = await prisma.$transaction(async (tx) => {
      if (contentChanged) {
        await tx.policyVersion.create({
          data: {
            policyId: existing.id,
            version: existing.version,
            content: existing.content,
          },
        });

        // bump version on the policy when content changes
        data.version = { increment: 1 };
      }

      return tx.policy.update({
        where: { id: existing.id },
        data,
      });
    });

    return ok(updated);
  } catch (e: any) {
    console.error("[PUT /api/policies/[id]]", e);
    if (e?.code === "P2025") return fail("NOT_FOUND", "Policy not found", 404);
    return prismaError(e);
  }
}

// ---------- DELETE /api/policies/[id] ----------
export async function DELETE(_req: NextRequest, context: RouteContext) {
  const u = await requireUserId();
  if (!u.ok) return u.res;

  const { id } = await context.params;
  const v = validateId(id);
  if (!v.ok) return v.res;

  try {
    // Must belong to user
    const existing = await prisma.policy.findFirst({
      where: { id: v.id, userId: u.userId },
      select: { id: true },
    });

    if (!existing) return fail("NOT_FOUND", "Policy not found", 404);

    await prisma.policy.delete({ where: { id: existing.id } });
    return ok({ success: true });
  } catch (e: any) {
    console.error("[DELETE /api/policies/[id]]", e);
    if (e?.code === "P2025") return fail("NOT_FOUND", "Policy not found", 404);
    return prismaError(e);
  }
}
