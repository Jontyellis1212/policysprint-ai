import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* Logo / brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-xs font-bold text-slate-950">
            PS
          </span>
          <span className="text-sm sm:text-base font-semibold text-slate-50">
            PolicySprint AI
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-5 text-xs sm:text-sm text-slate-300">
          <Link
            href="/"
            className="hover:text-emerald-300 transition"
          >
            Generator
          </Link>
          <Link
            href="/staff-guide"
            className="hover:text-emerald-300 transition"
          >
            Staff guide
          </Link>
          <Link
            href="/pricing"
            className="hover:text-emerald-300 transition"
          >
            Pricing
          </Link>
          <Link
            href="/?demo=1"
            className="hidden sm:inline-flex rounded-full border border-emerald-400/70 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:border-emerald-300 hover:text-emerald-100 transition"
          >
            Live demo
          </Link>
        </nav>
      </div>
    </header>
  );
}
