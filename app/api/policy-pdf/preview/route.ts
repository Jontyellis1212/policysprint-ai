// app/api/policy-pdf/preview/route.ts
import { NextRequest, NextResponse } from "next/server";

// IMPORTANT: policy PDF renderer lives in app/lib/pdf in your current setup
import { renderPdfBuffer, type PdfPayload } from "@/app/lib/pdf/renderPolicyPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/policy-pdf/preview
 * Body: PdfPayload JSON
 * Returns: application/pdf (inline)
 */
export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as PdfPayload;

    // Always preview mode for this endpoint
    const pdfBuffer = await renderPdfBuffer(payload, "preview");

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="policy-preview.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[policy-pdf/preview] Failed", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate preview.", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

/**
 * GET is intentionally blocked: wizard should POST live payload
 */
export async function GET() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
