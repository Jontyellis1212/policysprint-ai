"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GenerateStaffGuideButton from "../components/GenerateStaffGuideButton";
import { SavePolicyButton } from "../components/SavePolicyButton";

type Step = 1 | 2 | 3;
type TeamSizeOption = "solo" | "small" | "medium" | "large" | "enterprise";
type RiskLevel = "low" | "medium" | "high";
type RiskPosture = "strict" | "balanced" | "open";

interface WizardFormState {
  businessName: string;
  country: string;
  industry: string;
  teamSize: TeamSizeOption;
  aiUsageNotes: string;
  aiUsageTags: string[];

  riskLevel: RiskLevel;
  riskPosture: RiskPosture;
  whoCanUse: "everyone" | "approvedRoles" | "companyToolsOnly";
  approvedToolsText: string;
  mainConcerns: string[];
}

interface GenerateResult {
  success: boolean;
  message?: string;
  policyPreview?: {
    title: string;
    businessName: string;
    country: string;
    sampleSection: string[];
  };
  fullText?: string;
  error?: string;
}

const TEAM_SIZE_LABELS: Record<TeamSizeOption, string> = {
  solo: "Just me",
  small: "2–10 people",
  medium: "11–50 people",
  large: "51–250 people",
  enterprise: "250+ people",
};

const AI_USAGE_TAGS = [
  "Marketing & content",
  "Customer support",
  "Internal documents",
  "Coding / technical",
  "Other",
];

const CONCERN_TAGS = [
  "Data privacy",
  "Accuracy & hallucinations",
  "Copyright & IP",
  'Unapproved tools (“shadow AI”)',
  "Bias & fairness",
];

export default function WizardPage() {
  const [step, setStep] = useState<Step>(1);

  const [form, setForm] = useState<WizardFormState>({
    businessName: "",
    country: "Australia",
    industry: "",
    teamSize: "solo",
    aiUsageNotes: "",
    aiUsageTags: ["Marketing & content"],
    riskLevel: "medium",
    riskPosture: "balanced",
    whoCanUse: "everyone",
    approvedToolsText: "",
    mainConcerns: ["Data privacy", "Accuracy & hallucinations"],
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [demoInitialised, setDemoInitialised] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // ✅ NEW: banner for auth/upgrade gating on PDF
  const [pdfGate, setPdfGate] = useState<null | { code: 401 | 403; message: string }>(null);

  const toggleAiTag = (tag: string) => {
    setForm((prev) => {
      const exists = prev.aiUsageTags.includes(tag);
      return {
        ...prev,
        aiUsageTags: exists
          ? prev.aiUsageTags.filter((t) => t !== tag)
          : [...prev.aiUsageTags, tag],
      };
    });
  };

  const toggleConcernTag = (tag: string) => {
    setForm((prev) => {
      const exists = prev.mainConcerns.includes(tag);
      return {
        ...prev,
        mainConcerns: exists
          ? prev.mainConcerns.filter((t) => t !== tag)
          : [...prev.mainConcerns, tag],
      };
    });
  };

  const handleChange =
    (field: keyof WizardFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.industry) {
      alert("Please fill in at least your business name and industry.");
      return;
    }
    setStep(2);
    setResult(null);
    setErrorMessage(null);
    setCopied(false);
    setPdfGate(null);
  };

  const handleBackFromStep2 = () => {
    setStep(1);
    setCopied(false);
    setPdfGate(null);
  };

  const callGenerate = async (payload: WizardFormState) => {
    setLoading(true);
    setErrorMessage(null);
    setResult(null);
    setCopied(false);
    setPdfGate(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Non-OK response from /api/generate:", text);
        setErrorMessage("Server error while generating policy draft.");
        return;
      }

      const data: GenerateResult = await response.json();
      setResult(data);

      if (!data.success) {
        setErrorMessage(data.error || "Something went wrong.");
      } else {
        setStep(3);
      }
    } catch (err) {
      console.error("Error calling /api/generate:", err);
      setErrorMessage("Network error while calling /api/generate.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWizard = async (e: React.FormEvent) => {
    e.preventDefault();
    await callGenerate(form);
  };

  const handleCopy = async () => {
    if (!result?.fullText) return;
    try {
      await navigator.clipboard.writeText(result.fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result?.fullText) return;

    setPdfGate(null);

    try {
      setDownloadingPdf(true);

      const payload = {
        businessName: form.businessName,
        country: form.country,
        industry: form.industry,
        policyText: result.fullText,
      };

      const res = await fetch("/api/policy-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        setPdfGate({ code: 401, message: "Please sign in to download PDFs." });
        return;
      }

      if (res.status === 403) {
        setPdfGate({ code: 403, message: "Upgrade to export PDFs." });
        return;
      }

      if (!res.ok) {
        console.error("Failed to generate PDF", await res.text().catch(() => ""));
        setPdfGate({ code: 403, message: "Failed to generate PDF. Please try again." });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download =
        (form.businessName
          ? `ai-use-policy-${form.businessName.replace(/\s+/g, "-").toLowerCase()}`
          : "ai-use-policy") + ".pdf";

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      setPdfGate({ code: 403, message: "Something went wrong while downloading the PDF." });
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    if (demoInitialised) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const demo = params.get("demo");

    if (demo === "1") {
      const demoForm: WizardFormState = {
        businessName: "Bondi Physio Clinic",
        country: "Australia",
        industry: "Allied health / physiotherapy",
        teamSize: "small",
        aiUsageNotes:
          "Clinicians occasionally use ChatGPT to draft patient communication templates and blog posts.\nAdmin staff use AI to summarise internal documents.",
        aiUsageTags: ["Internal documents", "Marketing & content"],
        riskLevel: "high",
        riskPosture: "balanced",
        whoCanUse: "approvedRoles",
        approvedToolsText:
          "ChatGPT via company account for internal drafts only.\nNo patient-identifiable information in any AI tools.",
        mainConcerns: ["Data privacy", "Accuracy & hallucinations", "Copyright & IP"],
      };

      setForm(demoForm);
      setStep(2);
      setDemoInitialised(true);
      void callGenerate(demoForm);
    }
  }, [demoInitialised]);

  const policyTitleForSave =
    result?.policyPreview?.title ||
    (form.businessName
      ? `${form.businessName} – AI Use Policy`
      : "AI Use & Governance Policy");

  const fullPolicyTextForSave = result?.fullText || "";

  const loginHref = `/login?callbackUrl=${encodeURIComponent("/wizard")}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-[11px] font-semibold text-white">
              PS
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                PolicySprint AI
              </div>
              <div className="text-[13px] font-medium text-slate-900">
                AI policy wizard
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <div>
              {step === 1 && "Step 1 of 3 · Business basics"}
              {step === 2 && "Step 2 of 3 · Risk & rules"}
              {step === 3 && "Step 3 of 3 · Outputs"}
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 text-[11px] text-slate-600">
          <div
            className={`flex items-center gap-1 rounded-full border px-2 py-1 ${
              step === 1
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white"
            }`}
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px]">
              1
            </span>
            <span>Business</span>
          </div>
          <div className="h-px flex-1 bg-slate-200" />
          <div
            className={`flex items-center gap-1 rounded-full border px-2 py-1 ${
              step === 2
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white"
            }`}
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px]">
              2
            </span>
            <span>Risk & rules</span>
          </div>
          <div className="h-px flex-1 bg-slate-200" />
          <div
            className={`flex items-center gap-1 rounded-full border px-2 py-1 ${
              step === 3
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white"
            }`}
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px]">
              3
            </span>
            <span>Outputs</span>
          </div>
        </div>

        <div className="space-y-4">
          {step === 1 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm space-y-4">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                  Tell us about your business
                </h1>
                <p className="text-xs md:text-sm text-slate-600 max-w-2xl">
                  We&apos;ll use this to tailor your AI Use Policy, staff guide and training
                  examples to your size, industry and how you actually use AI today.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleNextFromStep1}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Business name
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:bg-white"
                      placeholder="e.g. Bondi Physio Clinic"
                      value={form.businessName}
                      onChange={handleChange("businessName")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Country / region
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
                      value={form.country}
                      onChange={handleChange("country")}
                    >
                      <option>Australia</option>
                      <option>New Zealand</option>
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>European Union</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Industry
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:bg-white"
                      placeholder="e.g. Allied health / physiotherapy"
                      value={form.industry}
                      onChange={handleChange("industry")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Team size
                    </label>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {(Object.keys(TEAM_SIZE_LABELS) as TeamSizeOption[]).map((key) => {
                        const selected = form.teamSize === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                teamSize: key,
                              }))
                            }
                            className={`rounded-full border px-2.5 py-1.5 text-left ${
                              selected
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                            }`}
                          >
                            {TEAM_SIZE_LABELS[key]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    How do you use AI today?
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Choose the options that fit, then add any extra detail.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {AI_USAGE_TAGS.map((tag) => {
                      const selected = form.aiUsageTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleAiTag(tag)}
                          className={`rounded-full border px-3 py-1 text-[11px] ${
                            selected
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:bg-white"
                    rows={3}
                    placeholder="e.g. Clinicians use AI to draft templates..."
                    value={form.aiUsageNotes}
                    onChange={handleChange("aiUsageNotes")}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <Link href="/" className="text-[11px] text-slate-500 hover:text-slate-700">
                    ← Back to landing page
                  </Link>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Save &amp; continue →
                  </button>
                </div>
              </form>
            </section>
          )}

          {step === 2 && (
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6 space-y-4">
              <div className="mb-2">
                <h1 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                  Set your risk &amp; rules
                </h1>
                <p className="text-xs md:text-sm text-slate-600 max-w-2xl">
                  This shapes how strict your policy will be.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmitWizard}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      How sensitive is your data overall?
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      {(["low", "medium", "high"] as RiskLevel[]).map((level) => {
                        const selected = form.riskLevel === level;
                        const label =
                          level === "low"
                            ? "Low"
                            : level === "medium"
                            ? "Medium"
                            : "High";
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                riskLevel: level,
                              }))
                            }
                            className={`rounded-full border px-2.5 py-1.5 text-left ${
                              selected
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Overall posture to AI
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      {(["strict", "balanced", "open"] as RiskPosture[]).map((p) => {
                        const selected = form.riskPosture === p;
                        const label =
                          p === "strict"
                            ? "Strict"
                            : p === "balanced"
                            ? "Balanced"
                            : "Open";
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                riskPosture: p,
                              }))
                            }
                            className={`rounded-full border px-2.5 py-1.5 text-left ${
                              selected
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Who is allowed to use AI tools for work?
                    </label>
                    <div className="space-y-1 text-[11px]">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          className="h-3 w-3"
                          checked={form.whoCanUse === "everyone"}
                          onChange={() =>
                            setForm((prev) => ({ ...prev, whoCanUse: "everyone" }))
                          }
                        />
                        <span>Everyone</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          className="h-3 w-3"
                          checked={form.whoCanUse === "approvedRoles"}
                          onChange={() =>
                            setForm((prev) => ({ ...prev, whoCanUse: "approvedRoles" }))
                          }
                        />
                        <span>Only approved roles</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          className="h-3 w-3"
                          checked={form.whoCanUse === "companyToolsOnly"}
                          onChange={() =>
                            setForm((prev) => ({ ...prev, whoCanUse: "companyToolsOnly" }))
                          }
                        />
                        <span>Only company-provided tools</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Which AI tools are currently allowed?
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:bg-white"
                      placeholder="e.g. ChatGPT for internal drafts..."
                      value={form.approvedToolsText}
                      onChange={handleChange("approvedToolsText")}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    What are your main concerns?
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {CONCERN_TAGS.map((tag) => {
                      const selected = form.mainConcerns.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleConcernTag(tag)}
                          className={`rounded-full border px-3 py-1 text-[11px] ${
                            selected
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleBackFromStep2}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-[11px] text-slate-700 hover:bg-white"
                    disabled={loading}
                  >
                    ← Back
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {loading ? "Generating…" : "Generate →"}
                  </button>
                </div>

                {errorMessage && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                    {errorMessage}
                  </div>
                )}
              </form>
            </section>
          )}

          {step === 3 && result && result.success && (
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h1 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                    Your AI policy draft is ready
                  </h1>
                  <p className="text-xs md:text-sm text-slate-600 max-w-2xl">
                    Copy, tweak, then review with a qualified lawyer before adoption.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-[11px] text-slate-700 hover:bg-white disabled:opacity-60"
                    disabled={downloadingPdf}
                  >
                    {downloadingPdf ? "Preparing PDF…" : "Download PDF"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-[11px] text-slate-700 hover:bg-white"
                  >
                    {copied ? "Copied!" : "Copy full draft"}
                  </button>

                  <SavePolicyButton
                    policyTitle={policyTitleForSave}
                    businessName={form.businessName}
                    industry={form.industry}
                    country={form.country}
                    fullPolicyText={fullPolicyTextForSave}
                  />
                </div>
              </div>

              {pdfGate ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900">
                  <div className="font-semibold">
                    {pdfGate.code === 401 ? "Sign in required" : "Upgrade required"}
                  </div>
                  <div className="mt-0.5">
                    {pdfGate.message}{" "}
                    {pdfGate.code === 401 ? (
                      <Link href={loginHref} className="underline font-semibold">
                        Sign in
                      </Link>
                    ) : (
                      <Link href="/pricing" className="underline font-semibold">
                        View pricing
                      </Link>
                    )}
                  </div>
                </div>
              ) : null}

              <textarea
                readOnly
                className="w-full h-72 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-900"
                value={result.fullText || ""}
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]">
                <div className="font-medium text-slate-800 mb-1">Staff guide</div>
                <GenerateStaffGuideButton policyText={result.fullText || ""} />
              </div>
            </section>
          )}

          <p className="text-[11px] text-slate-500">
            This wizard generates general templates only and is not legal advice. Always
            review your final policy with a qualified lawyer.
          </p>
        </div>
      </main>
    </div>
  );
}
