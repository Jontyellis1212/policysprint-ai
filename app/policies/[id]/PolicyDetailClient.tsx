"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Policy = {
  id: string;
  title: string | null;
  businessName: string | null;
  industry: string | null;
  country: string | null;
  organizationId: string | null;
  content: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

type PolicyVersion = {
  id: string;
  policyId: string;
  version: number;
  content: string;
  createdAt: string;
};

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: { code?: string; message: string; details?: unknown } };
type ApiResponse<T> = ApiOk<T> | ApiErr;

function isApiOk<T>(v: any): v is ApiOk<T> {
  return v && typeof v === "object" && v.ok === true && "data" in v;
}
function isApiErr(v: any): v is ApiErr {
  return v && typeof v === "object" && v.ok === false && v.error && typeof v.error.message === "string";
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

type Toast = { id: string; type: "success" | "error" | "info"; message: string };

type DiffRow =
  | { kind: "same"; text: string }
  | { kind: "add"; text: string }
  | { kind: "del"; text: string };

function splitLines(s: string) {
  return (s ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

// Simple LCS-based line diff (stable, readable).
function buildLineDiff(fromText: string, toText: string): DiffRow[] {
  const a = splitLines(fromText);
  const b = splitLines(toText);

  const n = a.length;
  const m = b.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffRow[] = [];
  let i = 0;
  let j = 0;

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ kind: "same", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ kind: "del", text: a[i] });
      i++;
    } else {
      out.push({ kind: "add", text: b[j] });
      j++;
    }
  }
  while (i < n) out.push({ kind: "del", text: a[i++] });
  while (j < m) out.push({ kind: "add", text: b[j++] });

  return out;
}

type PdfLockedState = { title: string; message: string } | null;

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function PolicyDetailClient({
  policy,
  versions,
  basePath = "/policies",
}: {
  policy: Policy;
  versions: PolicyVersion[];
  basePath?: "/policies" | "/dashboard/policies";
}) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewingPdf, setPreviewingPdf] = useState(false);

  const [selectedVersion, setSelectedVersion] = useState<PolicyVersion | null>(null);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [restoreBanner, setRestoreBanner] = useState<string | null>(null);

  const [previewMode, setPreviewMode] = useState<"text" | "diff">("text");

  // Paywall banner state (download only)
  const [pdfLocked, setPdfLocked] = useState<PdfLockedState>(null);

  // Preview modal state
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Mobile actions popover
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const pushToast = (type: Toast["type"], message: string, ms = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((t) => [{ id, type, message }, ...t].slice(0, 4));

    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, ms);
  };

  const redirectToLogin = () => {
    const cb = `${basePath}/${encodeURIComponent(policy.id)}`;
    router.replace(`/login?callbackUrl=${encodeURIComponent(cb)}`);
  };

  const closePreview = () => {
    setPdfPreviewOpen(false);
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  };

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close “More” when clicking outside or pressing Escape
  useEffect(() => {
    if (!mobileMoreOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMoreOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-mobile-more]")) return;
      setMobileMoreOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [mobileMoreOpen]);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete this policy?\n\n"${policy.title || "AI Use Policy"}"\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeleting(true);

      const res = await fetch(`/api/policies/${encodeURIComponent(policy.id)}`, { method: "DELETE" });
      const json = (await res.json().catch(() => null)) as ApiResponse<{ id: string; deleted: boolean }> | null;

      if (!res.ok) {
        if (res.status === 401) return redirectToLogin();
        if (json && isApiErr(json)) throw new Error(json.error.message);
        throw new Error("Failed to delete policy");
      }

      router.push(basePath);
      router.refresh();
    } catch (e: any) {
      pushToast("error", e?.message || "Failed to delete policy");
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      setDuplicating(true);

      const res = await fetch(`/api/policies/${encodeURIComponent(policy.id)}/duplicate`, { method: "POST" });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) return redirectToLogin();
        if (json && isApiErr(json)) throw new Error(json.error.message);
        throw new Error("Failed to duplicate policy");
      }

      const newId = (json as any)?.id || (json && isApiOk<any>(json) ? (json as any).data?.id : null);
      if (!newId || typeof newId !== "string") throw new Error("Duplicate succeeded but no new policy id returned");

      router.push(`${basePath}/${newId}`);
      router.refresh();
    } catch (e: any) {
      pushToast("error", e?.message || "Failed to duplicate policy");
    } finally {
      setDuplicating(false);
    }
  };

  const makePdfPayload = () => ({
    businessName: policy.businessName ?? "",
    country: policy.country ?? "",
    industry: policy.industry ?? "",
    policyText: policy.content,
  });

  const handlePreviewPdf = async () => {
    try {
      setPreviewingPdf(true);

      // Close any previous preview
      closePreview();

      const res = await fetch("/api/policy-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pdf-mode": "preview",
        },
        body: JSON.stringify(makePdfPayload()),
      });

      if (res.status === 401) {
        redirectToLogin();
        return;
      }

      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const j = await res.json().catch(() => null);
          const msg =
            (typeof (j as any)?.error?.message === "string" && (j as any).error.message) ||
            (typeof (j as any)?.error === "string" && (j as any).error) ||
            (typeof (j as any)?.message === "string" && (j as any).message) ||
            "Failed to generate PDF preview.";
          pushToast("error", msg);
          return;
        }
        const txt = await res.text().catch(() => "");
        pushToast(
          "error",
          txt?.trim() ? `Failed to generate PDF preview: ${txt.slice(0, 180)}` : "Failed to generate PDF preview."
        );
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      setPdfPreviewOpen(true);
    } catch (e: any) {
      pushToast("error", e?.message || "Something went wrong generating the preview.");
    } finally {
      setPreviewingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      setPdfLocked(null);

      const res = await fetch("/api/policy-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(makePdfPayload()),
      });

      if (res.status === 401) {
        redirectToLogin();
        return;
      }

      const contentType = (res.headers.get("content-type") || "").toLowerCase();

      const readJsonError = async () => {
        try {
          const j = await res.json();
          const msg =
            (typeof (j as any)?.error === "string" && (j as any).error) ||
            (typeof (j as any)?.error?.message === "string" && (j as any).error.message) ||
            (typeof (j as any)?.message === "string" && (j as any).message) ||
            "";
          const code =
            (typeof (j as any)?.error?.code === "string" && (j as any).error.code) ||
            (typeof (j as any)?.code === "string" && (j as any).code) ||
            "";
          return { msg, code };
        } catch {
          return { msg: "", code: "" };
        }
      };

      const showPaywall = (msg?: string) => {
        setPdfLocked({
          title: "PDF download is a Pro feature",
          message:
            msg ||
            "Preview the PDF for free. Upgrade to Pro to download the final, share-ready PDF without the preview watermark.",
        });
      };

      if (contentType.includes("application/json")) {
        const { msg, code } = await readJsonError();
        if (res.status === 403 && code.toUpperCase() === "PRO_REQUIRED") {
          showPaywall(msg);
          return;
        }
        if (!res.ok) {
          pushToast("error", msg || "Failed to generate PDF.");
          return;
        }
        pushToast("error", "Unexpected response while generating the PDF.");
        return;
      }

      if (res.status === 403) {
        showPaywall();
        return;
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        pushToast("error", txt?.trim() ? `Failed to generate PDF: ${txt.slice(0, 180)}` : "Failed to generate PDF.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = (policy.title ? policy.title.replace(/\s+/g, "-").toLowerCase() : "ai-use-policy") + ".pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      pushToast("success", "PDF downloaded.");
    } catch (e: any) {
      pushToast("error", e?.message || "Something went wrong generating the PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const refreshSelf = async () => {
    router.refresh();
  };

  const handleRestore = async (version: PolicyVersion) => {
    const confirmed = window.confirm(
      `Restore to Version ${version.version}?\n\nThis will overwrite the current policy content.\nA snapshot of your current content will be saved automatically.`
    );
    if (!confirmed) return;

    try {
      setRestoringVersionId(version.id);
      setRestoreBanner(null);

      const res = await fetch(`/api/policies/${encodeURIComponent(policy.id)}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: version.id }),
      });

      const json = (await res.json().catch(() => null)) as ApiResponse<Policy> | null;

      if (!res.ok) {
        if (res.status === 401) return redirectToLogin();
        if (json && isApiErr(json)) throw new Error(json.error.message);
        throw new Error("Failed to restore version");
      }

      setSelectedVersion(null);
      await refreshSelf();

      pushToast("success", `Restored to version ${version.version}.`);
      setRestoreBanner(`✅ Restored to version ${version.version}.`);

      window.setTimeout(() => {
        setRestoreBanner((current) => (current === `✅ Restored to version ${version.version}.` ? null : current));
      }, 4500);
    } catch (e: any) {
      pushToast("error", e?.message || "Failed to restore version");
    } finally {
      setRestoringVersionId(null);
    }
  };

  const currentText = policy.content ?? "";
  const previewText = selectedVersion?.content ?? "";

  const diffTooBig =
    currentText.length + previewText.length > 200_000 ||
    splitLines(currentText).length + splitLines(previewText).length > 6000;

  const diffRows: DiffRow[] =
    selectedVersion && previewMode === "diff" && !diffTooBig ? buildLineDiff(currentText, previewText) : [];

  const subtitle = useMemo(() => {
    const parts: string[] = [];
    if (policy.businessName) parts.push(policy.businessName);
    if (policy.industry) parts.push(policy.industry);
    if (policy.country) parts.push(policy.country);
    return parts.join(" · ");
  }, [policy.businessName, policy.country, policy.industry]);

  const primaryDisabled = deleting || duplicating || downloadingPdf || previewingPdf;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Toasts */}
      {toasts.length > 0 ? (
        <div className="fixed z-50 top-4 left-1/2 -translate-x-1/2 w-[92vw] max-w-[420px] flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={clsx(
                "rounded-2xl border shadow-lg px-4 py-3 text-sm backdrop-blur",
                t.type === "success" && "bg-emerald-500/15 border-emerald-400/25 text-emerald-50",
                t.type === "error" && "bg-red-500/15 border-red-400/25 text-red-50",
                t.type === "info" && "bg-slate-700/30 border-slate-400/20 text-slate-50"
              )}
            >
              {t.message}
            </div>
          ))}
        </div>
      ) : null}

      {/* Preview modal */}
      {pdfPreviewOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={closePreview} />
          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
            <div className="w-full max-w-6xl h-[86vh] rounded-3xl bg-slate-900/80 backdrop-blur border border-slate-700/60 overflow-hidden shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-slate-700/60">
                <div>
                  <p className="text-sm font-semibold text-slate-50">PDF preview</p>
                  <p className="text-xs text-slate-300">
                    This is a watermarked preview. Upgrade to download the final PDF.
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href="/pricing"
                    className="px-3 py-1.5 rounded-full bg-emerald-500 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    Upgrade to Pro
                  </a>
                  <button
                    onClick={closePreview}
                    className="px-3 py-1.5 rounded-full border border-slate-600 text-xs font-medium text-slate-100 hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="w-full h-full bg-slate-950">
                {pdfPreviewUrl ? (
                  <iframe title="PDF preview" src={pdfPreviewUrl} className="w-full h-full" />
                ) : (
                  <div className="p-6 text-sm text-slate-200">Loading preview…</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-5xl px-4 pt-8 pb-24 sm:pb-10">
        {/* Download paywall banner */}
        {pdfLocked ? (
          <div className="mb-5 rounded-3xl border border-amber-400/25 bg-amber-500/10 p-4 sm:p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-200">{pdfLocked.title}</p>
                <p className="mt-1 text-sm text-amber-50/90">{pdfLocked.message}</p>
              </div>

              <div className="flex gap-2">
                <a
                  href="/pricing"
                  className="px-3 py-1.5 rounded-full bg-amber-400 text-xs font-semibold text-slate-950 hover:bg-amber-300"
                >
                  Upgrade to Pro
                </a>
                <button
                  onClick={() => setPdfLocked(null)}
                  className="px-3 py-1.5 rounded-full border border-amber-400/30 bg-transparent text-xs font-medium text-amber-100 hover:bg-amber-400/10"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div className="min-w-0">
            <p className="uppercase text-xs font-semibold text-slate-400 tracking-[0.18em]">PolicySprint AI</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1 break-words">
              {policy.title || "AI Use Policy"}
            </h1>

            {subtitle ? <p className="text-sm text-slate-300 mt-1">{subtitle}</p> : null}

            <p className="text-xs text-slate-400 mt-1">
              Saved on {formatDate(policy.createdAt)} · Current version:{" "}
              <span className="font-semibold text-slate-200">{policy.version}</span>
            </p>
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => router.push(`/policies/${policy.id}/edit`)}
              className="px-3 py-1.5 rounded-full border border-slate-600/70 text-xs font-medium text-slate-100 hover:bg-slate-800/60 bg-slate-900/40"
            >
              Edit
            </button>

            <button
              onClick={handleDuplicate}
              disabled={duplicating}
              className="px-3 py-1.5 rounded-full border border-slate-600/70 text-xs font-medium text-slate-100 hover:bg-slate-800/60 bg-slate-900/40 disabled:opacity-60"
            >
              {duplicating ? "Duplicating…" : "Duplicate"}
            </button>

            <button
              onClick={handlePreviewPdf}
              disabled={previewingPdf}
              className="px-3 py-1.5 rounded-full border border-slate-600/70 text-xs font-medium text-slate-100 hover:bg-slate-800/60 bg-slate-900/40 disabled:opacity-60"
            >
              {previewingPdf ? "Preparing preview…" : "Preview PDF"}
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-3 py-1.5 rounded-full bg-emerald-500 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 shadow-sm"
            >
              {downloadingPdf ? "Preparing…" : "Download PDF"}
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 rounded-full border border-red-400/30 bg-red-500/10 text-xs font-semibold text-red-200 hover:bg-red-500/15 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>

        {/* Content card */}
        <section className="rounded-3xl border border-slate-800/60 bg-slate-900/40 backdrop-blur p-4 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-semibold text-slate-100">Policy content</h2>
            <span className="text-xs text-slate-400">Saved version</span>
          </div>

          <div className="max-h-[65vh] overflow-auto rounded-2xl border border-slate-800/70 bg-slate-950/50 p-4 text-sm leading-relaxed text-slate-100">
            {policy.content.split("\n").map((para, i) => (
              <p key={i} className="mb-3 whitespace-pre-wrap break-words">
                {para}
              </p>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 mt-2">
            You can edit, duplicate, delete, preview the PDF, or upgrade to download it.
          </p>
        </section>

        {/* Version history */}
        <section className="mt-6 rounded-3xl border border-slate-800/60 bg-slate-900/40 backdrop-blur p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold text-slate-100">Version history</h2>
            <span className="text-xs text-slate-400">Snapshots saved when content changes</span>
          </div>

          {restoreBanner ? (
            <div className="mb-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
              {restoreBanner}
            </div>
          ) : null}

          {versions.length === 0 ? (
            <p className="text-sm text-slate-300">No previous versions yet. Edit the policy content and save snapshots.</p>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => {
                const restoringThis = restoringVersionId === v.id;
                const isCurrent = v.content === policy.content;

                return (
                  <div
                    key={v.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-slate-800/70 rounded-2xl px-4 py-3 bg-slate-950/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-100">Version {v.version}</p>
                        <p className="text-xs text-slate-400">{formatDate(v.createdAt)}</p>
                      </div>

                      {isCurrent ? (
                        <span className="ml-1 inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
                          Current
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelectedVersion(v);
                          setPreviewMode("text");
                        }}
                        className="px-3 py-1.5 rounded-full border border-slate-600/70 text-xs font-medium text-slate-100 hover:bg-slate-800/60 bg-slate-900/40"
                      >
                        View
                      </button>

                      <button
                        onClick={() => handleRestore(v)}
                        disabled={restoringVersionId !== null || isCurrent}
                        className="px-3 py-1.5 rounded-full bg-emerald-500 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 shadow-sm"
                        title={isCurrent ? "This snapshot matches the current content" : "Restore this snapshot"}
                      >
                        {isCurrent ? "Restore (Current)" : restoringThis ? "Restoring…" : "Restore"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedVersion ? (
            <div className="mt-4 border border-slate-800/70 rounded-3xl bg-slate-950/30 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-slate-800/70">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100">Viewing version {selectedVersion.version}</p>
                  <p className="text-xs text-slate-400">{formatDate(selectedVersion.createdAt)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const previewIsCurrent = selectedVersion.content === policy.content;
                    const restoringThis = restoringVersionId === selectedVersion.id;

                    return (
                      <>
                        <button
                          onClick={() => handleRestore(selectedVersion)}
                          disabled={restoringVersionId !== null || previewIsCurrent}
                          className="px-3 py-1.5 rounded-full bg-emerald-500 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 shadow-sm"
                          title={previewIsCurrent ? "This matches the current content" : "Restore this version"}
                        >
                          {previewIsCurrent ? "Restore (Current)" : restoringThis ? "Restoring…" : "Restore this version"}
                        </button>

                        <button
                          onClick={() => setSelectedVersion(null)}
                          className="px-3 py-1.5 rounded-full border border-slate-600/70 text-xs font-medium text-slate-100 hover:bg-slate-800/60"
                        >
                          Close
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="px-4 py-3 border-b border-slate-800/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-slate-400">Compare this snapshot to the current policy content.</div>

                <div className="inline-flex rounded-full border border-slate-700/70 bg-slate-900/40 p-1 w-full sm:w-auto overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("text")}
                    className={clsx(
                      "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                      previewMode === "text"
                        ? "bg-slate-950 border border-slate-700/70 text-white shadow-sm"
                        : "text-slate-200 hover:bg-slate-800/60"
                    )}
                  >
                    Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("diff")}
                    className={clsx(
                      "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                      previewMode === "diff"
                        ? "bg-slate-950 border border-slate-700/70 text-white shadow-sm"
                        : "text-slate-200 hover:bg-slate-800/60"
                    )}
                    disabled={selectedVersion.content === policy.content}
                    title={
                      selectedVersion.content === policy.content
                        ? "This snapshot matches the current content"
                        : "Show differences vs current"
                    }
                  >
                    Diff vs current
                  </button>
                </div>
              </div>

              <div className="max-h-[45vh] overflow-auto bg-slate-950/40 p-4 text-sm leading-relaxed text-slate-100">
                {previewMode === "text" ? (
                  selectedVersion.content.split("\n").map((para, i) => (
                    <p key={i} className="mb-3 whitespace-pre-wrap break-words">
                      {para}
                    </p>
                  ))
                ) : selectedVersion.content === policy.content ? (
                  <div className="text-sm text-slate-200">
                    This snapshot is the same as the current content — no differences to show.
                  </div>
                ) : diffTooBig ? (
                  <div className="text-sm text-slate-200">
                    This policy is too large to diff safely in the browser.
                    <div className="mt-2 text-xs text-slate-400">
                      Tip: keep sections separated by headings and shorter paragraphs to make diffs faster and easier.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {diffRows.map((row, idx) => (
                      <div
                        key={idx}
                        className={clsx(
                          "whitespace-pre-wrap break-words rounded-xl px-3 py-2 font-mono text-[12px] leading-5 border",
                          row.kind === "add" && "bg-emerald-500/10 border-emerald-400/25 text-emerald-50",
                          row.kind === "del" && "bg-red-500/10 border-red-400/25 text-red-50",
                          row.kind === "same" && "bg-slate-950/40 border-slate-800/80 text-slate-100"
                        )}
                      >
                        <span className="inline-block w-6 opacity-70 select-none">
                          {row.kind === "add" ? "+" : row.kind === "del" ? "-" : " "}
                        </span>
                        {row.text.length ? row.text : " "}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-800/70">
                Tip: restoring will overwrite the current content, but we automatically save a snapshot first.
              </div>
            </div>
          ) : null}
        </section>
      </main>

      {/* Mobile sticky action bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="px-3 pb-3 pt-2 border-t border-slate-800/70 bg-slate-950/75 backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/policies/${policy.id}/edit`)}
              className="flex-1 px-3 py-2 rounded-2xl border border-slate-700/70 text-xs font-semibold text-slate-100 hover:bg-slate-800/60 bg-slate-900/40"
            >
              Edit
            </button>

            <button
              onClick={handlePreviewPdf}
              disabled={previewingPdf}
              className="flex-1 px-3 py-2 rounded-2xl border border-slate-700/70 text-xs font-semibold text-slate-100 hover:bg-slate-800/60 bg-slate-900/40 disabled:opacity-60"
            >
              {previewingPdf ? "Preview…" : "Preview"}
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex-1 px-3 py-2 rounded-2xl bg-emerald-500 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {downloadingPdf ? "PDF…" : "Download"}
            </button>

            <div className="relative" data-mobile-more>
              <button
                onClick={() => setMobileMoreOpen((v) => !v)}
                disabled={primaryDisabled}
                className="px-3 py-2 rounded-2xl border border-slate-700/70 text-xs font-semibold text-slate-100 hover:bg-slate-800/60 bg-slate-900/40 disabled:opacity-60"
                aria-haspopup="menu"
                aria-expanded={mobileMoreOpen}
              >
                More
              </button>

              {mobileMoreOpen ? (
                <div className="absolute right-0 bottom-12 w-56 rounded-2xl border border-slate-800/80 bg-slate-950/95 backdrop-blur shadow-2xl overflow-hidden">
                  <button
                    onClick={() => {
                      setMobileMoreOpen(false);
                      handleDuplicate();
                    }}
                    disabled={duplicating}
                    className="w-full text-left px-4 py-3 text-sm text-slate-100 hover:bg-slate-900/60 disabled:opacity-60"
                  >
                    {duplicating ? "Duplicating…" : "Duplicate"}
                  </button>
                  <button
                    onClick={() => {
                      setMobileMoreOpen(false);
                      handleDelete();
                    }}
                    disabled={deleting}
                    className="w-full text-left px-4 py-3 text-sm text-red-200 hover:bg-red-500/10 disabled:opacity-60"
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
