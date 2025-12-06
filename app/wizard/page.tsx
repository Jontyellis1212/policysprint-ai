"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GenerateStaffGuideButton from "../components/GenerateStaffGuideButton";
import GenerateQuizButton from "../components/GenerateQuizButton";
import EmailButton from "../components/EmailButton";

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

  // --- helpers & handlers ---

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
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      console.log("Response from /api/generate:", data);
      setResult(data);

      if (!data.success) {
        setErrorMessage(data.error || "Something went wrong.");
      } else {
        // Save policy for quiz/staff-guide auto-prefill
        if (typeof window !== "undefined" && data.fullText) {
          window.localStorage.setItem("policysprint:lastPolicy", data.fullText);
        }
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

  const handlePrint = () => {
    if (!result?.fullText) return;

    const title = `AI Use Policy - ${
      form.businessName || "Your business"
    }`;
    const printWindow = window.open(
      "",
      "_blank",
      "width=800,height=900"
    );
    if (!printWindow) {
      console.error("Could not open print window");
      return;
    }

    const policyHtml = result.fullText
      .split("\n")
      .map((line) => `<p>${line}</p>`)
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color: #020617; }
            h1 { margin-bottom: 12px; font-size: 20px; }
            p { margin: 0 0 6px 0; line-height: 1.5; font-size: 13px; }
            .meta { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
            .disclaimer { margin-top: 24px; font-size: 11px; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">
            Country / region: ${form.country || "Not specified"}<br />
            Industry: ${form.industry || "Not specified"}
          </div>
          ${policyHtml}
          <div class="disclaimer">
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

  // Demo mode: auto-fill & auto-generate when ?demo=1
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

  // --- JSX ---

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        <div className="space-y-6">
          {/* Top bar */}
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                PS
              </div>
              <div>
                <h1 className="text-sm font-semibold text-slate-900">
                  PolicySprint
                </h1>
                <p className="text-xs text-slate-500">
                  AI policy wizard
                </p>
              </div>
            </div>
            <div className="text-[11px] text-slate-500">
              {step === 1 && "Step 1 of 3 · Business basics"}
              {step === 2 && "Step 2 of 3 · Risk & rules"}
              {step === 3 && "Step 3 of 3 · Outputs & rollout"}
            </div>
          </header>

          {/* Step pills */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            <div
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${
                step === 1
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current">
                1
              </span>
              <span>Business</span>
            </div>
            <div
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${
                step === 2
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current">
                2
              </span>
              <span>Risk &amp; rules</span>
            </div>
            <div
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${
                step === 3
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current">
                3
              </span>
              <span>Outputs</span>
            </div>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6 space-y-4">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-slate-900 mb-1">
                  Tell us about your business
                </h1>
                <p className="text-xs md:text-sm text-slate-600 max-w-2xl">
                  We&apos;ll use this to tailor your AI Use Policy, staff
                  guide and training examples to your size, industry and how
                  you actually use AI today.
                </p>
              </div>

              {/* ... Step 1 form unchanged ... */}
              {/* (Use the same Step 1 content from the previous working version – omitted here for brevity) */}
            </section>
          )}

          {/* Step 2 */}
          {/* (Use the same Step 2 content from the previous working version – omitted here for brevity) */}

          {/* Step 3: Outputs & rollout */}
          {step === 3 && result && result.success && (
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6 space-y-6">
              {/* Success banner */}
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                  <span className="text-xs font-bold text-white">✓</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-emerald-900">
                    Your AI Use Policy draft is ready
                  </p>
                  <p className="text-xs text-emerald-800">
                    You now have a full draft you can refine with your legal or
                    compliance team, plus tools to help staff actually understand
                    and use it.
                  </p>
                </div>
              </div>

              {/* Header row */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                    Review &amp; roll out your{" "}
                    <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
                      AI Use Policy
                    </span>
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 max-w-xl">
                    Copy the draft into your policy docs, email it to yourself,
                    then use the staff guide and training quiz to roll it out
                    with confidence.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800 transition"
                >
                  ← Back to step 2 (fine-tune answers)
                </button>
              </div>

              {/* Main layout */}
              <div className="grid gap-6 md:grid-cols-[minmax(0,2.2fr),minmax(0,1.3fr)]">
                {/* LEFT SIDE – Final Policy */}
                <div className="space-y-4">
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

                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 max-h-[520px] overflow-auto">
                    <pre className="text-[13px] whitespace-pre-wrap text-slate-800 leading-relaxed">
                      {result.fullText}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="rounded-full px-4 py-2.5 text-[12px] font-medium bg-slate-900 text-slate-50 hover:bg-slate-800 transition"
                      >
                        Print / Save as PDF
                      </button>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="rounded-full px-4 py-2.5 text-[12px] font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 transition"
                      >
                        {copied ? "Copied!" : "Copy full policy"}
                      </button>
                    </div>
                    <EmailButton
                      subject="Your AI Use Policy draft"
                      getBody={() => result.fullText || ""}
                      label="Email this policy"
                      variant="light"
                    />
                    <p className="text-[11px] text-slate-500">
                      Tip: paste this into your existing policy template, intranet
                      or contract pack.
                    </p>
                  </div>
                </div>

                {/* RIGHT SIDE – Next Actions */}
                <div className="space-y-4 text-[13px]">
                  {/* Staff Guide Card */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-900">
                        Staff guide
                      </span>
                      <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-medium">
                        New
                      </span>
                    </div>
                    <p className="text-slate-600 mb-3">
                      Turn this draft into a short, plain-English guide that
                      explains the key rules in human language, not legalese.
                    </p>
                    <GenerateStaffGuideButton
                      policyText={result.fullText || ""}
                    />
                  </div>

                  {/* Quiz Card */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-900">
                        Training &amp; quiz
                      </span>
                      <span className="rounded-full bg-sky-100 text-sky-700 px-2 py-0.5 text-[10px] font-medium">
                        New
                      </span>
                    </div>
                    <p className="text-slate-600 mb-3">
                      Generate a short multiple-choice quiz based on this policy
                      so staff can confirm they understand what&apos;s allowed and
                      what&apos;s not.
                    </p>
                    <GenerateQuizButton policyText={result.fullText || ""} />
                  </div>

                  {/* Next Steps Card */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <span className="font-semibold text-slate-900">
                      Recommended next steps
                    </span>
                    <ul className="list-disc pl-4 mt-2 space-y-1 text-slate-600">
                      <li>Copy this draft into your official policy template.</li>
                      <li>Review and refine with leadership, HR or legal.</li>
                      <li>Publish the final policy to staff.</li>
                      <li>Share the staff guide for an easy-to-read version.</li>
                      <li>
                        Ask staff to complete the quiz as part of onboarding or
                        refresher training.
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
                  General templates only — always review with a qualified lawyer in
                  your jurisdiction.
                </span>
              </div>
            </section>
          )}

          <p className="text-[11px] text-slate-500">
            This wizard helps you generate general templates only and is not legal
            advice. Always review your final policy with a qualified lawyer in your
            jurisdiction.
          </p>
        </div>
      </main>
    </div>
  );
}
