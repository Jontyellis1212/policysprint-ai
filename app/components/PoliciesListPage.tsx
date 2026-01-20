// app/components/PoliciesListPage.tsx
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Policy = {
  id: string;
  title: string | null;
  businessName: string | null;
  industry: string | null;
  country: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
  version?: number | null;
};

function formatMeta(p: Policy) {
  const parts: string[] = [];
  if (p.businessName) parts.push(p.businessName);
  if (p.industry) parts.push(p.industry);
  if (p.country) parts.push(p.country);
  return parts.join(" · ");
}

function formatDate(d: Date) {
  try {
    return new Date(d).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

export default async function PoliciesListPage({
  basePath = "/policies",
  showSignedInAs = true,
}: {
  basePath?: "/policies" | "/dashboard/policies";
  showSignedInAs?: boolean;
}) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(basePath)}`);
  }

  const userEmail = typeof session?.user?.email === "string" ? session.user.email : null;

  const policies = (await prisma.policy.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      businessName: true,
      industry: true,
      country: true,
      createdAt: true,
      updatedAt: true,
      version: true,
    },
  })) as Policy[];

  const showEmpty = policies.length === 0;

  const pill =
    "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition";
  const pillNeutral = `${pill} border-slate-700 text-slate-100 hover:border-slate-500 hover:text-white`;
  const pillPrimary = `${pill} border-emerald-400/80 bg-emerald-950/20 text-emerald-200 hover:border-emerald-300 hover:bg-emerald-950/30`;
  const card = "rounded-2xl border border-slate-800 bg-slate-900/35 backdrop-blur p-6 shadow-sm";
  const listItem =
    "block rounded-xl border border-slate-800 bg-slate-950/30 backdrop-blur p-4 hover:border-slate-700 hover:bg-slate-950/45 transition";

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-50">Policies</h1>
          <p className="mt-1 text-sm text-slate-300">
            Click a policy to view, edit, duplicate, delete, or export.
          </p>

          {showSignedInAs && userEmail ? (
            <p className="mt-2 text-xs text-slate-400">
              Signed in as <span className="font-semibold text-slate-200">{userEmail}</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={basePath} prefetch={false} className={pillNeutral}>
            Refresh
          </Link>

          <Link href="/wizard" className={pillPrimary}>
            + New policy
          </Link>
        </div>
      </header>

      {showEmpty ? (
        <div className={card}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Welcome</p>

          <h2 className="mt-2 text-2xl font-semibold text-slate-50">Create your first policy</h2>

          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Generate a policy in minutes. Edit it, save versions, restore snapshots, and export a professional PDF when
            ready.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/wizard"
              className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300 transition"
            >
              Generate a policy
            </Link>

            <Link href={basePath} prefetch={false} className={pillNeutral + " px-5 py-2.5"}>
              Refresh
            </Link>
          </div>

          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/20 p-5">
            <p className="text-sm font-semibold text-slate-50">What happens next?</p>

            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-300">
              <li>Generate a policy from the wizard</li>
              <li>Save it to your dashboard</li>
              <li>Edit later and restore from version history</li>
              <li>Export a PDF when ready</li>
            </ul>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {policies.map((p) => (
            <li key={p.id}>
              <Link href={`${basePath}/${p.id}`} className={listItem}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-medium text-slate-50">{p.title || "AI Use Policy"}</h3>

                  <span className="text-xs text-slate-400">
                    {p.createdAt ? formatDate(p.createdAt) : ""}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-300">{formatMeta(p) || "—"}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
