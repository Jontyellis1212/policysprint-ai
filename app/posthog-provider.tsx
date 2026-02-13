"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    // No key/host = do nothing (safe for dev/staging)
    if (!key || !host) return;

    // Prevent double-init during Next dev/HMR
    if ((window as any).__PS_POSTHOG_INIT__) return;
    (window as any).__PS_POSTHOG_INIT__ = true;

    posthog.init(key, {
      api_host: host,

      // Keep it simple: pageviews + clicks
      capture_pageview: true,
      autocapture: true,

      // Keep you out of feature-flag/config complexity while you’re shipping
      advanced_disable_feature_flags: true,

      // Optional: off for now
      disable_session_recording: true,
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
