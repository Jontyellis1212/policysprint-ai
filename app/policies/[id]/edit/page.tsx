// app/policies/[id]/edit/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MobileStickyActions from "@/app/components/MobileStickyActions";

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
  params: Promise<{ id: string }> | { id: string };
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

  // Bypass navigation warnings when we intentionally leave (after save / cancel).
  const allowNavRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        setSaveError(null);
        setSaveSuccess(null);

        const resolved = (await Promise.resolve(params)) as { id?: string };
        if (cancelled) return;

        const rawId = resolved?.id;
        const cleanId = typeof rawId === "string" ? rawId.trim() : "";

        // Hard guard: prevent /policies/undefined and similar bad states
        if (!cleanId || cleanId === "undefined" || cleanId === "null") {
          setId("");
          throw new Error("Policy not found.");
        }

        setId(cleanId);

        const res = await fetch(`/api/policies/${encodeURIComponent(cleanId)}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 404) throw new Error("Policy not found.");
          throw new Error(`Failed to load policy (HTTP ${res.status}).`);
        }

        const json = await res.json().catch(() => null);
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
      content,
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

      const json = await res.json().catch(() => null);
      const updated: Policy | undefined = json?.data;

      setSaveSuccess("Saved.");
      if (updated) setOriginal(updated);

      const nextId = (updated?.id ?? cleanId ?? "").trim();
      if (!nextId || nextId === "undefined" || nextId === "null") {
        setSaveError(
          "Saved, but could not determine policy id to navigate. Please return to policies and reopen it."
        );
        return;
      }

      allowNavRef.current = true;
      router.push(`/policies/${encodeURIComponent(nextId)}`);
      router.refresh();
    } catch (e: any) {
      setSaveError(e?.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const card = "rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:p-6 shadow-sm";
  const label = "block text-xs font-medium text-slate-200 mb-1";
  const input =
    "w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-400/40";
  const btnSecondary =
    "inline-flex items-center justify-center rounded-full border border-slate-600 px-4 py-2 text-[12px] font-medium text-slate-100 hover:bg-slate-900/60 disabled:opacity-60";
  const btnPrimary =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-[12px] font-semibold disabled:opacity-60";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="w-full px-4 py-6 pb-28 md:mx-auto md:max-w-5xl md:py-10 md:pb-0">
        {/* Top bar (Wizard-style) */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-50 text-[11px] font-semibold text-slate-950">
              PS
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                PolicySprint AI
              </div>
              <div className="text-[13px] font-medium text-slate-100">Edit policy</div>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-400">
            {loading ? "Loading…" : isDirty ? "Unsaved changes" : "Up to date"}
          </div>
        </div>

        {loading ? (
          <section className={card}>
            <h1 className="text-xl font-semibold text-slate-50">Edit Policy</h1>
            <p className="mt-2 text-sm text-slate-300">Loading…</p>
          </section>
        ) : error ? (
          <section className={card}>
            <h1 className="text-xl font-semibold text-slate-50">Edit Policy</h1>
            <div className="mt-3 rounded-xl border border-rose-900/40 bg-rose-950/30 p-4 text-sm text-rose-200">
              {error}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Link
                className="text-emerald-300 hover:text-emerald-200 text-sm"
                href="/policies"
              >
                ← Back to policies
              </Link>
            </div>
          </section>
        ) : (
          <div className="space-y-4">
            {/* Main editor card */}
            <section className={card}>
              <div className="flex flex-col gap-1">
                <h1 className="text-xl md:text-2xl font-semibold text-slate-50">Edit policy</h1>

                {original ? (
                  <p className="text-[11px] text-slate-400">
                    ID: <span className="font-mono text-slate-200">{original.id}</span> · Version:{" "}
                    <span className="text-slate-200">{original.version}</span>
                    {isDirty ? (
                      <span className="ml-2 text-amber-200">· Unsaved changes</span>
                    ) : (
                      <span className="ml-2 text-slate-500">· Up to date</span>
                    )}
                  </p>
                ) : null}
              </div>

              {saveError ? (
                <div className="mt-4 rounded-xl border border-rose-900/40 bg-rose-950/30 p-4 text-sm text-rose-200">
                  {saveError}
                </div>
              ) : null}

              {saveSuccess ? (
                <div className="mt-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4 text-sm text-emerald-200">
                  {saveSuccess}
                </div>
              ) : null}

              <div className="mt-6 grid gap-4">
                <div>
                  <label className={label}>
                    Title <span className="text-rose-300">*</span>
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. AI Use Policy"
                    className={input}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className={label}>Business name</label>
                    <input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Optional"
                      className={input}
                    />
                  </div>

                  <div>
                    <label className={label}>Industry</label>
                    <input
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="Optional"
                      className={input}
                    />
                  </div>

                  <div>
                    <label className={label}>Country</label>
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Optional"
                      className={input}
                    />
                  </div>
                </div>

                <div>
                  <label className={label}>
                    Content <span className="text-rose-300">*</span>
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={18}
                    placeholder="Paste or write your policy content here…"
                    className={input + " font-normal"}
                  />
                  <p className="mt-2 text-[11px] text-slate-400">
                    Tip: keep short paragraphs + headings — it makes version diffs and PDF formatting cleaner.
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{isDirty ? "You have unsaved changes." : "No changes yet."}</span>

                  {id ? (
                    <Link
                      className="text-emerald-300 hover:text-emerald-200"
                      href={`/policies/${encodeURIComponent(id)}`}
                      onClick={(e) => {
                        if (!confirmLoseChanges()) e.preventDefault();
                      }}
                    >
                      View policy →
                    </Link>
                  ) : (
                    <Link className="text-emerald-300 hover:text-emerald-200" href="/policies">
                      Back to policies →
                    </Link>
                  )}
                </div>
              </div>
            </section>

            {/* Sticky actions (mobile) / normal flow (desktop) */}
            <MobileStickyActions>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleCancel} className={btnSecondary}>
                  Cancel
                </button>

                <Link
                  href={id ? `/policies/${encodeURIComponent(id)}` : "/policies"}
                  className="text-[12px] text-slate-400 hover:text-slate-200 hidden sm:inline"
                  onClick={(e) => {
                    if (!confirmLoseChanges()) e.preventDefault();
                  }}
                >
                  Back to policy
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving || !isDirty}
                  title={!isDirty ? "No changes to save" : "Save changes"}
                  className={[
                    btnPrimary,
                    "min-w-[140px] px-5",
                    saving || !isDirty
                      ? "bg-slate-700 text-slate-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-400 to-emerald-300 text-slate-950 hover:from-emerald-300 hover:to-emerald-200",
                  ].join(" ")}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </MobileStickyActions>

            <p className="text-[11px] text-slate-500">
              PolicySprint AI does not provide legal advice. Always have a qualified lawyer review any policy before use.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
