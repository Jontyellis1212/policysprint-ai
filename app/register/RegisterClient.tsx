"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: any };
type ApiResponse<T> = ApiOk<T> | ApiErr;

function isOk<T>(v: any): v is ApiOk<T> {
  return v && typeof v === "object" && v.ok === true && "data" in v;
}

export default function RegisterClient() {
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

    try {
      // 1) Create account
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = (await res.json().catch(() => null)) as
        | ApiResponse<{ id: string; email: string }>
        | null;

      if (!res.ok) {
        const msg =
          (json &&
            !isOk(json) &&
            typeof (json as any)?.error === "string" &&
            (json as any).error) ||
          (json &&
            !isOk(json) &&
            typeof (json as any)?.error?.message === "string" &&
            (json as any).error.message) ||
          (res.status === 409
            ? "An account with this email already exists."
            : "Failed to create account.");

        setError(msg);
        return;
      }

      if (!json || !isOk(json)) {
        setError("Unexpected response creating account.");
        return;
      }

      // 2) Auto sign-in
      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!login || login.error) {
        setError("Account created, but auto sign-in failed. Please sign in.");
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      // 3) Go to app
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        {/* Brand hint */}
        <div className="mb-6 text-center">
          <p className="uppercase text-[11px] font-semibold tracking-[0.14em] text-slate-400">
            PolicySprint AI
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-50">
            Create account
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Create your account — then you’ll land in your policies.
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
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={8}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 focus:border-emerald-400/70"
              />
              <p className="mt-1 text-xs text-slate-500">
                Minimum 8 characters.
              </p>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>

          <div className="mt-4 text-sm text-slate-300">
            Already have an account?{" "}
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-emerald-300 font-semibold hover:underline"
            >
              Sign in
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
