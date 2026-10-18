import { cx } from "@/components/ui";
import s from "./product.module.css";

/** A spreadsheet, boxes travelling along a dashed path, and the BillingEase window (prototype SiteSwitch hero). Decorative. */
export function MoveScene({ inAmt, outAmt, keepAmt, from }: { inAmt: string; outAmt: string; keepAmt: string; from: string }) {
  const box = (fill: string, delay: string) => (
    <g transform="translate(160 140)">
      <g className={s.box} style={{ animationDelay: delay }}>
        <path d="M0 8 L16 0 L32 8 V30 L16 38 L0 30 Z" fill={fill} stroke="#18161F" strokeWidth="2" strokeLinejoin="round" />
        <path d="M0 8 L16 16 L32 8 M16 16 V38" fill="none" stroke="#18161F" strokeWidth="2" strokeLinejoin="round" />
      </g>
    </g>
  );
  return (
    <div aria-hidden className="mx-auto min-w-0 max-w-[520px] flex-[1_1_400px]">
      <svg viewBox="0 0 460 320" width="100%" className="block overflow-visible">
        <circle cx="240" cy="170" r="140" fill="#EEE8FF" />
        <g transform="translate(10 70)">
          <rect width="150" height="170" rx="14" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.5" />
          <rect x="0" y="0" width="150" height="26" rx="14" fill="#E2DFE8" stroke="#18161F" strokeWidth="2.5" />
          <rect x="2" y="16" width="146" height="10" fill="#E2DFE8" />
          <circle cx="16" cy="13" r="4" fill="#FFFFFF" stroke="#18161F" strokeWidth="1.6" />
          <circle cx="30" cy="13" r="4" fill="#FFFFFF" stroke="#18161F" strokeWidth="1.6" />
          <path d="M0 52 H150 M0 78 H150 M0 104 H150 M0 130 H150 M50 26 V170 M100 26 V170" stroke="#CBC7D3" strokeWidth="1.5" />
          <path d="M10 40 h30 M60 40 h28 M110 40 h30 M10 66 h24 M60 66 h32 M110 66 h20 M10 92 h34 M60 92 h22 M110 92 h28 M10 118 h20 M60 118 h30 M110 118 h24" stroke="#8E8A97" strokeWidth="4" strokeLinecap="round" />
          <rect x="104" y="136" width="42" height="28" rx="4" fill="#FFF0B8" stroke="#18161F" strokeWidth="1.6" />
          <text x="125" y="155" textAnchor="middle" className="font-sans" fontSize="11" fontWeight="700" fill="#18161F">
            =SUM
          </text>
          <text x="75" y="198" textAnchor="middle" className="font-hand" fontSize="20" fontWeight="700" fill="#18161F">
            {from}
          </text>
        </g>
        <path d="M168 160 H282" stroke="#B9A3FF" strokeWidth="2.5" strokeDasharray="6 6" />
        {box("#E7B98A", "0s")}
        {box("#B9A3FF", "1.4s")}
        {box("#FDE6D6", "2.8s")}
        <g transform="translate(290 40)">
          <rect width="160" height="230" rx="16" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.5" />
          <rect x="14" y="14" width="20" height="20" rx="6" fill="#18161F" />
          <rect x="17" y="17" width="14" height="4" rx="2" fill="#B9A3FF" />
          <rect x="23" y="22" width="8" height="4" rx="2" fill="#E0752D" />
          <rect x="17" y="27" width="6" height="4" rx="2" fill="#FFFFFF" />
          <text x="42" y="29" className="font-display" fontSize="12" fontWeight="700" fill="#18161F">
            BillingEase
          </text>
          {[
            [46, "#7A5AF8", "Coming in", inAmt, "#F7F6F9", "#18161F", "#18161F"],
            [92, "#E0752D", "Going out", outAmt, "#F7F6F9", "#18161F", "#18161F"],
            [138, "#B9A3FF", "Yours to keep", keepAmt, "#18161F", "#EEE8FF", "#B9A3FF"],
          ].map(([y, dot, l, v, bg, ink, num]) => (
            <g key={l as string}>
              <rect x="14" y={y as number} width="132" height="40" rx="10" fill={bg as string} />
              <circle cx="26" cy={(y as number) + 12} r="4" fill={dot as string} />
              <text x="34" y={(y as number) + 16} className="font-sans" fontSize="10" fontWeight="700" fill={ink as string}>
                {l}
              </text>
              <text x="26" y={(y as number) + 34} className="font-display" fontSize="13" fontWeight="700" fill={num as string}>
                {v}
              </text>
            </g>
          ))}
          <rect x="14" y="190" width="132" height="24" rx="12" fill="#E2F6D5" />
          <text x="80" y="206" textAnchor="middle" className={cx("font-sans", s.blink)} fontSize="10" fontWeight="700" fill="#2F5711">
            Right from your start date
          </text>
        </g>
      </svg>
    </div>
  );
}

/** A person with a box and an invoice chip (prototype SiteSwitch testimonial). Decorative. */
export function MoverPerson({ chip }: { chip: string }) {
  return (
    <div aria-hidden className="mx-auto min-w-[180px] max-w-[260px] flex-[0_1_240px]">
      <svg viewBox="0 0 240 230" width="100%" className="block overflow-visible">
        <circle cx="120" cy="120" r="100" fill="#FFFFFF" />
        <path d="M44 228 C44 180 74 160 120 160 C166 160 196 180 196 228 Z" fill="#E0752D" stroke="#18161F" strokeWidth="2.5" />
        <rect x="108" y="134" width="24" height="28" fill="#A86B4C" stroke="#18161F" strokeWidth="2.2" />
        <circle cx="120" cy="108" r="34" fill="#A86B4C" stroke="#18161F" strokeWidth="2.5" />
        <path d="M84 110 C78 70 104 60 124 62 C150 64 162 84 156 110 C150 92 136 84 118 86 C102 88 90 98 84 110 Z" fill="#2B2233" stroke="#18161F" strokeWidth="2" />
        <path d="M84 110 C80 130 84 150 92 160" fill="none" stroke="#2B2233" strokeWidth="10" strokeLinecap="round" />
        <path d="M104 110 q5 -4 10 0 M128 110 q5 -4 10 0" fill="none" stroke="#18161F" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M110 124 q10 8 20 0" fill="none" stroke="#18161F" strokeWidth="2.2" strokeLinecap="round" />
        <g transform="translate(160 28)">
          <g className={s.bob}>
            <rect width="70" height="44" rx="10" fill="#18161F" />
            <text x="35" y="19" textAnchor="middle" className="font-sans" fontSize="10" fontWeight="700" fill="#EEE8FF">
              {chip}
            </text>
            <text x="35" y="34" textAnchor="middle" className="font-sans" fontSize="9" fontWeight="600" fill="#B9A3FF">
              first one
            </text>
          </g>
        </g>
        <g transform="translate(4 40)">
          <g className={s.bob} style={{ animationDelay: "-1.7s" }}>
            <path d="M0 8 L20 0 L40 8 V34 L20 42 L0 34 Z" fill="#E7B98A" stroke="#18161F" strokeWidth="2" strokeLinejoin="round" />
            <path d="M0 8 L20 16 L40 8 M20 16 V42" fill="none" stroke="#18161F" strokeWidth="2" />
          </g>
        </g>
      </svg>
    </div>
  );
}
