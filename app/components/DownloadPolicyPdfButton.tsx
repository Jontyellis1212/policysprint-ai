"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Props = {
  policyText: string;
  businessName?: string;
  country?: string;
  industry?: string;
  upgradeHref?: string; // optional override
};

type ApiErrorShape =
  | { ok?: boolean; error?: { code?: string; message?: string; details?: any } }
  | { error?: string };

function getCode(parsed: any): string | undefined {
  return parsed?.error?.code;
}

export default function DownloadPolicyPdfButton({
  policyText,
  businessName,
  country,
  industry,
  upgradeHref,
}: Props) {
  const [isDownloading, setIsDownloading] = useState(false);

  // gates
  const [needsPro, setNeedsPro] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);

  // resend UX
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const safeFilename = useMemo(() => {
    const base =
      businessName?.trim().replace(/\s+/g, "-").toLowerCase() || "ai-use-policy";
    return `${base}.pdf`;
  }, [businessName]);

  async function resendVerification() {
    if (resendLoading) return;
    setResendSent(false);
    setResendLoading(true);
    try {
      const res = await fetch("/api/email/verify/resend", { method: "POST" });
      if (res.ok) setResendSent(true);
    } catch {
      // keep quiet; we show a generic error below if needed
    } finally {
      setResendLoading(false);
    }
  }

  async function handleDownload() {
    if (!policyText.trim() || isDownloading) return;

    setErrorMsg(null);
    setNeedsPro(false);
    setNeedsVerify(false);
    setResendSent(false);

    try {
      setIsDownloading(true);

      const res = await fetch("/api/policy-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // NOTE: No x-pdf-mode header => defaults to "download" in your API
        body: JSON.stringify({
          policyText,
          businessName,
          country,
          industry,
        }),
      });

      // Handle gating cleanly
      if (res.status === 401) {
        // let middleware/auth flow handle sign-in; send them to login with callback
        const cb = encodeURIComponent("/policies");
        window.location.href = `/login?callbackUrl=${cb}`;
        return;
      }

      if (res.status === 403) {
        let parsed: ApiErrorShape | null = null;
        try {
          parsed = (await res.json()) as ApiErrorShape;
        } catch {}

        const code = getCode(parsed);

        if (code === "EMAIL_NOT_VERIFIED") {
          setNeedsVerify(true);
          return;
        }
        if (code === "PRO_REQUIRED") {
          setNeedsPro(true);
          return;
        }

        setErrorMsg("You don’t have access to download this PDF.");
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Failed to generate PDF", res.status, text);
        setErrorMsg("Something went wrong generating the PDF. Please try again.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading policy PDF:", err);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  const disabled = !policyText.trim() || isDownloading;
  const showGate = needsVerify || needsPro;

  return (
    <div className="flex flex-col gap-2">
      {showGate ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-[12px] text-slate-200">
          <div className="font-medium text-slate-50">Downloads are locked</div>

          <div className="mt-1 space-y-1 text-slate-300">
            {needsVerify ? (
              <div>
                • Verify your email to unlock downloads.
                <div className="text-[11px] text-slate-400">
                  Check your inbox (and spam). You can resend a new link anytime.
                </div>
              </div>
            ) : null}

            {needsPro ? (
              <div>
                • Upgrade to Pro to unlock downloads.
                <div className="text-[11px] text-slate-400">
                  Previews still work — downloads are a Pro feature.
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {needsVerify ? (
              resendSent ? (
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
              )
            ) : null}

            {needsPro ? (
              <Link
                href={upgradeHref ?? "/pricing"}
                className="inline-flex rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-[12px] font-medium text-slate-100 hover:bg-slate-900/60"
              >
                Upgrade to Pro
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {errorMsg && !showGate ? (
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/30 px-3 py-2 text-[12px] text-rose-200">
          {errorMsg}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleDownload}
        disabled={disabled}
        className="rounded-full px-4 py-2.5 text-[12px] font-medium bg-slate-900 text-slate-50 hover:bg-slate-800 disabled:opacity-60"
      >
        {isDownloading ? "Preparing PDF…" : "Download policy as PDF"}
      </button>
    </div>
  );
}
