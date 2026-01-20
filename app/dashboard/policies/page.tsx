// app/dashboard/policies/page.tsx
import PoliciesListPage from "@/app/components/PoliciesListPage";
import StripeSuccessRefresh from "./StripeSuccessRefresh";

export default async function DashboardPoliciesPage() {
  return (
    <>
      {/* Handles Stripe success → DB sync + session refresh */}
      <StripeSuccessRefresh />

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur p-6 shadow-sm">
        <PoliciesListPage basePath="/dashboard/policies" showSignedInAs={false} />
      </div>
    </>
  );
}
