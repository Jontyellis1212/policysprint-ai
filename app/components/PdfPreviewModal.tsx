"use client";

import { useEffect, useMemo, useState } from "react";
import PdfPreviewClient from "./PdfPreviewClient";

type Props = {
  blobUrl: string | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

export default function PdfPreviewModal({ blobUrl, loading, error, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [viewportH, setViewportH] = useState<number>(800);

  // Track viewport height so preview fits perfectly and scroll works
  useEffect(() => {
    const update = () => setViewportH(window.innerHeight || 800);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Prevent background scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Header height estimate (px). Keep this aligned with your header padding/font sizes.
  const headerH = 56;

  // Preview area height: full viewport minus header minus a bit of padding
  const previewH = useMemo(() => {
    const h = viewportH - headerH - 12; // 12px breathing room
    return Math.max(360, h);
  }, [viewportH]);

  return (
    <>
      {/* Mobile trigger (you already styled this how you like) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold bg-gradient-to-r from-emerald-400 to-emerald-300 text-slate-950 shadow-lg shadow-emerald-400/25 hover:from-emerald-300 hover:to-emerald-200 transition-all"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Preview PDF (full screen)
      </button>

      {/* Full-screen modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-3">
              <div>
                <div className="text-xs font-semibold text-slate-100">PDF preview</div>
                <div className="text-[10px] text-slate-400">This is exactly how your exported PDF will look</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={loading}
                  className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-[11px] text-slate-100 hover:bg-slate-900 disabled:opacity-60"
                >
                  {loading ? "Refreshing…" : "Refresh"}
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>

            {/* IMPORTANT: allow scrolling inside the modal */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-3">
                {/* PdfPreviewClient already uses an internal scroll container,
                    but giving it a real viewport-based height ensures it works reliably. */}
                <PdfPreviewClient blobUrl={blobUrl} loading={loading} error={error} height={previewH} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
