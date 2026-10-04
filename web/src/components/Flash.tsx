"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Shows a short confirmation ("Invoice sent") passed as ?flash=… after a
 * server action redirects, then quietly removes it from the URL.
 */
export function Flash() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const message = params.get("flash");

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      next.delete("flash");
      router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
    }, 3200);
    return () => clearTimeout(t);
  }, [message, params, pathname, router]);

  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex w-max max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-2.5 rounded-full bg-ink py-3 pl-3.5 pr-5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(24,22,31,0.22)]"
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-violet">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m5 12 5 5 9-10" />
        </svg>
      </span>
      {message}
    </div>
  );
}
