import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-12">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full border border-slate-500 flex items-center justify-center text-xs font-bold">
              PS
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold">PolicySprint AI</span>
              <span className="text-[11px] text-slate-400">
                AI policy in minutes, not months
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400">
            Early MVP · Not legal advice
          </span>
        </header>

        <section className="space-y-6">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-50">
            Spin up an AI Use Policy for your business in a few clicks.
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl">
            PolicySprint AI asks a few questions about your business, risk appetite and
            tools you actually use, then drafts a tailored AI Use Policy you can review
            with your lawyer and roll out to staff.
          </p>

          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/wizard"
              className="inline-flex items-center justify-center rounded-full bg-slate-50 px-5 py-2 font-medium text-slate-950 hover:bg-slate-200"
            >
              Start from scratch
            </Link>
            <Link
              href="/wizard?demo=1"
              className="inline-flex items-center justify-center rounded-full border border-slate-500 px-5 py-2 text-slate-100 hover:bg-slate-900/60 text-sm"
            >
              See example policy
            </Link>
          </div>

          <div className="mt-4 grid gap-3 text-[11px] md:grid-cols-3 text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="font-medium text-slate-100 mb-1">
                Built for small teams
              </div>
              <p>
                Clinics, agencies, trades, internal teams — anywhere staff are already
                using AI tools and you need some basic guardrails in place.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="font-medium text-slate-100 mb-1">
                Quick, not perfect
              </div>
              <p>
                Generates a first draft you can tweak, brand and review with a lawyer.
                Better than “we&apos;ll get to that policy one day”.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="font-medium text-slate-100 mb-1">
                PDF-ready output
              </div>
              <p>
                Copy, print or save as PDF in one click from the outputs screen once your
                draft looks right.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-10 text-[11px] text-slate-500">
          PolicySprint AI is an experiment and does not provide legal advice. Always
          have a qualified lawyer review any policy before use.
        </footer>
      </div>
    </main>
  );
}
