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

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-50">Policies</h1>
          <p className="text-sm text-slate-300 mt-1">
            Click a policy to view, edit, duplicate, delete, or export.
          </p>

          {showSignedInAs && userEmail ? (
            <p className="text-xs text-slate-400 mt-1">
              Signed in as{" "}
              <span className="font-semibold text-slate-200">{userEmail}</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Link
            href={basePath}
            prefetch={false}
            className="rounded border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-900/60 transition"
          >
            Refresh
          </Link>

          <Link
            href="/?demo=1"
            className="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
          >
            New policy
          </Link>
        </div>
      </header>

      {showEmpty ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Welcome
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-50">
                Create your first policy
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                Generate a policy in minutes. You can edit it, save versions, restore snapshots, and export a PDF.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/?demo=1"
                className="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
              >
                Generate a policy
              </Link>

              <Link
                href={basePath}
                prefetch={false}
                className="rounded border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-900/60 transition"
              >
                Refresh
              </Link>
            </div>

            <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-sm font-semibold text-slate-50">What happens next?</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-300 list-disc pl-5">
                <li>Generate a policy from the wizard</li>
                <li>Save it to your dashboard</li>
                <li>Edit later and restore from version history</li>
                <li>Export a PDF when ready</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {policies.map((p) => (
            <li key={p.id}>
              <Link
                href={`${basePath}/${p.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-medium text-slate-900">{p.title || "AI Use Policy"}</h3>

                  <span className="text-xs text-slate-500">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : ""}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-1">{formatMeta(p) || "—"}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
