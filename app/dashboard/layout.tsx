// app/dashboard/layout.tsx
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { doSignOut } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

  // Middleware should already protect /dashboard, but keep a server-side guard too.
  if (!userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/dashboard")}`);
  }

  const email = typeof session?.user?.email === "string" ? session.user.email : null;

  const card = "rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur p-4 shadow-sm";
  const navOn =
    "block rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-900/60";
  const navOff =
    "block rounded-xl border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900/50";
  const subtle = "text-xs text-slate-400";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-50 text-[11px] font-semibold text-slate-950">
              PS
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                PolicySprint AI
              </div>
              <div className="text-[13px] font-medium text-slate-100">Dashboard</div>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-400">
            {email ? (
              <div>
                Signed in as <span className="text-slate-200">{email}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          {/* Sidebar */}
          <aside className="md:w-72">
            <div className={card}>
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-50">Your workspace</h2>
                  <span className="rounded-full border border-emerald-900/40 bg-emerald-950/20 px-2 py-0.5 text-[10px] text-emerald-200">
                    Pro ready
                  </span>
                </div>
                <p className={`mt-1 ${subtle}`}>
                  Manage saved policies, downloads, and account settings.
                </p>
              </div>

              <nav className="space-y-2">
                <Link href="/dashboard/policies" className={navOn}>
                  Policies
                </Link>

                <Link href="/dashboard/settings" className={navOff}>
                  Settings
                </Link>

                <Link
                  href="/wizard"
                  className="block rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-950/30"
                >
                  + Generate new policy
                </Link>
              </nav>

              <div className="mt-4 border-t border-slate-800 pt-4">
                <form action={doSignOut}>
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/30 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900/60"
                    title="Sign out"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/30 p-4 text-[11px] text-slate-300">
              <div className="font-semibold text-slate-100 mb-1">Tip</div>
              <div className="text-slate-300">
                The fastest flow is: <span className="text-slate-100">Generate → Preview → Save</span>. Upgrade when
                you’re ready to download PDFs and quizzes.
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
