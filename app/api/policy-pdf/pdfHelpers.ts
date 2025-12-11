// app/api/policy-pdf/pdfHelpers.ts

import type PDFKit from 'pdfkit';
import { pdfTheme } from './pdfTheme';

type Doc = PDFKit.PDFDocument | any;

interface HeaderFooterOptions {
  title?: string;
  subtitle?: string;
  clientName?: string;
  shortUrl?: string;
}

export function drawHeader(doc: Doc, opts: HeaderFooterOptions = {}) {
  const { title, subtitle } = opts;
  const { pageMargin, headerHeight } = pdfTheme.spacing;
  const { primary, muted } = pdfTheme.colors;
  const { h2 } = pdfTheme.typography;

  doc
    .save()
    .rect(0, 0, doc.page.width, headerHeight + 10)
    .fill('#FFFFFF') // background for header (keep white/clean)
    .restore();

  doc
    .fillColor(primary)
    .font(pdfTheme.fonts.heading)
    .fontSize(h2.size)
    .text('PolicySprint', pageMargin, 18, {
      continued: false,
    });

  if (title) {
    doc
      .fillColor('#000000')
      .font(pdfTheme.fonts.heading)
      .fontSize(h2.size)
      .text(title, pageMargin, 36);
  }

  if (subtitle) {
    doc
      .fillColor(muted)
      .font(pdfTheme.fonts.body)
      .fontSize(9)
      .text(subtitle, pageMargin, 52);
  }

  doc.moveDown();
}

export function drawFooter(doc: Doc, opts: HeaderFooterOptions = {}) {
  const { shortUrl } = opts;
  const { pageMargin, footerHeight } = pdfTheme.spacing;
  const { muted, border } = pdfTheme.colors;

  const bottomY = doc.page.height - footerHeight;

  // Divider line
  doc
    .strokeColor(border)
    .lineWidth(0.5)
    .moveTo(pageMargin, bottomY)
    .lineTo(doc.page.width - pageMargin, bottomY)
    .stroke();

  // Left: URL / tagline
  if (shortUrl) {
    doc
      .fillColor(muted)
      .font(pdfTheme.fonts.body)
      .fontSize(8)
      .text(shortUrl, pageMargin, bottomY + 8, {
        align: 'left',
      });
  } else {
    doc
      .fillColor(muted)
      .font(pdfTheme.fonts.body)
      .fontSize(8)
      .text('Generated with PolicySprint', pageMargin, bottomY + 8, {
        align: 'left',
      });
  }

  // Right: page X of Y
  const currentPage = doc.page.document.page;
  const totalPages = doc._root.data.Count || doc._pageBuffer.length || currentPage;

  const footerText = `Page ${currentPage} of ${totalPages}`;
  const textWidth = doc.widthOfString(footerText);

  doc
    .fillColor(muted)
    .font(pdfTheme.fonts.body)
    .fontSize(8)
    .text(
      footerText,
      doc.page.width - pageMargin - textWidth,
      bottomY + 8,
      { align: 'right' }
    );
}

export function drawHeading(doc: Doc, level: 1 | 2 | 3, text: string) {
  const { sectionGap } = pdfTheme.spacing;
  const { primary, text: textColor } = pdfTheme.colors;
  const { h1, h2, h3 } = pdfTheme.typography;

  const style = level === 1 ? h1 : level === 2 ? h2 : h3;

  doc.moveDown();
  if (level === 1) {
    doc.moveDown(); // extra space before top-level sections
  }

  doc
    .fillColor(level === 1 ? primary : textColor)
    .font(pdfTheme.fonts.heading)
    .fontSize(style.size)
    .text(text, {
      paragraphGap: sectionGap / 2,
    });

  doc.moveDown(0.25);
}

export function drawBodyText(doc: Doc, text: string) {
  const { paragraphGap } = pdfTheme.spacing;
  const { body } = pdfTheme.typography;
  const { text: textColor } = pdfTheme.colors;

  doc
    .fillColor(textColor)
    .font(pdfTheme.fonts.body)
    .fontSize(body.size)
    .text(text, {
      lineGap: body.lineGap,
      paragraphGap,
    });
}

export function drawSectionBreak(doc: Doc) {
  const { sectionGap } = pdfTheme.spacing;
  const { border } = pdfTheme.colors;

  doc.moveDown();
  const x = doc.page.margins.left;
  const y = doc.y;

  doc
    .strokeColor(border)
    .lineWidth(0.5)
    .moveTo(x, y)
    .lineTo(doc.page.width - x, y)
    .stroke();

  doc.moveDown(sectionGap / 4);
}
