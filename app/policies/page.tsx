import PoliciesListPage from "@/app/components/PoliciesListPage";
import { doSignOut } from "./actions";

export default async function PoliciesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex justify-end mb-4">
        <form action={doSignOut}>
          <button
            type="submit"
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            title="Sign out"
          >
            Sign out
          </button>
        </form>
      </div>

      <PoliciesListPage basePath="/policies" showSignedInAs />
    </main>
  );
}
