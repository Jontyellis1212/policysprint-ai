// app/components/HeaderClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SignOutButton from "./SignOutButton";

type Props = {
  isAuthed: boolean;
};

export default function HeaderClient({ isAuthed }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const generatorHref = isAuthed ? "/wizard" : "/";

  const close = () => setOpen(false);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Prevent background scroll while open (mobile drawer)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close if click/tap outside the panel
  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = panelRef.current;
      if (!el) return;
      const target = e.target as Node;
      if (!el.contains(target)) close();
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:py-6">
        {/* Logo / brand */}
        <Link href="/" className="flex items-center shrink-0" onClick={close}>
          <span className="relative h-10 w-44 sm:h-12 sm:w-60 md:h-12 md:w-[360px] lg:w-[400px]">
            <Image
              src="/branding/logo/policysprint-mono-white.png"
              alt="PolicySprint AI"
              fill
              priority
              className="object-contain"
            />
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-200">
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
            className="hidden lg:inline-flex rounded-full border border-emerald-400/90 px-4 py-2 text-sm font-medium text-emerald-100 hover:border-emerald-300 hover:text-emerald-50 transition"
          >
            Live demo
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-950/40 text-slate-100 hover:border-slate-500 hover:bg-slate-900/40 transition"
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
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
        </div>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="absolute inset-0 bg-black/45"
          />

          {/* Panel */}
          <div
            ref={panelRef}
            className="absolute right-3 top-3 w-[calc(100vw-24px)] max-w-sm overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="text-sm font-semibold text-slate-100">Menu</div>
              <div className="flex items-center gap-2">
                <Link
                  href="/?demo=1"
                  onClick={close}
                  className="inline-flex rounded-full border border-emerald-400/90 px-3 py-1.5 text-[11px] font-medium text-emerald-100 hover:border-emerald-300 hover:text-emerald-50 transition"
                >
                  Live demo
                </Link>

                <button
                  type="button"
                  onClick={close}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-950/40 text-slate-100 hover:border-slate-500 hover:bg-slate-900/40 transition"
                  aria-label="Close menu"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <nav className="px-2 py-2">
              <Link
                href={generatorHref}
                onClick={close}
                className="block rounded-xl px-3 py-3 text-sm text-slate-100 hover:bg-slate-900/50"
              >
                Generator
              </Link>

              {isAuthed ? (
                <>
                  <Link
                    href="/policies"
                    onClick={close}
                    className="block rounded-xl px-3 py-3 text-sm text-slate-100 hover:bg-slate-900/50"
                  >
                    Policies
                  </Link>

                  <Link
                    href="/quiz"
                    onClick={close}
                    className="block rounded-xl px-3 py-3 text-sm text-slate-100 hover:bg-slate-900/50"
                  >
                    Quiz
                  </Link>
                </>
              ) : null}

              <Link
                href="/staff-guide"
                onClick={close}
                className="block rounded-xl px-3 py-3 text-sm text-slate-100 hover:bg-slate-900/50"
              >
                Staff guide
              </Link>

              <Link
                href="/pricing"
                onClick={close}
                className="block rounded-xl px-3 py-3 text-sm text-slate-100 hover:bg-slate-900/50"
              >
                Pricing
              </Link>

              <div className="mt-2 border-t border-slate-800 pt-2 px-1">
                {isAuthed ? (
                  <div className="flex items-center justify-between rounded-xl px-2 py-2">
                    <span className="text-[11px] text-slate-400">Signed in</span>
                    <SignOutButton />
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={close}
                    className="block w-full rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3 text-center text-sm font-medium text-slate-100 hover:border-slate-500 hover:bg-slate-900/40 transition"
                  >
                    Log in
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
