// app/policies/page.tsx
import Link from "next/link";

import PoliciesListPage from "@/app/components/PoliciesListPage";
import { doSignOut } from "./actions";

export default async function PoliciesPage() {
  const btnSecondary =
    "inline-flex items-center justify-center rounded-full border border-slate-600 px-4 py-2 text-[11px] text-slate-100 hover:bg-slate-900/60 disabled:opacity-60";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        {/* Top bar (Wizard-style) */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-50 text-[11px] font-semibold text-slate-950">
              PS
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                PolicySprint AI
              </div>
              <div className="text-[13px] font-medium text-slate-100">
                Saved policies
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/wizard" className={btnSecondary}>
              Wizard
            </Link>
            <Link href="/quiz" className={btnSecondary}>
              Quiz
            </Link>

            <form action={doSignOut}>
              <button type="submit" className={btnSecondary} title="Sign out">
                Sign out
              </button>
            </form>
          </div>
        </div>

        <PoliciesListPage basePath="/policies" showSignedInAs />
      </div>
    </main>
  );
}
