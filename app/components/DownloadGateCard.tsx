"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type GateKind = "signin" | "verify" | "upgrade";

export default function DownloadGateCard({
  showSignIn,
  showVerifyEmail,
  showUpgrade,
  callbackUrl,
  pricingHref = "/pricing",
  title = "Downloads are locked",
  subtitle = "Previews still work — downloads require access.",
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

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-[12px] text-slate-200">
      <div className="font-semibold text-slate-50">{title}</div>
      <div className="mt-1 text-[11px] text-slate-400">{subtitle}</div>

      <div className="mt-3 space-y-3 text-slate-300">
        {showSignIn ? (
          <div>
            <div>• Sign in to download.</div>
            <div className="mt-2">
              <Link
                href={loginHref}
                className="inline-flex rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-[12px] font-medium text-slate-100 hover:bg-slate-900/60"
              >
                Sign in
              </Link>
            </div>
          </div>
        ) : null}

        {showVerifyEmail ? (
          <div>
            <div>• Verify your email to unlock downloads.</div>
            <div className="text-[11px] text-slate-400">
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
                    className="inline-flex rounded-full bg-emerald-500 px-3 py-1.5 text-[12px] font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
                  >
                    {resendLoading ? "Sending…" : "Resend verification"}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {showUpgrade ? (
          <div>
            <div>• Upgrade to Pro to download PDFs and quizzes.</div>
            <div className="text-[11px] text-slate-400">Previews still work — downloads are a Pro feature.</div>

            <div className="mt-2">
              <Link
                href={pricingHref}
                className="inline-flex rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-[12px] font-medium text-slate-100 hover:bg-slate-900/60"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
