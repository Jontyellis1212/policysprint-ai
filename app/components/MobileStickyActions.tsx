import React from "react";

export default function MobileStickyActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={[
        // Mobile: fixed sticky bar
        "fixed inset-x-0 bottom-0 z-50",
        "border-t border-slate-800 bg-slate-950/95 backdrop-blur-md",
        // Safe-area padding for iPhone home indicator
        "pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
        // Desktop: normal flow (no sticky bar)
        "md:static md:border-0 md:bg-transparent md:backdrop-blur-0 md:pb-0",
      ].join(" ")}
    >
      <div className="mx-auto w-full md:max-w-5xl px-4 pt-3 md:px-0 md:pt-0">
        <div className="flex items-center justify-between gap-3">{children}</div>
      </div>
    </div>
  );
}
