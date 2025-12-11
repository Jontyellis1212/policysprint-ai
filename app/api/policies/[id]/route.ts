import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/policies/[id] – fetch a single policy
export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const policy = await prisma.policy.findUnique({
      where: { id },
    });

    if (!policy) {
      return NextResponse.json(
        { error: "Policy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(policy);
  } catch (error) {
    console.error("[GET /api/policies/[id]]", error);
    return NextResponse.json(
      { error: "Failed to fetch policy" },
      { status: 500 }
    );
  }
}

// PUT /api/policies/[id] – update a policy
export async function PUT(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const json = await req.json();

    const {
      title,
      businessName,
      industry,
      country,
      content,
    }: {
      title?: string | null;
      businessName?: string | null;
      industry?: string | null;
      country?: string | null;
      content?: string;
    } = json;

    if (typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const updated = await prisma.policy.update({
      where: { id },
      data: {
        title: title ?? null,
        businessName: businessName ?? null,
        industry: industry ?? null,
        country: country ?? null,
        content,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[PUT /api/policies/[id]]", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Policy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update policy" },
      { status: 500 }
    );
  }
}

// DELETE /api/policies/[id] – delete a policy
export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.policy.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/policies/[id]]", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Policy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete policy" },
      { status: 500 }
    );
  }
}
