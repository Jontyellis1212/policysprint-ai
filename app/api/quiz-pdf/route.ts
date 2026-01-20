import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { renderQuizPdfBuffer, type QuizPdfPayload } from "@/app/lib/pdf/renderQuizPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/quiz-pdf
 * Header: x-pdf-mode: "preview" | "download" (default download)
 *
 * Preview: PUBLIC (no auth)
 * Download: AUTH + VERIFIED + PRO ONLY
 */
export async function POST(req: NextRequest) {
  try {
    const modeHeader = (req.headers.get("x-pdf-mode") || "").toLowerCase();
    const mode: "download" | "preview" =
      modeHeader === "preview" ? "preview" : "download";

    // ✅ Only require auth + verified + pro for DOWNLOAD
    if (mode === "download") {
      const session = await auth();
      const email = (session?.user as any)?.email as string | undefined;

      if (!email) {
        return NextResponse.json(
          { ok: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
          { status: 401 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: { plan: true, emailVerified: true },
      });

      const verified = Boolean(user?.emailVerified);
      if (!verified) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "EMAIL_NOT_VERIFIED",
              message: "Please verify your email to download.",
            },
          },
          { status: 403 }
        );
      }

      const plan = user?.plan ?? "free";
      if (plan !== "pro") {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "PRO_REQUIRED",
              message: "Upgrade required",
              details: { plan },
            },
          },
          { status: 403 }
        );
      }
    }

    const payload = (await req.json()) as QuizPdfPayload;

    if (typeof payload?.quizText !== "string" || payload.quizText.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Missing quizText." } },
        { status: 400 }
      );
    }

    const pdfBuffer = await renderQuizPdfBuffer(payload, mode);
    const filename = `quiz-${Date.now()}.pdf`;
    const disposition = mode === "preview" ? "inline" : "attachment";

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[quiz-pdf] Failed to generate", err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "PDF_GENERATION_FAILED", message: "Failed to generate quiz PDF." },
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "Method Not Allowed" } },
    { status: 405 }
  );
}
