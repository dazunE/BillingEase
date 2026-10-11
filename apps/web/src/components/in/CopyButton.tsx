"use client";

import { useState } from "react";
import { ICONS, Icon } from "@/components/ui";

/** Copies text to the clipboard and says so. */
export function CopyButton({ text, label = "Copy link" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2500);
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-black"
    >
      <Icon d={state === "copied" ? ICONS.check : "M8 8h11v13H8zM5 16V3h11"} size={16} strokeWidth={2.2} />
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Select and copy it" : label}</span>
    </button>
  );
}
