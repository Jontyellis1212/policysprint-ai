// app/api/quiz-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { renderQuizPdfBuffer, type QuizPdfPayload } from "@/app/lib/pdf/renderQuizPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/quiz-pdf
 * Body: { quizText, businessName?, title?, policyTitle?, includeAnswerKey? }
 * Header: x-pdf-mode: "preview" | "download" (default download)
 *
 * Returns: application/pdf (inline)
 */
export async function POST(req: NextRequest) {
  try {
    const modeHeader = (req.headers.get("x-pdf-mode") || "").toLowerCase();
    const mode: "download" | "preview" = modeHeader === "preview" ? "preview" : "download";

    const payload = (await req.json()) as QuizPdfPayload;

    if (typeof payload?.quizText !== "string" || payload.quizText.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "Missing quizText." }, { status: 400 });
    }

    const pdfBuffer = await renderQuizPdfBuffer(payload, mode);

    const filename = `quiz-${Date.now()}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[quiz-pdf] Failed to generate", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate quiz PDF.", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
