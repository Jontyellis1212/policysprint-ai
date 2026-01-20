import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import SignOutButton from "./SignOutButton";

export default async function Header() {
  const session = await auth();
  const isAuthed = !!session?.user;

  // If logged in, take them to the real app generator
  const generatorHref = isAuthed ? "/wizard" : "/";

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        {/* Logo / brand */}
        <Link href="/" className="flex items-center">
          <span className="relative h-12 w-[360px] sm:h-14 sm:w-[400px]">
            <Image
              src="/branding/logo/policysprint-mono-white.png"
              alt="PolicySprint AI"
              fill
              priority
              className="object-contain"
            />
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-6 text-sm text-slate-200">
          <Link href={generatorHref} className="hover:text-emerald-300 transition">
            Generator
          </Link>

          {isAuthed ? (
            <>
              <Link href="/policies" className="hover:text-emerald-300 transition">
                Policies
              </Link>

              <Link href="/quiz" className="hover:text-emerald-300 transition">
                Quiz
              </Link>
            </>
          ) : null}

          <Link href="/staff-guide" className="hover:text-emerald-300 transition">
            Staff guide
          </Link>

          <Link href="/pricing" className="hover:text-emerald-300 transition">
            Pricing
          </Link>

          <Link
            href="/?demo=1"
            className="hidden sm:inline-flex rounded-full border border-emerald-400/90 px-4 py-2 text-sm font-medium text-emerald-100 hover:border-emerald-300 hover:text-emerald-50 transition"
          >
            Live demo
          </Link>

          {/* Auth */}
          <div className="flex items-center gap-2">
            {isAuthed ? (
              <SignOutButton />
            ) : (
              <Link
                href="/login"
                className="inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:border-slate-500 hover:text-white transition"
              >
                Log in
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
