"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Policy = {
  id: string;
  title: string;
  businessName: string | null;
  industry: string | null;
  country: string | null;
  content: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

type SavePayload = {
  title: string;
  businessName: string | null;
  industry: string | null;
  country: string | null;
  content: string;
};

export default function EditPolicyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const [id, setId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [original, setOriginal] = useState<Policy | null>(null);

  const [title, setTitle] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [content, setContent] = useState("");

  // This flag lets us bypass navigation warnings when we intentionally leave
  // (e.g., after a successful save).
  const allowNavRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        setSaveError(null);
        setSaveSuccess(null);

        const { id: rawId } = await params;
        if (cancelled) return;

        const cleanId = typeof rawId === "string" ? rawId.trim() : "";
        // Hard guard: prevent /policies/undefined and similar bad states
        if (!cleanId || cleanId === "undefined" || cleanId === "null") {
          setId("");
          throw new Error("Policy not found.");
        }

        setId(cleanId);

        const res = await fetch(`/api/policies/${encodeURIComponent(cleanId)}`, { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 404) throw new Error("Policy not found.");
          throw new Error(`Failed to load policy (HTTP ${res.status}).`);
        }

        const json = await res.json();
        const policy: Policy | undefined = json?.data;

        if (!policy) throw new Error("API returned no policy data.");

        if (cancelled) return;

        setOriginal(policy);

        setTitle(policy.title ?? "");
        setBusinessName(policy.businessName ?? "");
        setIndustry(policy.industry ?? "");
        setCountry(policy.country ?? "");
        setContent(policy.content ?? "");
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load policy.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [params]);

  const isDirty = useMemo(() => {
    if (!original) return false;

    const normalized = (v: string | null | undefined) => (v ?? "").trim();

    return (
      normalized(title) !== normalized(original.title) ||
      normalized(businessName) !== normalized(original.businessName) ||
      normalized(industry) !== normalized(original.industry) ||
      normalized(country) !== normalized(original.country) ||
      (content ?? "") !== (original.content ?? "")
    );
  }, [original, title, businessName, industry, country, content]);

  // Warn on refresh/close tab when there are unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (allowNavRef.current) return;
      if (!isDirty) return;

      // Most browsers ignore custom text now, but setting returnValue triggers the prompt.
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const validate = (): string | null => {
    if (!title.trim()) return "Title is required.";
    if (!content.trim()) return "Content is required.";
    return null;
  };

  const toNullIfEmpty = (v: string) => {
    const t = v.trim();
    return t.length ? t : null;
  };

  const confirmLoseChanges = (): boolean => {
    if (!isDirty) return true;
    return window.confirm("You have unsaved changes. Leave without saving?");
  };

  const handleCancel = () => {
    if (!confirmLoseChanges()) return;
    allowNavRef.current = true;
    router.push(id ? `/policies/${encodeURIComponent(id)}` : "/policies");
  };

  const onSave = async () => {
    setSaveError(null);
    setSaveSuccess(null);

    const v = validate();
    if (v) {
      setSaveError(v);
      return;
    }

    // Extra guard: never allow save with a bad id
    const cleanId = (id ?? "").trim();
    if (!cleanId || cleanId === "undefined" || cleanId === "null") {
      setSaveError("Missing policy id.");
      return;
    }

    const payload: SavePayload = {
      title: title.trim(),
      businessName: toNullIfEmpty(businessName),
      industry: toNullIfEmpty(industry),
      country: toNullIfEmpty(country),
      content: content,
    };

    try {
      setSaving(true);

      const res = await fetch(`/api/policies/${encodeURIComponent(cleanId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Save failed (HTTP ${res.status}).${text ? ` ${text}` : ""}`);
      }

      const json = await res.json();
      const updated: Policy | undefined = json?.data;

      setSaveSuccess("Saved.");
      if (updated) setOriginal(updated);

      // Prefer returned id (if API ever changes), otherwise fall back to current id.
      const nextId = (updated?.id ?? cleanId ?? "").trim();
      if (!nextId || nextId === "undefined" || nextId === "null") {
        // Do NOT navigate to /policies/undefined
        setSaveError("Saved, but could not determine policy id to navigate. Please return to policies and reopen it.");
        return;
      }

      // Allow navigation (we're intentionally leaving after a successful save).
      allowNavRef.current = true;

      // Send them back to the view page after a successful save
      router.push(`/policies/${encodeURIComponent(nextId)}`);
      router.refresh();
    } catch (e: any) {
      setSaveError(e?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ marginBottom: 8 }}>Edit Policy</h1>
        <p>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ marginBottom: 8 }}>Edit Policy</h1>
        <p style={{ color: "crimson" }}>{error}</p>
        <div style={{ marginTop: 16 }}>
          {id ? (
            <Link href={`/policies/${encodeURIComponent(id)}`}>Back to policy</Link>
          ) : (
            <Link href="/policies">Back to policies</Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Edit Policy</h1>
          {original ? (
            <p style={{ marginTop: 0, opacity: 0.8 }}>
              ID: <code>{original.id}</code> · Version: {original.version}
            </p>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Cancel should confirm if there are unsaved changes */}
          <button
            type="button"
            onClick={handleCancel}
            style={{
              padding: "8px 12px",
              cursor: "pointer",
              background: "transparent",
              border: "1px solid rgba(0,0,0,0.15)",
              borderRadius: 6,
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving || !isDirty}
            style={{
              padding: "8px 12px",
              cursor: saving || !isDirty ? "not-allowed" : "pointer",
            }}
            title={!isDirty ? "No changes to save" : "Save changes"}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {saveError ? <div style={{ marginTop: 12, color: "crimson" }}>{saveError}</div> : null}
      {saveSuccess ? <div style={{ marginTop: 12, color: "green" }}>{saveSuccess}</div> : null}

      <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Title *</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Privacy Policy"
            style={{ padding: 10 }}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Business name</span>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Optional"
              style={{ padding: 10 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Industry</span>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Optional"
              style={{ padding: 10 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Country</span>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Optional"
              style={{ padding: 10 }}
            />
          </label>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Content *</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={18}
            style={{ padding: 10, fontFamily: "inherit" }}
            placeholder="Paste or write your policy content here…"
          />
        </label>

        <div style={{ opacity: 0.8, fontSize: 14 }}>
          <p style={{ margin: 0 }}>{isDirty ? "You have unsaved changes." : "No changes yet."}</p>
        </div>
      </div>
    </div>
  );
}
