// app/dashboard/settings/page.tsx
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

  const card = "rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur p-6 shadow-sm";
  const subCard = "rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-3";
  const label = "text-xs text-slate-400";
  const value = "mt-1 text-sm text-slate-100";
  const mono = "mt-1 text-sm font-mono text-slate-100";

  return (
    <div className={card}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        Settings
      </p>

      <h1 className="mt-2 text-2xl font-semibold text-slate-50">Account</h1>
      <p className="mt-1 text-sm text-slate-300">
        Manage your account details. We’ll add profile/org fields here next.
      </p>

      <div className="mt-6 grid gap-3">
        <div className={subCard}>
          <p className={label}>User ID</p>
          <p className={mono}>{userId}</p>
        </div>

        <div className={subCard}>
          <p className={label}>Email</p>
          <p className={value}>{email ?? "—"}</p>
        </div>

        <div className={subCard}>
          <p className={label}>Name</p>
          <p className={value}>{name ?? "—"}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-[11px] text-emerald-200">
        <div className="font-semibold mb-1">Next</div>
        <div className="text-slate-200/90">
          Add org name, team size, and default policy settings — so the wizard can pre-fill values automatically.
        </div>
      </div>
    </div>
  );
}
