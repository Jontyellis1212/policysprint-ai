"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type ApiErr = { ok?: boolean; error?: any };

function pickErrorMessage(v: any): string | null {
  if (!v || typeof v !== "object") return null;

  // { ok:false, error: "..." }
  if (typeof v.error === "string") return v.error;

  // { ok:false, error: { message: "..." } }
  if (v.error && typeof v.error.message === "string") return v.error.message;

  // { ok:false, error: { code, message } }
  if (v.error && typeof v.error.message === "string") return v.error.message;

  return null;
}

export default function ResetPasswordClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const token = sp.get("token") || "";
  const hasToken = token.trim().length > 0;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const passwordOk = useMemo(() => password.length >= 8, [password]);
  const matchOk = useMemo(() => password === confirm, [password, confirm]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!hasToken) {
      setError("Missing reset token. Please request a new password reset email.");
      return;
    }
    if (!passwordOk) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!matchOk) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const json = (await res.json().catch(() => null)) as ApiErr | null;

      if (!res.ok) {
        const msg =
          pickErrorMessage(json) ||
          (res.status === 400
            ? "That reset link is invalid or expired. Please request a new one."
            : "Failed to reset password.");
        setError(msg);
        return;
      }

      setDone(true);

      // take them to login shortly (keeps UX smooth)
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 800);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="uppercase text-[11px] font-semibold tracking-[0.14em] text-slate-400">
            PolicySprint AI
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-50">
            Reset password
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Choose a new password for your account.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur p-6 shadow-sm">
          {!hasToken ? (
            <div className="rounded-xl border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
              Missing reset token. Please{" "}
              <Link href="/forgot-password" className="font-semibold underline">
                request a new reset link
              </Link>
              .
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {done ? (
            <div className="mt-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">
              Password updated. Redirecting to sign in…
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <label className="block">
              <span className="block text-sm font-medium text-slate-200 mb-1">
                New password
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

            <label className="block">
              <span className="block text-sm font-medium text-slate-200 mb-1">
                Confirm password
              </span>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={8}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 focus:border-emerald-400/70"
              />
            </label>

            <button
              type="submit"
              disabled={loading || !hasToken}
              className="mt-2 w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? "Resetting…" : "Reset password"}
            </button>

            <div className="mt-3 text-sm text-slate-300">
              Remembered your password?{" "}
              <Link
                href="/login"
                className="text-emerald-300 font-semibold hover:underline"
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          If your link expired, request a new reset email.
        </div>
      </div>
    </div>
  );
}
