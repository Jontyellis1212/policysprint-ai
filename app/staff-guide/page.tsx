"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import EmailButton from "../components/EmailButton";

const LAST_POLICY_KEY = "policysprint:lastPolicy";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: { code?: string; message: string; details?: unknown } };
type ApiResponse<T> = ApiOk<T> | ApiErr;

function isApiOk<T>(v: any): v is ApiOk<T> {
  return v && typeof v === "object" && v.ok === true && "data" in v;
}
function isApiErr(v: any): v is ApiErr {
  return v && typeof v === "object" && v.ok === false && v.error && typeof v.error.message === "string";
}

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

      const data = (await res.json().catch(() => null)) as ApiResponse<{ guide: string }> | any | null;

      if (res.status === 401) {
        throw new Error("Please sign in to generate a staff guide.");
      }

      if (!res.ok) {
        if (data && isApiErr(data)) throw new Error(data.error.message);
        throw new Error("Failed to generate staff guide.");
      }

      if (data && isApiOk<{ guide: string }>(data)) {
        setGuide(data.data.guide);
        return;
      }

      if (data && typeof (data as any).guide === "string") {
        setGuide((data as any).guide);
        return;
      }

      throw new Error("Unexpected response from staff guide API.");
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

  // ---------- Shared styles ----------
  const card = "rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:p-6 shadow-sm";
  const label = "block text-xs font-medium text-slate-200 mb-1";
  const hint = "text-[11px] text-slate-400";
  const input =
    "w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-400/40";
  const btnSecondary =
    "inline-flex items-center justify-center rounded-full border border-slate-600 px-4 py-2 text-[11px] text-slate-100 hover:bg-slate-900/60 disabled:opacity-60";
  const btnMini =
    "inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-[11px] text-slate-100 hover:bg-slate-900/70 disabled:opacity-60";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-6 w-40">
              <Image
                src="/branding/logo/policysprint-mono-white.png"
                alt="PolicySprint AI"
                fill
                sizes="160px"
                style={{ objectFit: "contain" }}
                priority
              />
            </div>

            <div className="hidden sm:block">
              <div className="text-[13px] font-medium text-slate-100">Staff guide generator</div>
              <div className="text-[11px] text-slate-400">Turn your policy into staff-friendly rules</div>
            </div>
          </div>

          <Link href="/wizard" className={btnSecondary}>
            ← Back to wizard
          </Link>
        </div>

        <div className="space-y-4">
          {/* Intro */}
          <section className={`${card} space-y-3`}>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-slate-50 mb-1">
                Create a{" "}
                <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                  staff-friendly AI guide
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
                Convert your AI Use Policy into a short, plain-English guide staff can actually follow.
              </p>

              {prefilledFromStorage ? (
                <p className="mt-2 text-[11px] text-emerald-300">Loaded your most recent policy from the wizard.</p>
              ) : null}
            </div>
          </section>

          {/* Main grid */}
          <div className="grid md:grid-cols-[3fr,2fr] gap-4">
            {/* LEFT */}
            <section className={`${card} space-y-4`}>
              <form className="space-y-4" onSubmit={handleGenerate}>
                <div>
                  <label className={label}>AI Use Policy</label>
                  <textarea
                    value={policyText}
                    onChange={(e) => setPolicyText(e.target.value)}
                    placeholder="Paste your full AI Use Policy here"
                    className={input}
                    rows={12}
                  />
                  <p className={`${hint} mt-1`}>
                    We’ll convert this into practical rules, examples, and a “when in doubt” checklist.
                  </p>
                </div>

                {errorMessage ? (
                  <div className="rounded-xl border border-rose-900/40 bg-rose-950/30 px-4 py-3 text-[11px] text-rose-200">
                    {errorMessage}
                  </div>
                ) : null}

                {/* ✅ EMERALD CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-full
                             bg-emerald-400 px-5 py-2 text-sm font-medium text-slate-950
                             hover:bg-emerald-300
                             focus:outline-none focus:ring-2 focus:ring-emerald-400/40
                             disabled:opacity-60"
                >
                  {loading ? "Generating…" : "Generate staff guide →"}
                </button>

                {loading && !errorMessage ? (
                  <div className="text-[11px] text-slate-400">
                    Summarising your policy into friendly, actionable guidance…
                  </div>
                ) : null}
              </form>
            </section>

            {/* RIGHT */}
            <section className={`${card} space-y-3`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold text-slate-100">Staff guide output</div>
                  <div className="text-[10px] text-slate-400">Ready to paste into your LMS or intranet.</div>
                </div>

                <button type="button" onClick={handleCopy} disabled={!guide} className={btnMini}>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <EmailButton
                subject="Your AI Use Policy - Staff Guide"
                getBody={() => guide || ""}
                label="Email this guide"
                variant="dark"
              />

              <div className="h-[520px] rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-[11px] leading-relaxed text-slate-100 whitespace-pre-wrap overflow-auto">
                {!guide && !loading ? (
                  <div className="text-slate-400">
                    After generating, your staff guide will appear here.
                    <br /><br />
                    • What staff can / can’t do  
                    • Approved tools and safe use  
                    • Privacy, data and security rules  
                    • Human review and escalation  
                  </div>
                ) : null}

                {loading && !guide ? (
                  <div className="text-slate-400 italic">Writing a staff-friendly guide…</div>
                ) : null}

                {guide && !loading ? guide : null}
              </div>

              <p className={hint}>Training tool only — not legal advice.</p>
            </section>
          </div>

          <p className="text-[11px] text-slate-500">
            Staff guides are for training only. Always keep your official AI Use Policy as the source of truth.
          </p>
        </div>
      </div>
    </main>
  );
}
