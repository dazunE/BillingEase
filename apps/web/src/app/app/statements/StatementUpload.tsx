"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ICONS, Icon } from "@/components/ui";

/** Upload a statement; while any is being read, the page refreshes itself. */
export function StatementUpload({ setUp, busy: reading }: { setUp: boolean; busy: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reading) return;
    const t = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(t);
  }, [reading, router]);

  async function send(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/app/statements/upload", { method: "POST", body: fd });
      const j = await res.json().catch(() => null);
      if (!res.ok) setError(j?.error?.message ?? "The upload didn't go through. Try again.");
      else router.push(`/app/statements/${j.id}`);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
      router.refresh();
    }
  }

  return (
    <section aria-labelledby="up-h" className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex size-11 flex-none items-center justify-center rounded-2xl bg-tint"><Icon d={ICONS.bank} /></span>
        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
          <h2 id="up-h" className="font-display text-lg font-bold">Upload a statement</h2>
          <p className="text-sm text-ink2">The CSV or PDF from any bank or card. Each line is matched to your invoices, bills and expenses; the rest get a category for you to check.</p>
        </div>
        <label className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold max-sm:w-full ${setUp && !busy ? "cursor-pointer bg-violet hover:bg-[#a98ffb]" : "pointer-events-none bg-surface opacity-60"}`}>
          <Icon d={ICONS.plus} size={18} strokeWidth={2.4} />
          {busy ? "Sending…" : "Choose a CSV or PDF"}
          <input ref={input} type="file" accept=".csv,.txt,.tsv,text/csv,application/pdf" disabled={!setUp || busy} className="sr-only" onChange={(e) => send(e.target.files)} />
        </label>
      </div>
      {!setUp && <p className="text-sm text-due">Reading statements needs Vertex AI, which isn&apos;t set up yet.</p>}
      {error && <p role="alert" className="text-sm font-semibold text-late">{error}</p>}
    </section>
  );
}
