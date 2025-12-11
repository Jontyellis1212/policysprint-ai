import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params; // ✅ FIXED

  try {
    const existing = await prisma.policy.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Policy not found" },
        { status: 404 }
      );
    }

    const copyTitle = existing.title
      ? `${existing.title} (Copy)`
      : "AI Use & Governance Policy (Copy)";

    const duplicated = await prisma.policy.create({
      data: {
        title: copyTitle,
        businessName: existing.businessName,
        industry: existing.industry,
        country: existing.country,
        content: existing.content,
      },
    });

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error) {
    console.error("[POST /api/policies/[id]/duplicate]", error);
    return NextResponse.json(
      { error: "Failed to duplicate policy" },
      { status: 500 }
    );
  }
}
