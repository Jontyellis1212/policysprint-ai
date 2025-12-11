import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/policies – list all policies (for now, global; later filter by userId)
export async function GET(_req: NextRequest) {
  try {
    const policies = await prisma.policy.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(policies);
  } catch (error) {
    console.error("[GET /api/policies]", error);
    return NextResponse.json(
      { error: "Failed to fetch policies" },
      { status: 500 },
    );
  }
}

// POST /api/policies – create a new policy
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    const {
      title,
      businessName,
      industry,
      country,
      content,
      fullPolicyText,
    }: {
      title?: string | null;
      businessName?: string | null;
      industry?: string | null;
      country?: string | null;
      content?: string | null;
      fullPolicyText?: string | null;
    } = json;

    // Accept either `content` or `fullPolicyText` from the client
    const bodyContentCandidate =
      typeof content === "string" && content.trim().length > 0
        ? content
        : typeof fullPolicyText === "string"
        ? fullPolicyText
        : "";

    const bodyContent = bodyContentCandidate.trim();

    if (bodyContent.length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    // Build data object and avoid writing null into non-nullable fields like `title`.
    const data: any = {
      content: bodyContent,
    };

    // For title, fall back to a default if nothing valid is provided.
    const finalTitle =
      typeof title === "string" && title.trim().length > 0
        ? title.trim()
        : "AI Use & Governance Policy";

    data.title = finalTitle;

    if (businessName !== undefined && businessName !== null) {
      data.businessName = businessName;
    }
    if (industry !== undefined && industry !== null) {
      data.industry = industry;
    }
    if (country !== undefined && country !== null) {
      data.country = country;
    }

    const created = await prisma.policy.create({
      data,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[POST /api/policies]", error);
    return NextResponse.json(
      { error: "Failed to create policy" },
      { status: 500 },
    );
  }
}
