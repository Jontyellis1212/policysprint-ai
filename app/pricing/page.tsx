import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Pricing | PolicySprint AI",
  description: "Simple, transparent pricing for AI policy readiness.",
};

type Tier = {
  name: string;
  badge?: string;
  price: string;
  priceSub?: string;
  description: string;
  highlight: boolean;
  comingSoon: boolean;
  ctaLabel: string;
  ctaHref?: string;
  ctaVariant: "outline" | "primary";
  features: string[];
};

const tiers: Tier[] = [
  {
    name: "Pro",
    badge: "Founding rate",
    price: "$49",
    priceSub: "per month, per organisation",
    description:
      "Ongoing access to keep your AI policy current — regenerate, update staff guidance, and roll out training as AI evolves.",
    highlight: true,
    comingSoon: false,
    ctaLabel: "Get Pro access",
    ctaVariant: "primary",
    features: [
      "Official policy PDF download (no watermark)",
      "Edit & regenerate anytime",
      "Saved organisation profile",
      "Staff-facing AI Use Guide output",
      "Built-in AI awareness quiz generated from your policy",
      "Version history for policy updates",
      "Priority support & onboarding",
    ],
  },
  {
    name: "Starter",
    badge: "Try it first",
    price: "$0",
    priceSub: "free access",
    description:
      "Generate and preview your policy before rolling it out across your organisation.",
    highlight: false,
    comingSoon: false,
    ctaLabel: "Try the generator",
    ctaHref: "/",
    ctaVariant: "outline",
    features: [
      "AI Use Policy generator",
      "3-step wizard (business → risk → outputs)",
      "Preview your policy in the app",
      "Copy & paste content manually",
    ],
  },
];

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default async function PricingPage() {
  const session = await auth();
  const user = session?.user as any | undefined;
  const userId = user?.id as string | undefined;
  const userPlan = (user?.plan as string | undefined) ?? undefined;

  const planLabel =
    userPlan?.toLowerCase() === "pro" ? "Pro" : userId ? "Free" : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="max-w-3xl mx-auto text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-300">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live on Vercel · AI Use Policy generator
          </p>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
            Simple pricing for{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent">
              AI policy readiness
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Move from “we should really have an AI policy” to “it&apos;s already
            drafted, shared and embedded” in a single session.
          </p>

          <p className="mt-4 text-sm text-emerald-200">
            Founding customers lock in <span className="font-medium">$49/month</span>.
            Pricing will increase as features expand.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/?demo=1"
              className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-md hover:bg-emerald-400 transition"
            >
              Try the live demo
            </Link>

            <Link
              href="/"
              className="text-sm text-slate-300 underline-offset-4 hover:underline"
            >
              Back to generator
            </Link>

            {userId && (
              <form method="POST" action="/api/stripe/portal">
                <button
                  type="submit"
                  className="rounded-full border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-100 hover:border-slate-500 transition"
                >
                  Manage billing
                </button>
              </form>
            )}
          </div>

          {planLabel && (
            <div className="mt-4 flex items-center justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Current plan:{" "}
                <span className="font-medium text-slate-100">{planLabel}</span>
              </span>
            </div>
          )}

          <p className="mt-3 text-xs text-slate-400">
            Secure payments powered by Stripe. Cancel anytime in-app.
          </p>
        </section>

        {/* Pricing grid */}
        <section className="mt-12 md:mt-16">
          <div className="grid gap-6 md:grid-cols-2">
            {tiers.map((tier) => {
              const isPro = tier.name === "Pro";
              const isLoggedIn = !!userId;
              const isAlreadyPro = (userPlan ?? "").toLowerCase() === "pro";

              return (
                <div
                  key={tier.name}
                  className={classNames(
                    "flex flex-col rounded-2xl border bg-slate-900/60 p-5 sm:p-6 shadow-sm",
                    tier.highlight
                      ? "border-emerald-400/70 shadow-emerald-500/15 shadow-lg ring-1 ring-emerald-500/40"
                      : "border-slate-800"
                  )}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold">{tier.name}</h2>
                    {tier.badge && (
                      <span
                        className={classNames(
                          "rounded-full px-2.5 py-1 text-[11px] font-medium",
                          isPro
                            ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-200"
                        )}
                      >
                        {tier.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold sm:text-3xl">
                      {tier.price}
                    </span>
                    {tier.priceSub && (
                      <span className="text-xs text-slate-400">
                        {tier.priceSub}
                      </span>
                    )}
                  </div>

                  {/* Key reassurance near price (Pro only) */}
                  {isPro && !isAlreadyPro && (
                    <p className="mt-2 text-xs text-slate-300">
                      No contracts · Cancel anytime
                    </p>
                  )}

                  <p className="mt-3 text-sm text-slate-300">
                    {tier.description}
                  </p>

                  {tier.comingSoon && (
                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-amber-300/90">
                      Coming soon
                    </p>
                  )}

                  <div className="mt-5">
                    {isPro ? (
                      isAlreadyPro ? (
                        <div className="inline-flex w-full items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-200">
                          You&apos;re on Pro ✅
                        </div>
                      ) : isLoggedIn ? (
                        <form method="POST" action="/api/stripe/checkout">
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                          >
                            Get Pro access
                          </button>
                        </form>
                      ) : (
                        <Link
                          href="/login?callbackUrl=%2Fpricing"
                          className="inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                        >
                          Get Pro access
                        </Link>
                      )
                    ) : (
                      <Link
                        href={tier.ctaHref ?? "/"}
                        className={classNames(
                          "inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition",
                          tier.ctaVariant === "primary"
                            ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                            : "border border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-500"
                        )}
                      >
                        {tier.ctaLabel}
                      </Link>
                    )}
                  </div>

                  {isPro && !isAlreadyPro && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-slate-300">
                        Instant access. Cancel anytime in-app.
                      </p>
                      <p className="text-xs text-slate-400">
                        Download requires Pro — you&apos;ll confirm in Stripe
                        Checkout first.
                      </p>
                      <p className="text-xs text-slate-400">
                        {isLoggedIn
                          ? "After checkout, you’re upgraded immediately."
                          : "Log in (or create a free account) then you’ll go straight to Stripe Checkout."}
                      </p>
                    </div>
                  )}

                  <ul className="mt-5 space-y-2 text-sm text-slate-200">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-400">
              Need enterprise rollout or custom workflows?{" "}
              <a
                href="mailto:hello@policysprint.ai?subject=Enterprise%20enquiry"
                className="underline underline-offset-4 hover:text-slate-200"
              >
                Contact us
              </a>
              .
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14 md:mt-16 border-t border-slate-800 pt-10">
          <div className="grid gap-10 md:grid-cols-[1.1fr,2fr] md:items-start">
            <div>
              <h2 className="text-xl font-semibold">Pricing FAQ</h2>
              <p className="mt-2 text-sm text-slate-300">
                Pro is designed for teams rolling out AI usage with repeatable
                updates — not a one-off PDF.
              </p>
            </div>

            <div className="space-y-5 text-sm text-slate-200">
              <div>
                <h3 className="font-medium">What do I get with Pro?</h3>
                <p className="mt-1 text-slate-300">
                  Pro unlocks the official PDF download and gives you ongoing
                  access to edit, regenerate, and keep staff guidance and
                  training updated as AI evolves.
                </p>
              </div>

              <div>
                <h3 className="font-medium">Can I cancel anytime?</h3>
                <p className="mt-1 text-slate-300">
                  Yes — there are no contracts. You can cancel anytime in-app via
                  the billing portal.
                </p>
              </div>

              <div>
                <h3 className="font-medium">Do I need Pro to try it?</h3>
                <p className="mt-1 text-slate-300">
                  No. You can generate and preview your policy on Starter to
                  confirm it fits your organisation before upgrading.
                </p>
              </div>

              <div>
                <h3 className="font-medium">How do you handle data & security?</h3>
                <p className="mt-1 text-slate-300">
                  PolicySprint AI is hosted on Vercel and uses the OpenAI API
                  for content generation. We aim to minimise data retention and
                  keep a clear data &amp; security overview for review.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}