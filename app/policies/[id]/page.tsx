import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PolicyDetailClient from "./PolicyDetailClient";

type PolicyDTO = {
  id: string;
  title: string | null;
  businessName: string | null;
  industry: string | null;
  country: string | null;
  organizationId: string | null;
  content: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

type PolicyVersionDTO = {
  id: string;
  policyId: string;
  version: number;
  content: string;
  createdAt: string;
};

export default async function PolicyDetailPage({
  params,
}: {
  // Next 16 can treat params as a Promise in RSC.
  params: Promise<{ id?: string }> | { id?: string };
}) {
  const resolvedParams = (await Promise.resolve(params)) as { id?: string };
  const policyId = typeof resolvedParams?.id === "string" ? resolvedParams.id : undefined;

  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    const cb = policyId ? `/policies/${encodeURIComponent(policyId)}` : "/policies";
    redirect(`/login?callbackUrl=${encodeURIComponent(cb)}`);
  }

  if (!policyId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-4xl px-4 py-10">
          <p className="uppercase text-xs font-semibold text-slate-500 tracking-[0.14em]">PolicySprint AI</p>
          <h1 className="text-2xl font-semibold text-slate-900 mt-2">Invalid link</h1>
          <p className="text-sm text-slate-700 mt-2">
            This policy link is missing an ID. Go back to your policies and open one from the list.
          </p>
        </main>
      </div>
    );
  }

  // Check if policy exists at all (to show a true forbidden vs not-found)
  const exists = await prisma.policy.findUnique({
    where: { id: policyId },
    select: { userId: true },
  });

  if (!exists) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-4xl px-4 py-10">
          <p className="uppercase text-xs font-semibold text-slate-500 tracking-[0.14em]">PolicySprint AI</p>
          <h1 className="text-2xl font-semibold text-slate-900 mt-2">Policy not found</h1>
          <p className="text-sm text-slate-700 mt-2">This policy doesn’t exist, or it may have been deleted.</p>
          <div className="mt-6">
            <a
              href="/policies"
              className="inline-flex px-4 py-2 rounded border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
            >
              ← Back to policies
            </a>
          </div>
        </main>
      </div>
    );
  }

  if (exists.userId !== userId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-4xl px-4 py-10">
          <p className="uppercase text-xs font-semibold text-slate-500 tracking-[0.14em]">PolicySprint AI</p>
          <h1 className="text-2xl font-semibold text-slate-900 mt-2">No access</h1>
          <p className="text-sm text-slate-700 mt-2">You’re signed in, but you don’t have access to this policy.</p>
          <div className="mt-6">
            <a
              href="/policies"
              className="inline-flex px-4 py-2 rounded border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
            >
              ← Back to policies
            </a>
          </div>
        </main>
      </div>
    );
  }

  const policy = await prisma.policy.findFirst({
    where: { id: policyId, userId },
    select: {
      id: true,
      title: true,
      businessName: true,
      industry: true,
      country: true,
      organizationId: true,
      content: true,
      version: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!policy) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-4xl px-4 py-10">
          <p className="uppercase text-xs font-semibold text-slate-500 tracking-[0.14em]">PolicySprint AI</p>
          <h1 className="text-2xl font-semibold text-slate-900 mt-2">Something went wrong</h1>
          <p className="text-sm text-slate-700 mt-2">We couldn’t load this policy.</p>
          <div className="mt-6">
            <a
              href="/policies"
              className="inline-flex px-4 py-2 rounded border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
            >
              ← Back to policies
            </a>
          </div>
        </main>
      </div>
    );
  }

  const versions = await prisma.policyVersion.findMany({
    where: { policyId: policy.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      policyId: true,
      version: true,
      content: true,
      createdAt: true,
    },
  });

  const policyDto: PolicyDTO = {
    ...policy,
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString(),
  };

  const versionsDto: PolicyVersionDTO[] = versions.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  }));

  return <PolicyDetailClient policy={policyDto} versions={versionsDto} />;
}
