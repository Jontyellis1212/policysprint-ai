// app/api/policy-pdf/pdfTheme.ts

export const pdfTheme = {
  colors: {
    background: '#FFFFFF',
    primary: '#1F6FEB', // main brand accent
    secondary: '#00B894', // secondary accent
    text: '#222222',
    muted: '#666666',
    border: '#E0E0E0',
    tocDot: '#CCCCCC',
  },
  fonts: {
    heading: 'Helvetica-Bold',
    body: 'Helvetica',
  },
  spacing: {
    pageMargin: 56,       // page margin all around
    headerHeight: 40,     // vertical space reserved for header
    footerHeight: 40,     // vertical space reserved for footer
    sectionGap: 24,       // space before a new main section
    paragraphGap: 10,     // space between paragraphs
  },
  typography: {
    h1: { size: 20 },
    h2: { size: 16 },
    h3: { size: 13 },
    body: { size: 10, lineGap: 4 },
    toc: { size: 10 },
  },
};
