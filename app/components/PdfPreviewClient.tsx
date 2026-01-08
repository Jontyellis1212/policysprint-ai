"use client";

import { useEffect, useRef } from "react";

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

  useEffect(() => {
    let cancelled = false;
    let pdf: any = null;

    async function render() {
      if (!blobUrl || !containerRef.current) return;

      // ⛔ Clear previous preview
      containerRef.current.innerHTML = "";

      // ✅ Lazy-load pdfjs ONLY in the browser
      const pdfjsLib = await import("pdfjs-dist");
      const workerSrc = "/pdf.worker.min.mjs";
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc;

      const loadingTask = (pdfjsLib as any).getDocument(blobUrl);
      pdf = await loadingTask.promise;

      if (cancelled) return;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.2 });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.display = "block";
        canvas.style.margin = "0 auto 16px auto";

        await page.render({
          canvas,
          canvasContext: ctx,
          viewport,
        }).promise;

        if (cancelled) return;

        containerRef.current.appendChild(canvas);
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

  if (loading) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-sm text-slate-500"
      >
        Generating preview…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-sm text-red-600"
      >
        {error}
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

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="overflow-y-auto rounded border border-slate-200 bg-white"
    />
  );
}
