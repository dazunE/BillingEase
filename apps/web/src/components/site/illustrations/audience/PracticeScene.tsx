import s from "./audience.module.css";

export type PracticeRow = { initials: string; name: string; sub: string; status: string; tone: "pos" | "due" | "info" | "grey" | "violet" };
export type PracticeSceneText = {
  practice: string;
  title: string;
  badge: string;
  rows: PracticeRow[];
  tiles: [string, string, "grey" | "due" | "info"][];
};

const TONE = {
  pos: "bg-pos-bg text-pos",
  due: "bg-due-bg text-due",
  info: "bg-info-bg text-info",
  grey: "bg-surface text-ink2",
  violet: "bg-tint text-ink",
} as const;
const AV = ["bg-tint", "bg-going-tint", "bg-pos-bg", "bg-due-bg", "bg-info-bg"];
const TILE = { grey: "bg-bg", due: "bg-due-bg", info: "bg-info-bg" } as const;

/**
 * Hero for /accountants: a preview of the practice's client list (adapted
 * from prototype SitePartners). Decorative; the badge says it is a preview.
 */
export function PracticeScene({ t }: { t: PracticeSceneText }) {
  return (
    <div aria-hidden className={`${s.bob} relative w-full max-w-[500px]`} style={{ animationDuration: "9s" }}>
      <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-[24px] bg-violet" />
      <div className="relative flex flex-col gap-3 rounded-[24px] border-2 border-ink bg-white p-[clamp(14px,2.4vw,20px)]">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold text-muted">{t.practice}</span>
            <span className="font-display text-[17px] font-bold tracking-[-0.01em]">{t.title}</span>
          </span>
          <span className="rounded-full bg-tint px-2.5 py-1 text-[11px] font-bold">{t.badge}</span>
        </div>
        <ul className="flex flex-col">
          {t.rows.map((r, i) => (
            <li key={r.name} className="flex items-center gap-3 border-b border-divider py-2.5 last:border-b-0">
              <span className={`flex size-9 flex-none items-center justify-center rounded-full border-2 border-ink text-[11px] font-bold ${AV[i % AV.length]}`}>{r.initials}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-bold">{r.name}</span>
                <span className="truncate text-[11px] text-muted">{r.sub}</span>
              </span>
              <span className={`flex-none whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${TONE[r.tone]}`}>{r.status}</span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-3 gap-2">
          {t.tiles.map(([l, v, tone]) => (
            <span key={l} className={`flex min-w-0 flex-col gap-0.5 rounded-xl px-2.5 py-2 ${TILE[tone]}`}>
              <span className="truncate text-[10px] font-bold text-ink2">{l}</span>
              <span className="font-display text-base font-bold">{v}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
