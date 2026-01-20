import Link from "next/link";

export const dynamic = "force-dynamic";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/40 px-2.5 py-1 text-xs text-slate-200">
      {children}
    </span>
  );
}

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string; status?: string };
}) {
  const token = typeof searchParams?.token === "string" ? searchParams.token : "";
  const status = typeof searchParams?.status === "string" ? searchParams.status : "";

  const shouldAutoConfirm = Boolean(token);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="uppercase text-[11px] font-semibold tracking-[0.14em] text-slate-400">
            PolicySprint AI
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-50">Email verification</h1>
          <p className="mt-1 text-sm text-slate-300">
            Verify your email to unlock downloads.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur p-6 shadow-sm">
          {shouldAutoConfirm ? (
            <>
              <Badge>Verifying…</Badge>
              <p className="mt-3 text-sm text-slate-300">
                Hang tight — we’re confirming your link.
              </p>

              {/* Server redirect confirm */}
              <meta httpEquiv="refresh" content={`0; url=/api/email/verify/confirm?token=${encodeURIComponent(token)}`} />
            </>
          ) : status === "success" ? (
            <>
              <Badge>Verified</Badge>
              <p className="mt-3 text-sm text-slate-300">
                Your email is verified. You can now download premium outputs (subject to plan).
              </p>
              <div className="mt-4 flex gap-3">
                <Link
                  href="/login"
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Sign in
                </Link>
                <Link
                  href="/dashboard/policies"
                  className="rounded-lg border border-slate-700 bg-slate-950/40 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900/40"
                >
                  Go to dashboard
                </Link>
              </div>
            </>
          ) : status === "expired" ? (
            <>
              <Badge>Expired</Badge>
              <p className="mt-3 text-sm text-slate-300">
                That verification link has expired. Please request a new one from inside the app.
              </p>
              <div className="mt-4">
                <Link
                  href="/login"
                  className="text-emerald-300 font-semibold hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </>
          ) : status === "invalid" ? (
            <>
              <Badge>Invalid link</Badge>
              <p className="mt-3 text-sm text-slate-300">
                That verification link is invalid or already used.
              </p>
              <div className="mt-4">
                <Link
                  href="/login"
                  className="text-emerald-300 font-semibold hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </>
          ) : status === "missing" ? (
            <>
              <Badge>Missing token</Badge>
              <p className="mt-3 text-sm text-slate-300">
                The verification token is missing.
              </p>
              <div className="mt-4">
                <Link
                  href="/login"
                  className="text-emerald-300 font-semibold hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </>
          ) : (
            <>
              <Badge>Check your inbox</Badge>
              <p className="mt-3 text-sm text-slate-300">
                If you just signed up, we sent a verification email. Open it and click verify.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Tip: check spam/junk folders.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
