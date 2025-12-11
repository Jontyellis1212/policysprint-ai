import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";

// -----------------------------------------------------
//  POLICYSPRINT AI — BRAND SYSTEM
// -----------------------------------------------------

const BRAND = {
  primary: "#2563EB",
  primarySoft: "#DBEAFE",
  accent: "#38BDF8",
  accentPurple: "#A855F7",
  ink: "#020617",
  muted: "#6B7280",
  subtle: "#9CA3AF",
  border: "#E5E7EB",
  background: "#F9FAFB",
};

const TYPO = {
  headingFont: "Helvetica-Bold",
  bodyFont: "Helvetica",
  monoFont: "Courier",
  h1Size: 18,
  h2Size: 14,
  h3Size: 11,
  bodySize: 10,
  smallSize: 8,
};

// -----------------------------------------------------
//  LAYOUT SYSTEM (MARGINS)
// -----------------------------------------------------

const LAYOUT = {
  top: 90,
  bottom: 60,
  left: 50,
  right: 50,
};

interface TocEntry {
  title: string;
  page: number;
  level: number; // 1 = main section, 2 = numbered subheading
}

// -----------------------------------------------------
//  BASIC TEXT HELPERS
// -----------------------------------------------------

function setBodyTextStyle(doc: PDFKit.PDFDocument) {
  doc
    .font(TYPO.bodyFont)
    .fontSize(TYPO.bodySize)
    .fillColor(BRAND.ink)
    .lineGap(5);
}

function setMutedTextStyle(
  doc: PDFKit.PDFDocument,
  size: number = TYPO.smallSize
) {
  doc
    .font(TYPO.bodyFont)
    .fontSize(size)
    .fillColor(BRAND.muted)
    .lineGap(3);
}

// -----------------------------------------------------
//  PAGE BACKGROUND + WATERMARK
// -----------------------------------------------------

function drawWatermark(doc: PDFKit.PDFDocument) {
  const w = doc.page.width;
  const h = doc.page.height;

  doc
    .save()
    .translate(w / 2, h / 2)
    .rotate(-35)
    .font(TYPO.headingFont)
    .fontSize(60)
    .fillColor("#2563EB")
    .opacity(0.04)
    .text("PolicySprint AI", -300, 0, {
      width: 600,
      align: "center",
    })
    .restore();

  // Soft stroke to improve visibility over white
  doc
    .save()
    .translate(w / 2, h / 2)
    .rotate(-35)
    .lineWidth(0.6)
    .strokeColor("#1E40AF")
    .opacity(0.05)
    .text("PolicySprint AI", -300, 0, {
      width: 600,
      align: "center",
    })
    .restore();
}

function applyPageBackground(doc: PDFKit.PDFDocument) {
  const w = doc.page.width;
  const h = doc.page.height;

  // Soft grey full-page background
  doc
    .save()
    .rect(0, 0, w, h)
    .fillColor(BRAND.background)
    .fill()
    .restore();

  // White inner card
  const cardMargin = 24;
  doc
    .save()
    .roundedRect(
      cardMargin,
      cardMargin,
      w - cardMargin * 2,
      h - cardMargin * 2,
      16
    )
    .fillColor("#FFFFFF")
    .fill()
    .restore();

  // Watermark behind content
  drawWatermark(doc);
}

// -----------------------------------------------------
//  HEADER BAND
// -----------------------------------------------------

function drawHeaderBand(
  doc: PDFKit.PDFDocument,
  policyTitle: string,
  subtitle?: string
) {
  const pageWidth = doc.page.width;
  const { left, right } = doc.page.margins;
  const usableWidth = pageWidth - left - right;

  const bandX = left;
  const bandY = 26;
  const bandHeight = 68;
  const radius = 12;

  // Soft shadow
  doc
    .save()
    .rect(bandX, bandY + 3, usableWidth, bandHeight)
    .fillColor("#0B1120")
    .opacity(0.05)
    .fill()
    .restore();

  // Main blue band
  doc
    .save()
    .roundedRect(bandX, bandY, usableWidth, bandHeight, radius)
    .fillColor(BRAND.primary)
    .fill()
    .restore();

  // Accent bar at right
  const accentWidth = 6;
  doc
    .save()
    .roundedRect(
      bandX + usableWidth - accentWidth,
      bandY,
      accentWidth,
      bandHeight,
      radius
    )
    .fillColor(BRAND.accent)
    .fill()
    .restore();

  // Minimal logo mark
  const logoX = bandX + 18;
  const logoY = bandY + 18;
  const logoSize = 20;

  doc
    .save()
    .roundedRect(logoX, logoY, logoSize, logoSize, 6)
    .fillColor("#EFF6FF")
    .fill()
    .restore();

  // "Spark" diagonal in logo
  doc
    .save()
    .moveTo(logoX + 5, logoY + logoSize - 5)
    .lineTo(logoX + logoSize - 5, logoY + 5)
    .lineWidth(2)
    .strokeColor(BRAND.primary)
    .stroke()
    .restore();

  // Left text: brand
  const textStartX = logoX + logoSize + 10;
  const textBaseline = logoY - 1;

  doc
    .fillColor("white")
    .font(TYPO.headingFont)
    .fontSize(13)
    .text("PolicySprint AI", textStartX, textBaseline, { continued: true });

  doc
    .font(TYPO.bodyFont)
    .fontSize(10)
    .fillColor(BRAND.primarySoft)
    .text(" • AI Use Policy Export");

  // Right-side metadata
  const rightBlockWidth = 220;
  const rightX = bandX + usableWidth - rightBlockWidth - 18;
  const rightY = logoY - 2;

  const effectiveTitle = policyTitle?.trim() || "AI Use & Governance Policy";

  doc
    .font(TYPO.headingFont)
    .fontSize(11)
    .fillColor("white")
    .text(effectiveTitle, rightX, rightY, {
      width: rightBlockWidth,
      align: "right",
    });

  const environmentLabel = subtitle ?? "Internal — Draft";
  doc
    .font(TYPO.bodyFont)
    .fontSize(9)
    .fillColor(BRAND.primarySoft)
    .text(environmentLabel, rightX, rightY + 18, {
      width: rightBlockWidth,
      align: "right",
    });
}

// -----------------------------------------------------
//  FOOTER (ADDED AFTER CONTENT USING BUFFERED PAGES)
// -----------------------------------------------------

function drawFooter(
  doc: PDFKit.PDFDocument,
  pageNumber: number,
  pageCount: number
) {
  const { left, right, bottom } = doc.page.margins;
  const usableWidth = doc.page.width - left - right;
  const footerY = doc.page.height - bottom + 10;

  // Divider line
  doc
    .save()
    .moveTo(left, footerY - 8)
    .lineTo(left + usableWidth, footerY - 8)
    .lineWidth(0.5)
    .strokeColor(BRAND.border)
    .stroke()
    .restore();

  // Left side: generator meta
  setMutedTextStyle(doc, TYPO.smallSize);
  doc.text("Generated with PolicySprint AI", left, footerY, {
    width: usableWidth / 2,
    align: "left",
  });

  // Right side: page number
  doc
    .font(TYPO.bodyFont)
    .fontSize(TYPO.smallSize)
    .fillColor(BRAND.subtle)
    .text(`Page ${pageNumber} of ${pageCount}`, left + usableWidth / 2, footerY, {
      width: usableWidth / 2,
      align: "right",
    });
}

// -----------------------------------------------------
//  COVER PAGE
// -----------------------------------------------------

function drawCoverPage(doc: PDFKit.PDFDocument, meta: {
  businessName?: string;
  country?: string;
  industry?: string;
  generatedAt?: string;
}) {
  const { left, right, top, bottom } = doc.page.margins;
  const usableWidth = doc.page.width - left - right;
  const usableHeight = doc.page.height - top - bottom;

  const orgName = meta.businessName || "Your organisation";
  const title = "AI Use Policy";

  // Move the main stack slightly higher (less empty space)
  const centerY = top + usableHeight * 0.25;

  // Organisation name (hero)
  doc
    .save()
    .font(TYPO.headingFont)
    .fontSize(30)
    .fillColor(BRAND.ink)
    .text(orgName, left, centerY, {
      width: usableWidth,
      align: "center",
    })
    .restore();

  // Policy title
  const titleY = centerY + 38;
  doc
    .save()
    .font(TYPO.headingFont)
    .fontSize(22)
    .fillColor(BRAND.primary)
    .text(title, left, titleY, {
      width: usableWidth,
      align: "center",
    })
    .restore();

  // Small divider under title
  const dividerWidth = 80;
  const dividerY = titleY + 30;
  doc
    .save()
    .moveTo(left + (usableWidth - dividerWidth) / 2, dividerY)
    .lineTo(left + (usableWidth + dividerWidth) / 2, dividerY)
    .lineWidth(2)
    .strokeColor(BRAND.primarySoft)
    .stroke()
    .restore();

  // Meta row beneath (labels + bold values)
  const metaTop = dividerY + 26;
  const colWidth = usableWidth / 2 - 12;

  // Left column: country + industry
  let cursorY = metaTop;
  doc
    .save()
    .font(TYPO.bodyFont)
    .fontSize(8)
    .fillColor(BRAND.muted)
    .text("Country / region", left, cursorY, {
      width: colWidth,
    })
    .font(TYPO.headingFont)
    .fontSize(11)
    .fillColor(BRAND.ink)
    .text(meta.country || "—", left, doc.y + 1, {
      width: colWidth,
    })
    .font(TYPO.bodyFont)
    .fontSize(8)
    .fillColor(BRAND.muted)
    .text("Industry", left, doc.y + 6, {
      width: colWidth,
    })
    .font(TYPO.headingFont)
    .fontSize(11)
    .fillColor(BRAND.ink)
    .text(meta.industry || "—", left, doc.y + 1, {
      width: colWidth,
    })
    .restore();

  // Right column: generated + status
  const rightX = left + colWidth + 24;
  cursorY = metaTop;
  doc
    .save()
    .font(TYPO.bodyFont)
    .fontSize(8)
    .fillColor(BRAND.muted)
    .text("Generated", rightX, cursorY, {
      width: colWidth,
    })
    .font(TYPO.headingFont)
    .fontSize(11)
    .fillColor(BRAND.ink)
    .text(meta.generatedAt || "—", rightX, doc.y + 1, {
      width: colWidth,
    })
    .font(TYPO.bodyFont)
    .fontSize(8)
    .fillColor(BRAND.muted)
    .text("Status", rightX, doc.y + 6, {
      width: colWidth,
    })
    .font(TYPO.headingFont)
    .fontSize(11)
    .fillColor(BRAND.ink)
    .text("Draft internal policy", rightX, doc.y + 1, {
      width: colWidth,
    })
    .restore();

  // Prepared-by badge bottom-right with soft shadow
  const badgeWidth = 230;
  const badgeHeight = 42;
  const badgeX = left + usableWidth - badgeWidth;
  const badgeY = top + usableHeight - badgeHeight - 32;

  // Shadow
  doc
    .save()
    .roundedRect(badgeX + 2, badgeY + 3, badgeWidth, badgeHeight, 999)
    .fillColor("#000000")
    .opacity(0.08)
    .fill()
    .restore();

  // Badge
  doc
    .save()
    .roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 999)
    .fillColor("#0F172A")
    .fill()
    .restore();

  doc
    .save()
    .font(TYPO.headingFont)
    .fontSize(11)
    .fillColor("#F9FAFB")
    .text("Prepared with PolicySprint AI", badgeX + 18, badgeY + 13)
    .restore();

  // Bottom cover notice
  const footerLineY = doc.page.height - bottom - 32;
  doc
    .save()
    .moveTo(left, footerLineY)
    .lineTo(left + usableWidth, footerLineY)
    .lineWidth(0.5)
    .strokeColor(BRAND.border)
    .stroke()
    .restore();

  doc
    .save()
    .font(TYPO.bodyFont)
    .fontSize(8)
    .fillColor(BRAND.muted)
    .text(
      "Confidential internal policy — Not for external distribution",
      left,
      footerLineY + 8,
      { width: usableWidth, align: "left" }
    )
    .restore();
}

// -----------------------------------------------------
//  INTRO SUMMARY CARD (PAGE 2)
// -----------------------------------------------------

function drawIntroSummaryCard(doc: PDFKit.PDFDocument, meta: {
  businessName?: string;
  industry?: string;
  country?: string;
  generatedAt?: string;
}) {
  const { left, right } = doc.page.margins;
  const cardWidth = doc.page.width - left - right;
  const startY = doc.y + 18;
  const cardHeight = 90;
  const x = left;
  const y = startY;
  const padding = 12;

  // Card background
  doc
    .save()
    .roundedRect(x, y, cardWidth, cardHeight, 10)
    .fillColor("#FFFFFF")
    .strokeColor(BRAND.border)
    .lineWidth(1)
    .fillAndStroke()
    .restore();

  const innerX = x + padding;
  let cursorY = y + padding;

  // Business name (or generic label)
  doc
    .save()
    .font(TYPO.headingFont)
    .fontSize(12)
    .fillColor(BRAND.ink)
    .text(meta.businessName || "Your organisation", innerX, cursorY, {
      width: cardWidth - padding * 2,
    })
    .restore();

  cursorY = doc.y + 4;

  // Two-column meta rows
  const colWidth = cardWidth / 2 - padding * 1.5;

  setMutedTextStyle(doc, TYPO.smallSize);

  // Left column: industry & country
  doc.text(`Industry: ${meta.industry || "—"}`, innerX, cursorY, {
    width: colWidth,
  });

  doc.text(`Country: ${meta.country || "—"}`, innerX, doc.y + 2, {
    width: colWidth,
  });

  // Right column: generated date & version
  const rightX = innerX + colWidth + padding;

  doc.text(`Generated: ${meta.generatedAt || "—"}`, rightX, cursorY, {
    width: colWidth,
  });

  doc.text(`Version: Draft`, rightX, doc.y + 2, {
    width: colWidth,
  });

  // Move doc cursor to just below the card
  doc.y = y + cardHeight + 10;
}

// -----------------------------------------------------
//  SECTION HEADING
// -----------------------------------------------------

function drawSectionHeading(doc: PDFKit.PDFDocument, title: string) {
  const { left, right } = doc.page.margins;
  const usableWidth = doc.page.width - left - right;

  const y = doc.y + 16;
  doc.y = y;

  // Chip background
  const chipHeight = 20;

  doc
    .save()
    .roundedRect(left - 2, y - 4, usableWidth + 4, chipHeight, 6)
    .fillColor(BRAND.primarySoft)
    .fill()
    .restore();

  doc
    .save()
    .font(TYPO.headingFont)
    .fontSize(TYPO.h2Size)
    .fillColor(BRAND.primary)
    .text(title.toUpperCase(), left + 8, y - 1)
    .restore();

  // Divider line
  const lineY = doc.y + 4;
  doc
    .save()
    .moveTo(left, lineY)
    .lineTo(left + 60, lineY)
    .lineWidth(1.5)
    .strokeColor(BRAND.primary)
    .stroke()
    .restore();

  doc.moveDown(0.8);
}

// -----------------------------------------------------
//  RICH CONTENT RENDERING (TYPOGRAPHY & BULLETS)
//  + HEADING CALLBACK FOR TOC
// -----------------------------------------------------

function renderSectionContent(
  doc: PDFKit.PDFDocument,
  content: string,
  onHeading?: (info: { title: string; level: number; page: number }) => void
) {
  const { left, right } = doc.page.margins;
  const width = doc.page.width - left - right;

  setBodyTextStyle(doc);

  const lines = content.split(/\r?\n/);

  for (let rawLine of lines) {
    const line = rawLine.trim();

    // Blank line → vertical space
    if (line.length === 0) {
      doc.moveDown(0.6);
      continue;
    }

    // Bullet line: -, *, or • at start
    if (/^[-*•]\s+/.test(line)) {
      const text = line.replace(/^[-*•]\s+/, "");
      setBodyTextStyle(doc);
      doc.text(`• ${text}`, {
        width,
        indent: 10,
        continued: false,
      });
      continue;
    }

    // Numbered subheading: "1. Something", "2. Scope", etc.
    if (/^\d+\.\s+/.test(line)) {
      // Call back into TOC collector (Option B)
      if (onHeading) {
        onHeading({
          title: line, // keep full "1. Purpose"
          level: 2,
          page: doc.page.number,
        });
      }

      doc.moveDown(0.4);
      doc
        .font(TYPO.headingFont)
        .fontSize(TYPO.h3Size)
        .fillColor(BRAND.ink)
        .text(line, {
          width,
        });
      doc.moveDown(0.1);
      setBodyTextStyle(doc);
      continue;
    }

    // Default body paragraph
    setBodyTextStyle(doc);
    doc.text(line, {
      width,
      continued: false,
    });
  }

  doc.moveDown(0.8);
}

// -----------------------------------------------------
//  TABLE OF CONTENTS (PAGE 2) — UPGRADED
// -----------------------------------------------------

function drawTableOfContents(doc: PDFKit.PDFDocument, tocEntries: TocEntry[]) {
  if (!tocEntries.length) return;

  const { left, right } = doc.page.margins;
  const usableWidth = doc.page.width - left - right;
  const rightEdge = doc.page.width - right;

  // Draw TOC just a bit below wherever the summary card left the cursor
  doc.y = doc.y + 20;

  // TOC heading
  doc
    .save()
    .font(TYPO.headingFont)
    .fontSize(12)
    .fillColor(BRAND.muted)
    .text("CONTENTS", left, doc.y, {
      width: usableWidth,
      align: "left",
    })
    .restore();

  doc.moveDown(0.8);

  // Entries with indentation + dotted leaders
  tocEntries.forEach((entry, index) => {
    const isMain = entry.level === 1;
    const indent = isMain ? 0 : 16;
    const label = isMain ? `${index + 1}. ${entry.title}` : entry.title;
    const pageStr = entry.page ? String(entry.page) : "";

    const rowY = doc.y;

    // Label style
    doc
      .save()
      .font(TYPO.bodyFont)
      .fontSize(isMain ? 10 : 9)
      .fillColor(isMain ? BRAND.ink : BRAND.muted);

    // Start text at left + indent
    doc.text(label, left + indent, rowY, {
      continued: true,
    });

    // Dotted leaders
    const dotsWidth = doc.widthOfString(".");
    const pageWidth = doc.widthOfString(pageStr || " ");
    let dotX = doc.x;
    const maxDotX = rightEdge - pageWidth - 4; // small gap before page #

    doc.fillColor(BRAND.subtle);
    while (dotX < maxDotX) {
      doc.text(".", dotX, rowY, { continued: true });
      dotX += dotsWidth;
    }

    // Page number on far right
    doc
      .fillColor(BRAND.muted)
      .text(pageStr, rightEdge - pageWidth, rowY, {
        continued: false,
      })
      .restore();

    doc.moveDown(isMain ? 0.35 : 0.25);
  });
}

// -----------------------------------------------------
//  MAIN ROUTE HANDLER
// -----------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      businessName,
      country,
      industry,
      policyText,
      policyTitle: bodyPolicyTitle,
      sections,
      policy,
      policyContent,
      content,
    } = body as any;

    const effectiveTitle: string =
      bodyPolicyTitle ||
      (businessName
        ? `${businessName} — AI Use Policy`
        : "AI Use & Governance Policy");

    // Build sections
    let effectiveSections: { title: string; content: string }[] = [];

    if (Array.isArray(sections) && sections.length > 0) {
      effectiveSections = sections;
    } else {
      const text: string =
        typeof policyText === "string" && policyText.trim().length > 0
          ? policyText
          : typeof policy === "string" && policy.trim().length > 0
          ? policy
          : typeof policyContent === "string" && policyContent.trim().length > 0
          ? policyContent
          : typeof content === "string" && content.trim().length > 0
          ? content
          : "";

      if (text.trim().length > 0) {
        effectiveSections = [
          {
            title: "Full Policy",
            content: text,
          },
        ];
      }
    }

    const generatedAt = new Date().toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const doc = new PDFDocument({
      autoFirstPage: false, // we control pages manually (cover + summary/TOC + content)
      bufferPages: true,
      margins: {
        top: LAYOUT.top,
        bottom: LAYOUT.bottom,
        left: LAYOUT.left,
        right: LAYOUT.right,
      },
    });

    // Collect PDF chunks into a Buffer
    const buffers: Buffer[] = [];
    const pdfBufferPromise: Promise<Buffer> = new Promise((resolve, reject) => {
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));
    });

    // PAGE 1: COVER
    doc.addPage();
    applyPageBackground(doc);
    drawHeaderBand(doc, effectiveTitle);
    setBodyTextStyle(doc);

    drawCoverPage(doc, {
      businessName,
      country,
      industry,
      generatedAt,
    });

    // PAGE 2: INTRO SUMMARY (TOC will be drawn later)
    doc.addPage();
    applyPageBackground(doc);
    drawHeaderBand(doc, effectiveTitle);
    setBodyTextStyle(doc);

    drawIntroSummaryCard(doc, {
      businessName,
      industry,
      country,
      generatedAt,
    });

    // Track TOC entries while rendering sections
    const tocEntries: TocEntry[] = [];

    // Subsequent pages (including first content page & overflow)
    doc.on("pageAdded", () => {
      applyPageBackground(doc);
      drawHeaderBand(doc, effectiveTitle);
      setBodyTextStyle(doc);
      doc.y = doc.page.margins.top;
    });

    // PAGE 3: FIRST CONTENT PAGE
    doc.addPage(); // pageAdded will style it

    // Render sections and capture page numbers for TOC
    for (const sec of effectiveSections) {
      // Main section entry
      tocEntries.push({
        title: sec.title,
        page: doc.page.number,
        level: 1,
      });

      drawSectionHeading(doc, sec.title);

      renderSectionContent(doc, sec.content, (headingInfo) => {
        tocEntries.push({
          title: headingInfo.title,
          page: headingInfo.page,
          level: headingInfo.level,
        });
      });
    }

    // AFTER CONTENT: add footer & render TOC
    const range = (doc as any).bufferedPageRange();
    const pageCount = range.count;

    // Draw TOC back on page 2 (index start + 1)
    const tocPageIndex = range.start + 1; // 0: cover, 1: summary/TOC
    doc.switchToPage(tocPageIndex);
    drawTableOfContents(doc, tocEntries);

    // Footers on all pages
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(range.start + i);
      drawFooter(doc, i + 1, pageCount);
    }

    doc.end();
    const pdfBuffer = await pdfBufferPromise;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=policy.pdf",
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err: any) {
    console.error("PDF ERROR:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
