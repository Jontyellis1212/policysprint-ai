// app/lib/pdf/renderPolicyPdf.ts
import PDFDocument from "pdfkit";
/// <reference types="pdfkit" />
type PDFKitDocument = PDFKit.PDFDocument;

import path from "path";
import { readFile } from "fs/promises";

export type PdfPayload = {
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
 * Reset text style after watermark/cover rendering.
 * (PDFKit save/restore is not guaranteed to restore font/fontSize reliably.)
 */
function resetDefaultTextStyle(doc: PDFKitDocument) {
  doc.fillOpacity(1);
  doc.fillColor("#0B1220");
  doc.font("Helvetica");
  doc.fontSize(10);
}

/**
 * COVER (Option C: Hybrid)
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
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(14).text("PolicySprint", left, brandY + 2);
    }
  } else {
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(14).text("PolicySprint", left, brandY + 2);
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

  // keep this note INSIDE printable area so it doesn't spill onto new page
  const footerFontSize = 9;
  const coverFooterY = doc.page.height - doc.page.margins.bottom - footerFontSize - 8;

  doc
    .fillColor(muted)
    .font("Helvetica")
    .fontSize(footerFontSize)
    .text("Template only — not legal advice. Review with a qualified lawyer before adoption.", left, coverFooterY, {
      width,
      lineGap: 2,
    });

  resetDefaultTextStyle(doc);
}

/**
 * Grey panel behind content pages
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
 * Watermark for preview mode
 * IMPORTANT: must not move doc.x/doc.y.
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
 * Section header (premium + consistent)
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

function splitIntoParagraphs(text: string): string[] {
  const t = normalizePreserveLines(text);
  if (!t) return [];
  return t
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);
}

function clampMaxPages(
  doc: PDFKitDocument,
  state: { totalPages: number },
  maxTotalPages: number,
  sectionName: string
) {
  if (state.totalPages >= maxTotalPages) {
    const left = doc.page.margins.left;
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.moveDown(0.6);
    doc
      .fillColor("#64748B")
      .font("Helvetica-Oblique")
      .fontSize(9)
      .text(`Content truncated to keep the PDF readable. (${sectionName} exceeded the page limit.)`, left, doc.y, {
        width,
        lineGap: 2,
      });
    resetDefaultTextStyle(doc);
    return true;
  }
  return false;
}

function isNumberedSectionHeadingLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  return /^\d+[\.\)]\s+\S+/.test(t);
}

function renderLine(doc: PDFKitDocument, line: string, left: number, width: number, lineGap: number) {
  if (isNumberedSectionHeadingLine(line)) {
    doc.font("Helvetica-Bold").text(line, left, doc.y, { width, lineGap });
    doc.font("Helvetica");
    return;
  }
  doc.font("Helvetica").text(line, left, doc.y, { width, lineGap });
}

function writeBodyPaged(
  doc: PDFKitDocument,
  body: string,
  opts: {
    sectionName: string;
    mode: "download" | "preview";
    state: { totalPages: number };
    maxTotalPages: number;
    maxSectionPages: number;
  }
) {
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const bottomY = doc.page.height - doc.page.margins.bottom;

  const paragraphs = splitIntoParagraphs(body);
  if (paragraphs.length === 0) return;

  const bodyFontSize = 10;
  const lineGap = 2;

  doc.fillColor("#0B1220").font("Helvetica").fontSize(bodyFontSize);

  let sectionPages = 1;

  const newContentPage = () => {
    doc.addPage();
    opts.state.totalPages += 1;
    sectionPages += 1;

    if (clampMaxPages(doc, opts.state, opts.maxTotalPages, opts.sectionName)) return false;
    if (sectionPages > opts.maxSectionPages) {
      doc
        .fillColor("#64748B")
        .font("Helvetica-Oblique")
        .fontSize(9)
        .text(
          `Content truncated to keep the PDF readable. (${opts.sectionName} exceeded the section page limit.)`,
          left,
          doc.y,
          { width, lineGap: 2 }
        );
      resetDefaultTextStyle(doc);
      return false;
    }

    drawContentBackdrop(doc);
    forceContentCursor(doc);
    resetDefaultTextStyle(doc);

    if (opts.mode === "preview") drawPreviewWatermark(doc);

    drawSectionHeader(doc, opts.sectionName, "continued");
    doc.fillColor("#0B1220").font("Helvetica").fontSize(bodyFontSize);
    return true;
  };

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const lines = p.split("\n");

    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];

      const h = doc.heightOfString(line || " ", { width, lineGap });
      if (doc.y + h > bottomY) {
        const ok = newContentPage();
        if (!ok) return;
      }

      if (line.trim() === "") {
        doc.moveDown(0.6);
      } else {
        renderLine(doc, line, left, width, lineGap);
      }
    }

    if (i !== paragraphs.length - 1) {
      doc.moveDown(0.6);
    }
  }

  resetDefaultTextStyle(doc);
}

function addSection(
  doc: PDFKitDocument,
  heading: string,
  body: string,
  opts: {
    mode: "download" | "preview";
    state: { totalPages: number };
    maxTotalPages: number;
    maxSectionPages: number;
  }
) {
  const safe = normalizePreserveLines(body);
  if (!safe) return;

  doc.addPage();
  opts.state.totalPages += 1;

  drawContentBackdrop(doc);
  forceContentCursor(doc);
  resetDefaultTextStyle(doc);

  if (opts.mode === "preview") drawPreviewWatermark(doc);

  drawSectionHeader(doc, heading, "first");

  writeBodyPaged(doc, safe, {
    sectionName: heading,
    mode: opts.mode,
    state: opts.state,
    maxTotalPages: opts.maxTotalPages,
    maxSectionPages: opts.maxSectionPages,
  });
}

/**
 * Footers (draw inside printable area)
 */
function drawFootersWithTotalPages(doc: PDFKitDocument) {
  const range = (doc as any).bufferedPageRange?.() as { start: number; count: number } | undefined;
  if (!range || typeof (doc as any).switchToPage !== "function") return;

  const ink = "#0B1220";
  const muted = "#64748B";

  const total = range.count;
  for (let i = range.start; i < range.start + range.count; i++) {
    (doc as any).switchToPage(i);

    const isCover = i === range.start;
    if (isCover) continue;

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;

    const footerFontSize = 9;
    const y = doc.page.height - doc.page.margins.bottom - footerFontSize - 8;

    doc.save();
    doc.fillOpacity(1);
    doc.fillColor(muted);
    doc.font("Helvetica").fontSize(footerFontSize);

    doc
      .strokeOpacity(0.12)
      .strokeColor(ink)
      .lineWidth(1)
      .moveTo(left, y - 10)
      .lineTo(right, y - 10)
      .stroke();

    const pageNum = i - range.start;
    doc.text(`Page ${pageNum} of ${total - 1}`, left, y, { width: right - left, align: "right" });

    doc.restore();
  }

  (doc as any).switchToPage(range.start + range.count - 1);
}

export async function renderPdfBuffer(payload: PdfPayload, mode: "download" | "preview"): Promise<Buffer> {
  const title = s(payload.title, "AI Use Policy");
  const businessName = s(payload.businessName, "PolicySprint AI");
  const country = s(payload.country, "");
  const industry = s(payload.industry, "");

  const contentsText = normalizePreserveLines(s(payload.contentsText, ""));
  const policyText = normalizePreserveLines(s(payload.policyText, "Policy body not provided."));
  const disclaimerText = normalizePreserveLines(s(payload.disclaimerText, ""));

  const MAX_TOTAL_PAGES = 18;
  const MAX_SECTION_PAGES = 10;

  const doc = new PDFDocument({
    autoFirstPage: false,
    size: "A4",
    margins: { top: 64, bottom: 110, left: 64, right: 64 },
    pdfVersion: "1.7",
    bufferPages: true,
  }) as unknown as PDFKitDocument;

  const chunks: Buffer[] = [];
  doc.on("data", (c: any) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  let inContent = false;
  const state = { totalPages: 0 };

  (doc as any).on("pageAdded", () => {
    if (inContent) {
      drawContentBackdrop(doc);
      forceContentCursor(doc);
      resetDefaultTextStyle(doc);
    }
    if (mode === "preview") {
      drawPreviewWatermark(doc);
    }
  });

  // Cover
  doc.addPage();
  state.totalPages += 1;
  const monoLogo = await loadCoverLogoMonoWhite().catch(() => null);
  drawCover(doc, { title, businessName, country, industry, monoLogo });

  if (mode === "preview") {
    drawPreviewWatermark(doc);
  } else {
    resetDefaultTextStyle(doc);
  }

  // Content pages
  inContent = true;

  const canAddMore = () => state.totalPages < MAX_TOTAL_PAGES;

  if (canAddMore()) {
    addSection(doc, "Contents", contentsText, {
      mode,
      state,
      maxTotalPages: MAX_TOTAL_PAGES,
      maxSectionPages: MAX_SECTION_PAGES,
    });
  }
  if (canAddMore()) {
    addSection(doc, "Policy", policyText, {
      mode,
      state,
      maxTotalPages: MAX_TOTAL_PAGES,
      maxSectionPages: MAX_SECTION_PAGES,
    });
  }
  if (canAddMore()) {
    addSection(doc, "Disclaimer", disclaimerText, {
      mode,
      state,
      maxTotalPages: MAX_TOTAL_PAGES,
      maxSectionPages: MAX_SECTION_PAGES,
    });
  }

  drawFootersWithTotalPages(doc);
  doc.end();

  return done;
}
