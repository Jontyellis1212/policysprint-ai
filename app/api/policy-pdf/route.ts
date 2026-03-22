import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

  let user:
    | {
        id: string;
        emailVerified: Date | null;
        plan: string;
        oneTimePdfCredits: number;
      }
    | null = null;

  if (mode === "download") {
    user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        emailVerified: true,
        plan: true,
        oneTimePdfCredits: true,
      },
    });

    const plan = user?.plan ?? "free";
    const oneTimePdfCredits = user?.oneTimePdfCredits ?? 0;

    if (DOWNLOADS_REQUIRE_PRO) {
      const hasAccess = plan === "pro" || oneTimePdfCredits > 0;

      if (!hasAccess) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "PRO_REQUIRED",
              message: "Upgrade required",
              details: { plan, oneTimePdfCredits },
            },
          },
          { status: 403 }
        );
      }
    } else {
      if (!user?.emailVerified) {
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
    }
  }

  try {
    const payload = (await req.json()) as PdfPayload;
    const pdfBuffer = await renderPdfBuffer(payload, mode);

    let remainingCredits: number | null = null;

    if (mode === "download" && user && user.plan !== "pro") {
      if ((user.oneTimePdfCredits ?? 0) <= 0) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "PRO_REQUIRED",
              message: "Upgrade required",
              details: {
                plan: user.plan,
                oneTimePdfCredits: user.oneTimePdfCredits ?? 0,
              },
            },
          },
          { status: 403 }
        );
      }

      const result = await prisma.user.updateMany({
        where: {
          id: user.id,
          oneTimePdfCredits: {
            gt: 0,
          },
        },
        data: {
          oneTimePdfCredits: {
            decrement: 1,
          },
        },
      });

      if (result.count === 0) {
        const freshUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            plan: true,
            oneTimePdfCredits: true,
          },
        });

        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "PRO_REQUIRED",
              message: "Upgrade required",
              details: {
                plan: freshUser?.plan ?? "free",
                oneTimePdfCredits: freshUser?.oneTimePdfCredits ?? 0,
              },
            },
          },
          { status: 403 }
        );
      }

      remainingCredits = Math.max(0, (user.oneTimePdfCredits ?? 0) - 1);
    }

    const filename = `policy-${Date.now()}.pdf`;
    const disposition = mode === "preview" ? "inline" : "attachment";

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "no-store",
        ...(remainingCredits !== null
          ? { "X-One-Time-Pdf-Credits-Remaining": String(remainingCredits) }
          : {}),
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
    {
      ok: false,
      error: { code: "METHOD_NOT_ALLOWED", message: "Method Not Allowed" },
    },
    { status: 405 }
  );
}