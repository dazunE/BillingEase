import Link from "next/link";
import type { ThreeNumbers } from "@/lib/numbers";
import { formatMoney } from "@/lib/money";
import { ICONS, Icon, cx } from "./ui";

/** Compact "Coming in − Going out = Yours to keep" strip shown on every drill-down screen. */
export function EquationStrip({ n, current }: { n: ThreeNumbers; current: "in" | "out" | "keep" }) {
  const pill = (key: "in" | "out" | "keep", label: string, value: number, dot: string, href: string) => (
    <Link
      href={href}
      aria-current={current === key ? "page" : undefined}
      className={cx(
        "inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold",
        key === "keep" ? "bg-ink text-white" : "bg-white text-ink",
        current === key ? (key === "keep" ? "ring-2 ring-coming ring-offset-2" : key === "in" ? "ring-2 ring-coming" : "ring-2 ring-going") : "border border-line",
      )}
    >
      <span className={cx("size-2 rounded-full", dot)} aria-hidden />
      {label}
      <span className={cx("font-display font-bold tabular", key === "keep" && "text-violet")}>{formatMoney(value, { cents: false })}</span>
    </Link>
  );
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/app" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold">
        <Icon d={ICONS.arrowLeft} size={16} />
        Home
      </Link>
      <nav aria-label="Your three numbers" className="flex flex-wrap items-center gap-2 text-muted">
        {pill("in", "Coming in", n.comingIn, "bg-coming", "/app/in")}
        <span aria-hidden className="font-display font-bold">−</span>
        {pill("out", "Going out", n.goingOut, "bg-going", "/app/out")}
        <span aria-hidden className="font-display font-bold">=</span>
        {pill("keep", "Yours to keep", n.yoursToKeep, "bg-violet", "/app/keep")}
      </nav>
    </div>
  );
}
