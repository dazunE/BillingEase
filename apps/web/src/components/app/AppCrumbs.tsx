import { home } from "@billingease/contracts";
import { formatMoney, monthLabel } from "@billingease/core";
import Link from "next/link";
import { ICONS, Icon } from "@/components/ui";
import { ApiFailure, call } from "@/lib/api";

export type Area = "in" | "out" | "keep" | "biz";

/** "Q3 so far" (UK quarter) or "October so far" (Sri Lanka month), as on Home. */
function periodWords(p: { key: string; label: string; from: string }) {
  if (p.key === "quarter") return `${p.label.split(" ")[0]} so far`;
  if (p.key === "month") return `${monthLabel(p.from).split(" ")[0]} so far`;
  return "This year so far";
}

async function numbers() {
  try {
    return await call(home.summary);
  } catch (err) {
    if (err instanceof ApiFailure) return null;
    throw err;
  }
}

/**
 * Where you are, and your three numbers for the same period as Home (prototype AppCrumbs).
 * Sits at the top of every page under the header; the current area's number is ringed.
 * `trail` is everything after Home; the last item without an href is the current page.
 */
export async function AppCrumbs({ area, trail }: { area?: Area; trail: { label: string; href?: string }[] }) {
  const h = await numbers();
  const pill = "inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full px-[11px] text-[12.5px] font-semibold";
  const on = (a: Area, bg: string, ring: string) => (area === a ? `${bg} border-2 ${ring}` : "bg-white border border-line");
  const money = (n: number) => (h ? formatMoney(n, h.currency, { decimals: "never" }) : "");
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-muted">
        <Link href="/app" className="inline-flex min-h-9 items-center gap-1.5 text-ink2 hover:underline">
          <Icon d={ICONS.arrowLeft} size={18} /> Home
        </Link>
        {trail.map((t, i) => (
          <span key={i} className="flex min-w-0 items-center gap-2">
            <span aria-hidden>/</span>
            {t.href ? (
              <Link href={t.href} className="inline-flex min-h-9 items-center text-ink2 hover:underline">{t.label}</Link>
            ) : (
              <span aria-current="page" className="truncate text-ink">{t.label}</span>
            )}
          </span>
        ))}
      </nav>
      {h && (
        <nav aria-label={`Your three numbers, ${periodWords(h.period)}`} className="flex flex-wrap items-center gap-1.5">
          <span title={`Yours to keep is after ${h.tax.label.toLowerCase()}, estimated`} className="mr-0.5 whitespace-nowrap text-xs font-semibold text-muted">{periodWords(h.period)}</span>
          <Link href="/app/in" aria-current={area === "in" ? "page" : undefined} className={`${pill} ${on("in", "bg-tint", "border-coming")}`}>
            <span className="size-2 rounded-full bg-coming" />Coming in <strong className="font-display tabular-nums">{money(h.comingIn.total)}</strong>
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="font-display font-bold text-muted">−</span>
            <Link href="/app/out" aria-current={area === "out" ? "page" : undefined} className={`${pill} ${on("out", "bg-going-tint", "border-going")}`}>
              <span className="size-2 rounded-full bg-going" />Going out <strong className="font-display tabular-nums">{money(h.goingOut.total)}</strong>
            </Link>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="font-display font-bold text-muted">=</span>
            <Link href="/app" className={`${pill} bg-ink text-white ${area === "keep" ? "border-2 border-ink shadow-[0_0_0_2px_#B9A3FF]" : "border border-ink"}`}>
              <span className="size-2 rounded-full bg-violet" />Yours to keep <strong className="font-display tabular-nums text-violet">{money(h.keep)}</strong>
            </Link>
          </span>
        </nav>
      )}
    </div>
  );
}
