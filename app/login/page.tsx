"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/policies";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (!res) {
      setError("Login failed.");
      return;
    }

    if (res.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        {/* Brand hint */}
        <div className="mb-6 text-center">
          <p className="uppercase text-[11px] font-semibold tracking-[0.14em] text-slate-400">
            PolicySprint AI
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-50">Sign in</h1>
          <p className="mt-1 text-sm text-slate-300">
            Welcome back — continue to your policies.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur p-6 shadow-sm"
        >
          {error ? (
            <div className="mb-4 rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="space-y-3">
            <label className="block">
              <span className="block text-sm font-medium text-slate-200 mb-1">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 focus:border-emerald-400/70"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-slate-200 mb-1">
                Password
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 focus:border-emerald-400/70"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="mt-4 text-sm text-slate-300">
            Don’t have an account?{" "}
            <Link
              href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-emerald-300 font-semibold hover:underline"
            >
              Create one
            </Link>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          By continuing, you agree to use PolicySprint AI responsibly.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // Required by Next 16 when using useSearchParams in the tree
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="h-4 w-28 bg-slate-800 animate-pulse rounded" />
            <div className="mt-4 h-10 w-full bg-slate-800 animate-pulse rounded" />
            <div className="mt-3 h-10 w-full bg-slate-800 animate-pulse rounded" />
            <div className="mt-4 h-10 w-full bg-slate-800 animate-pulse rounded" />
          </div>
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
