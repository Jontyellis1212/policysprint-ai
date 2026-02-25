"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type GateKind = "signin" | "verify" | "upgrade";

export default function DownloadGateCard({
  showSignIn,
  showVerifyEmail,
  showUpgrade,
  callbackUrl,
  pricingHref = "/pricing",
  title = "Unlock downloads",
  subtitle = "Download requires Pro. Preview is free — upgrade to export PDFs, staff guides, and quizzes.",
  showResendVerification = true,
}: {
  showSignIn?: boolean;
  showVerifyEmail?: boolean;
  showUpgrade?: boolean;
  callbackUrl?: string;
  pricingHref?: string;
  title?: string;
  subtitle?: string;
  showResendVerification?: boolean;
}) {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  // slide/fade-in on mount/appearance
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  const blocks: GateKind[] = useMemo(() => {
    const out: GateKind[] = [];
    if (showSignIn) out.push("signin");
    if (showVerifyEmail) out.push("verify");
    if (showUpgrade) out.push("upgrade");
    return out;
  }, [showSignIn, showVerifyEmail, showUpgrade]);

  const show = blocks.length > 0;

  const loginHref = useMemo(() => {
    const safeCb = callbackUrl?.startsWith("/") ? callbackUrl : undefined;
    return safeCb ? `/login?callbackUrl=${encodeURIComponent(safeCb)}` : "/login";
  }, [callbackUrl]);

  async function resendVerification() {
    if (resendLoading) return;
    setResendSent(false);
    setResendLoading(true);
    try {
      const res = await fetch("/api/email/verify/resend", { method: "POST" });
      if (res.ok) setResendSent(true);
    } catch {
      // silent
    } finally {
      setResendLoading(false);
    }
  }

  if (!show) return null;

  const proBullets = [
    "Official policy PDF download (no watermark)",
    "Edit & regenerate anytime",
    "Staff AI usage guide + built-in quiz",
    "Ongoing updates as AI evolves",
  ];

  const showCancelReassurance = !!showUpgrade;

  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border px-4 py-3 text-[12px]",
        "border-emerald-500/30 bg-slate-950/50 text-slate-200",
        "backdrop-blur-md shadow-sm",
        "transition-all duration-300 ease-out",
        entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      ].join(" ")}
    >
      {/* Soft attention glow */}
      <div className="pointer-events-none absolute -inset-10">
        <div className="absolute inset-0 bg-emerald-400/10 blur-3xl animate-pulse" />
      </div>

      {/* Subtle top highlight line */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-emerald-50">{title}</div>
            <div className="mt-1 text-[11px] text-emerald-100/70">{subtitle}</div>

            {showCancelReassurance ? (
              <div className="mt-2 text-[11px] text-slate-300">
                $49/month · <span className="text-slate-200 font-medium">Cancel anytime</span> · No lock-in
              </div>
            ) : null}
          </div>

          {/* Small “Pro” pill for visibility */}
          {showUpgrade ? (
            <span className="shrink-0 rounded-full border border-emerald-400/25 bg-emerald-950/30 px-2.5 py-1 text-[10px] font-semibold text-emerald-200">
              Pro
            </span>
          ) : null}
        </div>

        {/* What Pro gives you */}
        {showUpgrade ? (
          <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-3 py-2">
            <div className="text-[11px] font-semibold text-emerald-100">Included with Pro:</div>
            <ul className="mt-1 list-disc pl-4 text-[11px] text-emerald-100/80 space-y-0.5">
              {proBullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-3 space-y-3 text-slate-200">
          {showSignIn ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
              <div className="font-medium text-slate-50">Sign in to continue</div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Preview is free. To download and save your organisation, you’ll need an account.
                <span className="text-slate-300"> Creating one usually takes ~30 seconds.</span>
              </div>
              <div className="mt-2">
                <Link
                  href={loginHref}
                  className="inline-flex rounded-full bg-emerald-400 px-3.5 py-1.5 text-[12px] font-semibold text-slate-950 hover:bg-emerald-300 transition"
                >
                  Sign in / create account
                </Link>
              </div>
            </div>
          ) : null}

          {showVerifyEmail ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
              <div className="font-medium text-slate-50">Verify your email</div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Check your inbox (and spam). You can resend a new link anytime.
              </div>

              {showResendVerification ? (
                <div className="mt-2">
                  {resendSent ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-950/20 px-3 py-1.5 text-[12px] font-medium text-emerald-200">
                      Verification email resent ✓
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={resendVerification}
                      disabled={resendLoading}
                      className="inline-flex rounded-full bg-emerald-400 px-3.5 py-1.5 text-[12px] font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60 transition"
                    >
                      {resendLoading ? "Sending…" : "Resend verification"}
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          {showUpgrade ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
              <div className="font-medium text-slate-50">Download requires Pro</div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                You can keep previewing for free. Upgrade to export the official PDF and keep this policy up to date.
              </div>

              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Link
                  href={pricingHref}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-3.5 py-1.5 text-[12px] font-semibold text-slate-950 hover:bg-emerald-300 transition"
                >
                  Get Pro — cancel anytime
                </Link>

                <div className="text-[10px] text-slate-400">
                  Secure checkout via Stripe · manage/cancel in-app
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}