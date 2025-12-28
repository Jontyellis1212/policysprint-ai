import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why PolicySprint AI exists",
  description:
    "Why we built PolicySprint AI — and why AI policies shouldn’t be slow, legal-heavy, or ignored.",
};

export default function WhyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* Eyebrow */}
        <p className="uppercase text-xs font-semibold tracking-[0.14em] text-slate-500">
          Why PolicySprint AI exists
        </p>

        {/* H1 */}
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
          AI policies are becoming mandatory.
          <br />
          <span className="text-slate-700">But the way they’re created is broken.</span>
        </h1>

        {/* Intro */}
        <p className="mt-6 text-lg leading-relaxed text-slate-700">
          Most businesses now use AI — whether it’s ChatGPT, internal copilots, automation tools,
          or AI-assisted decision making.
        </p>

        <p className="mt-4 text-lg leading-relaxed text-slate-700">
          Regulators, insurers, and enterprise customers are starting to ask the same question:
        </p>

        <p className="mt-4 text-lg font-medium text-slate-900">
          “Do you have an AI Use Policy?”
        </p>

        {/* Problem */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">
            The problem with traditional policies
          </h2>

          <ul className="mt-4 space-y-3 text-slate-700">
            <li>• They’re written by lawyers, not used by teams</li>
            <li>• They take weeks (or months) to produce</li>
            <li>• They’re generic, bloated, and outdated the moment AI changes</li>
            <li>• Most employees never read them</li>
          </ul>

          <p className="mt-4 text-slate-700">
            The result? Policies that exist purely to tick a box — not to actually guide how AI is
            used day to day.
          </p>
        </section>

        {/* Insight */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">
            What we realised
          </h2>

          <p className="mt-4 text-slate-700 leading-relaxed">
            AI governance shouldn’t be a legal exercise. It should be a practical one.
          </p>

          <p className="mt-4 text-slate-700 leading-relaxed">
            A good AI Use Policy should be:
          </p>

          <ul className="mt-4 space-y-3 text-slate-700">
            <li>• Clear enough that non-technical staff understand it</li>
            <li>• Specific to how <em>your</em> business actually uses AI</li>
            <li>• Easy to update as tools, risks, and regulations evolve</li>
            <li>• Simple to share with customers, auditors, and partners</li>
          </ul>
        </section>

        {/* Solution */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">
            Why we built PolicySprint AI
          </h2>

          <p className="mt-4 text-slate-700 leading-relaxed">
            We built PolicySprint AI to remove friction from AI compliance.
          </p>

          <p className="mt-4 text-slate-700 leading-relaxed">
            Instead of starting from a blank document or a legal template, you generate a policy
            that’s tailored to your business, your industry, and your jurisdiction — in minutes,
            not weeks.
          </p>

          <p className="mt-4 text-slate-700 leading-relaxed">
            You can version it, update it, restore previous drafts, and export a clean,
            professional PDF whenever you need to share it.
          </p>
        </section>

        {/* Positioning */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">
            What PolicySprint AI is — and isn’t
          </h2>

          <ul className="mt-4 space-y-3 text-slate-700">
            <li>• It’s not legal advice — it’s a practical compliance tool</li>
            <li>• It’s not a static document — it’s a living policy</li>
            <li>• It’s not built for lawyers — it’s built for operators</li>
          </ul>
        </section>

        {/* CTA */}
        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            If you’re already using AI, you need a policy.
          </h3>

          <p className="mt-2 text-slate-700">
            PolicySprint AI helps you create one that people actually understand — and actually use.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/?demo=1"
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Try the live demo
            </Link>

            <Link
              href="/pricing"
              className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View pricing
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
