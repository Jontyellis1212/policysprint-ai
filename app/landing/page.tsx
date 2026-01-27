// app/landing/page.tsx
import Link from "next/link";

export const metadata = {
  title: "PolicySprint AI — Peace of mind in minutes",
  description:
    "Generate clear, practical AI policy templates in minutes — plus a staff guide and quiz — built for real businesses.",
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is PolicySprint legal advice?",
    a: "No. PolicySprint provides guided templates and practical information to help you create a strong policy foundation. It is not a substitute for legal advice, and it does not create a lawyer–client relationship.",
  },
  {
    q: "How long does it take?",
    a: "Most businesses can generate a first draft in a few minutes. You can then review and customize the wording to match your operations.",
  },
  {
    q: "Can I edit the policy?",
    a: "Yes. You can review and adjust the generated content before downloading. The goal is something clear and usable for your team.",
  },
  {
    q: "What do I get on Pro?",
    a: "Unlimited policy generations, saved organisation profiles, a staff-facing AI use guide, quiz generation, version history, and priority support/onboarding.",
  },
  {
    q: "What’s Enterprise for?",
    a: "Larger organisations with complex risk, multiple business units, custom workflows, SSO, and advanced controls. It’s coming soon — you can lock in early pricing.",
  },
];

function Badge({
  children,
  variant = "emerald",
}: {
  children: React.ReactNode;
  variant?: "emerald" | "slate";
}) {
  const cls =
    variant === "emerald"
      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
      : "border-white/10 bg-white/5 text-white/70";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function SectionTitle({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {kicker ? (
        <div className="mb-3 flex justify-center">
          <Badge>{kicker}</Badge>
        </div>
      ) : null}
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-pretty text-base text-white/70 sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function Icon({
  name,
}: {
  name:
    | "menu"
    | "check"
    | "spark"
    | "shield"
    | "clock"
    | "plain"
    | "doc"
    | "guide"
    | "quiz";
}) {
  const common = "h-5 w-5 shrink-0" as const;

  if (name === "menu") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`${common} text-white/70`} aria-hidden="true">
        <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`${common} text-emerald-300`} aria-hidden="true">
        <path
          d="M20 6L9 17l-5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "spark") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`${common} text-emerald-300`} aria-hidden="true">
        <path
          d="M12 2l1.2 4.2L17 8l-3.8 1.8L12 14l-1.2-4.2L7 8l3.8-1.8L12 2z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M19 12l.7 2.2L22 15l-2.3.8L19 18l-.7-2.2L16 15l2.3-.8L19 12z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`${common} text-emerald-300`} aria-hidden="true">
        <path
          d="M12 3l8 4v6c0 5-3.4 8.6-8 8.9C7.4 21.6 4 18 4 13V7l8-4z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 12l1.7 1.7L15 9.9"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`${common} text-emerald-300`} aria-hidden="true">
        <path d="M12 22a10 10 0 110-20 10 10 0 010 20z" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M12 6v6l4 2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "plain") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`${common} text-emerald-300`} aria-hidden="true">
        <path
          d="M6 4h9l3 3v13a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M15 4v4h4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M7.5 12h9M7.5 15.5h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  const docBase = (paths: React.ReactNode) => (
    <svg viewBox="0 0 24 24" fill="none" className={`${common} text-emerald-300`} aria-hidden="true">
      {paths}
    </svg>
  );

  if (name === "doc") {
    return docBase(
      <>
        <path
          d="M7 3h7l3 3v15a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M8.5 12h7M8.5 15h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </>
    );
  }

  if (name === "guide") {
    return docBase(
      <>
        <path
          d="M6 4h12a2 2 0 012 2v13a1 1 0 01-1 1H8a2 2 0 00-2 2V6a2 2 0 012-2z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M8 8h9M8 11h7M8 14h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </>
    );
  }

  // quiz
  return docBase(
    <>
      <path
        d="M7 4h10a2 2 0 012 2v14a1 1 0 01-1 1H7a2 2 0 01-2-2V6a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 9h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 13h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 17h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M8.5 9l.8.8 1.5-1.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function StepPill({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-2xl bg-black/20 px-4 py-3 ring-1 ring-emerald-300/20">
      <div className="text-[11px] font-semibold text-emerald-200/90">{n}</div>
      <div className="mt-0.5 text-sm font-semibold text-white/90">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#070B14] text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-20%] top-[-20%] h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-10%] top-[5%] h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-white/5 to-transparent" />
      </div>

      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-white">PS</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-white/90">PolicySprint AI</span>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-white/70 sm:flex">
          <a href="#how-it-works" className="hover:text-white">
            How it works
          </a>
          <a href="#pricing" className="hover:text-white">
            Pricing
          </a>
          <a href="#faq" className="hover:text-white">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/wizard"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#061019] shadow-sm hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#070B14]"
          >
            Generate my policy
          </Link>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10 sm:hidden"
            aria-label="Open menu"
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-6 pt-6 sm:px-6 sm:pb-10 sm:pt-10">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-4">
              <Badge>Peace of mind, without the legal headache</Badge>
            </div>

            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Get your AI Use Policy sorted — in minutes.
            </h1>

            <p className="mt-5 text-pretty text-base text-white/70 sm:text-lg">
              Guided questions produce a practical policy baseline, plus a staff guide and quiz — so you can roll it out
              with confidence.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/wizard?demo=1"
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-[#061019] shadow-sm hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#070B14] sm:w-auto"
              >
                Try live demo
              </Link>

              <a
                href="#pricing"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-white/10 sm:w-auto"
              >
                View pricing
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
              <span className="inline-flex items-center gap-2">
                <Icon name="clock" />
                Minutes to first draft
              </span>
              <span className="inline-flex items-center gap-2">
                <Icon name="plain" />
                Plain English
              </span>
              <span className="inline-flex items-center gap-2">
                <Icon name="shield" />
                Built for rollout
              </span>
            </div>

            <p className="mt-4 text-xs text-white/50">
              Not legal advice. Templates + guidance to help you create a practical policy foundation.
            </p>
          </div>

          {/* Replace “policy pack preview” with purposeful deliverables */}
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-emerald-500/10 blur-2xl" />

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90">What you walk away with</div>
                <Badge variant="slate">In minutes</Badge>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 ring-1 ring-emerald-300/20">
                      <Icon name="doc" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">AI Use Policy (PDF)</div>
                      <div className="mt-1 text-sm text-white/70">
                        A practical baseline your team can follow: scope, data handling, approvals, and review cadence.
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="slate">Plain English</Badge>
                        <Badge variant="slate">Editable</Badge>
                        <Badge variant="slate">Export-ready</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 ring-1 ring-emerald-300/20">
                      <Icon name="guide" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">Staff Guide (1 page)</div>
                      <div className="mt-1 text-sm text-white/70">
                        Day-to-day do&apos;s and don&apos;ts, examples, and quick rules for staff.
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="slate">Easy rollout</Badge>
                        <Badge variant="slate">Great for onboarding</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 ring-1 ring-emerald-300/20">
                      <Icon name="quiz" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">Training Quiz (10 questions)</div>
                      <div className="mt-1 text-sm text-white/70">
                        Confirms understanding and reduces “I didn’t know” moments.
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="slate">Printable PDF</Badge>
                        <Badge variant="slate">Track completion</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
                <div className="text-xs font-semibold text-emerald-200">3-step flow</div>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <StepPill n="1" label="Answer questions" />
                  <StepPill n="2" label="Review & customize" />
                  <StepPill n="3" label="Download & roll out" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <SectionTitle
          kicker="How it works"
          title="A clear, fast process your team can actually follow"
          subtitle="Three steps. No jargon. You get a practical baseline you can use immediately."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Card className="p-6 transition hover:-translate-y-0.5 hover:bg-white/10">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 ring-1 ring-emerald-300/20">
                <Icon name="spark" />
              </span>
              <div className="text-sm font-semibold text-white/80">Step 1</div>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Answer a few questions</h3>
            <p className="mt-2 text-sm text-white/70">
              Tell us your business, industry, and how you use AI today.
            </p>
          </Card>

          <Card className="p-6 transition hover:-translate-y-0.5 hover:bg-white/10">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 ring-1 ring-emerald-300/20">
                <Icon name="plain" />
              </span>
              <div className="text-sm font-semibold text-white/80">Step 2</div>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Review & customize</h3>
            <p className="mt-2 text-sm text-white/70">
              You get a clear first draft. Adjust wording to match your workflow.
            </p>
          </Card>

          <Card className="p-6 transition hover:-translate-y-0.5 hover:bg-white/10">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 ring-1 ring-emerald-300/20">
                <Icon name="shield" />
              </span>
              <div className="text-sm font-semibold text-white/80">Step 3</div>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Roll it out</h3>
            <p className="mt-2 text-sm text-white/70">
              Export PDF, share the staff guide, and use the quiz to confirm understanding.
            </p>
          </Card>
        </div>
      </section>

      {/* Pricing — match your screenshot */}
      <section id="pricing" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <SectionTitle
          kicker="Pricing"
          title="Choose the plan that fits"
          subtitle="Start free in beta. Upgrade when you want repeatable, organisation-level rollout."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {/* Starter */}
          <Card className="p-7">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold">Starter</h3>
              <Badge variant="slate">Best for getting started</Badge>
            </div>

            <div className="mt-4">
              <div className="flex items-end gap-2">
                <div className="text-4xl font-semibold">$0</div>
                <div className="pb-1 text-sm text-white/60">during beta</div>
              </div>
              <p className="mt-4 text-sm text-white/70">
                Generate your first AI Use Policy and share it internally without any friction.
              </p>
            </div>

            <Link
              href="/wizard?demo=1"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-white/10"
            >
              Try live demo
            </Link>

            <ul className="mt-6 space-y-3 text-sm text-white/80">
              {[
                "AI Use Policy generator",
                "3-step wizard (business → risk → outputs)",
                "PDF export via browser print",
                "Sample/demo mode with realistic data",
                "Copy & paste policy into your own templates",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Icon name="check" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Pro */}
          <Card className="p-7 ring-1 ring-emerald-300/30">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold">Pro</h3>
              <Badge>Most popular</Badge>
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap items-baseline gap-2">
                <div className="text-4xl font-semibold">$49</div>
                <div className="text-sm text-white/60">per month, per organisation</div>
              </div>
              <p className="mt-4 text-sm text-white/70">
                For organisations that want repeatable, up-to-date AI policies and staff guidance.
              </p>
            </div>

            <Link
              href="/pricing"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-[#061019] shadow-sm hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#070B14]"
            >
              Upgrade to Pro
            </Link>

            <p className="mt-3 text-xs text-white/55">
              You&apos;ll be redirected to Stripe Checkout. Cancel anytime.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-white/80">
              {[
                "Unlimited policy generations",
                "Saved organisation profiles",
                "Staff-facing AI Use Guide output",
                "Training quiz generated from your policy",
                "Version history for policy updates",
                "Priority support & onboarding",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Icon name="check" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Enterprise */}
          <Card className="p-7">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold">Enterprise</h3>
              <Badge variant="slate">For complex risk & scale</Badge>
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap items-baseline gap-2">
                <div className="text-4xl font-semibold">Custom</div>
                <div className="text-sm text-white/60">annual</div>
              </div>

              <p className="mt-4 text-sm text-white/70">
                For larger organisations with complex risk, multiple business units or custom workflows.
              </p>

              <div className="mt-3 text-xs font-semibold text-amber-300">
                COMING SOON — LOCK IN EARLY PRICING
              </div>
            </div>

            <Link
              href="/contact"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-white/10"
            >
              Talk to us
            </Link>

            <ul className="mt-6 space-y-3 text-sm text-white/80">
              {[
                "Everything in Pro",
                "Custom legal/risk inputs & templates",
                "Multiple business units & policies",
                "SSO & advanced access controls",
                "Dedicated success manager",
                "On-site or virtual training sessions",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Icon name="check" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <p className="mt-6 text-center text-xs text-white/50">
          PolicySprint provides templates and guidance — not legal advice.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <SectionTitle kicker="FAQ" title="Common questions" subtitle="Clear expectations = better outcomes." />

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-sm font-semibold text-white/90">{f.q}</span>
                <span className="text-white/50 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-white/70">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-8 backdrop-blur sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-balance text-2xl font-semibold sm:text-3xl">
                Ready to get your policy sorted?
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Generate a baseline in minutes, then roll it out with the staff guide and quiz.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
              <Link
                href="/wizard?demo=1"
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-[#061019] shadow-sm hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#070B14] sm:w-auto"
              >
                Try live demo
              </Link>
              <a
                href="#pricing"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-white/10 sm:w-auto"
              >
                View pricing
              </a>
            </div>
          </div>

          <p className="mt-5 text-xs text-white/50">Not legal advice. Templates + guidance only.</p>
        </div>

        <footer className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-xs text-white/50 sm:flex-row">
          <div>© {new Date().getFullYear()} PolicySprint</div>
          <div className="flex items-center gap-4">
            <span className="hover:text-white/70">Privacy</span>
            <span className="hover:text-white/70">Terms</span>
            <span className="hover:text-white/70">Contact</span>
          </div>
        </footer>
      </section>
    </main>
  );
}
