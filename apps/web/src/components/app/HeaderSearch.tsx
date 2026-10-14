"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ICONS, Icon } from "@/components/ui";

type Result = { type: "customer" | "invoice" | "supplier" | "expense" | "bill"; id: string; title: string; subtitle: string; href: string };

const KIND: Record<Result["type"], { label: string; tint: string }> = {
  customer: { label: "Customer", tint: "bg-tint" },
  invoice: { label: "Invoice", tint: "bg-tint" },
  supplier: { label: "Supplier", tint: "bg-going-tint" },
  expense: { label: "Expense", tint: "bg-going-tint" },
  bill: { label: "Bill", tint: "bg-going-tint" },
};

/** The header's search pill: results drop down as you type; Enter opens the first, or every result. */
export function HeaderSearch({ placeholder, noHint }: { placeholder: string; noHint: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/app/search/live?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const json = await res.json();
        setResults((json.results ?? []).slice(0, 8));
      } catch {
        // A newer search replaced this one.
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setQ("");
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setQ("");
    document.addEventListener("click", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const open = q.trim().length > 0 && results !== null;
  const go = (href: string) => {
    setQ("");
    setResults(null);
    router.push(href);
  };

  return (
    <div ref={box} role="search" className="relative min-w-0 flex-[1_1_260px] max-w-[480px] max-sm:max-w-none max-sm:basis-full">
      <label className="flex min-h-11 items-center gap-2.5 rounded-full bg-surface px-4 focus-within:shadow-[0_0_0_3px_#7A5AF8]">
        <Icon d={ICONS.search} size={18} className="shrink-0 text-ink2" />
        <span className="sr-only">Find anything</span>
        <input
          type="search"
          value={q}
          autoComplete="off"
          placeholder={placeholder}
          onChange={(e) => {
            setQ(e.target.value);
            if (!e.target.value.trim()) setResults(null);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || !q.trim()) return;
            e.preventDefault();
            go(results?.[0]?.href ?? `/app/search?q=${encodeURIComponent(q.trim())}`);
          }}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none focus-visible:outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button type="button" onClick={() => { setQ(""); setResults(null); }} aria-label="Clear search" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-line">
            <Icon d="M6 6l12 12M18 6 6 18" size={14} strokeWidth={2.4} />
          </button>
        )}
      </label>
      {open && (
        <div role="listbox" aria-label="Search results" className="absolute inset-x-0 top-[calc(100%+8px)] z-40 flex max-h-[420px] flex-col gap-0.5 overflow-y-auto rounded-[18px] border border-line bg-white p-2 shadow-[0_16px_40px_rgba(24,22,31,0.16)]">
          {results!.map((r) => (
            <Link key={`${r.type}-${r.id}`} href={r.href} role="option" aria-selected={false} onClick={() => { setQ(""); setResults(null); }} className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-1 hover:bg-bg">
              <span className={`min-w-[74px] shrink-0 rounded-full px-2 py-0.5 text-center text-[11.5px] font-bold ${KIND[r.type].tint}`}>{KIND[r.type].label}</span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[14.5px] font-semibold">{r.title}</span>
                <span className="truncate text-[12.5px] text-muted">{r.subtitle}</span>
              </span>
            </Link>
          ))}
          {results!.length === 0 && <p className="m-0 p-3 text-sm text-ink2">Nothing matches “{q.trim()}”. {noHint}</p>}
          {results!.length > 0 && (
            <Link href={`/app/search?q=${encodeURIComponent(q.trim())}`} onClick={() => setQ("")} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ink2 hover:bg-bg">
              See every result for “{q.trim()}”
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
