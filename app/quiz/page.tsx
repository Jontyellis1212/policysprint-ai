// app/page.tsx
import Link from "next/link";

export const metadata = {
  title: "PolicySprint — Policies in minutes. Peace of mind for small business.",
  description:
    "Generate clear, practical policy templates in minutes — plus a staff guide and quiz — built for real small businesses.",
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
    q: "What do I actually get?",
    a: "You’ll get a policy draft, a staff-friendly guide (how to follow it day-to-day), and a quick quiz to help confirm understanding.",
  },
  {
    q: "What if my business is unique or regulated?",
    a: "PolicySprint is best for small businesses wanting a practical baseline quickly. If you’re highly regulated or need jurisdiction-specific review, use PolicySprint as a starting point and consider professional advice.",
  },
  {
    q: "Do I keep my documents?",
    a: "Yes — once you download, you keep your documents. PolicySprint is designed to reduce friction, not lock you in.",
  },
];

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-900">
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
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-pretty text-base text-slate-600 sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function Icon({
  name,
}: {
  name: "spark" | "list" | "download" | "shield" | "clock" | "plain";
}) {
  const common =
    "h-5 w-5 text-emerald-700 shrink-0" as const;

  if (name === "spark") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
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

  if (name === "list") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path
          d="M8 6h13M8 12h13M8 18h13"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "download") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path
          d="M12 3v10m0 0l4-4m-4 4l-4-4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 17v3h16v-3"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
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
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path
          d="M12 22a10 10 0 110-20 10 10 0 010 20z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
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

  // plain
  return (
    <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
      <path
        d="M6 4h9l3 3v13a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M15 4v4h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 12h9M7.5 15.5h7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Top gradient accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-emerald-50 via-white to-white" />

      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-emerald-600/10 ring-1 ring-emerald-600/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-emerald-800">PS</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">PolicySprint</span>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-slate-600 sm:flex">
          <a href="#how-it-works" className="hover:text-slate-900">
            How it works
          </a>
          <a href="#pricing" className="hover:text-slate-900">
            Pricing
          </a>
          <a href="#faq" className="hover:text-slate-900">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/wizard"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Generate my policy
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-10">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-4">
              <Badge>Peace of mind, without the legal headache</Badge>
            </div>

            <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Policies your business needs — generated in minutes.
            </h1>

            <p className="mt-5 text-pretty text-base text-slate-600 sm:text-lg">
              PolicySprint helps small businesses create clear, practical policy templates
              with guided questions — plus a staff guide and quick quiz — so you can move forward
              with confidence.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/wizard"
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:w-auto"
              >
                Generate my policy
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 sm:w-auto"
              >
                See how it works
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
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
                Strong baseline
              </span>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Not legal advice. Templates + guidance to help you create a practical policy foundation.
            </p>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-emerald-100/40 blur-2xl" />
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Your policy pack</div>
                <span className="text-xs text-slate-500">Preview</span>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600/10 ring-1 ring-emerald-600/20">
                      <Icon name="spark" />
                    </span>
                    <div>
                      <div className="text-sm font-semibold">AI Use Policy</div>
                      <div className="text-xs text-slate-500">v1 — editable</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="h-2 w-[92%] rounded bg-slate-200" />
                    <div className="h-2 w-[78%] rounded bg-slate-200" />
                    <div className="h-2 w-[85%] rounded bg-slate-200" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600/10 ring-1 ring-emerald-600/20">
                        <Icon name="list" />
                      </span>
                      <div>
                        <div className="text-sm font-semibold">Staff Guide</div>
                        <div className="text-xs text-slate-500">day-to-day rules</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="h-2 w-[88%] rounded bg-slate-200" />
                      <div className="h-2 w-[72%] rounded bg-slate-200" />
                      <div className="h-2 w-[80%] rounded bg-slate-200" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600/10 ring-1 ring-emerald-600/20">
                        <Icon name="download" />
                      </span>
                      <div>
                        <div className="text-sm font-semibold">Quick Quiz</div>
                        <div className="text-xs text-slate-500">confirm understanding</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="h-2 w-[82%] rounded bg-slate-200" />
                      <div className="h-2 w-[66%] rounded bg-slate-200" />
                      <div className="h-2 w-[74%] rounded bg-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-xs font-semibold text-emerald-900">
                    3-step flow
                  </div>
                  <div className="mt-2 grid gap-2 text-sm text-emerald-950/90 sm:grid-cols-3">
                    <div className="rounded-xl bg-white/60 px-3 py-2 ring-1 ring-emerald-200">
                      1) Answer questions
                    </div>
                    <div className="rounded-xl bg-white/60 px-3 py-2 ring-1 ring-emerald-200">
                      2) Review & customize
                    </div>
                    <div className="rounded-xl bg-white/60 px-3 py-2 ring-1 ring-emerald-200">
                      3) Download & roll out
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600/10 ring-1 ring-emerald-600/20">
                <Icon name="spark" />
              </span>
              <div className="text-sm font-semibold">Step 1</div>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Answer a few questions</h3>
            <p className="mt-2 text-sm text-slate-600">
              Tell us your business, industry, and how you use AI today. Takes minutes.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600/10 ring-1 ring-emerald-600/20">
                <Icon name="plain" />
              </span>
              <div className="text-sm font-semibold">Step 2</div>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Review & customize</h3>
            <p className="mt-2 text-sm text-slate-600">
              We generate a policy draft in plain English. Adjust wording to match your workflow.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600/10 ring-1 ring-emerald-600/20">
                <Icon name="download" />
              </span>
              <div className="text-sm font-semibold">Step 3</div>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Download & roll it out</h3>
            <p className="mt-2 text-sm text-slate-600">
              Export PDF, share the staff guide, and use the quiz to confirm understanding.
            </p>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/wizard"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Start Step 1
          </Link>
        </div>
      </section>

      {/* What you get */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <SectionTitle
          kicker="What you get"
          title="A complete pack — not just a document"
          subtitle="Policy + staff guide + quiz, designed to make rollout easier (and actually used)."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Icon name="spark" />
              <h3 className="text-lg font-semibold">AI Use Policy</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              A clear, practical baseline policy built around real-world workflows.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-600" />
                Guidance on acceptable use and boundaries
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-600" />
                Data handling and confidentiality reminders
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-600" />
                Ownership and responsibility expectations
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Icon name="list" />
              <h3 className="text-lg font-semibold">Staff Guide</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              A staff-friendly guide that turns policy into daily habits.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-600" />
                Quick do’s and don’ts
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-600" />
                Examples your team understands
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-600" />
                Easy rollout instructions
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Icon name="plain" />
              <h3 className="text-lg font-semibold">Quick Quiz</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              A short quiz to confirm understanding and reinforce the basics.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-600" />
                Reduces “I didn’t know” moments
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-600" />
                Useful for onboarding
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-600" />
                Helps build a compliance culture
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Fit / Not fit */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <SectionTitle
          kicker="Who it’s for"
          title="Perfect if you want a strong baseline — fast"
          subtitle="Clear expectations make better outcomes (and fewer headaches)."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="text-lg font-semibold text-emerald-950">Great fit</h3>
            <ul className="mt-4 space-y-3 text-sm text-emerald-950/90">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-700" />
                Small businesses using ChatGPT or AI tools
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-700" />
                Teams that want clear, plain-English rules
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-700" />
                Owners who want peace of mind now, not “someday”
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">Not a fit</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
                Highly regulated orgs needing bespoke legal review
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
                Situations requiring jurisdiction-specific legal advice
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
                Court-strategy or guaranteed compliance outcomes
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <SectionTitle
          kicker="Pricing"
          title="Simple pricing that matches the job"
          subtitle="Pick the option that fits your stage. Upgrade anytime."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Starter</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Get your baseline policy pack fast.
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-semibold text-slate-900">$49</div>
                <div className="text-xs text-slate-500">AUD (example)</div>
              </div>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-600" />
                AI Use Policy (PDF)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-600" />
                Staff Guide (PDF)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-600" />
                Quick Quiz (PDF)
              </li>
            </ul>

            <Link
              href="/wizard"
              className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Get Starter
            </Link>

            <p className="mt-3 text-xs text-slate-500">
              Prices shown are placeholders — swap anytime.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-7 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex">
                  <Badge>Most popular</Badge>
                </div>
                <h3 className="text-lg font-semibold text-emerald-950">Pro</h3>
                <p className="mt-1 text-sm text-emerald-950/80">
                  More generation flexibility + future policy types.
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-semibold text-emerald-950">$99</div>
                <div className="text-xs text-emerald-950/70">AUD (example)</div>
              </div>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-emerald-950/90">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-700" />
                Everything in Starter
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-700" />
                Additional generations (for iterations)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-700" />
                Access to new policy packs as they release
              </li>
            </ul>

            <Link
              href="/wizard"
              className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Get Pro
            </Link>

            <p className="mt-3 text-xs text-emerald-950/70">
              Swap these details to match your real billing rules.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          PolicySprint provides templates and guidance — not legal advice.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <SectionTitle
          kicker="FAQ"
          title="Common questions"
          subtitle="Clear expectations = better outcomes."
        />

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-900">
                  {f.q}
                </span>
                <span className="text-slate-400 group-open:rotate-45 transition">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-balance text-2xl font-semibold text-emerald-950 sm:text-3xl">
                Ready to get your policy sorted?
              </h2>
              <p className="mt-2 text-sm text-emerald-950/80">
                Generate a clear baseline in minutes, then roll it out with the staff guide and quiz.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
              <Link
                href="/wizard"
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:w-auto"
              >
                Generate my policy
              </Link>
              <Link
                href="/quiz"
                className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-emerald-100/30 sm:w-auto"
              >
                Take the quiz
              </Link>
            </div>
          </div>

          <p className="mt-5 text-xs text-emerald-950/70">
            Not legal advice. Templates + guidance only.
          </p>
        </div>

        <footer className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-8 text-xs text-slate-500 sm:flex-row">
          <div>© {new Date().getFullYear()} PolicySprint</div>
          <div className="flex items-center gap-4">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </div>
        </footer>
      </section>
    </main>
  );
}
