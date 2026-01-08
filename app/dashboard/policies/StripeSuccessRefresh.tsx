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
    }

    const shouldRun =
      stripeSuccess || sessionStorage.getItem("ps_stripe_success") === "1";

    if (!shouldRun || started.current) return;
    started.current = true;

    let cancelled = false;

    const run = async () => {
      // ✅ First: sync user subscription from Stripe -> DB
      await callSync();

      // Then poll session for up to ~10 seconds
      for (let i = 0; i < 10; i++) {
        if (cancelled) return;

        const plan = await getSessionPlan();
        if (plan === "pro") {
          sessionStorage.removeItem("ps_stripe_success");

          const params = new URLSearchParams(searchParams.toString());
          params.delete("stripe");
          const qs = params.toString();
          router.replace(qs ? `?${qs}` : ".", { scroll: false });
          router.refresh();
          return;
        }

        router.refresh();
        await new Promise((r) => setTimeout(r, 1000));
      }

      sessionStorage.removeItem("ps_stripe_success");
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return null;
}
