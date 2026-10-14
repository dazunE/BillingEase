"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** The prototype's bottom toast: `const [toast, notify] = useToast()` then `<Toast text={toast} />`. */
export function useToast(ms = 2600): [string | null, (t: string) => void] {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const notify = useCallback(
    (t: string) => {
      setText(t);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setText(null), ms);
    },
    [ms],
  );
  return [text, notify];
}

export function Toast({ text }: { text: string | null }) {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-[60] w-max max-w-[calc(100%-32px)] -translate-x-1/2">
      {text && (
        <span className="flex items-center gap-2.5 rounded-full bg-ink py-3 pl-3.5 pr-5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(24,22,31,0.22)]">
          <span aria-hidden className="flex size-6 flex-none items-center justify-center rounded-full bg-violet">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12 5 5 9-10" />
            </svg>
          </span>
          {text}
        </span>
      )}
    </div>
  );
}
