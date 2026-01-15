// app/lib/pdf/renderQuizPdf.ts
import PDFDocument from "pdfkit";
/// <reference types="pdfkit" />
type PDFKitDocument = PDFKit.PDFDocument;

export type QuizPdfPayload = {
  title?: string; // e.g. "AI Use Policy — Staff Quiz"
  businessName?: string;
  policyTitle?: string; // optional subtitle
  quizText: string; // required (raw text from /api/quiz)
  includeAnswerKey?: boolean; // default true
};

type ParsedQuestion = {
  number: number;
  prompt: string;
  options: { label: "A" | "B" | "C" | "D"; text: string }[];
  correct?: "A" | "B" | "C" | "D";
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

function resetDefaultTextStyle(doc: PDFKitDocument) {
  doc.fillOpacity(1);
  doc.fillColor("#0B1220");
  doc.font("Helvetica");
  doc.fontSize(10);
}

/**
 * Preview watermark (same vibe as policy PDFs)
 */
function drawPreviewWatermark(doc: PDFKitDocument) {
  const text = "PREVIEW — Quiz PDF";

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

function drawCover(
  doc: PDFKitDocument,
  args: { title: string; businessName: string; policyTitle?: string; mode: "download" | "preview" }
) {
  const ink = "#0B1220";
  const emerald = "#10B981";
  const muted = "#64748B";

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const width = right - left;

  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#FFFFFF");

  const stripH = 64;
  doc.rect(0, 0, doc.page.width, stripH).fill(ink);
  doc.rect(0, stripH, doc.page.width, 4).fill(emerald);

  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(14).text("PolicySprint", left, 22);
  doc.fillColor("#CBD5E1").font("Helvetica").fontSize(9).text("Staff training quiz", left + 150, 26, { width: width - 150 });

  const heroY = 140;

  doc.fillColor(muted).font("Helvetica").fontSize(10).text("Prepared for", left, heroY - 18);
  doc.fillColor(ink).font("Helvetica-Bold").fontSize(38).text(args.businessName || "—", left, heroY, { width, lineGap: 2 });

  doc.fillColor("#334155").font("Helvetica").fontSize(14).text(args.title, left, heroY + 82, { width });

  if (args.policyTitle) {
    doc.fillColor(muted).font("Helvetica").fontSize(10).text(args.policyTitle, left, heroY + 106, { width });
  }

  const dateStr = new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "2-digit" });
  doc.fillColor(muted).font("Helvetica").fontSize(10).text(`Generated: ${dateStr}`, left, heroY + 140, { width });

  const footerFontSize = 9;
  const coverFooterY = doc.page.height - doc.page.margins.bottom - footerFontSize - 8;

  doc
    .fillColor(muted)
    .font("Helvetica")
    .fontSize(footerFontSize)
    .text("Internal training material — adapt to your organisation and keep it current.", left, coverFooterY, {
      width,
      lineGap: 2,
    });

  resetDefaultTextStyle(doc);

  if (args.mode === "preview") drawPreviewWatermark(doc);
}

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

function parseQuizText(raw: string): ParsedQuestion[] {
  const text = normalizePreserveLines(raw);
  if (!text) return [];

  // Split by numbered questions like "1." or "1)"
  const parts = text.split(/\n(?=\d+[\.\)]\s+)/g);

  const out: ParsedQuestion[] = [];

  for (const part of parts) {
    const block = part.trim();
    if (!block) continue;

    const firstLineMatch = block.match(/^(\d+)[\.\)]\s*(.+)$/m);
    if (!firstLineMatch) continue;

    const number = Number(firstLineMatch[1]);
    if (!Number.isFinite(number)) continue;

    // Everything after the first line belongs to options + correct answer
    const lines = block.split("\n").map((l) => l.trim());

    const prompt = lines[0].replace(/^(\d+)[\.\)]\s*/, "").trim();

    const options: ParsedQuestion["options"] = [];
    let correct: ParsedQuestion["correct"] | undefined;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      const correctMatch = line.match(/^Correct answer:\s*([ABCD])\b/i);
      if (correctMatch) {
        const c = correctMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
        correct = c;
        continue;
      }

      // Accept "A) foo", "A. foo", "A - foo"
      const optMatch = line.match(/^([ABCD])[\)\.\-:]\s*(.+)$/i);
      if (optMatch) {
        const label = optMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
        const text = optMatch[2].trim();
        options.push({ label, text });
        continue;
      }

      // If the AI outputs "A foo" (no punctuation)
      const optMatch2 = line.match(/^([ABCD])\s+(.+)$/i);
      if (optMatch2) {
        const label = optMatch2[1].toUpperCase() as "A" | "B" | "C" | "D";
        const text = optMatch2[2].trim();
        options.push({ label, text });
        continue;
      }
    }

    out.push({
      number,
      prompt,
      options: options.slice(0, 4),
      correct,
    });
  }

  // If parsing fails (some formats), fall back to a single "question" blob
  if (out.length === 0) {
    return [
      {
        number: 1,
        prompt: "Quiz",
        options: [],
        correct: undefined,
      },
    ];
  }

  return out;
}

function writeWrapped(doc: PDFKitDocument, text: string, opts?: { font?: string; size?: number }) {
  if (opts?.font) doc.font(opts.font);
  if (opts?.size) doc.fontSize(opts.size);
  doc.text(text, { lineGap: 2 });
  resetDefaultTextStyle(doc);
}

export async function renderQuizPdfBuffer(payload: QuizPdfPayload, mode: "download" | "preview"): Promise<Buffer> {
  const title = s(payload.title, "Staff Quiz");
  const businessName = s(payload.businessName, "Your business");
  const policyTitle = s(payload.policyTitle, "");
  const quizText = normalizePreserveLines(payload.quizText || "");
  const includeAnswerKey = payload.includeAnswerKey !== false;

  if (!quizText) {
    throw new Error("Missing quizText");
  }

  const questions = parseQuizText(quizText);

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

  // Cover
  doc.addPage();
  drawCover(doc, { title, businessName, policyTitle: policyTitle || undefined, mode });

  // Questions
  doc.addPage();
  if (mode === "preview") drawPreviewWatermark(doc);

  resetDefaultTextStyle(doc);

  doc.font("Helvetica-Bold").fontSize(16).fillColor("#0B1220").text("Quiz Questions");
  doc.moveDown(0.6);
  resetDefaultTextStyle(doc);

  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const bottomY = doc.page.height - doc.page.margins.bottom;

  const ensureSpace = (h: number) => {
    if (doc.y + h > bottomY) {
      doc.addPage();
      if (mode === "preview") drawPreviewWatermark(doc);
      resetDefaultTextStyle(doc);
    }
  };

  for (const q of questions) {
    const qHeader = `${q.number}. ${q.prompt}`;
    const h1 = doc.heightOfString(qHeader, { width, lineGap: 2 });
    ensureSpace(h1 + 10);

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0B1220").text(qHeader, left, doc.y, { width, lineGap: 2 });
    resetDefaultTextStyle(doc);

    if (q.options.length) {
      doc.moveDown(0.35);
      for (const opt of q.options) {
        const line = `${opt.label}. ${opt.text}`;
        const h2 = doc.heightOfString(line, { width, lineGap: 2 });
        ensureSpace(h2 + 4);
        doc.font("Helvetica").fontSize(10).fillColor("#0B1220").text(line, left + 12, doc.y, { width: width - 12, lineGap: 2 });
        resetDefaultTextStyle(doc);
      }
    } else {
      doc.moveDown(0.2);
      writeWrapped(doc, "(Options not detected in AI output. See raw quiz text.)", { font: "Helvetica-Oblique", size: 9 });
    }

    // Space for the learner
    doc.moveDown(0.4);
    doc.fillColor("#64748B").font("Helvetica").fontSize(9).text("Your answer: ________", left, doc.y, { width });
    resetDefaultTextStyle(doc);

    doc.moveDown(0.8);
  }

  // Answer key
  if (includeAnswerKey) {
    doc.addPage();
    if (mode === "preview") drawPreviewWatermark(doc);

    resetDefaultTextStyle(doc);
    doc.font("Helvetica-Bold").fontSize(16).fillColor("#0B1220").text("Answer Key");
    doc.moveDown(0.6);
    resetDefaultTextStyle(doc);

    for (const q of questions) {
      const line = q.correct ? `${q.number}. ${q.correct}` : `${q.number}. (not provided)`;
      const h = doc.heightOfString(line, { width, lineGap: 2 });
      ensureSpace(h + 4);

      doc.font("Helvetica").fontSize(11).fillColor("#0B1220").text(line, left, doc.y, { width, lineGap: 2 });
      resetDefaultTextStyle(doc);
    }
  }

  drawFootersWithTotalPages(doc);
  doc.end();

  return done;
}
