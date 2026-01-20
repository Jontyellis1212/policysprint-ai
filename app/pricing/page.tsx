import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Pricing | PolicySprint AI",
  description: "Simple, transparent pricing for AI policy compliance.",
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
    name: "Starter",
    badge: "Best for getting started",
    price: "$0",
    priceSub: "during beta",
    description:
      "Generate your first AI Use Policy and share it internally without any friction.",
    highlight: false,
    comingSoon: false,
    ctaLabel: "Try live demo",
    ctaHref: "/?demo=1",
    ctaVariant: "outline",
    features: [
      "AI Use Policy generator",
      "3-step wizard (business → risk → outputs)",
      "PDF export via browser print",
      "Sample/demo mode with realistic data",
      "Copy & paste policy into your own templates",
    ],
  },
  {
    name: "Pro",
    badge: "Most popular",
    price: "$49",
    priceSub: "per month, per organisation",
    description:
      "For organisations that want repeatable, up-to-date AI policies and staff guidance.",
    highlight: true,
    comingSoon: false,
    ctaLabel: "Upgrade to Pro",
    ctaVariant: "primary",
    features: [
      "Unlimited policy generations",
      "Saved organisation profiles",
      "Staff-facing AI Use Guide output",
      "Training quiz generated from your policy",
      "Version history for policy updates",
      "Priority support & onboarding",
    ],
  },
  {
    name: "Enterprise",
    badge: "For complex risk & scale",
    price: "Custom",
    priceSub: "annual",
    description:
      "For larger organisations with complex risk, multiple business units or custom workflows.",
    highlight: false,
    comingSoon: true,
    ctaLabel: "Talk to us",
    ctaHref:
      "mailto:hello@policysprint.ai?subject=Enterprise%20enquiry&body=Hi%20there%2C%0D%0A%0D%0AWe%27d%20like%20to%20discuss%20PolicySprint%20AI%20for%20our%20organisation.%0D%0A%0D%0AOrganisation%20name%3A%0D%0AStaff%20count%3A%0D%0AIndustry%3A%0D%0AKey%20AI%20use%20cases%3A%0D%0A",
    ctaVariant: "outline",
    features: [
      "Everything in Pro",
      "Custom legal/risk inputs & templates",
      "Multiple business units & policies",
      "SSO & advanced access controls",
      "Dedicated success manager",
      "On-site or virtual training sessions",
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
              AI policy compliance
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Move from “we should really have an AI policy” to “it&apos;s already
            drafted, shared and embedded” in a single session.
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
            Secure payments powered by Stripe. Cancel anytime.
          </p>
        </section>

        {/* Pricing grid */}
        <section className="mt-12 md:mt-16">
          <div className="grid gap-6 md:grid-cols-3">
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
                      <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200">
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

                  <p className="mt-3 text-sm text-slate-300">
                    {tier.description}
                  </p>

                  {tier.comingSoon && (
                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-amber-300/90">
                      Coming soon – lock in early pricing
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
                            Upgrade to Pro
                          </button>
                        </form>
                      ) : (
                        <Link
                          href="/login?callbackUrl=%2Fpricing"
                          className="inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                        >
                          Log in to upgrade
                        </Link>
                      )
                    ) : (
                      <Link
                        href={tier.ctaHref ?? "/pricing"}
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
                    <p className="mt-3 text-xs text-slate-400">
                      You&apos;ll be redirected to Stripe Checkout. Cancel anytime.
                    </p>
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
        </section>

        {/* FAQ */}
        <section className="mt-14 md:mt-16 border-t border-slate-800 pt-10">
          <div className="grid gap-10 md:grid-cols-[1.1fr,2fr] md:items-start">
            <div>
              <h2 className="text-xl font-semibold">Pricing FAQ</h2>
              <p className="mt-2 text-sm text-slate-300">
                Start on the free beta, validate that PolicySprint AI fits your
                workflow, then upgrade to Pro when you&apos;re ready to roll it
                out across the organisation.
              </p>
            </div>
            <div className="space-y-5 text-sm text-slate-200">
              <div>
                <h3 className="font-medium">
                  Is PolicySprint AI really free right now?
                </h3>
                <p className="mt-1 text-slate-300">
                  Yes. During the beta period, the Starter tier is free so you
                  can generate and test AI Use Policies internally before
                  committing to a paid plan.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  What happens after I upgrade?
                </h3>
                <p className="mt-1 text-slate-300">
                  After payment, your account is automatically upgraded to Pro via Stripe webhooks.
                  You can manage or cancel your subscription at any time from the billing portal.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  Can you mirror our existing legal or risk framework?
                </h3>
                <p className="mt-1 text-slate-300">
                  For many organisations, the built-in prompts and options will
                  be enough. If you have strict wording, existing policies or a
                  complex risk setup, the Enterprise tier is designed for
                  deeper customisation.
                </p>
              </div>
              <div>
                <h3 className="font-medium">
                  How do you handle data and security?
                </h3>
                <p className="mt-1 text-slate-300">
                  PolicySprint AI is hosted on Vercel and uses the OpenAI API
                  for content generation. We aim to minimise data retention and
                  publish a clear data &amp; security overview so your risk and
                  compliance teams can review it.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
