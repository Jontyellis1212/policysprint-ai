import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* Logo / Title */}
        <Link href="/" className="text-lg font-semibold text-slate-100">
          PolicySprint AI
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-6 text-sm text-slate-300">
          <Link
            href="/pricing"
            className="hover:text-emerald-300 transition"
          >
            Pricing
          </Link>
          <Link
            href="/?demo=1"
            className="hover:text-emerald-300 transition"
          >
            Demo
          </Link>
        </nav>
      </div>
    </header>
  );
}
