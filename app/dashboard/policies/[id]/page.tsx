import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PolicyDetailClient from "@/app/policies/[id]/PolicyDetailClient";

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

export default async function DashboardPolicyDetailPage({
  params,
}: {
  // Next 16 + Turbopack: params may be a Promise
  params: Promise<{ id: string }>;
}) {
  const { id: policyId } = await params;

  if (!policyId) {
    redirect("/dashboard/policies");
  }

  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/dashboard/policies/${policyId}`)}`);
  }

  // Policy must exist and be owned by current user
  const exists = await prisma.policy.findUnique({
    where: { id: policyId },
    select: { userId: true },
  });

  if (!exists) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Policy not found</h1>
        <p className="mt-2 text-sm text-slate-700">
          This policy doesn’t exist, or it may have been deleted.
        </p>
        <div className="mt-6">
          <a
            href="/dashboard/policies"
            className="inline-flex px-4 py-2 rounded border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
          >
            ← Back to policies
          </a>
        </div>
      </div>
    );
  }

  if (exists.userId !== userId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">No access</h1>
        <p className="mt-2 text-sm text-slate-700">
          You’re signed in, but you don’t have access to this policy.
        </p>
        <div className="mt-6">
          <a
            href="/dashboard/policies"
            className="inline-flex px-4 py-2 rounded border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
          >
            ← Back to policies
          </a>
        </div>
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-700">We couldn’t load this policy.</p>
      </div>
    );
  }

  const versions = await prisma.policyVersion.findMany({
    where: { policyId: policy.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, policyId: true, version: true, content: true, createdAt: true },
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

  return <PolicyDetailClient policy={policyDto} versions={versionsDto} basePath="/dashboard/policies" />;
}
