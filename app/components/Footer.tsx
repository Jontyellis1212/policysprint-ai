import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} PolicySprint AI. Not legal advice. Use with your own judgment and legal review.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/pricing"
            className="hover:text-emerald-300 transition"
          >
            Pricing
          </Link>
          <Link
            href="mailto:hello@policysprint.ai?subject=PolicySprint%20AI%20enquiry"
            className="hover:text-emerald-300 transition"
          >
            Contact
          </Link>
          <span className="text-slate-500">
            Hosted on Vercel · Powered by OpenAI API
          </span>
        </div>
      </div>
    </footer>
  );
}
