import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      deploy: "MARKER_2026-01-14_1520"
    },
    { status: 200 }
  );
}
