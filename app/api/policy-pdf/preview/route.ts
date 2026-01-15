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

function s(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
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

/**
 * Reset text style
 */
function resetDefaultTextStyle(doc: PDFKitDocument) {
  doc.fillOpacity(1);
  doc.fillColor("#0B1220");
  doc.font("Helvetica");
  doc.fontSize(10);
}

/**
 * COVER (match download: Option C hybrid)
 */
function drawCover(
  doc: PDFKitDocument,
  args: {
    title: string;
    businessName: string;
    country: string;
    industry: string;
    monoLogo: Buffer | null;
  }
) {
  const { title, businessName, country, industry, monoLogo } = args;

  const ink = "#0B1220";
  const emerald = "#10B981";
  const muted = "#64748B";
  const border = "#E2E8F0";

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const width = right - left;

  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#FFFFFF");

  const stripH = 64;
  doc.rect(0, 0, doc.page.width, stripH).fill(ink);
  doc.rect(0, stripH, doc.page.width, 4).fill(emerald);

  const brandY = 20;
  if (monoLogo) {
    try {
      doc.image(monoLogo, left, brandY, { fit: [170, 28] });
    } catch {
      doc
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("PolicySprint", left, brandY + 2);
    }
  } else {
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("PolicySprint", left, brandY + 2);
  }

  doc
    .fillColor("#CBD5E1")
    .font("Helvetica")
    .fontSize(9)
    .text("AI policy compliance", left + 190, brandY + 7, { width: width - 190 });

  const heroY = 128;

  doc.fillColor(muted).font("Helvetica").fontSize(10).text("Prepared for", left, heroY - 18);

  doc
    .fillColor(ink)
    .font("Helvetica-Bold")
    .fontSize(40)
    .text(businessName || "—", left, heroY, { width, lineGap: 2 });

  doc
    .fillColor("#334155")
    .font("Helvetica")
    .fontSize(14)
    .text(title || "AI Use Policy", left, heroY + 82, { width });

  const metaParts: string[] = [];
  if (industry) metaParts.push(industry);
  if (country) metaParts.push(country);
  const meta = metaParts.join(" • ");
  if (meta) {
    doc.fillColor(muted).font("Helvetica").fontSize(10).text(meta, left, heroY + 106, { width });
  }

  doc.save();
  doc.strokeOpacity(0.12);
  doc.strokeColor(ink);
  doc.lineWidth(1);
  doc.moveTo(left, heroY + 138).lineTo(right, heroY + 138).stroke();
  doc.restore();

  const cardY = heroY + 168;
  const cardH = 150;

  doc.roundedRect(left + 2, cardY + 3, width, cardH, 16).fill("#F1F5F9");
  doc
    .roundedRect(left, cardY, width, cardH, 16)
    .fill("#FFFFFF")
    .strokeColor(border)
    .lineWidth(1)
    .stroke();
  doc.rect(left, cardY, 6, cardH).fill(emerald);

  doc.fillColor(muted).font("Helvetica").fontSize(10).text("DOCUMENT", left + 20, cardY + 20);

  const meta2Parts: string[] = [];
  if (industry) meta2Parts.push(industry);
  if (country) meta2Parts.push(country);
  const meta2 = meta2Parts.join(" • ");

  doc
    .fillColor(ink)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("AI Use Policy (Internal)", left + 20, cardY + 42, { width: width - 40 });

  if (meta2) {
    doc
      .fillColor("#334155")
      .font("Helvetica")
      .fontSize(10)
      .text(meta2, left + 20, cardY + 66, { width: width - 40 });
  }

  const dateStr = new Date().toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  doc.fillColor(muted).font("Helvetica").fontSize(10).text(`Generated: ${dateStr}`, left + 20, cardY + 96);

  const footerFontSize = 9;
  const coverFooterY = doc.page.height - doc.page.margins.bottom - footerFontSize - 8;

  doc
    .fillColor(muted)
    .font("Helvetica")
    .fontSize(footerFontSize)
    .text(
      "Template only — not legal advice. Review with a qualified lawyer before adoption.",
      left,
      coverFooterY,
      { width, lineGap: 2 }
    );

  resetDefaultTextStyle(doc);
}

/**
 * CONTENT PANEL — match download
 */
const CONTENT_PANEL = {
  xPad: 10,
  yTop: 62,
  radius: 16,
  bottomPad: 12,
  opacity: 0.055,
  contentTopInset: 20,
};

function drawContentBackdrop(doc: PDFKitDocument) {
  const ink = "#0B1220";

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const width = right - left;

  const panelX = left - CONTENT_PANEL.xPad;
  const panelY = CONTENT_PANEL.yTop;
  const panelW = width + CONTENT_PANEL.xPad * 2;
  const panelH = doc.page.height - panelY - doc.page.margins.bottom - CONTENT_PANEL.bottomPad;

  doc.save();
  doc.fillOpacity(CONTENT_PANEL.opacity);
  doc.roundedRect(panelX, panelY, panelW, panelH, CONTENT_PANEL.radius).fill(ink);
  doc.fillOpacity(1);
  doc.restore();
}

function forceContentCursor(doc: PDFKitDocument) {
  doc.x = doc.page.margins.left;
  doc.y = CONTENT_PANEL.yTop + CONTENT_PANEL.contentTopInset;
}

/**
 * PREVIEW WATERMARK (must not move doc.x/doc.y)
 */
function drawPreviewWatermark(doc: PDFKitDocument) {
  const text = "PREVIEW — Upgrade to download";
  const prevX = doc.x;
  const prevY = doc.y;

  doc.save();
  doc.fillOpacity(0.08);
  doc.fillColor("#0B1220");
  doc.font("Helvetica-Bold").fontSize(46);

  const cx = doc.page.width / 2;
  const cy = doc.page.height / 2;

  doc.rotate(-18, { origin: [cx, cy] });
  doc.text(text, 0, cy - 30, { width: doc.page.width, align: "center" });
  doc.rotate(18, { origin: [cx, cy] });

  doc.restore();

  doc.x = prevX;
  doc.y = prevY;
  resetDefaultTextStyle(doc);
}

/**
 * Section header (match download)
 */
function drawSectionHeader(doc: PDFKitDocument, heading: string, variant: "first" | "continued") {
  const ink = "#0B1220";
  const emerald = "#10B981";
  const muted = "#64748B";

  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  forceContentCursor(doc);

  if (variant === "first") {
    const y = doc.y;
    doc.rect(left, y + 2, 6, 18).fill(emerald);
    doc.fillColor(ink).font("Helvetica-Bold").fontSize(16).text(heading, left + 16, y, { width });
    doc.y = y + 30;
  } else {
    const y = doc.y - 2;
    doc.fillColor(muted).font("Helvetica-Bold").fontSize(9).text(heading.toUpperCase(), left, y, {
      width,
      characterSpacing: 0.4,
    });
    doc
      .save()
      .strokeOpacity(0.12)
      .strokeColor("#0B1220")
      .lineWidth(1)
      .moveTo(left, y + 14)
      .lineTo(left + width, y + 14)
      .stroke()
      .restore();
    doc.y = y + 22;
  }

  resetDefaultTextStyle(doc);
}

function isNumberedSectionHeadingLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  return /^\d+[\.\)]\s+\S+/.test(t);
}

function splitIntoParagraphs(text: string): string[] {
  const t = normalizePreserveLines(text);
  if (!t) return [];
  return t
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);
}

type PageCtx = { pages: number; maxPages: number };

function contentBottom(doc: PDFKitDocument) {
  return doc.page.height - doc.page.margins.bottom;
}

function addContentPage(doc: PDFKitDocument, ctx: PageCtx) {
  doc.addPage();
  ctx.pages += 1;

  drawContentBackdrop(doc);
  forceContentCursor(doc);
  resetDefaultTextStyle(doc);
  drawPreviewWatermark(doc);
}

function ensureSpaceOrNewPage(doc: PDFKitDocument, ctx: PageCtx, neededHeight: number) {
  const bottomY = contentBottom(doc);
  if (doc.y + neededHeight <= bottomY) return true;

  if (ctx.pages >= ctx.maxPages) return false;
  addContentPage(doc, ctx);
  return true;
}

function writeLine(doc: PDFKitDocument, line: string, width: number, lineGap: number) {
  const left = doc.page.margins.left;

  if (isNumberedSectionHeadingLine(line)) {
    doc.font("Helvetica-Bold").text(line, left, doc.y, { width, lineGap });
    doc.font("Helvetica");
    return;
  }

  doc.font("Helvetica").text(line, left, doc.y, { width, lineGap });
}

function writeBodyPreviewPaged(
  doc: PDFKitDocument,
  ctx: PageCtx,
  body: string,
  sectionName: string,
  opts: { firstPageAlreadyHasHeader: boolean }
): { stoppedEarly: boolean } {
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const bottomY = contentBottom(doc);

  const paragraphs = splitIntoParagraphs(body);
  if (paragraphs.length === 0) return { stoppedEarly: false };

  const bodyFontSize = 10;
  const lineGap = 2;

  doc.fillColor("#0B1220").font("Helvetica").fontSize(bodyFontSize);

  let firstOnThisSectionPage = !opts.firstPageAlreadyHasHeader;

  const ensureHeaderIfNeeded = () => {
    if (!firstOnThisSectionPage) return;
    drawSectionHeader(doc, sectionName, "continued");
    doc.fillColor("#0B1220").font("Helvetica").fontSize(bodyFontSize);
    firstOnThisSectionPage = false;
  };

  const newSectionPage = () => {
    if (ctx.pages >= ctx.maxPages) return false;
    addContentPage(doc, ctx);
    firstOnThisSectionPage = true;
    ensureHeaderIfNeeded();
    return true;
  };

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const lines = p.split("\n");

    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];

      ensureHeaderIfNeeded();

      const h = doc.heightOfString(line || " ", { width, lineGap });
      if (doc.y + h > bottomY) {
        const ok = newSectionPage();
        if (!ok) return { stoppedEarly: true };
      }

      if (line.trim() === "") {
        doc.moveDown(0.6);
      } else {
        writeLine(doc, line, width, lineGap);
      }
    }

    if (i !== paragraphs.length - 1) {
      doc.moveDown(0.6);
    }
  }

  resetDefaultTextStyle(doc);
  return { stoppedEarly: false };
}

async function renderPreviewPdfBuffer(payload: PdfPayload): Promise<Buffer> {
  const title = s(payload.title, "AI Use Policy");
  const businessName = s(payload.businessName, "Your business");
  const country = s(payload.country, "");
  const industry = s(payload.industry, "");

  const contentsText = normalizePreserveLines(s(payload.contentsText, ""));
  const policyText = normalizePreserveLines(s(payload.policyText, "Policy body not provided."));
  const disclaimerText = normalizePreserveLines(s(payload.disclaimerText, ""));

  const doc = new PDFDocument({
    autoFirstPage: false,
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

  // Cover (watermarked)
  doc.addPage();
  const monoLogo = await loadCoverLogoMonoWhite();
  drawCover(doc, { title, businessName, country, industry, monoLogo });
  drawPreviewWatermark(doc);

  // Content pages (preview limited)
  const ctx: PageCtx = { pages: 0, maxPages: 4 };

  // Contents
  if (contentsText.trim().length > 0) {
    addContentPage(doc, ctx);
    drawSectionHeader(doc, "Contents", "first");

    const r = writeBodyPreviewPaged(doc, ctx, contentsText, "Contents", {
      firstPageAlreadyHasHeader: true,
    });
    if (r.stoppedEarly) {
      doc.end();
      return done;
    }
  }

  // Policy
  if (ctx.pages === 0) addContentPage(doc, ctx);
  drawSectionHeader(doc, "Policy", "first");

  const rPolicy = writeBodyPreviewPaged(doc, ctx, policyText, "Policy", {
    firstPageAlreadyHasHeader: true,
  });

  // Disclaimer only if we didn’t truncate
  if (!rPolicy.stoppedEarly && disclaimerText.trim().length > 0) {
    drawSectionHeader(doc, "Disclaimer", "first");
    const rDisc = writeBodyPreviewPaged(doc, ctx, disclaimerText, "Disclaimer", {
      firstPageAlreadyHasHeader: true,
    });
    if (rDisc.stoppedEarly) {
      doc.end();
      return done;
    }
  }

  // Truncation notice (only if we stopped early)
  if (rPolicy.stoppedEarly) {
    const left = doc.page.margins.left;
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    const msgTitle = "Preview truncated";
    doc.fillColor("#0B1220").font("Helvetica-Bold").fontSize(16);
    const h = doc.heightOfString(msgTitle, { width });

    if (ensureSpaceOrNewPage(doc, ctx, h + 80)) {
      doc.text(msgTitle, left, doc.y, { width });
      doc.y += 8;

      doc.fillColor("#334155").font("Helvetica").fontSize(11);
      doc.text(
        "Free accounts can preview the first few pages. Upgrade to download the full PDF export.",
        left,
        doc.y,
        { width, lineGap: 3 }
      );
    }
  }

  doc.end();
  return done;
}

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

// ✅ NEW: Support browser/iframe preview via GET ?policyId=...
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

    // NOTE: These field names assume your Policy model stores the same strings used for PDF rendering.
    // If your model uses different names, this will fail at build time and we’ll adjust in the next step.
    const policy = await prisma.policy.findFirst({
      where: { id: policyId, userId },
      select: {
        title: true,
        businessName: true,
        country: true,
        industry: true,
        contentsText: true,
        policyText: true,
        disclaimerText: true,
      } as any,
    });

    if (!policy) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const payload: PdfPayload = {
      title: policy.title ?? undefined,
      businessName: policy.businessName ?? undefined,
      country: policy.country ?? undefined,
      industry: policy.industry ?? undefined,
      contentsText: (policy as any).contentsText ?? undefined,
      policyText: (policy as any).policyText ?? undefined,
      disclaimerText: (policy as any).disclaimerText ?? undefined,
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
