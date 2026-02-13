"use client";

import posthog from "posthog-js";

type Props = Record<string, any>;

export function track(event: string, props?: Props) {
  try {
    if (typeof window === "undefined") return;
    if (!posthog || typeof posthog.capture !== "function") return;
    posthog.capture(event, props || {});
  } catch {
    // never break UX because of analytics
  }
}
