"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const token = useMemo(() => sp.get("token") || "", [sp]);

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          (json && json?.error?.message) || "Could not reset password. Try again."
        );
        return;
      }

      setDone(true);
      setTimeout(() => {
        router.push("/login");
      }, 800);
    } catch {
      setError("Could not reset password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="uppercase text-[11px] font-semibold tracking-[0.14em] text-slate-400">
            PolicySprint AI
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-50">Reset password</h1>
          <p className="mt-1 text-sm text-slate-300">Choose a new password.</p>
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

          {!token ? (
            <div className="mb-4 rounded-xl border border-yellow-900/40 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-200">
              Missing reset token. Please request a new link.
            </div>
          ) : null}

          {done ? (
            <div className="mb-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">
              Password updated. Redirecting to sign in…
            </div>
          ) : null}

          <label className="block">
            <span className="block text-sm font-medium text-slate-200 mb-1">
              New password
            </span>
            <input
              type="password"
              required
              disabled={!token || done}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 focus:border-emerald-400/70 disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-slate-500">Minimum 8 characters.</p>
          </label>

          <button
            type="submit"
            disabled={loading || done || !token}
            className="mt-4 w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? "Saving…" : "Reset password"}
          </button>

          <div className="mt-4 text-sm text-slate-300">
            Back to{" "}
            <Link href="/login" className="text-emerald-300 font-semibold hover:underline">
              sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
