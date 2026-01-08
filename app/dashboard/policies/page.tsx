import PoliciesListPage from "@/app/components/PoliciesListPage";
import StripeSuccessRefresh from "./StripeSuccessRefresh";

export default async function DashboardPoliciesPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Handles Stripe success → session refresh */}
      <StripeSuccessRefresh />

      <PoliciesListPage basePath="/dashboard/policies" showSignedInAs={false} />
    </div>
  );
}
