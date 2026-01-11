import PoliciesListPage from "@/app/components/PoliciesListPage";
import StripeSuccessRefresh from "./StripeSuccessRefresh";

export default async function DashboardPoliciesPage() {
  return (
    <>
      {/* Handles Stripe success → DB sync + session refresh */}
      <StripeSuccessRefresh />

      {/* Let PoliciesListPage own the layout + styling */}
      <PoliciesListPage basePath="/dashboard/policies" showSignedInAs={false} />
    </>
  );
}
