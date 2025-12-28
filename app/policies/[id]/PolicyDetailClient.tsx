"use client";

import { useState } from "react";
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

  const [selectedVersion, setSelectedVersion] = useState<PolicyVersion | null>(null);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [restoreBanner, setRestoreBanner] = useState<string | null>(null);

  const [previewMode, setPreviewMode] = useState<"text" | "diff">("text");

  // NEW: PDF locked banner state
  const [pdfLocked, setPdfLocked] = useState<PdfLockedState>(null);

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

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      setPdfLocked(null);

      const payload = {
        businessName: policy.businessName ?? "",
        country: policy.country ?? "",
        industry: policy.industry ?? "",
        policyText: policy.content,
      };

      const res = await fetch("/api/policy-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        redirectToLogin();
        return;
      }

      const contentType = (res.headers.get("content-type") || "").toLowerCase();

      const tryReadJsonError = async () => {
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
          return { msg, code, raw: j };
        } catch {
          return { msg: "", code: "", raw: null };
        }
      };

      // 1) Explicit paywall/forbidden
      if (res.status === 403) {
        const { msg } = contentType.includes("application/json") ? await tryReadJsonError() : { msg: "" };
        setPdfLocked({
          title: "Unlock PDF export",
          message:
            msg ||
            "Download a polished, share-ready PDF of this policy. Upgrade to enable PDF export for your account.",
        });
        return;
      }

      // 2) JSON => not a PDF (handle locked + other errors)
      if (contentType.includes("application/json")) {
        const { msg, code } = await tryReadJsonError();

        const looksLocked =
          res.status === 403 ||
          code.toUpperCase() === "FORBIDDEN" ||
          code.toUpperCase() === "PDF_LOCKED" ||
          /locked|pro|waitlist|forbidden|upgrade/i.test(msg);

        if (looksLocked) {
          setPdfLocked({
            title: "Unlock PDF export",
            message:
              msg ||
              "Download a polished, share-ready PDF of this policy. Upgrade to enable PDF export for your account.",
          });
          return;
        }

        pushToast("error", msg || "Failed to generate PDF.");
        return;
      }

      // 3) Non-ok + non-json => show server text
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        pushToast("error", txt?.trim() ? `Failed to generate PDF: ${txt.slice(0, 180)}` : "Failed to generate PDF.");
        return;
      }

      // 4) OK + non-json => assume PDF
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toasts */}
      {toasts.length > 0 ? (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[320px]">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={[
                "rounded-xl border shadow-sm px-4 py-3 text-sm",
                t.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : t.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-slate-50 border-slate-200 text-slate-800",
              ].join(" ")}
            >
              {t.message}
            </div>
          ))}
        </div>
      ) : null}

      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* PDF locked banner */}
        {pdfLocked ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{pdfLocked.title}</p>
                <p className="mt-1 text-sm text-amber-900/90">{pdfLocked.message}</p>
                <p className="mt-2 text-xs text-amber-900/70">
                  Want access without upgrading? Email us and we’ll help you out.
                </p>
              </div>

              <div className="flex gap-2">
                <a
                  href="/pricing"
                  className="px-3 py-1.5 rounded-full border border-amber-300 bg-white text-xs font-medium text-amber-900 hover:bg-amber-100"
                >
                  See plans
                </a>
                <a
                  href="mailto:hello@policysprint.ai?subject=PolicySprint%20AI%20PDF%20Export%20Access&body=Hi%20there%2C%0D%0A%0D%0AI%27d%20like%20access%20to%20PDF%20export.%0D%0A%0D%0ABusiness%20name%3A%0D%0AIndustry%3A%0D%0AStaff%20count%3A%0D%0A%0D%0AThanks!"
                  className="px-3 py-1.5 rounded-full bg-amber-500 text-xs font-medium text-slate-950 hover:bg-amber-400"
                >
                  Email for access
                </a>
                <button
                  onClick={() => setPdfLocked(null)}
                  className="px-3 py-1.5 rounded-full border border-amber-300 bg-white text-xs font-medium text-amber-900 hover:bg-amber-100"
                  title="Dismiss"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-start justify-between mb-6 gap-4">
          <div>
            <p className="uppercase text-xs font-semibold text-slate-500 tracking-[0.14em]">PolicySprint AI</p>
            <h1 className="text-3xl font-semibold text-slate-900 mt-1">{policy.title || "AI Use Policy"}</h1>

            <p className="text-sm text-slate-600 mt-1">
              {policy.businessName && <span>{policy.businessName} · </span>}
              {policy.industry && <span>{policy.industry} · </span>}
              {policy.country && <span>{policy.country}</span>}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Saved on {formatDate(policy.createdAt)} · Current version:{" "}
              <span className="font-semibold text-slate-700">{policy.version}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* NOTE: Edit is still on /policies for now (even if viewing under /dashboard). */}
            <button
              onClick={() => router.push(`/policies/${policy.id}/edit`)}
              className="px-3 py-1.5 rounded-full border border-slate-300 text-xs font-medium text-slate-700 hover:bg-white bg-slate-50"
            >
              Edit
            </button>

            <button
              onClick={handleDuplicate}
              disabled={duplicating}
              className="px-3 py-1.5 rounded-full border border-slate-300 text-xs font-medium text-slate-700 hover:bg-white bg-slate-50 disabled:opacity-60"
            >
              {duplicating ? "Duplicating…" : "Duplicate"}
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-3 py-1.5 rounded-full bg-slate-900 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60 shadow-sm"
            >
              {downloadingPdf ? "Preparing…" : "Download PDF"}
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 rounded-full border border-red-200 bg-red-50 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Policy content</h2>

          <div className="max-h-[70vh] overflow-auto bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm leading-relaxed text-slate-900">
            {policy.content.split("\n").map((para, i) => (
              <p key={i} className="mb-3 whitespace-pre-wrap">
                {para}
              </p>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 mt-2">
            This is your saved version. You can edit, duplicate, delete, or export a PDF.
          </p>
        </section>

        <section className="mt-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-semibold text-slate-800">Version history</h2>
            <span className="text-xs text-slate-500">Snapshots saved when content changes</span>
          </div>

          {restoreBanner ? (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {restoreBanner}
            </div>
          ) : null}

          {versions.length === 0 ? (
            <p className="text-sm text-slate-600">No previous versions yet. Edit the policy content and save snapshots.</p>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => {
                const restoringThis = restoringVersionId === v.id;
                const isCurrent = v.content === policy.content;

                return (
                  <div
                    key={v.id}
                    className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Version {v.version}</p>
                        <p className="text-xs text-slate-500">{formatDate(v.createdAt)}</p>
                      </div>

                      {isCurrent ? (
                        <span className="ml-1 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          Current
                        </span>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedVersion(v);
                          setPreviewMode("text");
                        }}
                        className="px-3 py-1.5 rounded-full border border-slate-300 text-xs font-medium text-slate-700 hover:bg-white bg-slate-50"
                      >
                        View
                      </button>

                      <button
                        onClick={() => handleRestore(v)}
                        disabled={restoringVersionId !== null || isCurrent}
                        className="px-3 py-1.5 rounded-full bg-slate-900 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60 shadow-sm"
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
            <div className="mt-4 border border-slate-200 rounded-xl bg-white">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Viewing version {selectedVersion.version}</p>
                  <p className="text-xs text-slate-500">{formatDate(selectedVersion.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2">
                  {(() => {
                    const previewIsCurrent = selectedVersion.content === policy.content;
                    const restoringThis = restoringVersionId === selectedVersion.id;

                    return (
                      <>
                        <button
                          onClick={() => handleRestore(selectedVersion)}
                          disabled={restoringVersionId !== null || previewIsCurrent}
                          className="px-3 py-1.5 rounded-full bg-slate-900 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60 shadow-sm"
                          title={previewIsCurrent ? "This matches the current content" : "Restore this version"}
                        >
                          {previewIsCurrent ? "Restore (Current)" : restoringThis ? "Restoring…" : "Restore this version"}
                        </button>

                        <button
                          onClick={() => setSelectedVersion(null)}
                          className="px-3 py-1.5 rounded-full border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Close
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-600">Compare this snapshot to the current policy content.</div>

                <div className="inline-flex rounded-full border border-slate-300 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("text")}
                    className={[
                      "px-3 py-1 rounded-full text-xs font-medium",
                      previewMode === "text"
                        ? "bg-white border border-slate-200 text-slate-900 shadow-sm"
                        : "text-slate-700 hover:bg-white",
                    ].join(" ")}
                  >
                    Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("diff")}
                    className={[
                      "px-3 py-1 rounded-full text-xs font-medium",
                      previewMode === "diff"
                        ? "bg-white border border-slate-200 text-slate-900 shadow-sm"
                        : "text-slate-700 hover:bg-white",
                    ].join(" ")}
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

              <div className="max-h-[45vh] overflow-auto bg-slate-50 rounded-b-xl p-4 text-sm leading-relaxed text-slate-900">
                {previewMode === "text" ? (
                  selectedVersion.content.split("\n").map((para, i) => (
                    <p key={i} className="mb-3 whitespace-pre-wrap">
                      {para}
                    </p>
                  ))
                ) : selectedVersion.content === policy.content ? (
                  <div className="text-sm text-slate-700">
                    This snapshot is the same as the current content — no differences to show.
                  </div>
                ) : diffTooBig ? (
                  <div className="text-sm text-slate-700">
                    This policy is too large to diff safely in the browser.
                    <div className="mt-2 text-xs text-slate-600">
                      Tip: keep sections separated by headings and shorter paragraphs to make diffs faster and easier.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {diffRows.map((row, idx) => (
                      <div
                        key={idx}
                        className={[
                          "whitespace-pre-wrap rounded-md px-2 py-1 font-mono text-[12px] leading-5 border",
                          row.kind === "add"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                            : row.kind === "del"
                            ? "bg-red-50 border-red-200 text-red-900"
                            : "bg-white border-slate-200 text-slate-800",
                        ].join(" ")}
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

              <div className="px-4 py-3 text-xs text-slate-500 border-t border-slate-200">
                Tip: restoring will overwrite the current content, but we automatically save a snapshot first.
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
