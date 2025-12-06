"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EmailButton from "../components/EmailButton";

const LAST_POLICY_KEY = "policysprint:lastPolicy";

export default function StaffGuidePage() {
  const [policyText, setPolicyText] = useState("");
  const [guide, setGuide] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [prefilledFromStorage, setPrefilledFromStorage] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (policyText.trim().length > 0) return;

    try {
      const stored = window.localStorage.getItem(LAST_POLICY_KEY);
      if (stored && stored.trim().length > 0) {
        setPolicyText(stored);
        setPrefilledFromStorage(true);
      }
    } catch (err) {
      console.error("Error reading localStorage", err);
    }
  }, [policyText]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();

    if (!policyText.trim()) {
      setErrorMessage("Please paste your AI Use Policy first.");
      return;
    }

    setErrorMessage(null);
    setGuide("");
    setLoading(true);

    try {
      const res = await fetch("/api/staff-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyText }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate staff guide.");
      }

      if (!data.guide || typeof data.guide !== "string") {
        throw new Error("Unexpected response from staff guide API.");
      }

      setGuide(data.guide);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!guide) return;
    try {
      await navigator.clipboard.writeText(guide);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        <div className="space-y-6">
          {/* Header bar */}
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                PS
              </div>
              <div>
                <h1 className="text-sm font-semibold text-slate-900">
                  PolicySprint
                </h1>
                <p className="text-xs text-slate-500">Staff guide generator</p>
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              Help staff understand the policy in plain English
            </div>
          </header>

          {/* Hero card */}
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                  Create a{" "}
                  <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
                    staff-friendly AI guide
                  </span>
                </h2>
                <p className="text-xs md:text-sm text-slate-600 max-w-xl">
                  Convert your AI Use Policy into a short, plain-English summary
                  that’s easy for staff to read and understand.
                </p>
                {prefilledFromStorage && (
                  <p className="text-[11px] text-emerald-700">
                    Loaded your most recent policy from the wizard.
                  </p>
                )}
              </div>

              <Link
                href="/wizard"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-white hover:border-slate-300"
              >
                ← Back to policy wizard
              </Link>
            </div>

            {/* Grid layout */}
            <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,2.1fr),minmax(0,1.9fr)]">
              {/* LEFT: input form */}
              <form
                onSubmit={handleGenerate}
                className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Your AI Use Policy
                  </label>
                  <textarea
                    value={policyText}
                    onChange={(e) => setPolicyText(e.target.value)}
                    placeholder="Paste your full AI Use Policy here"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 min-h-[200px]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    A staff guide summarises your policy into simple, actionable
                    rules staff can follow.
                  </p>
                </div>

                {errorMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "Generating guide…" : "Generate staff guide"}
                </button>
              </form>

              {/* RIGHT: output */}
              <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-50 p-4 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold">Staff guide output</h3>
                    <p className="text-[11px] text-slate-300">
                      Summary of your AI Use Policy in plain English.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!guide}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                      guide
                        ? "border-slate-400 text-slate-50 hover:border-sky-300"
                        : "border-slate-700 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                <div className="mb-2">
                  <EmailButton
                    subject="Your AI Use Policy - Staff Guide"
                    getBody={() => guide || ""}
                    label="Email this guide"
                    variant="dark"
                  />
                </div>

                <div className="flex-1 rounded-lg border border-slate-700 bg-slate-950/70 p-3 text-xs whitespace-pre-wrap overflow-auto">
                  {!guide && !loading && (
                    <p className="text-slate-400">
                      After generating, your staff guide will appear here.
                      This includes:
                      <br />
                      • What staff can / can’t do  
                      • How to use approved AI tools  
                      • Privacy, data and safety rules  
                      • Who to ask for help  
                      <br />
                      <br />
                      Tip: paste this into your intranet or training LMS.
                    </p>
                  )}

                  {loading && (
                    <p className="text-slate-400 italic">
                      Summarising your policy into friendly language…
                    </p>
                  )}

                  {guide && !loading && guide}
                </div>

                <p className="mt-2 text-[11px] text-slate-400">
                  Tip: Share this guide alongside your full policy for easier
                  onboarding and refresher training.
                </p>
              </div>
            </div>
          </section>

          <p className="text-[11px] text-slate-500">
            Staff guides are for training only. Always keep your official AI
            Use Policy as the source of truth.
          </p>
        </div>
      </main>
    </div>
  );
}
