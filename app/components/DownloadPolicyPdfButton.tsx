"use client";

import { useMemo, useState } from "react";

type Props = {
  policyText: string;
  businessName?: string;
  country?: string;
  industry?: string;
  upgradeHref?: string;
};

type ApiErrorShape = {
  ok?: boolean;
  error?: {
    code?: string;
    message?: string;
    details?: any;
  };
};

export default function DownloadPolicyPdfButton({
  policyText,
  businessName,
  country,
  industry,
  upgradeHref,
}: Props) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const safeFilename = useMemo(() => {
    const base =
      businessName?.trim().replace(/\s+/g, "-").toLowerCase() || "ai-use-policy";
    return `${base}.pdf`;
  }, [businessName]);

  async function handleDownload() {
    if (!policyText.trim() || isDownloading) return;

    setErrorMsg(null);
    setUpgradeRequired(false);
    setEmailNotVerified(false);
    setResendSent(false);

    try {
      setIsDownloading(true);

      const res = await fetch("/api/policy-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyText,
          businessName,
          country,
          industry,
        }),
      });

      if (res.status === 403) {
        let parsed: ApiErrorShape | null = null;
        try {
          parsed = (await res.json()) as ApiErrorShape;
        } catch {}

        const code = parsed?.error?.code;

        if (code === "EMAIL_NOT_VERIFIED") {
          setEmailNotVerified(true);
          return;
        }

        if (code === "PRO_REQUIRED") {
          setUpgradeRequired(true);
          return;
        }

        setErrorMsg("You don’t have access to download this PDF.");
        return;
      }

      if (!res.ok) {
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

  async function resendVerification() {
    setResendSent(false);
    try {
      const res = await fetch("/api/email/verify/resend", { method: "POST" });
      if (res.ok) setResendSent(true);
    } catch {}
  }

  const disabled = !policyText.trim() || isDownloading;

  return (
    <div className="flex flex-col gap-2">
      {/* Email not verified */}
      {emailNotVerified && (
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-[12px] text-emerald-200">
          <div className="font-medium">Verify your email to download</div>
          <div className="mt-0.5 opacity-90">
            We sent you a verification email when you signed up.
          </div>

          {resendSent ? (
            <div className="mt-2 text-emerald-300 font-medium">
              Verification email resent ✓
            </div>
          ) : (
            <button
              type="button"
              onClick={resendVerification}
              className="mt-2 inline-flex rounded-full bg-emerald-500 px-3 py-1.5 text-[12px] font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Resend verification email
            </button>
          )}
        </div>
      )}

      {/* Pro required */}
      {upgradeRequired && (
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-[12px] text-amber-200">
          <div className="font-medium">Upgrade to Pro to download PDFs</div>
          <div className="mt-0.5 opacity-90">
            You can preview anytime. Downloads require Pro.
          </div>

          {upgradeHref && (
            <a
              href={upgradeHref}
              className="mt-2 inline-flex rounded-full bg-amber-400 px-3 py-1.5 text-[12px] font-semibold text-slate-950 hover:bg-amber-300"
            >
              Upgrade to Pro
            </a>
          )}
        </div>
      )}

      {/* Generic error */}
      {errorMsg && !upgradeRequired && !emailNotVerified && (
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 px-3 py-2 text-[12px] text-rose-200">
          {errorMsg}
        </div>
      )}

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
