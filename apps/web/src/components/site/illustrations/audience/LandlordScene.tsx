import s from "./audience.module.css";

export type LandlordSceneText = {
  /** Rent tag on the door, e.g. "£800". */
  rent: string;
  /** Share badge, e.g. "50%". */
  share: string;
  /** Envelope label for the mortgage interest kept apart. */
  envelope: string;
  pill: string;
  pillAmount: string;
  hand: string;
};

/**
 * Hero for /for/landlords: a terrace house with two flats, a swinging rent
 * tag, a key, the ownership share and an envelope holding mortgage interest
 * apart. Adapted from prototype SiteShops' shelf scene.
 */
export function LandlordScene({ t }: { t: LandlordSceneText }) {
  return (
    <svg viewBox="0 0 520 430" width="100%" className="block overflow-visible" aria-hidden>
      <circle cx="300" cy="200" r="168" fill="#FDE6D6" />
      <circle cx="452" cy="72" r="44" fill="#EEE8FF" />
      <ellipse cx="270" cy="372" rx="190" ry="12" fill="#18161F" opacity="0.08" />
      {/* the house */}
      <g>
        <path d="M150 170 L280 70 L410 170" fill="#B9A3FF" stroke="#18161F" strokeWidth="3" strokeLinejoin="round" />
        <rect x="350" y="84" width="26" height="50" fill="#E0752D" stroke="#18161F" strokeWidth="3" />
        <rect x="166" y="160" width="228" height="206" fill="#FFFFFF" stroke="#18161F" strokeWidth="3" />
        <path d="M166 262 H394" stroke="#18161F" strokeWidth="2.5" />
        {/* windows */}
        <rect x="190" y="186" width="54" height="50" rx="6" fill="#EEE8FF" stroke="#18161F" strokeWidth="2.5" />
        <path d="M217 186 V236 M190 211 H244" stroke="#18161F" strokeWidth="2" />
        <rect x="316" y="186" width="54" height="50" rx="6" fill="#FFF0B8" stroke="#18161F" strokeWidth="2.5" />
        <path d="M343 186 V236 M316 211 H370" stroke="#18161F" strokeWidth="2" />
        <rect x="190" y="288" width="54" height="50" rx="6" fill="#FFF0B8" stroke="#18161F" strokeWidth="2.5" />
        <path d="M217 288 V338 M190 313 H244" stroke="#18161F" strokeWidth="2" />
        {/* door */}
        <rect x="300" y="286" width="56" height="80" rx="6" fill="#18161F" />
        <circle cx="344" cy="328" r="4" fill="#B9A3FF" />
        <text x="214" y="254" textAnchor="middle" className="font-sans" fontSize="11" fontWeight="700" fill="#18161F">
          Flat 1
        </text>
        <text x="342" y="254" textAnchor="middle" className="font-sans" fontSize="11" fontWeight="700" fill="#18161F">
          Flat 2
        </text>
      </g>
      {/* swinging rent tag */}
      <g className={`${s.top} ${s.sway}`}>
        <path d="M410 170 V196" stroke="#18161F" strokeWidth="2" />
        <path d="M388 200 L410 190 L432 200 V252 H388 Z" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="410" cy="204" r="4" fill="#FDE6D6" stroke="#18161F" strokeWidth="2" />
        <text x="410" y="236" textAnchor="middle" className="font-hand" fontSize="17" fontWeight="700" fill="#18161F">
          {t.rent}
        </text>
      </g>
      {/* ownership share */}
      <g className={s.bob}>
        <circle cx="104" cy="148" r="44" fill="#FFFFFF" stroke="#18161F" strokeWidth="3" />
        <path d="M104 104 A44 44 0 0 1 104 192 Z" fill="#7A5AF8" />
        <circle cx="104" cy="148" r="44" fill="none" stroke="#18161F" strokeWidth="3" />
        <rect x="74" y="200" width="60" height="26" rx="13" fill="#18161F" />
        <text x="104" y="218" textAnchor="middle" className="font-display" fontSize="13" fontWeight="800" fill="#B9A3FF">
          {t.share}
        </text>
      </g>
      {/* key */}
      <g className={s.float} style={{ animationDelay: "-2s" }}>
        <circle cx="88" cy="296" r="20" fill="#FFF0B8" stroke="#18161F" strokeWidth="3" />
        <circle cx="88" cy="296" r="7" fill="#FDE6D6" stroke="#18161F" strokeWidth="2.5" />
        <path d="M108 296 H150 M136 296 v12 M146 296 v9" fill="none" stroke="#18161F" strokeWidth="4" strokeLinecap="round" />
      </g>
      {/* mortgage interest, kept apart */}
      <g className={s.bob} style={{ animationDelay: "-3s" }}>
        <rect x="430" y="276" width="76" height="52" rx="6" fill="#E3C79A" stroke="#18161F" strokeWidth="2.5" />
        <path d="M430 280 L468 306 L506 280" fill="none" stroke="#18161F" strokeWidth="2.5" strokeLinejoin="round" />
        <text x="468" y="346" textAnchor="middle" className="font-hand" fontSize="16" fontWeight="700" fill="#18161F">
          {t.envelope}
        </text>
      </g>
      {/* rent recorded */}
      <g className={s.pop} style={{ animationDelay: "1.2s" }}>
        <rect x="200" y="20" width="232" height="40" rx="20" fill="#18161F" />
        <text x="222" y="45" className="font-sans" fontSize="13" fontWeight="700" fill="#FFFFFF">
          {t.pill}
        </text>
        <text x="418" y="45" textAnchor="end" className="font-sans" fontSize="13" fontWeight="700" fill="#B9A3FF">
          {t.pillAmount}
        </text>
      </g>
      <text x="300" y="414" className="font-hand" fontSize="26" fontWeight="700" fill="#18161F">
        {t.hand}
      </text>
      <path d="M440 398 q18 -10 22 -40" fill="none" stroke="#18161F" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
