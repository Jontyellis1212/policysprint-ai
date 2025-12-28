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

export default function RegisterPage() {
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

      const json = (await res.json().catch(() => null)) as ApiResponse<{ id: string; email: string }> | null;

      if (!res.ok) {
        const msg =
          (json && !isOk(json) && typeof (json as any)?.error === "string" && (json as any).error) ||
          (json && !isOk(json) && typeof (json as any)?.error?.message === "string" && (json as any).error.message) ||
          (res.status === 409 ? "An account with this email already exists." : "Failed to create account.");

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Create account</h1>
        <p className="text-sm text-slate-600 mb-4">Start generating and exporting AI policies in minutes.</p>

        {error ? <div className="mb-3 text-sm text-red-600">{error}</div> : null}

        <div className="space-y-3">
          <label className="block">
            <span className="block text-sm text-slate-700 mb-1">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="block text-sm text-slate-700 mb-1">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              autoComplete="new-password"
              minLength={8}
            />
            <p className="mt-1 text-xs text-slate-500">Minimum 8 characters.</p>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create account"}
        </button>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="text-slate-900 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
