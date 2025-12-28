// app/policies/[id]/loading.tsx
export default function PolicyDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="space-y-4">
          <div className="h-3 w-40 bg-slate-200 animate-pulse rounded" />
          <div className="h-8 w-80 bg-slate-200 animate-pulse rounded" />
          <div className="h-4 w-96 bg-slate-200 animate-pulse rounded" />
          <div className="h-3 w-72 bg-slate-200 animate-pulse rounded" />

          <div className="mt-6 h-10 w-full bg-slate-200 animate-pulse rounded" />
          <div className="h-64 w-full bg-slate-200 animate-pulse rounded" />

          <div className="mt-6 h-6 w-44 bg-slate-200 animate-pulse rounded" />
          <div className="h-24 w-full bg-slate-200 animate-pulse rounded" />
        </div>
      </main>
    </div>
  );
}
