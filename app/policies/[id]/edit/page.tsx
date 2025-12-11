"use client";

import { useEffect, useState, FormEvent } from "react";
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

export default function EditPolicyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const policyId = params?.id as string;

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [content, setContent] = useState("");

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

        setTitle(data.title ?? "");
        setBusinessName(data.businessName ?? "");
        setIndustry(data.industry ?? "");
        setCountry(data.country ?? "");
        setContent(data.content ?? "");
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load policy");
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [policyId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!policyId) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/policies/${policyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title || null,
          businessName: businessName || null,
          industry: industry || null,
          country: country || null,
          content,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update policy");
      }

      const updated: Policy = await res.json();

      // Redirect back to the policy view
      router.push(`/policies/${updated.id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update policy");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
          <div className="h-32 w-full animate-pulse rounded bg-slate-200" />
        </div>
      </main>
    );
  }

  if (error || !policy) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-4 text-2xl font-semibold text-slate-900">
          Edit Policy
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
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          PolicySprint AI
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">
          Edit Policy
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Update the details of your AI Use Policy. When you’re done, save
          changes to update the policy and keep your PDF export in sync.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meta section */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            Policy details
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-600">
                Policy title
              </label>
              <input
                type="text"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="AI Use & Governance Policy"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Shown in dashboards and on PDFs.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-600">
                Business name
              </label>
              <input
                type="text"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="Acme Pty Ltd"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-600">
                Industry
              </label>
              <input
                type="text"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="Professional services, healthcare, education…"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-600">
                Country / jurisdiction
              </label>
              <input
                type="text"
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="Australia, EU, US…"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Policy content
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {content.length.toLocaleString()} characters
            </span>
          </div>

          <p className="mb-3 text-xs text-slate-500">
            This is the full AI Use Policy text that is saved in your database
            and used for PDF export. You can safely edit wording, headings and
            sections here.
          </p>

          <textarea
            className="block h-[420px] w-full resize-y rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-900 shadow-inner focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Last updated{" "}
            <span className="font-medium text-slate-600">
              {new Date(policy.updatedAt).toLocaleString()}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push(`/policies/${policy.id}`)}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-70"
            >
              {saving ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-b-transparent" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
