import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardSettingsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/dashboard/settings")}`);
  }

  const email = typeof session?.user?.email === "string" ? session.user.email : null;
  const name = typeof session?.user?.name === "string" ? session.user.name : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        Settings
      </p>

      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Account</h1>
      <p className="mt-1 text-sm text-slate-600">
        This is a protected dashboard page. We’ll add profile/org fields here next.
      </p>

      <div className="mt-6 grid gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">User ID</p>
          <p className="mt-1 text-sm font-mono text-slate-900">{userId}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">Email</p>
          <p className="mt-1 text-sm text-slate-900">{email ?? "—"}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">Name</p>
          <p className="mt-1 text-sm text-slate-900">{name ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}
