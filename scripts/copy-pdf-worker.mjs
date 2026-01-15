// scripts/copy-pdf-worker.mjs
import fs from "fs";
import path from "path";

const root = process.cwd();
const publicDir = path.join(root, "public");

// ✅ Single canonical output (matches PdfPreviewClient.tsx workerSrc)
const outFile = path.join(publicDir, "pdf.worker.min.js");

// pdfjs-dist paths differ by version; try multiple candidates.
const candidates = [
  // v5+ (often mjs)
  path.join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs"),
  path.join(root, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.min.mjs"),

  // some versions have js
  path.join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.js"),
  path.join(root, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.min.js"),

  // older layouts
  path.join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.js"),
  path.join(root, "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.js"),
];

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

let found = null;
for (const p of candidates) {
  if (fs.existsSync(p)) {
    found = p;
    break;
  }
}

if (!found) {
  console.error("❌ Could not find pdf.js worker in pdfjs-dist. Checked:");
  for (const c of candidates) console.error(" -", c);
  process.exit(1);
}

// Copy as raw bytes (works for both .mjs and .js sources)
fs.copyFileSync(found, outFile);

console.log("✅ Copied pdf.js worker from:", found);
console.log("   ->", outFile);
