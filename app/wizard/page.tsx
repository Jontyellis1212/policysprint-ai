"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GenerateStaffGuideButton from "../components/GenerateStaffGuideButton";

type Step = 1 | 2 | 3;

type TeamSizeOption = "solo" | "small" | "medium" | "large" | "enterprise";
type RiskLevel = "low" | "medium" | "high";
type RiskPosture = "strict" | "balanced" | "open";

interface WizardFormState {
  // Step 1
  businessName: string;
  country: string;
  industry: string;
  teamSize: TeamSizeOption;
  aiUsageNotes: string;
  aiUsageTags: string[];
  // Step 2
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
  "Unapproved tools (“shadow AI”)",
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
    (e: any) => {
      setForm((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleNextFromStep1 = (e: any) => {
    e.preventDefault();
    if (!form.businessName || !form.industry) {
      alert("Please fill in at least your business name and industry.");
      return;
    }
    setStep(2);
    setResult(null);
    setErrorMessage(null);
    setCopied(false);
  };

  const handleBackFromStep2 = () => {
    setStep(1);
    setCopied(false);
  };

  const callGenerate = async (payload: WizardFormState) => {
    setLoading(true);
    setErrorMessage(null);
    setResult(null);
    setCopied(false);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Non-OK response from /api/generate:", text);
        setErrorMessage("Server error while generating policy draft.");
        setLoading(false);
        return;
      }

      const data: GenerateResult = await response.json();
      console.log("Response from /api/generate:", data);
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

  const handleSubmitWizard = async (e: any) => {
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

  const handlePrint = () => {
    if (!result?.fullText) return;
    const title = `AI Use Policy - ${form.businessName || "Your business"}`;

    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) {
      console.error("Could not open print window");
      return;
    }

    const policyHtml = result.fullText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              padding: 40px;
              line-height: 1.5;
              font-size: 12px;
              color: #0f172a;
            }
            h1 {
              font-size: 20px;
              margin-bottom: 4px;
            }
            .meta {
              font-size: 11px;
              color: #64748b;
              margin-bottom: 16px;
            }
            .footer {
              margin-top: 32px;
              font-size: 10px;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">
            <div><strong>Country / region:</strong> ${form.country || "Not specified"}</div>
            <div><strong>Industry:</strong> ${form.industry || "Not specified"}</div>
          </div>
          <div>${policyHtml}</div>
          <div class="footer">
            Generated by PolicySprint AI. This is a general template only and is not legal advice.
            Always have a qualified lawyer review and adapt this policy before use.
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // 🔹 Demo mode: auto-fill & auto-generate when ?demo=1 (read from window.location)
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
          "Clinicians occasionally use ChatGPT to draft patient communication templates and blog posts. Admin staff use AI to summarise internal documents.",
        aiUsageTags: ["Internal documents", "Marketing & content"],
        riskLevel: "high",
        riskPosture: "balanced",
        whoCanUse: "approvedRoles",
        approvedToolsText:
          "ChatGPT via company account for internal drafts only. No patient-identifiable information in any AI tools.",
        mainConcerns: [
          "Data privacy",
          "Accuracy & hallucinations",
          "Copyright & IP",
        ],
      };

      setForm(demoForm);
      setStep(2); // briefly in Step 2, then go to 3 after generate
      setDemoInitialised(true);
      void callGenerate(demoForm);
    }
  }, [demoInitialised]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full border border-slate-900 flex items-center justify-center text-xs font-bold">
              PS
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-slate-900">PolicySprint AI</span>
              <span className="text-[11px] text-slate-500">AI policy wizard</span>
            </div>
          </Link>
          <div className="ml-auto text-[11px] text-slate-500">
            {step === 1 && "Step 1 of 3 · Business basics"}
            {step === 2 && "Step 2 of 3 · Risk & rules"}
            {step === 3 && "Step 3 of 3 · Outputs"}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-4">
          {/* Step pills */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${
                step === 1
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              <span className="h-4 w-4 rounded-full border flex items-center justify-center text-[10px]">
                1
              </span>
              Business
            </div>
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${
                step === 2
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              <span className="h-4 w-4 rounded-full border flex items-center justify-center text-[10px]">
                2
              </span>
              Risk &amp; rules
            </div>
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${
                step === 3
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              <span className="h-4 w-4 rounded-full border flex items-center justify-center text-[10px]">
                3
              </span>
              Outputs
            </div>
          </div>

          {/* Step 1: Business basics */}
          {step === 1 && (
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6">
              <div className="mb-4">
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
                      type="text"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:bg-white"
                      placeholder="Acme Physio Clinic"
                      value={form.businessName}
                      onChange={handleChange("businessName")}
                      required
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
                      type="text"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:bg-white"
                      placeholder="e.g. Allied health, marketing agency, trades, e-commerce…"
                      value={form.industry}
                      onChange={handleChange("industry")}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Team size
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      {(Object.keys(TEAM_SIZE_LABELS) as TeamSizeOption[]).map((key) => {
                        const selected = form.teamSize === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({ ...prev, teamSize: key }))
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
                    Choose the options that fit, then add any extra detail. This helps us
                    shape examples and &quot;do / don&apos;t&quot; guidance.
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
                    placeholder='Optional: e.g. “We use ChatGPT to draft emails and social posts, and Canva AI for simple graphics.”'
                    value={form.aiUsageNotes}
                    onChange={handleChange("aiUsageNotes")}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <Link
                    href="/"
                    className="text-[11px] text-slate-500 hover:text-slate-700"
                  >
                    ← Back to landing page
                  </Link>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Save &amp; continue to risk &amp; rules →
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Step 2: Risk & rules */}
          {step === 2 && (
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6 space-y-4">
              <div className="mb-2">
                <h1 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                  Set your risk &amp; rules
                </h1>
                <p className="text-xs md:text-sm text-slate-600 max-w-2xl">
                  This shapes how strict your policy will be, what&apos;s allowed, and
                  where you draw the line. You can tweak the generated text later.
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
                            ? "Low (mostly public)"
                            : level === "medium"
                            ? "Medium"
                            : "High (health, finance, IDs, etc.)";
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({ ...prev, riskLevel: level }))
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
                            ? "Strict (tight rules)"
                            : p === "balanced"
                            ? "Balanced"
                            : "Open (more flexible)";
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({ ...prev, riskPosture: p }))
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
                            setForm((prev) => ({
                              ...prev,
                              whoCanUse: "everyone",
                            }))
                          }
                        />
                        <span>Everyone (with guidance)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          className="h-3 w-3"
                          checked={form.whoCanUse === "approvedRoles"}
                          onChange={() =>
                            setForm((prev) => ({
                              ...prev,
                              whoCanUse: "approvedRoles",
                            }))
                          }
                        />
                        <span>Only approved roles / teams</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          className="h-3 w-3"
                          checked={form.whoCanUse === "companyToolsOnly"}
                          onChange={() =>
                            setForm((prev) => ({
                              ...prev,
                              whoCanUse: "companyToolsOnly",
                            }))
                          }
                        />
                        <span>Only via company-provided AI tools</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Which AI tools are currently allowed?
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:bg-white"
                      placeholder='e.g. “ChatGPT for internal drafts, Canva AI for marketing, no free browser plugins.”'
                      value={form.approvedToolsText}
                      onChange={handleChange("approvedToolsText")}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    What are your main concerns?
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    We&apos;ll emphasise these risks in your policy and staff training.
                  </p>
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
                    ← Back to business details
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {loading ? "Generating draft…" : "Generate draft preview →"}
                  </button>
                </div>

                {errorMessage && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                    {errorMessage}
                  </div>
                )}

                {loading && (
                  <p className="text-[11px] text-slate-500">
                    Generating draft… this usually takes a moment.
                  </p>
                )}
              </form>
            </section>
          )}

          {/* Step 3: Outputs */}
          {step === 3 && result && result.success && (
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h1 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                    Your AI policy draft is ready
                  </h1>
                  <p className="text-xs md:text-sm text-slate-600 max-w-2xl">
                    Copy this into your own document, tweak the language, and have your
                    lawyer review it before rolling it out to staff.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-[11px] text-slate-700 hover:bg-white"
                  >
                    Print / Save as PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-[11px] text-slate-700 hover:bg-white"
                  >
                    {copied ? "Copied!" : "Copy full draft"}
                  </button>
                </div>
              </div>

              {/* Summary row */}
              <div className="grid md:grid-cols-3 gap-3 text-[11px]">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-slate-500 mb-1">Business</div>
                  <div className="font-semibold text-slate-900">
                    {form.businessName || "Your business"}
                  </div>
                  <div className="text-slate-600">
                    {form.industry || "Industry not set"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-slate-500 mb-1">Region &amp; size</div>
                  <div className="text-slate-700">{form.country}</div>
                  <div className="text-slate-600">
                    {TEAM_SIZE_LABELS[form.teamSize]}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-slate-500 mb-1">AI usage focus</div>
                  <div className="text-slate-700">
                    {form.aiUsageTags.length > 0
                      ? form.aiUsageTags.join(", ")
                      : "Not specified"}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-[3fr,2fr] gap-4">
                {/* Policy draft */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-slate-700">
                      AI Use Policy draft
                    </span>
                  </div>
                  <textarea
                    readOnly
                    className="w-full h-72 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-900"
                    value={result.fullText || ""}
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Tip: paste this into your letterhead or policy template, then adjust
                    tone, add references to existing policies, and get sign-off from your
                    legal or compliance advisor.
                  </p>
                </div>

                {/* Right-hand column */}
                <div className="space-y-3 text-[11px]">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-800">Staff guide</span>
                      <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px]">
                        New
                      </span>
                    </div>
                    <p className="text-slate-600 mb-2">
                      Turn this policy into a short, plain-English summary you can send
                      to your team or paste into your internal wiki.
                    </p>
                    <GenerateStaffGuideButton policyText={result.fullText || ""} />
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-800">
                        Training &amp; quiz
                      </span>
                      <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px]">
                        Coming soon
                      </span>
                    </div>
                    <p className="text-slate-600">
                      Simple training questions staff can answer to confirm they&apos;ve
                      read and understood your AI Use Policy.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="font-medium text-slate-800">
                      What&apos;s next?
                    </span>
                    <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-600">
                      <li>Copy this draft into a document</li>
                      <li>Review and edit with a lawyer</li>
                      <li>Roll it out to your team</li>
                      <li>
                        Use the staff guide to help them actually understand it
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <button
                  type="button"
                  className="underline"
                  onClick={() => setStep(2)}
                >
                  ← Back to adjust risk &amp; rules
                </button>
                <span>
                  General templates only — always review with a qualified lawyer in your
                  jurisdiction.
                </span>
              </div>
            </section>
          )}

          <p className="text-[11px] text-slate-500">
            This wizard helps you generate general templates only and is not legal advice.
            Always review your final policy with a qualified lawyer in your jurisdiction.
          </p>
        </div>
      </main>
    </div>
  );
}
