"use client";

import { useState, type ReactNode } from "react";
import { cx } from "@/components/ui";

/**
 * Copies `text` (or the page's own address when `text` is omitted) to the
 * clipboard and says so for two seconds. Used by the press kit and guides.
 */
export function CopyButton({ text, children, done = "Copied", className, icon = false }: { text?: string; children: ReactNode; done?: string; className?: string; icon?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text ?? window.location.href);
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={cx("inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-ink/[0.07] px-4 text-sm font-semibold text-ink transition-colors hover:bg-ink/[0.11]", className)}
    >
      {icon && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {copied ? <path d="m5 12 5 5 9-10" /> : <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />}
        </svg>
      )}
      <span aria-live="polite">{copied ? done : failed ? "Couldn’t copy" : children}</span>
    </button>
  );
}
