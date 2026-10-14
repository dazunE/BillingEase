import s from "./audience.module.css";


export type SoleTraderSceneText = {
  /** Ring label, e.g. "Q2" or "VAT". */
  ring: string;
  ringSub: string;
  invTitle: string;
  invNo: string;
  customer: string;
  lines: [string, string][];
  total: string;
  stamp: string;
  pill: string;
  hand: string;
};

/**
 * Hero for /for/sole-traders: a quarter ring filling up, an invoice stamped
 * PAID, a sketchbook and pencil (the work itself) and a payment being
 * recorded. Adapted from prototype SiteFreelancers (no timers, no card payments).
 */
export function SoleTraderScene({ t }: { t: SoleTraderSceneText }) {
  return (
    <svg viewBox="0 0 520 430" width="100%" className="block overflow-visible" aria-hidden>
      <circle cx="282" cy="222" r="176" fill="#EEE8FF" />
      <circle cx="92" cy="96" r="58" fill="#FDE6D6" />
      {/* the quarter, filling up */}
      <g className={s.bob}>
        <circle cx="94" cy="100" r="50" fill="#FFFFFF" stroke="#18161F" strokeWidth="3" />
        <circle cx="94" cy="100" r="38" fill="none" stroke="#EFEDF3" strokeWidth="8" />
        <path d="M94 62 A38 38 0 1 1 56 100" fill="none" stroke="#7A5AF8" strokeWidth="8" strokeLinecap="round" />
        <text x="94" y="104" textAnchor="middle" className="font-display" fontSize="20" fontWeight="800" fill="#18161F">
          {t.ring}
        </text>
        <text x="94" y="122" textAnchor="middle" className="font-sans" fontSize="10" fontWeight="700" fill="#5F5B68">
          {t.ringSub}
        </text>
      </g>
      {/* invoice */}
      <g transform="rotate(4 390 170)">
        <rect x="306" y="40" width="176" height="236" rx="12" fill="#18161F" opacity="0.07" transform="translate(6 8)" />
        <rect x="306" y="40" width="176" height="236" rx="12" fill="#FFFFFF" stroke="#18161F" strokeWidth="3" />
        <rect x="322" y="56" width="28" height="28" rx="9" fill="#B9A3FF" stroke="#18161F" strokeWidth="2" />
        <path d="M330 78 l5 -15 h8 l-5 15 z" fill="#18161F" />
        <text x="466" y="68" textAnchor="end" className="font-display" fontSize="10" fontWeight="800" fill="#18161F" letterSpacing="1">
          {t.invTitle}
        </text>
        <text x="466" y="82" textAnchor="end" className="font-sans" fontSize="10" fontWeight="600" fill="#5F5B68">
          {t.invNo}
        </text>
        <text x="322" y="108" className="font-sans" fontSize="11" fontWeight="700" fill="#18161F">
          {t.customer}
        </text>
        {t.lines.map(([l, v], i) => (
          <g key={l}>
            <text x="322" y={134 + i * 20} className="font-sans" fontSize="10" fill="#47444F">
              {l}
            </text>
            <text x="466" y={134 + i * 20} textAnchor="end" className="font-sans" fontSize="10" fontWeight="700" fill="#18161F">
              {v}
            </text>
          </g>
        ))}
        <path d="M322 192 H466" stroke="#E2DFE8" strokeWidth="2" />
        <text x="322" y="222" className="font-sans" fontSize="11" fontWeight="600" fill="#5F5B68">
          Total
        </text>
        <text x="466" y="224" textAnchor="end" className="font-display" fontSize="20" fontWeight="800" fill="#18161F">
          {t.total}
        </text>
        <g transform="rotate(-14 420 150)">
          <g className={`${s.c} ${s.stamp}`}>
            <rect x="372" y="128" width="92" height="40" rx="9" fill="#E2F6D5" fillOpacity="0.92" stroke="#2F5711" strokeWidth="3.5" />
            <text x="418" y="156" textAnchor="middle" className="font-display" fontSize="21" fontWeight="800" fill="#2F5711" letterSpacing="1.5">
              {t.stamp}
            </text>
          </g>
        </g>
      </g>
      {/* sketchbook and pencil: the work */}
      <g className={s.bob} style={{ animationDuration: "7s", animationDelay: "-2.4s" }}>
        <ellipse cx="170" cy="392" rx="120" ry="12" fill="#18161F" opacity="0.08" />
        <rect x="56" y="214" width="236" height="166" rx="18" fill="#18161F" />
        <rect x="68" y="226" width="212" height="142" rx="10" fill="#FFFFFF" stroke="#18161F" strokeWidth="2" />
        <path d="M86 340 C110 270 150 250 176 300 C196 338 232 330 258 252" fill="none" stroke="#7A5AF8" strokeWidth="5" strokeLinecap="round" />
        <circle cx="120" cy="268" r="18" fill="#FDE6D6" stroke="#18161F" strokeWidth="2.5" />
        <rect x="200" y="300" width="56" height="40" rx="8" fill="#B9A3FF" stroke="#18161F" strokeWidth="2.5" />
        <g transform="rotate(-38 250 250)">
          <rect x="236" y="196" width="18" height="96" rx="4" fill="#FFF0B8" stroke="#18161F" strokeWidth="2.5" />
          <path d="M236 292 l9 18 l9 -18 z" fill="#F4C3A1" stroke="#18161F" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="236" y="196" width="18" height="14" rx="3" fill="#E0752D" stroke="#18161F" strokeWidth="2.5" />
        </g>
      </g>
      {/* payment recorded */}
      <g className={s.pop} style={{ animationDelay: "1.2s" }}>
        <rect x="270" y="312" width="236" height="46" rx="23" fill="#FFFFFF" stroke="#E2DFE8" strokeWidth="2" />
        <circle cx="294" cy="335" r="12" fill="#E2F6D5" />
        <path d="M288 335 l4 4 l8 -9" fill="none" stroke="#2F5711" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <text x="314" y="340" className="font-sans" fontSize="14" fontWeight="700" fill="#18161F">
          {t.pill}
        </text>
      </g>
      <text x="300" y="404" className="font-hand" fontSize="26" fontWeight="700" fill="#18161F">
        {t.hand}
      </text>
      <path d="M268 396 q-16 -6 -22 -24" fill="none" stroke="#18161F" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
