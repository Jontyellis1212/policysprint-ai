"use client";

import { FormEvent, useState } from "react";

export default function StaffGuidePage() {
  const [organisationName, setOrganisationName] = useState("");
  const [audienceDescription, setAudienceDescription] = useState(
    "Non-technical staff who use AI tools as part of their work"
  );
  const [policyText, setPolicyText] = useState("");
  const [guide, setGuide] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setGuide("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/staff-guide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisationName: organisationName || "the organisation",
          audienceDescription,
          policyText,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to generate staff guide");
      }

      const data = await res.json();
      setGuide(data.guide);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong generating the guide.");
    } finally {
      setIsLoading(false);
    }
  }

  const canSubmit = policyText.trim().length > 100 && !isLoading;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-300">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            New · Staff-facing AI Use Guide
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Turn your AI Use Policy into a{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent">
              simple staff guide
            </span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300">
            Paste the AI Use Policy you generated on the main page and we&apos;ll
            convert it into a plain-language guide you can share with staff.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Best for: onboarding packs, internal wiki pages, and &quot;here&apos;s
            what you actually need to know&quot; summaries.
          </p>
        </section>

        {/* Form + Output */}
        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Left: Input form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 shadow-sm"
          >
            <h2 className="text-base font-semibold mb-4">
              1. Paste your policy and context
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <label className="mb-1 block text-slate-200">
                  Organisation name (optional)
                </label>
                <input
                  type="text"
                  value={organisationName}
                  onChange={(e) => setOrganisationName(e.target.value)}
                  placeholder="Acme Co."
                  className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-slate-200">
                  Who is this guide for?
                </label>
                <textarea
                  value={audienceDescription}
                  onChange={(e) => setAudienceDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Example: &quot;Customer service and sales staff using AI tools for
                  drafting emails, messages and internal notes.&quot;
                </p>
              </div>

              <div>
                <label className="mb-1 block text-slate-200">
                  AI Use Policy (paste from PolicySprint output)
                </label>
                <textarea
                  value={policyText}
                  onChange={(e) => setPolicyText(e.target.value)}
                  rows={12}
                  placeholder="Paste the full AI Use Policy you generated on the main page..."
                  className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-50 outline-none focus:border-emerald-400"
                />
                <p className="mt-1 text-xs text-slate-400">
                  TIP: Paste the full policy, not just a section. The guide will
                  pull out the key &quot;what do I do / not do?&quot; points.
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-xs text-rose-300">
                {error || "Something went wrong."}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`mt-5 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition ${
                canSubmit
                  ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  : "cursor-not-allowed bg-slate-700 text-slate-400"
              }`}
            >
              {isLoading ? "Generating staff guide..." : "Generate staff guide"}
            </button>

            <p className="mt-2 text-[11px] text-slate-500">
              Your policy text is sent securely to the server, where OpenAI is
              called via API. The guide is generated once and shown here – you
              can copy it into your own templates or wiki.
            </p>
          </form>

          {/* Right: Output */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-base font-semibold">
                2. Staff-facing AI Use Guide
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (!guide) return;
                  navigator.clipboard.writeText(guide).catch(() => {});
                }}
                disabled={!guide}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  guide
                    ? "border-slate-600 text-slate-100 hover:border-emerald-400"
                    : "border-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                Copy guide
              </button>
            </div>

            <div className="relative flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-200">
              {!guide && !isLoading && (
                <p className="text-slate-400">
                  After you generate, the staff guide will appear here in
                  friendly, practical language: key dos and don&apos;ts, examples,
                  and how to get help if they&apos;re unsure.
                </p>
              )}

              {isLoading && (
                <p className="text-slate-400 italic">
                  Drafting your guide and turning legalese into something humans
                  can actually read…
                </p>
              )}

              {guide && <article className="whitespace-pre-wrap">{guide}</article>}
            </div>

            <p className="mt-3 text-[11px] text-slate-500">
              Best practice: share this guide alongside the full AI Use Policy
              so staff can skim the guide but still access the formal document
              when needed.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
