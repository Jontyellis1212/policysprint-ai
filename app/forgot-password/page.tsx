"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Always show success message even if not found
      if (!res.ok) {
        setError("Could not send reset email. Please try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Could not send reset email. Please try again.");
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
          <h1 className="mt-2 text-2xl font-semibold text-slate-50">Forgot password</h1>
          <p className="mt-1 text-sm text-slate-300">
            We’ll email you a reset link.
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

          {sent ? (
            <div className="mb-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">
              If an account exists for that email, we sent a reset link. Check your inbox.
            </div>
          ) : null}

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

          <button
            type="submit"
            disabled={loading || sent}
            className="mt-4 w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? "Sending…" : sent ? "Sent" : "Send reset link"}
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
