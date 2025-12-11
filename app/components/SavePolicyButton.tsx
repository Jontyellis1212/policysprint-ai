"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SavePolicyButtonProps = {
  policyTitle: string;
  businessName: string;
  industry: string;
  country: string;
  fullPolicyText: string;
};

export function SavePolicyButton({
  policyTitle,
  businessName,
  industry,
  country,
  fullPolicyText,
}: SavePolicyButtonProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!fullPolicyText || !fullPolicyText.trim()) {
      setError("Nothing to save yet – generate a draft first.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: policyTitle || null,
          businessName: businessName || null,
          industry: industry || null,
          country: country || null,
          content: fullPolicyText,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save policy");
      }

      const created = await res.json();

      // 🔑 After saving, go straight to the policy detail page
      router.push(`/policies/${created.id}`);
      router.refresh();
    } catch (err: any) {
      console.error("Error saving policy:", err);
      setError(err.message || "Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={saving}
        className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-[11px] font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save to dashboard"}
      </button>
      {error && (
        <p className="text-[10px] text-red-600 max-w-xs text-right">
          {error}
        </p>
      )}
    </div>
  );
}
