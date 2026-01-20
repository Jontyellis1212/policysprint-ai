import { Suspense } from "react";

export const dynamic = "force-dynamic";

import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="h-4 w-36 bg-slate-800 animate-pulse rounded" />
            <div className="mt-4 h-10 w-full bg-slate-800 animate-pulse rounded" />
            <div className="mt-3 h-10 w-full bg-slate-800 animate-pulse rounded" />
            <div className="mt-4 h-10 w-full bg-slate-800 animate-pulse rounded" />
          </div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
