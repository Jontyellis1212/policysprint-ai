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

  const userEmail =
    typeof session?.user?.email === "string" ? session.user.email : null;

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
          <h1 className="text-3xl font-semibold text-slate-900">Policies</h1>
          <p className="mt-1 text-sm text-slate-600">
            Click a policy to view, edit, duplicate, delete, or export.
          </p>

          {showSignedInAs && userEmail ? (
            <p className="mt-1 text-xs text-slate-500">
              Signed in as{" "}
              <span className="font-semibold text-slate-700">{userEmail}</span>
            </p>
          ) : null}
        </div>

        {/* Only show header actions when there are policies.
            On empty state, the card owns the CTAs to avoid duplication. */}
        {!showEmpty ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={basePath}
              prefetch={false}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Refresh
            </Link>

            <Link
              href="/?demo=1"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              New policy
            </Link>
          </div>
        ) : null}
      </header>

      {showEmpty ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Welcome
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Create your first policy
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Generate a policy in minutes. You can edit it, save versions,
            restore snapshots, and export a professional PDF when ready.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/?demo=1"
              className="inline-flex items-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition"
            >
              Generate a policy
            </Link>

            <Link
              href={basePath}
              prefetch={false}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Refresh
            </Link>
          </div>

          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">
              What happens next?
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
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
              <Link
                href={`${basePath}/${p.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-medium text-slate-900">
                    {p.title || "AI Use Policy"}
                  </h3>

                  <span className="text-xs text-slate-500">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : ""}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {formatMeta(p) || "—"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
