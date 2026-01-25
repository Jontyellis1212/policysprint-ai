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

      // clear previous preview
      containerRef.current.innerHTML = "";

      try {
        const pdfjsLib: any = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

        const loadingTask = pdfjsLib.getDocument({
          url: blobUrl,
          disableAutoFetch: true,
        });

        pdf = await loadingTask.promise;
        if (cancelled) return;

        const containerWidth = Math.max(320, containerRef.current.clientWidth || 0);
        const dpr = Math.min(2, window.devicePixelRatio || 1);

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          if (cancelled) return;

          const baseViewport = page.getViewport({ scale: 1 });
          const fitScale = containerWidth / baseViewport.width;
          const viewport = page.getViewport({ scale: fitScale * dpr });

          // --- Page wrapper (this is the "page break" UI) ---
          const pageWrap = document.createElement("div");
          pageWrap.style.padding = "12px 0 20px 0";

          // subtle separator between pages (not after the last page)
          if (pageNum !== 1) {
            const sep = document.createElement("div");
            sep.style.height = "1px";
            sep.style.background = "rgba(15, 23, 42, 0.12)"; // slate-ish
            sep.style.margin = "0 0 14px 0";
            pageWrap.appendChild(sep);
          }

          // optional page label
          const label = document.createElement("div");
          label.textContent = `Page ${pageNum} of ${pdf.numPages}`;
          label.style.fontSize = "11px";
          label.style.color = "rgba(15, 23, 42, 0.55)";
          label.style.textAlign = "right";
          label.style.margin = "0 0 8px 0";
          label.style.padding = "0 6px";
          pageWrap.appendChild(label);

          // Canvas
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);

          canvas.style.display = "block";
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.background = "white";
          canvas.style.borderRadius = "14px";
          canvas.style.boxShadow = "0 10px 30px rgba(0,0,0,0.10)";
          canvas.style.border = "1px solid rgba(15, 23, 42, 0.08)";

          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;

          pageWrap.appendChild(canvas);
          containerRef.current.appendChild(pageWrap);
        }
      } catch (e: any) {
        if (cancelled) return;

        const msg =
          e?.message || (typeof e === "string" ? e : "Failed to render PDF preview.");

        console.error("PDF preview render failed:", e);
        setInternalError(msg);
        setUseIframeFallback(true);
      }
    }

    render();

    const onResize = () => {
      if (cancelled) return;
      window.requestAnimationFrame(() => {
        if (!cancelled) render();
      });
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      try {
        pdf?.destroy?.();
      } catch {}
    };
  }, [blobUrl, height]);

  const shownError = error || internalError;

  if (loading) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-slate-400">
        Generating preview…
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-slate-400">
        Preview will appear here
      </div>
    );
  }

  if (useIframeFallback) {
    return (
      <div className="rounded border border-slate-200 bg-white overflow-hidden">
        <div className="px-3 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-100">
          Preview renderer hit an issue, showing fallback preview.
          {shownError ? ` (${shownError})` : null}
        </div>
        <iframe title="PDF Preview" src={blobUrl} style={{ height, width: "100%" }} />
      </div>
    );
  }

  return (
    <div className="rounded border border-slate-200 bg-white overflow-hidden">
      {shownError ? (
        <div className="px-3 py-2 text-xs text-red-700 bg-red-50 border-b border-red-100">
          {shownError}
        </div>
      ) : null}

      {/* key: scroll vertically, never horizontally */}
      <div
        ref={containerRef}
        style={{ height }}
        className="overflow-y-auto overflow-x-hidden p-3 bg-slate-50"
      />
    </div>
  );
}
