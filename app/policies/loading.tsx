// app/policies/loading.tsx
export default function PoliciesLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-8 w-40 bg-slate-200 animate-pulse rounded" />
          <div className="mt-2 h-4 w-80 bg-slate-200 animate-pulse rounded" />
          <div className="mt-2 h-3 w-56 bg-slate-200 animate-pulse rounded" />
        </div>

        <div className="flex gap-2">
          <div className="h-10 w-24 bg-slate-200 animate-pulse rounded" />
          <div className="h-10 w-28 bg-slate-200 animate-pulse rounded" />
          <div className="h-10 w-24 bg-slate-200 animate-pulse rounded" />
        </div>
      </header>

      <ul className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="h-5 w-56 bg-slate-200 animate-pulse rounded" />
              <div className="h-3 w-24 bg-slate-200 animate-pulse rounded" />
            </div>
            <div className="mt-2 h-3 w-72 bg-slate-200 animate-pulse rounded" />
          </li>
        ))}
      </ul>
    </main>
  );
}
