"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  policyText: string;
};

export default function GenerateQuizButton({ policyText }: Props) {
  const router = useRouter();
  const [isWorking, setIsWorking] = useState(false);

  const hasPolicy = policyText.trim().length > 0;

  async function handleClick() {
    if (!hasPolicy || isWorking) return;

    try {
      setIsWorking(true);
      if (typeof window !== "undefined") {
        // Save the policy so /quiz can prefill it
        window.localStorage.setItem("policysprint:lastPolicy", policyText);
      }
      router.push("/quiz");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!hasPolicy || isWorking}
      className={`inline-flex items-center justify-center rounded-full px-4 py-2.5 text-[11px] font-medium transition ${
        hasPolicy && !isWorking
          ? "bg-sky-500 text-slate-950 hover:bg-sky-400"
          : "cursor-not-allowed bg-slate-200 text-slate-400"
      }`}
      title={
        hasPolicy
          ? "Open the quiz generator based on this policy"
          : "Generate a policy first"
      }
    >
      {isWorking ? "Opening quiz…" : "Generate training quiz from this policy"}
    </button>
  );
}
