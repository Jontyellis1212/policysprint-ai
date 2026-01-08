"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SavePolicyButtonProps = {
  policyTitle: string;
  businessName: string;
  industry: string;
  country: string;
  fullPolicyText: string;

  // NEW: allow wizard to lock this before the user clicks
  disabled?: boolean;
  lockedMessage?: string | null;
};

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: any };

function isOk<T>(v: any): v is ApiOk<T> {
  return v && typeof v === "object" && v.ok === true && "data" in v;
}

export function SavePolicyButton({
  policyTitle,
  businessName,
  industry,
  country,
  fullPolicyText,
  disabled = false,
  lockedMessage = null,
}: SavePolicyButtonProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    // If the wizard locked it, do nothing (wizard shows the CTA/banner)
    if (disabled) return;

    if (!fullPolicyText || !fullPolicyText.trim()) {
      setError("Nothing to save yet – generate a draft first.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: policyTitle || null,
          businessName: businessName || null,
          industry: industry || null,
          country: country || null,
          content: fullPolicyText,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          (json && typeof (json as any)?.error === "string" && (json as any).error) ||
          (json && typeof (json as any)?.error?.message === "string" && (json as any).error.message) ||
          (json && typeof (json as any)?.message === "string" && (json as any).message) ||
          (json && typeof (json as any)?.error?.code === "string" && (json as any).error.code === "FREE_LIMIT_REACHED"
            ? "You’ve hit the free plan limit. Upgrade to save more policies."
            : "") ||
          "Failed to save policy";
        throw new Error(msg);
      }

      const rawId =
        (json && typeof (json as any)?.id === "string" && (json as any).id) ||
        (json && isOk<any>(json) && typeof (json as any).data?.id === "string" ? (json as any).data.id : "");

      const id = (rawId ?? "").trim();

      if (!id || id === "undefined" || id === "null") {
        throw new Error("Saved, but could not determine the new policy ID. Please open it from your dashboard.");
      }

      // ✅ IMPORTANT: go to the themed dashboard detail route
      router.push(`/dashboard/policies/${encodeURIComponent(id)}`);
      router.refresh();
    } catch (err: any) {
      console.error("Error saving policy:", err);
      setError(err?.message || "Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  const isDisabled = disabled || saving;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={[
          "inline-flex items-center justify-center rounded-full px-4 py-2 text-[11px] font-medium text-white disabled:opacity-60",
          disabled ? "bg-slate-700 hover:bg-slate-700 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500",
        ].join(" ")}
        title={disabled && lockedMessage ? lockedMessage : undefined}
      >
        {saving ? "Saving…" : disabled ? "Upgrade to save" : "Save to dashboard"}
      </button>

      {lockedMessage ? (
        <p className="text-[10px] text-slate-300/80 max-w-xs text-right">{lockedMessage}</p>
      ) : null}

      {error ? <p className="text-[10px] text-red-600 max-w-xs text-right">{error}</p> : null}
    </div>
  );
}
