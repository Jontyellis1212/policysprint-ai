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

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: any };

function isOk<T>(v: any): v is ApiOk<T> {
  return v && typeof v === "object" && v.ok === true && "data" in v;
}
function isErr(v: any): v is ApiErr {
  return v && typeof v === "object" && v.ok === false && "error" in v;
}

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
        // Try to extract a useful message from known shapes
        const msg =
          (json && typeof (json as any)?.error === "string" && (json as any).error) ||
          (json && typeof (json as any)?.error?.message === "string" && (json as any).error.message) ||
          (json && typeof (json as any)?.message === "string" && (json as any).message) ||
          "Failed to save policy";
        throw new Error(msg);
      }

      // Accept both shapes:
      // 1) { id: "..." }
      // 2) { ok: true, data: { id: "..." } }
      const rawId =
        (json && typeof (json as any)?.id === "string" && (json as any).id) ||
        (json && isOk<any>(json) && typeof (json as any).data?.id === "string" ? (json as any).data.id : "");

      const id = (rawId ?? "").trim();

      if (!id || id === "undefined" || id === "null") {
        // Saved, but we can't navigate safely — prevent /policies/undefined
        throw new Error("Saved, but could not determine the new policy ID. Please open it from /policies.");
      }

      // After saving, go straight to the policy detail page
      router.push(`/policies/${encodeURIComponent(id)}`);
      router.refresh();
    } catch (err: any) {
      console.error("Error saving policy:", err);
      setError(err?.message || "Failed to save policy");
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
      {error && <p className="text-[10px] text-red-600 max-w-xs text-right">{error}</p>}
    </div>
  );
}
