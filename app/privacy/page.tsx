export const metadata = {
  title: "Privacy Policy | PolicySprint",
  description: "Privacy Policy for PolicySprint.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-[calc(100vh-80px)] bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-4xl px-6 py-14">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
            PolicySprint
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-300">
            This policy explains how PolicySprint collects, uses, and protects your
            information when you use our website and services.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-a:text-emerald-600 dark:prose-a:text-emerald-400">
            <p>
              PolicySprint ("we", "us", "our") is operated by <strong>Jonty Ellis</strong>{" "}
              as a sole trader in Australia.
            </p>

            <h2>Information we collect</h2>
            <p>We may collect personal information including:</p>
            <ul>
              <li>Name</li>
              <li>Email address</li>
              <li>Business name (if provided)</li>
              <li>Information you submit when generating a policy</li>
              <li>Usage data (via analytics tools)</li>
            </ul>

            <h2>How we use your information</h2>
            <ul>
              <li>To provide and improve the PolicySprint service</li>
              <li>To generate AI Use Policies</li>
              <li>To communicate with you about your account or requests</li>
              <li>
                To send updates, product information, and marketing emails (you can
                unsubscribe anytime)
              </li>
              <li>To measure advertising performance and improve our website</li>
            </ul>

            <h2>Analytics and tracking</h2>
            <p>We use third-party analytics and tracking tools, including:</p>
            <ul>
              <li>Meta (Facebook) Pixel</li>
              <li>PostHog analytics</li>
            </ul>
            <p>
              These tools may use cookies or similar technologies to help us understand
              website usage and advertising performance.
            </p>

            <h2>Payments</h2>
            <p>
              Payments are processed securely via <strong>Stripe</strong>. We do not store your
              full payment card details on our servers.
            </p>

            <h2>Marketing communications</h2>
            <p>
              If you submit your details, you may receive emails related to PolicySprint,
              including updates, educational content, and promotional material. You can
              unsubscribe at any time using the link in our emails.
            </p>

            <h2>Data storage and security</h2>
            <p>
              We take reasonable steps to protect your information. Data may be stored
              on secure third-party infrastructure providers used to run PolicySprint.
            </p>

            <h2>Your rights</h2>
            <p>
              You may request access to or correction of your personal information by
              contacting us.
            </p>

            <h2>Contact</h2>
            <p>
              For privacy-related enquiries, contact:
              <br />
              <a href="mailto:jonty@policysprint.ai">jonty@policysprint.ai</a>
            </p>

            <hr />

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Last updated: {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* Footer hint */}
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          Need this for Meta Lead Forms? Use:{" "}
          <span className="font-medium text-slate-700 dark:text-slate-200">
            https://policysprint.ai/privacy
          </span>
        </p>
      </div>
    </main>
  );
}
