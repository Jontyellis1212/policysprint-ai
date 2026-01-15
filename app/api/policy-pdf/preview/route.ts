// app/api/policy-pdf/preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { renderPdfBuffer, type PdfPayload } from "@/app/lib/pdf/renderPolicyPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * POST: JSON -> Styled PDF buffer (PREVIEW mode)
 * - No auth / no plan gating (wizard preview must always work)
 * - Hard-fail if policyText missing so we never silently produce a tiny fallback PDF
 */
export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as PdfPayload;

    // Guardrail: no more silent "Policy body not provided."
    if (!isNonEmptyString(payload.policyText)) {
      return NextResponse.json(
        { ok: false, error: "Missing policyText in preview payload." },
        { status: 400 }
      );
    }

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
    return NextResponse.json(
      { ok: false, error: "Failed to generate preview.", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

/**
 * Keep GET for DB preview (optional) — but since you want wizard POST, we can keep it as-is.
 * For now: return 405 to avoid confusing the wizard and prevent old flows.
 */
export async function GET() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
