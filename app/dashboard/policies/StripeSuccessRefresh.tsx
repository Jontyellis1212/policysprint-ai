"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

async function callSync(): Promise<void> {
  try {
    await fetch("/api/stripe/sync", { method: "POST" });
  } catch {
    // ignore
  }
}

async function getSessionPlan(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.user?.plan as string | undefined) ?? null;
  } catch {
    return null;
  }
}

export default function StripeSuccessRefresh() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);

  useEffect(() => {
    const stripeSuccess = searchParams.get("stripe") === "success";

    if (stripeSuccess) {
      sessionStorage.setItem("ps_stripe_success", "1");

      // Remove ?stripe=success immediately so the page doesn't stay in a "state"
      const params = new URLSearchParams(searchParams.toString());
      params.delete("stripe");
      const qs = params.toString();
      router.replace(qs ? `/dashboard/policies?${qs}` : "/dashboard/policies", {
        scroll: false,
      });
    }

    const shouldRun =
      stripeSuccess || sessionStorage.getItem("ps_stripe_success") === "1";

    if (!shouldRun || started.current) return;
    started.current = true;

    let cancelled = false;

    const run = async () => {
      // 1) Sync Stripe -> DB
      await callSync();

      // 2) Poll session for up to ~10 seconds without forcing refresh each time
      for (let i = 0; i < 10; i++) {
        if (cancelled) return;

        const plan = await getSessionPlan();
        if (plan === "pro") {
          sessionStorage.removeItem("ps_stripe_success");
          router.refresh(); // single refresh once we know it's pro
          return;
        }

        await new Promise((r) => setTimeout(r, 1000));
      }

      // Give up quietly
      sessionStorage.removeItem("ps_stripe_success");
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return null;
}
