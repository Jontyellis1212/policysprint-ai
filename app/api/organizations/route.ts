// app/api/organizations/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      industry,
      country,
      ownerId,
    } = body as {
      name?: string;
      industry?: string;
      country?: string;
      ownerId?: string;
    };

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const org = await prisma.organization.create({
      data: {
        name,
        industry: industry || null,
        country: country || null,
        ownerId: ownerId || null,
      },
    });

    return NextResponse.json(org, { status: 201 });
  } catch (err: any) {
    console.error("CREATE ORG ERROR:", err);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orgs, { status: 200 });
  } catch (err: any) {
    console.error("LIST ORGS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to list organizations" },
      { status: 500 }
    );
  }
}
