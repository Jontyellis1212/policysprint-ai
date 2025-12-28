import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Helpers (consistent API shape)
 */
function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

function fail(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

async function requireUserId() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) return { ok: false as const, res: fail("UNAUTHORIZED", "Unauthorized", 401) };
  return { ok: true as const, userId };
}

/**
 * GET /api/policies
 * List policies for the logged-in user only
 */
export async function GET() {
  const u = await requireUserId();
  if (!u.ok) return u.res;

  try {
    const policies = await prisma.policy.findMany({
      where: { userId: u.userId },
      orderBy: { createdAt: "desc" },
    });

    return ok(policies);
  } catch (err) {
    console.error("[GET /api/policies]", err);
    return fail("INTERNAL_ERROR", "Failed to fetch policies", 500);
  }
}

/**
 * POST /api/policies
 * Create a new policy owned by the logged-in user
 */
export async function POST(req: Request) {
  const u = await requireUserId();
  if (!u.ok) return u.res;

  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return fail("BAD_REQUEST", "Body must be a JSON object", 400);
    }

    if (typeof (body as any)?.content !== "string" || (body as any).content.trim().length === 0) {
      return fail("BAD_REQUEST", "Content is required", 400);
    }

    const policy = await prisma.policy.create({
      data: {
        userId: u.userId,
        title: (body as any).title ?? null,
        businessName: (body as any).businessName ?? null,
        industry: (body as any).industry ?? null,
        country: (body as any).country ?? null,
        content: (body as any).content,
      },
    });

    return ok(policy, 201);
  } catch (err) {
    console.error("[POST /api/policies]", err);
    return fail("INTERNAL_ERROR", "Failed to create policy", 500);
  }
}
