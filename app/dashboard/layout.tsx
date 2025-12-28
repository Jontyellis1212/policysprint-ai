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

  const email =
    typeof session?.user?.email === "string" ? session.user.email : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          {/* Sidebar */}
          <aside className="md:w-64">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  PolicySprint AI
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Dashboard
                </h2>
                {email ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Signed in as{" "}
                    <span className="font-medium text-slate-700">{email}</span>
                  </p>
                ) : null}
              </div>

              <nav className="space-y-2">
                <Link
                  href="/dashboard/policies"
                  className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
                >
                  Policies
                </Link>

                <Link
                  href="/dashboard/settings"
                  className="block rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Settings
                </Link>
              </nav>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <form action={doSignOut}>
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    title="Sign out"
                  >
                    Sign out
                  </button>
                </form>
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
