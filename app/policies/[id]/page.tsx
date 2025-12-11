"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Policy = {
  id: string;
  title: string | null;
  businessName: string | null;
  industry: string | null;
  country: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export default function PolicyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const policyId = params?.id as string;

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Fetch policy
  useEffect(() => {
    if (!policyId) return;

    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/policies/${policyId}`);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch policy");
        }

        const data: Policy = await res.json();
        setPolicy(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to fetch policy");
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [policyId]);

  // Delete
  const handleDelete = async () => {
    if (!policy) return;

    const confirmed = window.confirm(
      `Delete this policy?\n\n"${policy.title || "AI Use Policy"}"\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const res = await fetch(`/api/policies/${policy.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete policy");
      }

      router.push("/policies");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete policy");
    } finally {
      setDeleting(false);
    }
  };

  // Duplicate
  const handleDuplicate = async () => {
    if (!policy) return;

    try {
      setDuplicating(true);

      const res = await fetch(`/api/policies/${policy.id}/duplicate`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to duplicate policy");
      }

      const cloned: Policy = await res.json();
      router.push(`/policies/${cloned.id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to duplicate policy");
    } finally {
      setDuplicating(false);
    }
  };

  // Download PDF (POST to /api/policy-pdf)
  const handleDownloadPdf = async () => {
    if (!policy) return;

    try {
      setDownloadingPdf(true);

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

      if (!res.ok) {
        console.error("PDF error:", await res.text());
        alert("Failed to generate PDF.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download =
        (policy.title
          ? policy.title.replace(/\s+/g, "-").toLowerCase()
          : "ai-use-policy") + ".pdf";

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Something went wrong generating the PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-4xl px-4 py-10">
          <div className="space-y-4">
            <div className="h-6 w-40 bg-slate-200 animate-pulse rounded" />
            <div className="h-8 w-80 bg-slate-200 animate-pulse rounded" />
            <div className="h-40 w-full bg-slate-200 animate-pulse rounded" />
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !policy) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-4xl px-4 py-10">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Policy</h1>
          <p className="text-sm text-red-600 mb-4">{error || "Not found"}</p>
          <button
            onClick={() => router.push("/policies")}
            className="px-4 py-2 rounded border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
          >
            ← Back to dashboard
          </button>
        </main>
      </div>
    );
  }

  // Main UI
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between mb-6 gap-4">
          <div>
            <p className="uppercase text-xs font-semibold text-slate-500 tracking-[0.14em]">
              PolicySprint AI
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 mt-1">
              {policy.title || "AI Use Policy"}
            </h1>

            <p className="text-sm text-slate-600 mt-1">
              {policy.businessName && <span>{policy.businessName} · </span>}
              {policy.industry && <span>{policy.industry} · </span>}
              {policy.country && <span>{policy.country}</span>}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Saved on{" "}
              {new Date(policy.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
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

        {/* Content */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">
            Policy content
          </h2>

          <div className="max-h-[70vh] overflow-auto bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm leading-relaxed text-slate-900">
            {policy.content.split("\n").map((para, i) => (
              <p key={i} className="mb-3 whitespace-pre-wrap">
                {para}
              </p>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 mt-2">
            This is your saved version. You can edit, duplicate, delete, or export a
            branded PDF using the buttons above.
          </p>
        </section>
      </main>
    </div>
  );
}
