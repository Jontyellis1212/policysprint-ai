import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/policies – list all policies (for dashboard)
export async function GET() {
  try {
    const policies = await prisma.policy.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(policies);
  } catch (error) {
    console.error("[GET /api/policies]", error);
    return NextResponse.json(
      { error: "Failed to fetch policies" },
      { status: 500 }
    );
  }
}

// POST /api/policies – create a new policy (used by wizard “Save policy”)
export async function POST(req: NextRequest) {
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
      content: string;
    } = json;

    if (typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const created = await prisma.policy.create({
      data: {
        title: title ?? null,
        businessName: businessName ?? null,
        industry: industry ?? null,
        country: country ?? null,
        content,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[POST /api/policies]", error);
    return NextResponse.json(
      { error: "Failed to create policy" },
      { status: 500 }
    );
  }
}
