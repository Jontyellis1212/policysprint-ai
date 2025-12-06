// app/components/EmailButton.tsx
"use client";

import { useEffect, useState } from "react";

type EmailButtonProps = {
  subject: string;
  getBody: () => string;
  variant?: "light" | "dark";
  label?: string;
};

const EMAIL_STORAGE_KEY = "policysprint:email";

export default function EmailButton({
  subject,
  getBody,
  variant = "light",
  label = "Email this to me",
}: EmailButtonProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(EMAIL_STORAGE_KEY);
      if (stored && stored.includes("@")) {
        setEmail(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const isDark = variant === "dark";

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();

    const body = getBody().trim();
    if (!body) {
      setStatus("error");
      setErrorMessage("There is nothing to email yet.");
      return;
    }

    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("sending");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject,
          body,
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to send email.");
      }

      // Save email for next time
      if (typeof window !== "undefined") {
        window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
      }

      setStatus("sent");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err: any) {
      console.error("Email send error:", err);
      setStatus("error");
      setErrorMessage(
        err?.message || "Something went wrong while sending the email."
      );
      setTimeout(() => setStatus("idle"), 2500);
    }
  }

  const inputClasses = isDark
    ? "w-full rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-[11px] text-slate-50 placeholder:text-slate-500 outline-none focus:border-sky-400"
    : "w-full rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-slate-900";

  const buttonClasses = isDark
    ? "inline-flex items-center justify-center rounded-full border border-sky-400 px-3 py-1.5 text-[11px] font-medium text-sky-100 hover:border-sky-300 disabled:opacity-60"
    : "inline-flex items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-slate-800 disabled:opacity-60";

  return (
    <form onSubmit={handleSend} className="space-y-1">
      <div className="flex gap-2 items-center">
        <input
          type="email"
          className={inputClasses}
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className={buttonClasses}
        >
          {status === "sending"
            ? "Sending…"
            : status === "sent"
            ? "Sent!"
            : label}
        </button>
      </div>
      {errorMessage && status === "error" && (
        <p
          className={`text-[10px] ${
            isDark ? "text-rose-300" : "text-rose-600"
          }`}
        >
          {errorMessage}
        </p>
      )}
      {status === "sent" && !errorMessage && (
        <p
          className={`text-[10px] ${
            isDark ? "text-emerald-300" : "text-emerald-600"
          }`}
        >
          Email sent via PolicySprint.
        </p>
      )}
    </form>
  );
}
