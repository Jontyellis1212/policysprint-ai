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

  useEffect(() => {
    if (!policyId) return;

    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/policies/${policyId}`);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load policy");
        }

        const data: Policy = await res.json();
        setPolicy(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load policy");
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [policyId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-32 w-full animate-pulse rounded bg-slate-200" />
        </div>
      </main>
    );
  }

  if (error || !policy) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-4 text-2xl font-semibold text-slate-900">
          Policy
        </h1>
        <p className="mb-4 text-sm text-red-600">
          {error || "Policy not found."}
        </p>
        <button
          onClick={() => router.push("/policies")}
          className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to all policies
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            PolicySprint AI
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">
            {policy.title || "AI Use Policy"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {policy.businessName && (
              <>
                <span className="font-medium">{policy.businessName}</span>
                {" • "}
              </>
            )}
            {policy.industry && <>{policy.industry} • </>}
            {policy.country && <>{policy.country}</>}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Created{" "}
            {new Date(policy.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/policies/${policy.id}/edit`)}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>

          {/* Assuming you already have PDF export wired on this page somewhere;
              if not, you can reuse your existing logic from the dashboard/wizard. */}

          <button
            type="button"
            onClick={() =>
              router.push(`/api/policy-pdf?id=${encodeURIComponent(policy.id)}`)
            }
            className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
          >
            Download PDF
          </button>
        </div>
      </header>

      <article className="rounded-lg border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-900 shadow-sm">
        {policy.content.split("\n").map((paragraph, idx) => (
          <p key={idx} className="mb-3 whitespace-pre-wrap">
            {paragraph}
          </p>
        ))}
      </article>
    </main>
  );
}
