"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:border-slate-500 hover:text-white transition"
    >
      Sign out
    </button>
  );
}
