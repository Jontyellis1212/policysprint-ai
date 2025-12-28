// app/api/policy-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import path from "path";
import { readFile } from "fs/promises";

export const runtime = "nodejs";

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
 * COVER
 */
function drawCover(
  doc: PDFDocument,
  args: { title: string; businessName: string; country: string; industry: string; monoLogo: Buffer | null }
) {
  const { title, businessName, country, industry, monoLogo } = args;

  const black = "#0B1220";
  const emerald = "#10B981";
  const muted = "#64748B";
  const border = "#E2E8F0";

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const width = right - left;

  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#FFFFFF");

  const heroH = 230;
  doc.rect(0, 0, doc.page.width, heroH).fill(black);
  doc.rect(0, heroH, doc.page.width, 6).fill(emerald);

  doc.save();
  doc.strokeColor("#132033").lineWidth(1);
  for (let y = 26; y < heroH; y += 30) {
    doc.moveTo(0, y).lineTo(doc.page.width, y).strokeOpacity(0.1).stroke();
  }
  doc.restore();

  const logoY = 44;
  if (monoLogo) {
    try {
      doc.image(monoLogo, left, logoY, { fit: [240, 52] });
    } catch {
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(22).text("PolicySprint", left, logoY + 10);
    }
  } else {
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(22).text("PolicySprint", left, logoY + 10);
  }

  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(40).text(title, left, 132, { width });

  const infoY = heroH + 26;
  doc.fillColor("#334155").font("Helvetica").fontSize(11).text("Internal policy document", left, infoY);
  doc.fillColor(muted).font("Helvetica").fontSize(10).text("AI policy compliance", left, infoY + 18);

  const cardY = infoY + 48;
  const cardH = 132;

  doc.roundedRect(left + 2, cardY + 3, width, cardH, 16).fill("#F1F5F9");
  doc.roundedRect(left, cardY, width, cardH, 16).fill("#FFFFFF").strokeColor(border).lineWidth(1).stroke();
  doc.rect(left, cardY, 7, cardH).fill(emerald);

  doc.fillColor(muted).font("Helvetica").fontSize(10).text("PREPARED FOR", left + 22, cardY + 18);

  doc
    .fillColor(black)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(businessName || "—", left + 22, cardY + 40, { width: width - 44 });

  const metaParts: string[] = [];
  if (industry) metaParts.push(industry);
  if (country) metaParts.push(country);
  const meta = metaParts.join(" • ");
  if (meta) {
    doc.fillColor("#334155").font("Helvetica").fontSize(12).text(meta, left + 22, cardY + 72, { width: width - 44 });
  }

  const dateStr = new Date().toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
  doc.fillColor(muted).font("Helvetica").fontSize(10).text(`Generated: ${dateStr}`, left + 22, cardY + 102);

  doc
    .fillColor(muted)
    .font("Helvetica")
    .fontSize(9)
    .text("Template only — not legal advice. Review with a qualified lawyer before adoption.", left, cardY + cardH + 18, {
      width,
      lineGap: 2,
    });
}

/**
 * Grey panel behind content pages (lighter, centered to margins)
 */
const CONTENT_PANEL = {
  xPad: 10,
  yTop: 64,
  radius: 16,
  bottomPad: 10,
  opacity: 0.06,
  // content inset from top of panel
  contentTopInset: 22,
};

function drawContentBackdrop(doc: PDFDocument) {
  const black = "#0B1220";

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const width = right - left;

  const panelX = left - CONTENT_PANEL.xPad;
  const panelY = CONTENT_PANEL.yTop;
  const panelW = width + CONTENT_PANEL.xPad * 2;
  const panelH = doc.page.height - panelY - doc.page.margins.bottom - CONTENT_PANEL.bottomPad;

  doc.save();
  doc.fillOpacity(CONTENT_PANEL.opacity);
  doc.roundedRect(panelX, panelY, panelW, panelH, CONTENT_PANEL.radius).fill(black);
  doc.fillOpacity(1);
  doc.restore();
}

function forceContentCursor(doc: PDFDocument) {
  // ✅ Prevent PDFKit drift on auto pages (this was your screenshot issue)
  doc.x = doc.page.margins.left;
  const targetY = CONTENT_PANEL.yTop + CONTENT_PANEL.contentTopInset;
  if (doc.y < targetY) doc.y = targetY;
}

function addTextSection(doc: PDFDocument, heading: string, body: string) {
  const safe = body.trim();
  if (!safe) return;

  doc.addPage();
  drawContentBackdrop(doc);
  forceContentCursor(doc);

  const black = "#0B1220";
  const emerald = "#10B981";

  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Heading
  const headingY = doc.y;
  doc.rect(left, headingY + 2, 6, 20).fill(emerald);
  doc.fillColor(black).font("Helvetica-Bold").fontSize(18).text(heading, left + 16, headingY);

  // Move to body start (explicit)
  doc.y = headingY + 34;

  // ✅ Body text anchored to left margin explicitly (prevents drift)
  doc.fillColor(black).font("Helvetica").fontSize(11).text(safe, left, doc.y, {
    width,
    lineGap: 3,
  });
}

async function renderPdfBuffer(payload: PdfPayload): Promise<Buffer> {
  const title = s(payload.title, "AI Use Policy");
  const businessName = s(payload.businessName, "PolicySprint AI");
  const country = s(payload.country, "");
  const industry = s(payload.industry, "");

  const contentsText = normalizePreserveLines(s(payload.contentsText, ""));
  const policyText = normalizePreserveLines(s(payload.policyText, "Policy body not provided."));
  const disclaimerText = normalizePreserveLines(s(payload.disclaimerText, ""));

  const doc = new PDFDocument({
    autoFirstPage: false,
    size: "A4",
    margins: { top: 72, bottom: 120, left: 72, right: 72 },
    pdfVersion: "1.7",
  });

  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  let inContent = false;

  // ✅ This catches PDFKit auto-flow pages
  (doc as any).on("pageAdded", () => {
    if (!inContent) return;
    drawContentBackdrop(doc);
    forceContentCursor(doc);
  });

  // cover
  doc.addPage();
  const monoLogo = await loadCoverLogoMonoWhite();
  drawCover(doc, { title, businessName, country, industry, monoLogo });

  // content
  inContent = true;
  addTextSection(doc, "Contents", contentsText);
  addTextSection(doc, "Policy", policyText);
  addTextSection(doc, "Disclaimer", disclaimerText);

  doc.end();
  return done;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as PdfPayload;
    const pdfBuffer = await renderPdfBuffer(payload);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="policy-${Date.now()}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to generate PDF.", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}
