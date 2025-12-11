// app/components/DownloadPolicyPdfButton.tsx
"use client";

import { useState } from "react";

type Props = {
  policyText: string;
  businessName?: string;
  country?: string;
  industry?: string;
};

export default function DownloadPolicyPdfButton({
  policyText,
  businessName,
  country,
  industry,
}: Props) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (!policyText.trim() || isDownloading) return;

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

      if (!res.ok) {
        console.error("Failed to generate PDF", await res.text());
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const safeName =
        (businessName?.trim().replace(/\s+/g, "-").toLowerCase() ||
          "ai-use-policy") + ".pdf";

      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading policy PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  }

  const disabled = !policyText.trim() || isDownloading;

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled}
      className="rounded-full px-4 py-2.5 text-[12px] font-medium bg-slate-900 text-slate-50 hover:bg-slate-800 disabled:opacity-60"
    >
      {isDownloading ? "Preparing PDF…" : "Download policy as PDF"}
    </button>
  );
}
