"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  policyText: string;
};

export default function GenerateStaffGuideButton({ policyText }: Props) {
  const router = useRouter();
  const [isWorking, setIsWorking] = useState(false);

  const hasPolicy = policyText.trim().length > 0;

  async function handleClick() {
    if (!hasPolicy || isWorking) return;
    try {
      setIsWorking(true);
      // Save the policy so /staff-guide can prefill it
      if (typeof window !== "undefined") {
        window.localStorage.setItem("policysprint:lastPolicy", policyText);
      }
      router.push("/staff-guide");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!hasPolicy || isWorking}
      className={`inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition ${
        hasPolicy && !isWorking
          ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
          : "cursor-not-allowed bg-slate-700 text-slate-400"
      }`}
      title={
        hasPolicy
          ? "Open the staff guide generator with this policy"
          : "Generate a policy first"
      }
    >
      {isWorking ? "Opening staff guide..." : "Generate staff guide from this policy"}
    </button>
  );
}
