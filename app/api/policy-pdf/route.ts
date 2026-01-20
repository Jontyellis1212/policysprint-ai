import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// IMPORTANT: policy PDF renderer lives in app/lib/pdf in your current setup
import { renderPdfBuffer, type PdfPayload } from "@/app/lib/pdf/renderPolicyPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOWNLOADS_REQUIRE_PRO = true;

export async function POST(req: NextRequest) {
  const session = await auth();
  const email = (session?.user as any)?.email as string | undefined;

  if (!email) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const modeHeader = (req.headers.get("x-pdf-mode") || "").toLowerCase();
  const mode: "download" | "preview" =
    modeHeader === "preview" ? "preview" : "download";

  // Gate DOWNLOAD only (email verified + optional pro)
  if (mode === "download") {
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

    if (DOWNLOADS_REQUIRE_PRO) {
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
  }

  try {
    const payload = (await req.json()) as PdfPayload;
    const pdfBuffer = await renderPdfBuffer(payload, mode);

    const filename = `policy-${Date.now()}.pdf`;
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
    console.error("[policy-pdf] Failed to generate", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PDF_GENERATION_FAILED",
          message: "Failed to generate PDF.",
          details: err?.message ?? String(err),
        },
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
