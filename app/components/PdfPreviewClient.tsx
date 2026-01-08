// app/components/PdfPreviewClient.tsx
"use client";

import { useMemo } from "react";

type Props = {
  blobUrl: string | null;
  className?: string;
  height?: number; // default 520
  showWatermark?: boolean; // optional overlay watermark (UI only)
};

export default function PdfPreviewClient({
  blobUrl,
  className,
  height = 520,
  showWatermark = true,
}: Props) {
  // Hide built-in PDF viewer UI as much as Chromium allows.
  // Note: this does NOT “secure” the PDF — it just removes most buttons.
  const iframeSrc = useMemo(() => {
    if (!blobUrl) return null;

    // Chrome PDF viewer supports most of these.
    // toolbar=0 removes toolbar, navpanes=0 removes left panes.
    // view=FitH tends to look nicer in an embedded pane.
    return `${blobUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
  }, [blobUrl]);

  return (
    <div
      className={[
        "relative w-full min-w-0 overflow-hidden rounded-lg border border-slate-800 bg-black/20",
        className || "",
      ].join(" ")}
      style={{ height }}
    >
      {!iframeSrc ? (
        <div className="h-full w-full flex items-center justify-center text-[11px] text-slate-400">
          Preview will appear here.
        </div>
      ) : (
        <>
          {/* The PDF itself */}
          <iframe
            title="PDF preview"
            src={iframeSrc}
            className="h-full w-full bg-white"
          />

          {/* Optional overlay watermark (UI only).
              Your server PDF already has a watermark too — this just reinforces it. */}
          {showWatermark ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="select-none rotate-[-18deg] text-slate-400/15 font-black text-5xl md:text-6xl tracking-wide">
                PREVIEW
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
