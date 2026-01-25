// app/policies/page.tsx
import PoliciesListPage from "@/app/components/PoliciesListPage";

export default async function PoliciesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <PoliciesListPage basePath="/policies" showSignedInAs />
      </div>
    </main>
  );
}
