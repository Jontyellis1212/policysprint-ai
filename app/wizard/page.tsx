// app/wizard/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import DownloadGateCard from "../components/DownloadGateCard";
import GenerateStaffGuideButton from "../components/GenerateStaffGuideButton";
import { SavePolicyButton } from "../components/SavePolicyButton";
import PdfPreviewClient from "../components/PdfPreviewClient";
import MobileStickyActions from "@/app/components/MobileStickyActions";
import PdfPreviewModal from "../components/PdfPreviewModal";


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
  "None currently",
  "Marketing & content",
  "Customer support",
  "Internal documents",
  "Coding / technical",
  "Other",
];

const COMMON_AI_TOOLS = [
  "ChatGPT",
  "Microsoft Copilot",
  "Google Gemini",
  "Claude",
  "Perplexity",
  "Canva AI",
  "Notion AI",
  "Grammarly",
  "Midjourney",
  "DALL·E",
  "GitHub Copilot",
  "Cursor",
  "Jasper",
  "Zendesk AI / Helpdesk AI",
  "Intercom Fin / AI",
  "Other / custom",
];

const CONCERN_TAGS = [
  "Data privacy",
  "Accuracy & hallucinations",
  "Copyright & IP",
  'Unapproved tools (“shadow AI”)',
  "Bias & fairness",
];

type DownloadGateState = {
  signinRequired: boolean;
  upgradeRequired: boolean;
  message: string | null;
};

function phaseForSeconds(seconds: number) {
  if (seconds < 3) return "Warming up…";
  if (seconds < 9) return "Drafting policy…";
  if (seconds < 14) return "Finalising…";
  return "Almost done…";
}

function remainingForSeconds(seconds: number) {
  const est = 12;
  const rem = Math.max(0, est - seconds);
  if (seconds >= est) return "This can take a little longer sometimes.";
  return `~${rem}s remaining`;
}

function GenerateButton({ loading, seconds }: { loading: boolean; seconds: number }) {
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="relative">
        {loading ? (
          <div className="pointer-events-none absolute -inset-2 rounded-full bg-emerald-400/25 blur-xl animate-pulse" />
        ) : null}

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className={[
            "relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3",
            "font-semibold text-sm",
            "transition-all select-none",
            "min-w-[260px]",
            loading ? "cursor-not-allowed" : "cursor-pointer",
            "shadow-sm",
            "ring-1 ring-emerald-300/35",
            loading
              ? "bg-emerald-400 text-slate-950"
              : "bg-gradient-to-r from-emerald-400 to-emerald-300 text-slate-950 hover:from-emerald-300 hover:to-emerald-200",
          ].join(" ")}
        >
          {loading ? (
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
              <span className="absolute -left-1/2 top-0 h-full w-1/2 bg-white/25 blur-md animate-pulse" />
            </span>
          ) : null}

          {loading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="2.6"
                className="opacity-25"
              />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                className="opacity-90"
              />
            </svg>
          ) : null}

          <span className="relative">{loading ? "Generating…" : "Generate draft preview →"}</span>
        </button>

        {loading ? (
          <div className="absolute left-3 right-3 -bottom-1.5 h-[3px] rounded-full bg-emerald-950/30 overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-emerald-900/40 animate-pulse" />
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="text-right">
          <div className="text-[11px] font-medium text-emerald-300">{phaseForSeconds(seconds)}</div>
          <div className="text-[10px] text-slate-400">{remainingForSeconds(seconds)}</div>
        </div>
      ) : null}
    </div>
  );
}

function buildContentsText(result: GenerateResult | null): string {
  const sample = result?.policyPreview?.sampleSection?.filter(Boolean) ?? [];
  if (sample.length) return sample.map((s, i) => `${i + 1}. ${s}`).join("\n");

  const text = result?.fullText ?? "";
  if (!text.trim()) return "";

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const headings: string[] = [];
  for (const l of lines) {
    const cleaned = l.replace(/^#+\s*/, "");
    const isNumbered = /^\d+(\.|\))\s+/.test(cleaned);
    const isAllCapsShort =
      cleaned.length <= 60 && cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned);

    const looksLikeHeading =
      isNumbered ||
      cleaned.startsWith("Purpose") ||
      cleaned.startsWith("Scope") ||
      cleaned.startsWith("Definitions") ||
      cleaned.startsWith("Policy") ||
      cleaned.startsWith("Rules") ||
      cleaned.startsWith("Approvals") ||
      cleaned.startsWith("Security") ||
      cleaned.startsWith("Compliance") ||
      cleaned.startsWith("Incident") ||
      cleaned.startsWith("Review") ||
      isAllCapsShort;

    if (looksLikeHeading) {
      const h = cleaned.replace(/^\d+(\.|\))\s+/, "").trim();
      if (h && !headings.includes(h)) headings.push(h);
    }
    if (headings.length >= 10) break;
  }

  if (!headings.length) return "";
  return headings.map((h, i) => `${i + 1}. ${h}`).join("\n");
}

function buildDisclaimerText(country: string): string {
  const base =
    "This document is a general template for information purposes only and does not constitute legal advice. " +
    "You should obtain advice from a qualified lawyer before adopting or relying on this policy.";
  return country ? `${base}\nJurisdiction: ${country}.` : base;
}

function composeAiUsageNotes(notes: string, tools: string[]): string {
  const trimmedNotes = (notes || "").trim();

  const withoutToolsLine = trimmedNotes
    .split("\n")
    .filter((l) => !/^tools used:/i.test(l.trim()))
    .join("\n")
    .trim();

  const cleanTools = Array.from(new Set((tools || []).map((t) => t.trim()).filter(Boolean)));
  if (cleanTools.length === 0) return withoutToolsLine;

  const toolsLine = `Tools used: ${cleanTools.join(", ")}`;
  if (!withoutToolsLine) return toolsLine;
  return `${toolsLine}\n\n${withoutToolsLine}`;
}

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

  const [aiToolsUsed, setAiToolsUsed] = useState<string[]>([]);
  const [aiToolPicker, setAiToolPicker] = useState<string>("ChatGPT");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [demoInitialised, setDemoInitialised] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [generateSeconds, setGenerateSeconds] = useState(0);

  // ✅ Unified download gating
  const [downloadGate, setDownloadGate] = useState<DownloadGateState>({
    signinRequired: false,
    upgradeRequired: false,
    message: null,
  });

  // Preview state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const previewAbortRef = useRef<AbortController | null>(null);

  const toggleAiTag = (tag: string) => {
    setForm((prev) => {
      const exists = prev.aiUsageTags.includes(tag);

      if (tag === "None currently") {
        if (exists) {
          return { ...prev, aiUsageTags: prev.aiUsageTags.filter((t) => t !== tag) };
        }
        return { ...prev, aiUsageTags: ["None currently"] };
      }

      const base = prev.aiUsageTags.filter((t) => t !== "None currently");

      return {
        ...prev,
        aiUsageTags: exists ? base.filter((t) => t !== tag) : [...base, tag],
      };
    });
  };

  const toggleConcernTag = (tag: string) => {
    setForm((prev) => {
      const exists = prev.mainConcerns.includes(tag);
      return {
        ...prev,
        mainConcerns: exists ? prev.mainConcerns.filter((t) => t !== tag) : [...prev.mainConcerns, tag],
      };
    });
  };

  const handleChange =
    (field: keyof WizardFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
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

    // Reset gates
    setDownloadGate({ signinRequired: false, upgradeRequired: false, message: null });

    // reset preview state on regenerate
    setPreviewError(null);
    previewAbortRef.current?.abort();
    previewAbortRef.current = null;
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });

    setGenerateSeconds(0);
    const interval = setInterval(() => setGenerateSeconds((s) => s + 1), 1000);

    try {
      const payloadToSend: WizardFormState = {
        ...payload,
        aiUsageNotes: composeAiUsageNotes(payload.aiUsageNotes, aiToolsUsed),
      };

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToSend),
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
      clearInterval(interval);
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

  const policyTitleForSave = useMemo(() => {
    return (
      result?.policyPreview?.title ||
      (form.businessName ? `${form.businessName} – AI Use Policy` : "AI Use & Governance Policy")
    );
  }, [result?.policyPreview?.title, form.businessName]);

  const fullPolicyTextForSave = result?.fullText || "";

  const callbackUrl = "/wizard";
  const pricingHref = "/pricing";

  const handleDownloadPdf = async () => {
    if (!result?.fullText) return;

    try {
      setDownloadingPdf(true);

      // Clear only when trying again
      setDownloadGate({ signinRequired: false, upgradeRequired: false, message: null });

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
        setDownloadGate({
          signinRequired: true,
          upgradeRequired: false,
          message: "Please sign in to download PDFs.",
        });
        return;
      }

      if (res.status === 403) {
        setDownloadGate({
          signinRequired: false,
          upgradeRequired: true,
          message: "PDF export is included with Pro. Upgrade to download your policy PDF.",
        });
        return;
      }

      if (!res.ok) {
        console.error("Failed to generate PDF", await res.text());
        alert("Failed to generate PDF. Please try again.");
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
      alert("Something went wrong while downloading the PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const buildPreviewPayload = () => {
    const title = policyTitleForSave;
    const businessName = form.businessName || "Your business";
    const country = form.country || "";
    const industry = form.industry || "";
    const policyText = (result?.fullText || "").trim();

    const contentsText = buildContentsText(result);
    const disclaimerText = buildDisclaimerText(country);

    return {
      title,
      businessName,
      country,
      industry,
      contentsText,
      policyText,
      disclaimerText,
    };
  };

  const buildPreview = async () => {
    const policyText = (result?.fullText || "").trim();
    if (!policyText) return;

    setPreviewLoading(true);
    setPreviewError(null);

    previewAbortRef.current?.abort();
    const controller = new AbortController();
    previewAbortRef.current = controller;

    try {
      const payload = buildPreviewPayload();

      const res = await fetch("/api/policy-pdf/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt?.trim() ? txt.slice(0, 200) : "Failed to generate preview.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setPreviewError(e?.message || "Failed to generate preview.");
    } finally {
      if (previewAbortRef.current === controller) {
        previewAbortRef.current = null;
        setPreviewLoading(false);
      }
    }
  };

  useEffect(() => {
    if (step !== 3) return;
    if (!result?.success) return;
    if (!result?.fullText) return;

    if (!previewUrl && !previewLoading && !previewError) {
      void buildPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, result?.success, result?.fullText]);

  useEffect(() => {
    return () => {
      previewAbortRef.current?.abort();
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
    };
  }, []);

  // Demo mode
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
      setAiToolsUsed(["ChatGPT"]);
      setAiToolPicker("ChatGPT");

      setStep(2);
      setDemoInitialised(true);
      void callGenerate(demoForm);
    }
  }, [demoInitialised]);

  const card = "rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:p-6 shadow-sm";
  const label = "block text-xs font-medium text-slate-200 mb-1";
  const hint = "text-[11px] text-slate-400";
  const input =
    "w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-400/40";
  const inputSm =
    "w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-400/40";
  const pillBase = "rounded-full border px-3 py-1 text-[11px] transition";
  const pillOn = "border-slate-50 bg-slate-50 text-slate-950";
  const pillOff = "border-slate-700 bg-slate-950/40 text-slate-200 hover:bg-slate-900/50";
  const btnPrimary =
    "inline-flex items-center justify-center rounded-full bg-slate-50 px-5 py-2 text-sm font-medium text-slate-950 hover:bg-slate-200 disabled:opacity-60";
  const btnSecondary =
    "inline-flex items-center justify-center rounded-full border border-slate-600 px-4 py-2 text-[11px] text-slate-100 hover:bg-slate-900/60 disabled:opacity-60";

  const progressWidth = step === 1 ? "33.333%" : step === 2 ? "66.666%" : "100%";
  const helperText =
    step === 1
      ? "Add business basics to tailor the draft."
      : step === 2
      ? "Set risk posture and allowed tools."
      : "Copy, preview PDF, and save to dashboard.";

  const addPickedTool = () => {
    const t = (aiToolPicker || "").trim();
    if (!t) return;
    setAiToolsUsed((prev) => (prev.includes(t) ? prev : [...prev, t]));
  };

  const removeTool = (t: string) => {
    setAiToolsUsed((prev) => prev.filter((x) => x !== t));
  };

  const clearTools = () => setAiToolsUsed([]);

  const showGateCard = downloadGate.signinRequired || downloadGate.upgradeRequired;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* ✅ pb-28 prevents content being hidden behind the sticky bar on mobile */}
      <div className="w-full px-4 py-6 pb-28 md:mx-auto md:max-w-5xl md:py-10 md:pb-0">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-50 text-[11px] font-semibold text-slate-950">
              PS
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                PolicySprint AI
              </div>
              <div className="text-[13px] font-medium text-slate-100">AI policy wizard</div>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-400">
            <div>
              {step === 1 && "Step 1 of 3 · Business basics"}
              {step === 2 && "Step 2 of 3 · Risk & rules"}
              {step === 3 && "Step 3 of 3 · Outputs"}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-5 space-y-2">
          <div className="h-2 w-full rounded-full bg-slate-900/60 border border-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-300/90 transition-all" style={{ width: progressWidth }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{helperText}</span>
            <span className="text-slate-500">{step === 1 ? "33%" : step === 2 ? "66%" : "100%"}</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Step 1 */}
          {step === 1 && (
            <section className={`${card} space-y-4`}>
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-slate-50 mb-1">
                  Tell us about your business
                </h1>
                <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
                  We&apos;ll use this to tailor your AI Use Policy, staff guide and training examples to your size,
                  industry and how you actually use AI today.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleNextFromStep1}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={label}>Business name</label>
                    <input
                      className={inputSm}
                      placeholder="e.g. Bondi Physio Clinic"
                      value={form.businessName}
                      onChange={handleChange("businessName")}
                    />
                  </div>
                  <div>
                    <label className={label}>Country / region</label>
                    <select className={inputSm} value={form.country} onChange={handleChange("country")}>
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
                    <label className={label}>Industry</label>
                    <input
                      className={inputSm}
                      placeholder="e.g. Allied health / physiotherapy"
                      value={form.industry}
                      onChange={handleChange("industry")}
                    />
                  </div>
                  <div>
                    <label className={label}>Team size</label>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {(Object.keys(TEAM_SIZE_LABELS) as TeamSizeOption[]).map((key) => {
                        const selected = form.teamSize === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, teamSize: key }))}
                            className={[
                              "rounded-full border px-3 py-1 text-[11px] transition text-left",
                              selected ? pillOn : pillOff,
                            ].join(" ")}
                          >
                            {TEAM_SIZE_LABELS[key]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={label}>How do you use AI today?</label>
                  <p className={`${hint} mb-2`}>
                    Choose the options that fit, optionally pick common tools, then add any extra detail.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {AI_USAGE_TAGS.map((tag) => {
                      const selected = form.aiUsageTags.includes(tag);
                      const isNone = tag === "None currently";
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleAiTag(tag)}
                          className={[pillBase, selected ? pillOn : pillOff, isNone ? "border-amber-900/40" : ""].join(
                            " "
                          )}
                          title={isNone ? "Selecting this clears other usage types" : undefined}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 mb-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[11px] font-medium text-slate-200">Common AI tools used (optional)</div>
                          <div className="text-[10px] text-slate-400">
                            This helps the policy call out specific tools. It will be included in your “How we use AI”
                            notes.
                          </div>
                        </div>

                        {aiToolsUsed.length ? (
                          <button
                            type="button"
                            onClick={clearTools}
                            className="rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-[11px] text-slate-100 hover:bg-slate-900/70"
                          >
                            Clear
                          </button>
                        ) : null}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <select className={inputSm} value={aiToolPicker} onChange={(e) => setAiToolPicker(e.target.value)}>
                          {COMMON_AI_TOOLS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={addPickedTool}
                          className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2.5 text-[11px] font-semibold text-slate-950 hover:bg-emerald-300"
                        >
                          Add tool
                        </button>
                      </div>

                      {aiToolsUsed.length ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {aiToolsUsed.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => removeTool(t)}
                              className="rounded-full border border-emerald-900/40 bg-emerald-950/20 px-3 py-1 text-[11px] text-emerald-200 hover:bg-emerald-950/35"
                              title="Remove"
                            >
                              {t} <span className="text-emerald-300/80">×</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500">No tools selected.</div>
                      )}
                    </div>
                  </div>

                  <textarea
                    className={input}
                    rows={3}
                    placeholder="e.g. Clinicians use AI to draft templates, admin uses AI to summarise documents..."
                    value={form.aiUsageNotes}
                    onChange={handleChange("aiUsageNotes")}
                  />

                  {aiToolsUsed.length ? (
                    <p className="mt-2 text-[10px] text-slate-400">
                      This will be included in notes as:{" "}
                      <span className="text-slate-200">Tools used: {aiToolsUsed.join(", ")}</span>
                    </p>
                  ) : null}
                </div>

                {/* ✅ Sticky actions on mobile, normal flow on desktop */}
                <MobileStickyActions>
                  <div className="flex items-center gap-2">
                    <Link href="/" className="text-[11px] text-slate-400 hover:text-slate-200">
                      ← Back to landing page
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="submit" className={btnPrimary}>
                      Save &amp; continue to risk &amp; rules →
                    </button>
                  </div>
                </MobileStickyActions>
              </form>
            </section>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <section className={`${card} space-y-4`}>
              <div className="mb-2">
                <h1 className="text-xl md:text-2xl font-semibold text-slate-50 mb-1">Set your risk &amp; rules</h1>
                <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
                  This shapes how strict your policy will be, what&apos;s allowed, and where you draw the line.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmitWizard}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={label}>How sensitive is your data overall?</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      {(["low", "medium", "high"] as RiskLevel[]).map((level) => {
                        const selected = form.riskLevel === level;
                        const labelTxt =
                          level === "low"
                            ? "Low (mostly public)"
                            : level === "medium"
                            ? "Medium"
                            : "High (health, finance, IDs, etc.)";
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, riskLevel: level }))}
                            className={`${pillBase} ${selected ? pillOn : pillOff} text-left`}
                          >
                            {labelTxt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className={label}>Overall posture to AI</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      {(["strict", "balanced", "open"] as RiskPosture[]).map((p) => {
                        const selected = form.riskPosture === p;
                        const labelTxt =
                          p === "strict" ? "Strict (tight rules)" : p === "balanced" ? "Balanced" : "Open (more flexible)";
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, riskPosture: p }))}
                            className={`${pillBase} ${selected ? pillOn : pillOff} text-left`}
                          >
                            {labelTxt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={label}>Who is allowed to use AI tools for work?</label>
                    <div className="space-y-1 text-[11px] text-slate-200">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          className="h-3 w-3 accent-emerald-400"
                          checked={form.whoCanUse === "everyone"}
                          onChange={() => setForm((prev) => ({ ...prev, whoCanUse: "everyone" }))}
                        />
                        <span>Everyone (with guidance)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          className="h-3 w-3 accent-emerald-400"
                          checked={form.whoCanUse === "approvedRoles"}
                          onChange={() => setForm((prev) => ({ ...prev, whoCanUse: "approvedRoles" }))}
                        />
                        <span>Only approved roles / teams</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          className="h-3 w-3 accent-emerald-400"
                          checked={form.whoCanUse === "companyToolsOnly"}
                          onChange={() => setForm((prev) => ({ ...prev, whoCanUse: "companyToolsOnly" }))}
                        />
                        <span>Only via company-provided AI tools</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className={label}>Which AI tools are currently allowed?</label>
                    <textarea
                      className={input}
                      placeholder={`e.g.\n“ChatGPT for internal drafts, Canva AI for marketing…”`}
                      value={form.approvedToolsText}
                      onChange={handleChange("approvedToolsText")}
                    />
                  </div>
                </div>

                <div>
                  <label className={label}>What are your main concerns?</label>
                  <p className={`${hint} mb-2`}>We&apos;ll emphasise these risks in your policy and staff training.</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {CONCERN_TAGS.map((tag) => {
                      const selected = form.mainConcerns.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleConcernTag(tag)}
                          className={`${pillBase} ${selected ? pillOn : pillOff}`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ✅ Sticky actions on mobile, normal flow on desktop */}
                <MobileStickyActions>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={handleBackFromStep2} className={btnSecondary} disabled={loading}>
                      ← Back to business details
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <GenerateButton loading={loading} seconds={generateSeconds} />
                  </div>
                </MobileStickyActions>

                {errorMessage && (
                  <div className="mt-3 rounded-xl border border-rose-900/40 bg-rose-950/30 px-4 py-3 text-[11px] text-rose-200">
                    {errorMessage}
                  </div>
                )}
              </form>
            </section>
          )}

{/* Step 3 */}
{step === 3 && result && result.success && (
  <section className={`${card} space-y-5`}>
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-50 mb-1">
          Your AI policy draft is ready
        </h1>
        <p className="text-xs md:text-sm text-slate-300 max-w-2xl">
          Copy this into your own document, tweak the language, and have your lawyer review it before rolling it out to staff.
        </p>
      </div>

      {/* Actions: mobile = stacked flow, desktop = inline */}
      <div className="w-full md:w-auto">
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:gap-2 md:items-center">
          {/* Mobile primary: Preview PDF */}
          <div className="w-full md:hidden">
            <PdfPreviewModal
              blobUrl={previewUrl}
              loading={previewLoading}
              error={previewError}
              onRefresh={buildPreview}
            />
            <p className="mt-1 text-center text-[10px] text-slate-400">
              Opens a full-screen preview. Free accounts see a watermark.
            </p>
          </div>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className={[
              btnSecondary,
              "w-full md:w-auto",
              "py-3 md:py-2",
              "text-[12px] md:text-[11px]",
            ].join(" ")}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? "Preparing PDF…" : "Download PDF"}
          </button>

          {/* Save */}
          <div className="w-full md:w-auto">
            <SavePolicyButton
              policyTitle={policyTitleForSave}
              businessName={form.businessName}
              industry={form.industry}
              country={form.country}
              fullPolicyText={fullPolicyTextForSave}
            />
          </div>

          {/* Copy */}
          <button
            type="button"
            onClick={handleCopy}
            className={[
              btnSecondary,
              "w-full md:w-auto",
              "py-3 md:py-2",
              "text-[12px] md:text-[11px]",
            ].join(" ")}
          >
            {copied ? "Copied!" : "Copy full draft"}
          </button>
        </div>
      </div>
    </div>

    {/* ✅ Unified gating banner */}
    {showGateCard ? (
      <DownloadGateCard
        showSignIn={downloadGate.signinRequired}
        showUpgrade={downloadGate.upgradeRequired}
        callbackUrl={callbackUrl}
        pricingHref={pricingHref}
        title="Unlock downloads"
        subtitle={
          downloadGate.message ||
          "Preview is free. Sign in or upgrade to export PDFs, staff guides, and quizzes."
        }
      />
    ) : null}

    <div className="grid md:grid-cols-[3fr,2fr] gap-4">
      {/* LEFT */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-200">AI Use Policy draft</span>
          </div>
          <textarea
            readOnly
            className="w-full h-72 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-[11px] leading-relaxed text-slate-100"
            value={result.fullText || ""}
          />
          <p className="mt-1 text-[10px] text-slate-400">
            Tip: paste this into your letterhead or policy template, then adjust tone and get sign-off from your legal/compliance advisor.
          </p>
        </div>

        {/* PDF preview — desktop only */}
        <div className="hidden md:block rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <div className="text-[11px] font-semibold text-slate-100">PDF preview</div>
              <div className="text-[10px] text-slate-400">
                This is what your exported PDF will look like. Free accounts see a preview watermark.
              </div>
            </div>

            <button
              type="button"
              onClick={buildPreview}
              disabled={previewLoading}
              className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-[11px] text-slate-100 hover:bg-slate-900/70 disabled:opacity-60"
            >
              {previewLoading ? "Building…" : "Refresh preview"}
            </button>
          </div>

          <PdfPreviewClient blobUrl={previewUrl} loading={previewLoading} error={previewError} height={520} />
        </div>
      </div>

      {/* RIGHT */}
      <div className="space-y-3 text-[11px]">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-slate-100">Staff guide</span>
            <span className="rounded-full bg-emerald-950/40 text-emerald-200 border border-emerald-900/40 px-2 py-0.5 text-[10px]">
              New
            </span>
          </div>
          <p className="text-slate-300 mb-2">
            Turn this policy into a short, plain-English summary you can send to your team.
          </p>
          <GenerateStaffGuideButton policyText={result.fullText || ""} />
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-slate-100">Training &amp; quiz</span>
            <span className="rounded-full bg-amber-950/30 text-amber-200 border border-amber-900/30 px-2 py-0.5 text-[10px]">
              Available
            </span>
          </div>
          <p className="text-slate-300 mb-2">
            Generate a staff quiz from your policy and export a styled PDF.
          </p>
          <Link
            href="/quiz"
            className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950/40 px-3 py-2 text-[12px] font-medium text-slate-100 hover:bg-slate-900/60 w-full md:w-auto"
          >
            Open quiz generator →
          </Link>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
          <span className="font-medium text-slate-100">What&apos;s next?</span>
          <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-300">
            <li>Copy this draft into a document</li>
            <li>Review and edit with a lawyer</li>
            <li>Roll it out to your team</li>
            <li>Use the staff guide so they actually understand it</li>
          </ul>
        </div>
      </div>
    </div>

    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[11px] text-slate-400">
      <button type="button" className="underline text-left" onClick={() => setStep(2)}>
        ← Back to adjust risk &amp; rules
      </button>
      <span>General templates only — always review with a qualified lawyer.</span>
    </div>
  </section>
)}


          <p className="text-[11px] text-slate-500">
            This wizard helps you generate general templates only and is not legal advice. Always review your final policy with a qualified lawyer in your jurisdiction.
          </p>
        </div>
      </div>
    </main>
  );
}
