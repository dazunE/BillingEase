import { cx } from "@/components/ui";
import s from "./product.module.css";

/** Padlock with the cash jar inside and three ticked chips (prototype SiteSecurity hero). Decorative. */
export function LockScene({ chips }: { chips: string[] }) {
  return (
    <div aria-hidden className="relative mx-auto min-w-0 max-w-[480px] flex-[1_1_380px]">
      <svg viewBox="0 0 420 340" width="100%" className="block overflow-visible">
        <circle cx="210" cy="180" r="140" fill="#EEE8FF" />
        <circle cx="210" cy="180" r="158" fill="none" stroke="#C9BCFB" strokeWidth="2" strokeDasharray="4 10" />
        <g className={s.orbit}>
          <circle cx="210" cy="22" r="8" fill="#B9A3FF" stroke="#18161F" strokeWidth="2" />
          <circle cx="368" cy="180" r="6" fill="#E0752D" stroke="#18161F" strokeWidth="2" />
          <circle cx="52" cy="180" r="6" fill="#7FB872" stroke="#18161F" strokeWidth="2" />
        </g>
        <g transform="translate(130 70)">
          <g className={s.shackle}>
            <path d="M30 100 V60 a50 50 0 0 1 100 0 V100" fill="none" stroke="#18161F" strokeWidth="18" strokeLinecap="round" />
            <path d="M30 100 V60 a50 50 0 0 1 100 0 V100" fill="none" stroke="#CBC7D3" strokeWidth="10" strokeLinecap="round" />
          </g>
          <rect x="0" y="92" width="160" height="140" rx="26" fill="#B9A3FF" stroke="#18161F" strokeWidth="3" />
          <rect x="14" y="106" width="132" height="112" rx="18" fill="none" stroke="#18161F" strokeWidth="1.5" strokeDasharray="3 6" />
          <rect x="58" y="128" width="44" height="12" rx="4" fill="#CBC7D3" stroke="#18161F" strokeWidth="2" />
          <path d="M52 140 h56 a6 6 0 0 1 6 6 v48 a12 12 0 0 1 -12 12 h-44 a12 12 0 0 1 -12 -12 v-48 a6 6 0 0 1 6 -6 z" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.5" />
          <rect x="56" y="168" width="48" height="32" rx="6" fill="#7FB872" stroke="#18161F" strokeWidth="2" />
          <ellipse cx="80" cy="166" rx="16" ry="5" fill="#FFC53D" stroke="#18161F" strokeWidth="1.8" />
          <circle className={s.glow} cx="80" cy="184" r="9" fill="#FFFFFF" stroke="#18161F" strokeWidth="2" />
          <path className={s.glow} d="M75 184 l4 4 l7 -8" fill="none" stroke="#2F5711" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      {chips.map((c, i) => (
        <span
          key={c}
          className={cx("absolute inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-white px-3 py-[7px] text-xs font-bold shadow-[0_6px_16px_rgba(24,22,31,0.08)]", s.bob)}
          style={{ ...[{ left: "0%", top: "18%" }, { right: "0%", top: "46%" }, { left: "6%", bottom: "6%" }][i], animationDelay: `${-i * 1.1}s` }}
        >
          <span className="text-pos">✓</span> {c}
        </span>
      ))}
    </div>
  );
}

const SEAL = "M48 4 L56 12 L67 9 L71 20 L82 23 L80 34 L88 42 L82 51 L86 62 L76 67 L74 78 L63 77 L56 86 L48 80 L40 86 L33 77 L22 78 L20 67 L10 62 L14 51 L8 42 L16 34 L14 23 L25 20 L29 9 L40 12 Z";

/** A rosette badge with "PLANNED" (prototype compliance seals, but honest). Decorative. */
export function Seal({ l1, l2, tint }: { l1: string; l2: string; tint: string }) {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden>
      <path d={SEAL} fill={tint} stroke="#18161F" strokeWidth="2.5" strokeLinejoin="round" strokeDasharray="5 4" />
      <circle cx="48" cy="45" r="28" fill="#FFFFFF" stroke="#18161F" strokeWidth="2" />
      <circle cx="48" cy="45" r="23" fill="none" stroke="#18161F" strokeWidth="1" strokeDasharray="2 3" />
      <text x="48" y={l1.length > 3 ? 47 : 49} textAnchor="middle" className="font-display" fontSize={l1.length > 3 ? 12 : 16} fontWeight="800" fill="#18161F">
        {l1}
      </text>
      <text x="48" y="60" textAnchor="middle" className="font-sans" fontSize="7" fontWeight="700" fill="#6B5000">
        {l2}
      </text>
    </svg>
  );
}
