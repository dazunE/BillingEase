import { CashJar } from "@/components/CashJar";
import s from "./landing.module.css";

/** Decorative landing illustrations (server-rendered SVG + CSS animation). All aria-hidden. */

function Chip({ children, className, delay }: { children: React.ReactNode; className: string; delay?: string }) {
  return (
    <span
      className={`${s.chip} absolute inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-white px-3 py-[7px] text-xs font-bold shadow-[0_6px_16px_rgba(24,22,31,0.08)] ${className}`}
      style={delay ? { animationDelay: delay } : undefined}
    >
      <span className="text-pos">✓</span> {children}
    </span>
  );
}

export function MayaAtDesk() {
  return (
    <div className={`${s.anim} relative min-w-[260px] flex-[0_1_380px]`} aria-hidden>
      <svg viewBox="0 0 360 250" width="100%" className="block overflow-visible">
        <circle cx="190" cy="140" r="108" fill="#EEE8FF" />
        <g className={`${s.b} ${s.sway}`}>
          <path d="M62 170 C50 140 40 128 30 120 C48 124 60 138 66 160" fill="#7FB872" stroke="#18161F" strokeWidth="2" />
          <path d="M66 168 C66 136 72 116 86 104 C84 126 76 146 72 168" fill="#5E9E54" stroke="#18161F" strokeWidth="2" />
          <path d="M70 170 C82 148 98 140 112 140 C98 150 86 160 78 172" fill="#8CC47F" stroke="#18161F" strokeWidth="2" />
        </g>
        <path d="M52 170 H96 L90 204 H58 Z" fill="#D9622B" stroke="#18161F" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M126 210 C126 168 150 150 190 150 C230 150 254 168 254 210 Z" fill="#B9A3FF" stroke="#18161F" strokeWidth="2.5" />
        <path d="M176 150 L190 168 L204 150" fill="none" stroke="#18161F" strokeWidth="2.2" strokeLinejoin="round" />
        <rect x="180" y="128" width="20" height="22" fill="#C68B6E" stroke="#18161F" strokeWidth="2.2" />
        <circle cx="190" cy="108" r="28" fill="#C68B6E" stroke="#18161F" strokeWidth="2.5" />
        <path d="M162 106 C160 82 176 72 192 72 C210 72 222 84 218 104 C210 92 196 88 182 92 C174 94 166 100 162 106 Z" fill="#2B2233" stroke="#18161F" strokeWidth="2" />
        <circle cx="208" cy="70" r="11" fill="#2B2233" stroke="#18161F" strokeWidth="2" />
        <g className={`${s.c} ${s.blink}`}>
          <path d="M176 108 q4 -4 8 0" fill="none" stroke="#18161F" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M196 108 q4 -4 8 0" fill="none" stroke="#18161F" strokeWidth="2.2" strokeLinecap="round" />
        </g>
        <path d="M182 120 q8 7 16 0" fill="none" stroke="#18161F" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="172" cy="118" r="4" fill="#E9A28A" opacity="0.7" />
        <circle cx="208" cy="118" r="4" fill="#E9A28A" opacity="0.7" />
        <path d="M150 176 C140 186 136 196 140 204" fill="none" stroke="#18161F" strokeWidth="2.5" />
        <rect x="132" y="168" width="28" height="32" rx="5" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.5" />
        <path d="M160 176 c10 0 10 16 0 16" fill="none" stroke="#18161F" strokeWidth="2.5" />
        <path d="M138 160 c-4 -6 4 -10 0 -16" fill="none" stroke="#5F5B68" strokeWidth="2" strokeLinecap="round" className={s.steam} />
        <path d="M150 160 c-4 -6 4 -10 0 -16" fill="none" stroke="#5F5B68" strokeWidth="2" strokeLinecap="round" className={s.steam} style={{ animationDelay: "1.2s" }} />
        <path d="M206 158 H290 L298 206 H198 Z" fill="#CBC7D3" stroke="#18161F" strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="238" y="174" width="18" height="18" rx="5" fill="#B9A3FF" stroke="#18161F" strokeWidth="1.6" />
        <path d="M243 188 l3 -9 h6 l-3 9 z" fill="#18161F" />
        <rect x="24" y="204" width="316" height="12" rx="6" fill="#18161F" />
        <rect x="48" y="216" width="8" height="30" rx="3" fill="#18161F" />
        <rect x="308" y="216" width="8" height="30" rx="3" fill="#18161F" />
      </svg>
      <Chip className="right-0 top-0">Matched Atlas Freight’s $6,300</Chip>
      <Chip className="left-0 top-[17%]" delay="2.5s">
        Sorted 19 card charges
      </Chip>
      <Chip className="right-[4%] top-[34%]" delay="5s">
        Put $2,803 aside for tax
      </Chip>
    </div>
  );
}

const FEED_ROWS = [
  ["ADOBE CREATIVE CLOUD", "Software", "−$90"],
  ["STRIPE PAYOUT", "Sales", "+$1,412"],
  ["SHELL 57412", "Vehicle", "−$48"],
];

export function BankScene() {
  const folder = (y: number, fill: string, label: string) => (
    <g>
      <path d={`M236 ${y} h22 l6 6 h30 v26 h-58 z`} fill={fill} stroke="#18161F" strokeWidth="2" strokeLinejoin="round" />
      <text x="265" y={y + 24} textAnchor="middle" className="font-sans" fontSize="10" fontWeight="700" fill="#18161F">
        {label}
      </text>
    </g>
  );
  const slip = (cls: string, stroke: string, delay: string) => (
    <g transform="translate(96 82)">
      <g className={cls} style={{ animationDelay: delay }}>
        <rect width="30" height="20" rx="3" fill="#FFFFFF" stroke="#18161F" strokeWidth="1.8" />
        <path d="M6 7 H24 M6 13 H18" stroke={stroke} strokeWidth="2" />
      </g>
    </g>
  );
  return (
    <>
      <span aria-hidden className={`${s.anim} mt-auto block rounded-2xl bg-bg px-2 pb-1 pt-3`}>
        <svg viewBox="0 0 300 150" width="100%" className="block overflow-visible">
          <path d="M18 62 L64 34 L110 62 Z" fill="#EEE8FF" stroke="#18161F" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="22" y="62" width="84" height="8" fill="#CBC7D3" stroke="#18161F" strokeWidth="2" />
          {[30, 52, 66, 88].map((x) => (
            <rect key={x} x={x} y="70" width="10" height="44" fill="#FFFFFF" stroke="#18161F" strokeWidth="2" />
          ))}
          <rect x="16" y="114" width="96" height="10" rx="2" fill="#CBC7D3" stroke="#18161F" strokeWidth="2" />
          <text x="64" y="56" textAnchor="middle" className="font-display" fontSize="10" fontWeight="800" fill="#18161F">
            BANK
          </text>
          <path d="M112 92 H230" stroke="#C9BCFB" strokeWidth="2" strokeDasharray="5 5" />
          {slip(s.slip1, "#7A5AF8", "0s")}
          {slip(s.slip2, "#E0752D", "1.5s")}
          {slip(s.slip3, "#4F7F49", "3s")}
          {folder(40, "#B9A3FF", "Software")}
          {folder(80, "#F4C3A1", "Travel")}
          {folder(118, "#B6E0AE", "Meals")}
        </svg>
      </span>
      <span aria-hidden className={`${s.anim} flex flex-col gap-2.5 rounded-2xl bg-bg p-3.5`}>
        <span className="flex items-center gap-3">
          <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10 12 4l9 6M5 10v8M19 10v8M9.5 10v8M14.5 10v8M3 20h18" />
            </svg>
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-semibold">Chase ••4417</span>
            <span className="text-xs text-muted">23 new today</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pos-bg px-2.5 py-1 text-xs font-semibold text-pos">
            <span className={`${s.pulse} size-1.5 rounded-full bg-pos`} />
            Connected
          </span>
        </span>
        {FEED_ROWS.map(([n, c, a], i) => (
          <span key={n} className={`${s.rowin} flex items-center gap-2 rounded-[10px] bg-white px-2.5 py-2 text-xs`} style={{ animationDelay: `${i * 0.5}s` }}>
            <span className="min-w-0 flex-1 truncate font-semibold">{n}</span>
            <span className="whitespace-nowrap rounded-full bg-tint px-2 py-0.5 font-semibold">{c}</span>
            <span className="font-bold tabular">{a}</span>
          </span>
        ))}
      </span>
    </>
  );
}

export function BillScene() {
  return (
    <>
      <span aria-hidden className={`${s.anim} mt-auto block rounded-2xl bg-bg px-2 pb-1 pt-3`}>
        <svg viewBox="0 0 300 150" width="100%" className="block overflow-visible">
          <rect x="20" y="58" width="88" height="58" rx="6" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.5" />
          <rect x="30" y="66" width="68" height="42" rx="3" fill="#EEE8FF" />
          <path d="M38 76 H72 M38 86 H88 M38 96 H62" stroke="#7A5AF8" strokeWidth="3" strokeLinecap="round" />
          <path d="M10 116 H118 L110 126 H18 Z" fill="#CBC7D3" stroke="#18161F" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="198" y="64" width="90" height="62" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.5" />
          <path d="M192 50 H294 L288 66 H198 Z" fill="#B9A3FF" stroke="#18161F" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M210 50 L206 66 M228 50 L226 66 M246 50 L246 66 M264 50 L266 66 M282 50 L286 66" stroke="#18161F" strokeWidth="2" />
          <rect x="208" y="80" width="34" height="26" rx="2" fill="#EEE8FF" stroke="#18161F" strokeWidth="2" />
          <rect x="252" y="82" width="24" height="44" rx="2" fill="#FDE6D6" stroke="#18161F" strokeWidth="2" />
          <text x="243" y="44" textAnchor="middle" className="font-hand" fontSize="16" fontWeight="700" fill="#18161F">
            Atlas Freight
          </text>
          <g transform="translate(96 58)">
            <g className={`${s.c} ${s.plane}`}>
              <path d="M0 10 L26 0 L18 22 L13 14 Z" fill="#FFFFFF" stroke="#18161F" strokeWidth="2" strokeLinejoin="round" />
              <path d="M13 14 L26 0" stroke="#18161F" strokeWidth="1.6" />
            </g>
          </g>
          <g transform="translate(232 118)">
            <g className={s.payback}>
              <ellipse cx="0" cy="3" rx="11" ry="4.6" fill="#D99A12" />
              <ellipse cx="0" cy="0" rx="11" ry="4.6" fill="#FFC53D" stroke="#18161F" strokeWidth="1.8" />
            </g>
          </g>
          <text x="64" y="146" textAnchor="middle" className={`font-display ${s.plus}`} fontSize="13" fontWeight="800" fill="#2F5711">
            +$6,300
          </text>
        </svg>
      </span>
      <span aria-hidden className={`${s.anim} flex flex-col gap-2.5 rounded-2xl bg-bg p-3.5`}>
        <span className="flex items-center rounded-full bg-white px-3.5 py-[9px] text-[13px] text-ink2">
          <span className={`${s.type6} inline-block max-w-[340px] overflow-hidden whitespace-nowrap`}>
            Bill Atlas Freight <strong className="text-ink">$6,300</strong> for freight
          </span>
          <span className={`${s.caret} ml-0.5 h-[15px] w-0.5 flex-none bg-coming`} />
        </span>
        <span className="flex items-center justify-between gap-2 px-1">
          <span className="flex items-center gap-2 text-[13px] font-semibold">
            <span className="size-2 rounded-full bg-coming" />
            INV-0153
          </span>
          <span className="relative inline-flex justify-end">
            <span className={`${s.swapA} absolute right-0 top-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-info-bg px-2.5 py-1 text-xs font-semibold text-info`}>
              <span className="size-1.5 rounded-full bg-info" />
              Sent
            </span>
            <span className={`${s.swapB} inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-pos-bg px-2.5 py-1 text-xs font-semibold text-pos`}>
              <span className="size-1.5 rounded-full bg-pos" />
              Paid Oct 2
            </span>
          </span>
        </span>
      </span>
    </>
  );
}

export function KeepScene() {
  return (
    <span aria-hidden className="mt-auto flex justify-center rounded-2xl bg-bg px-2 pb-2.5 pt-3.5">
      <CashJar size={260} amount="$8,407" />
    </span>
  );
}

export function PriceTag({ fill, text, size, delay }: { fill: string; text: string; size: number; delay?: string }) {
  return (
    <svg className={`${s.anim} absolute -top-3.5 right-[22px] overflow-visible`} aria-hidden viewBox="0 0 80 110" width="72">
      <g className={`${s.pivot} ${s.swing}`} style={delay ? { animationDelay: delay } : undefined}>
        <path d="M40 0 V26" stroke="#18161F" strokeWidth="2" />
        <path d="M24 30 L40 22 L56 30 V96 H24 Z" fill={fill} stroke="#18161F" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="40" cy="34" r="4" fill="#FFFFFF" stroke="#18161F" strokeWidth="2" />
        <text x="40" y="68" textAnchor="middle" className="font-hand" fontSize={size} fontWeight="700" fill="#18161F">
          {text}
        </text>
      </g>
    </svg>
  );
}

export function ThinkingPerson() {
  return (
    <svg className={`${s.anim} block w-full max-w-[280px] overflow-visible`} aria-hidden viewBox="0 0 240 200">
      <circle cx="110" cy="120" r="78" fill="#FDE6D6" />
      <path d="M44 200 C44 154 72 138 110 138 C148 138 176 154 176 200 Z" fill="#7A5AF8" stroke="#18161F" strokeWidth="2.5" />
      <rect x="100" y="116" width="20" height="24" fill="#8D5A3B" stroke="#18161F" strokeWidth="2.2" />
      <circle cx="110" cy="96" r="28" fill="#8D5A3B" stroke="#18161F" strokeWidth="2.5" />
      <path d="M82 92 C80 70 96 62 112 62 C130 62 140 74 138 90 C130 80 116 78 104 80 C94 82 86 86 82 92 Z" fill="#18161F" />
      <circle cx="100" cy="98" r="3" fill="#18161F" />
      <circle cx="122" cy="98" r="3" fill="#18161F" />
      <path d="M104 110 q6 3 12 0" fill="none" stroke="#18161F" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M150 176 C150 150 142 130 130 118" fill="none" stroke="#18161F" strokeWidth="2.5" />
      <circle cx="128" cy="116" r="9" fill="#8D5A3B" stroke="#18161F" strokeWidth="2.2" />
      <g className={s.q}>
        <path
          d="M156 26 h52 a12 12 0 0 1 12 12 v26 a12 12 0 0 1 -12 12 h-30 l-12 12 v-12 h-10 a12 12 0 0 1 -12 -12 v-26 a12 12 0 0 1 12 -12 z"
          fill="#FFFFFF"
          stroke="#18161F"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <text x="182" y="62" textAnchor="middle" className="font-display" fontSize="30" fontWeight="800" fill="#7A5AF8">
          ?
        </text>
      </g>
      <g className={`${s.c} ${s.ans}`}>
        <circle cx="40" cy="44" r="22" fill="#B9A3FF" stroke="#18161F" strokeWidth="2.5" />
        <path d="M30 44 l7 7 l13 -14" fill="none" stroke="#18161F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
