"use client";

import type { Capture } from "@billingease/contracts";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ICONS, Icon } from "@/components/ui";
import { retryCapture } from "./actions";

const MAX = 10 * 1024 * 1024;

/**
 * Add photos or PDFs of receipts and bills. Each is read in the background; the page refreshes
 * itself while any are still being read, and what was read appears below as something to check.
 */
export function CaptureBox({ captures, setUp }: { captures: Capture[]; setUp: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reading = captures.filter((c) => c.status === "queued" || c.status === "reading");
  const failed = captures.filter((c) => c.status === "failed").slice(0, 5);

  useEffect(() => {
    if (!reading.length) return;
    const t = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(t);
  }, [reading.length, router]);

  async function send(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      for (const f of Array.from(files)) {
        if (f.size > MAX) {
          setError(`${f.name} is over 10 MB. Try a smaller photo or PDF.`);
          continue;
        }
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/app/capture", { method: "POST", body: fd });
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          setError(j?.error?.message ?? "The upload didn't go through. Try again.");
          break;
        }
      }
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
      router.refresh();
    }
  }

  return (
    <section id="capture" aria-labelledby="cap-h" className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex size-11 flex-none items-center justify-center rounded-2xl bg-going-tint"><Icon d={ICONS.camera} /></span>
        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
          <h2 id="cap-h" className="font-display text-lg font-bold">Add a receipt or bill</h2>
          <p className="text-sm text-ink2">A photo or PDF. BillingEase reads it and drafts the expense or bill here for you to check.</p>
        </div>
        <label className={`inline-flex min-h-11 max-sm:w-full cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold ${setUp && !busy ? "bg-violet hover:bg-[#a98ffb]" : "pointer-events-none bg-surface opacity-60"}`}>
          <Icon d={ICONS.plus} size={18} strokeWidth={2.4} />
          {busy ? "Sending…" : "Choose photos or PDFs"}
          <input ref={input} type="file" accept="image/*,application/pdf" multiple disabled={!setUp || busy} className="sr-only" onChange={(e) => send(e.target.files)} />
        </label>
      </div>
      {!setUp && <p className="text-sm text-due">Reading receipts needs Vertex AI, which isn&apos;t set up yet. You can still add expenses by hand.</p>}
      {error && <p role="alert" className="text-sm font-semibold text-late">{error}</p>}
      {(reading.length > 0 || failed.length > 0) && (
        <ul aria-label="Uploads" aria-live="polite" className="flex flex-col divide-y divide-divider rounded-2xl bg-bg">
          {reading.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span aria-hidden className="size-2 animate-pulse rounded-full bg-coming motion-reduce:animate-none" />
              <span className="min-w-0 flex-1 truncate font-semibold">{c.filename}</span>
              <span className="text-muted">{c.status === "queued" ? "Waiting to be read" : "Reading…"}</span>
            </li>
          ))}
          {failed.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
              <span className="min-w-0 flex-1 font-semibold [overflow-wrap:anywhere]">{c.filename}</span>
              <span className="basis-full text-late sm:order-last">{c.error}</span>
              <a href={`/app/out/attachments/${c.attachmentId}`} target="_blank" rel="noreferrer" className="min-h-11 content-center underline underline-offset-4">Open</a>
              <form action={retryCapture}>
                <input type="hidden" name="id" value={c.id} />
                <button className="min-h-11 rounded-full bg-ink/[0.07] px-4 font-semibold hover:bg-ink/[0.11]">Try again</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
