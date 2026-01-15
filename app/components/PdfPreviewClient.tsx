"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  blobUrl: string | null;
  loading?: boolean;
  error?: string | null;
  height?: number;
};

export default function PdfPreviewClient({
  blobUrl,
  loading = false,
  error = null,
  height = 520,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pdf: any = null;

    async function render() {
      setInternalError(null);
      setUseIframeFallback(false);

      if (!blobUrl || !containerRef.current) return;

      // Clear previous preview
      containerRef.current.innerHTML = "";

      try {
        /**
         * ✅ Use the legacy build (most compatible in Next/webpack environments)
         * Worker is served from /public as .js to avoid module-worker issues in Next dev.
         */
        const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf");

        // ✅ IMPORTANT: point to .js worker (copied into /public)
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

        const loadingTask = pdfjsLib.getDocument({
          url: blobUrl,
          // Helps when blob URLs behave oddly in some environments
          disableAutoFetch: true,
        });

        pdf = await loadingTask.promise;
        if (cancelled) return;

        // Render each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          if (cancelled) return;

          const viewport = page.getViewport({ scale: 1.2 });

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          canvas.style.display = "block";
          canvas.style.margin = "0 auto 16px auto";
          canvas.style.background = "white";

          await page
            .render({
              canvasContext: ctx,
              viewport,
            })
            .promise;

          if (cancelled) return;

          containerRef.current.appendChild(canvas);
        }
      } catch (e: any) {
        if (cancelled) return;

        const msg =
          e?.message ||
          (typeof e === "string" ? e : "Failed to render PDF preview.");

        console.error("PDF preview render failed:", e);

        // If pdf.js fails, fall back to iframe preview so you still see something.
        setInternalError(msg);
        setUseIframeFallback(true);
      }
    }

    render();

    return () => {
      cancelled = true;
      try {
        pdf?.destroy?.();
      } catch {}
    };
  }, [blobUrl]);

  const shownError = error || internalError;

  if (loading) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-sm text-slate-400"
      >
        Generating preview…
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-sm text-slate-400"
      >
        Preview will appear here
      </div>
    );
  }

  // ✅ Fallback: show PDF directly if pdf.js fails
  if (useIframeFallback) {
    return (
      <div className="rounded border border-slate-200 bg-white overflow-hidden">
        <div className="px-3 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-100">
          Preview renderer hit an issue, showing fallback preview.
          {shownError ? ` (${shownError})` : null}
        </div>
        <iframe
          title="PDF Preview"
          src={blobUrl}
          style={{ height, width: "100%" }}
        />
      </div>
    );
  }

  // ✅ pdf.js canvas container
  return (
    <div className="rounded border border-slate-200 bg-white overflow-hidden">
      {shownError ? (
        <div className="px-3 py-2 text-xs text-red-700 bg-red-50 border-b border-red-100">
          {shownError}
        </div>
      ) : null}

      <div ref={containerRef} style={{ height }} className="overflow-y-auto" />
    </div>
  );
}
