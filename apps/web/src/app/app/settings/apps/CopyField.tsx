"use client";

import { useState } from "react";

/** A value to copy: an address or a new token. Selecting it works too where the clipboard doesn't. */
export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex min-w-0 items-stretch gap-2">
        <input readOnly value={value} aria-label={label} onFocus={(e) => e.currentTarget.select()}
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-input bg-white px-3 font-mono text-[13px] text-ink" />
        <button type="button" className="min-h-11 shrink-0 rounded-full bg-ink/[0.07] px-4 text-sm font-semibold hover:bg-ink/[0.11]"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              setCopied(false);
            }
          }}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
