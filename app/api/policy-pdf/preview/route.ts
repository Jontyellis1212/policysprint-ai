// app/api/policy-pdf/preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
/// <reference types="pdfkit" />
type PDFKitDocument = PDFKit.PDFDocument;

import path from "path";
import { readFile } from "fs/promises";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PdfPayload = {
  title?: string;
  businessName?: string;
  country?: string;
  industry?: string;
  contentsText?: string;
  policyText?: string;
  disclaimerText?: string;
};

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function normalizePreserveLines(raw: string): string {
  return (raw ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\f/g, "")
    .replace(/\u000c/g, "")
    .replace(/\u2028/g, "\n")
    .replace(/\u2029/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function logoPath(...parts: string[]) {
  return path.join(process.cwd(), "public", "branding", "logo", ...parts);
}

async function tryReadFirst(paths: string[]): Promise<Buffer | null> {
  for (const p of paths) {
    try {
      return await readFile(p);
    } catch {}
  }
  return null;
}

async function loadCoverLogoMonoWhite(): Promise<Buffer | null> {
  return tryReadFirst([
    logoPath("policysprint-mono-white.png"),
    logoPath("policysprint-horizontal.png"),
    logoPath("policysprint-mark.png"),
  ]);
}

function resetDefaultTextStyle(doc: PDFKitDocument) {
  doc.fillOpacity(1);
  doc.fillColor("#0B1220");
  doc.font("Helvetica");
  doc.fontSize(10);
}

/**
 * Minimal preview render (stable + build-safe).
 * We can re-add the fancy cover later once deploys are stable.
 */
async function renderPreviewPdfBuffer(payload: PdfPayload): Promise<Buffer> {
  const title = payload.title ?? "AI Use Policy";
  const businessName = payload.businessName ?? "Your business";
  const country = payload.country ?? "";
  const industry = payload.industry ?? "";

  const contentsText = normalizePreserveLines(payload.contentsText ?? "");
  const policyText = normalizePreserveLines(payload.policyText ?? "");
  const disclaimerText = normalizePreserveLines(payload.disclaimerText ?? "");

  const doc = new PDFDocument({
    autoFirstPage: true,
    size: "A4",
    margins: { top: 64, bottom: 110, left: 64, right: 64 },
    pdfVersion: "1.7",
  }) as unknown as PDFKitDocument;

  const chunks: Buffer[] = [];
  doc.on("data", (c: any) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // optional logo load (non-fatal)
  await loadCoverLogoMonoWhite().catch(() => null);

  resetDefaultTextStyle(doc);

  doc.font("Helvetica-Bold").fontSize(20).text(title);
  doc.moveDown(0.4);

  doc.font("Helvetica").fontSize(12).text(businessName);
  doc.moveDown(0.2);

  const meta = [industry, country].filter(Boolean).join(" • ");
  if (meta) {
    doc.fontSize(10).fillColor("#475569").text(meta);
    doc.fillColor("#0B1220");
    doc.moveDown(0.8);
  } else {
    doc.moveDown(0.8);
  }

  if (contentsText) {
    doc.font("Helvetica-Bold").fontSize(12).text("Contents");
    doc.moveDown(0.4);
    doc.font("Helvetica").fontSize(10).text(contentsText);
    doc.moveDown(0.8);
  }

  doc.font("Helvetica-Bold").fontSize(12).text("Policy");
  doc.moveDown(0.4);
  doc.font("Helvetica").fontSize(10).text(policyText || "Policy body not provided.");

  if (disclaimerText) {
    doc.addPage();
    resetDefaultTextStyle(doc);
    doc.font("Helvetica-Bold").fontSize(12).text("Disclaimer");
    doc.moveDown(0.4);
    doc.font("Helvetica").fontSize(10).text(disclaimerText);
  }

  doc.end();
  return done;
}

/**
 * POST: JSON -> PDF buffer
 */
export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as PdfPayload;
    const pdfBuffer = await renderPreviewPdfBuffer(payload);

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
 * GET: ?policyId=... -> loads policy and generates preview.
 * KEY: We do NOT reference typed fields like policy.title directly.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const policyId = url.searchParams.get("policyId");

    if (!policyId) {
      return NextResponse.json({ ok: false, error: "Missing policyId" }, { status: 400 });
    }

    const session = await auth();
    const userId = (session?.user as any)?.id as string | undefined;

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Do NOT use select. Pull raw record, then coerce.
    const policy = (await prisma.policy.findFirst({
      where: { id: policyId, userId },
    })) as any;

    if (!policy) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const payload: PdfPayload = {
      title: str(policy.title),
      businessName: str(policy.businessName),
      country: str(policy.country),
      industry: str(policy.industry),
      contentsText: str(policy.contentsText),
      policyText: str(policy.policyText),
      disclaimerText: str(policy.disclaimerText),
    };

    const pdfBuffer = await renderPreviewPdfBuffer(payload);

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
