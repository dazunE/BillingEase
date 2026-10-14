import { cx } from "@/components/ui";
import s from "./product.module.css";

/** Three swinging price tags on a line with a coin stack (prototype SitePricing hero). Decorative. */
export function PriceTags({ mid, right, note }: { mid: string; right: string; note: string }) {
  const tag = (x: number, len: number, w: number, h: number, fill: string, delay: string, big: string, small: string, sub?: string) => (
    <g transform={`translate(${x} 34)`}>
      <g className={s.swing} style={{ animationDelay: delay }}>
        <path d={`M30 0 V${len}`} stroke="#18161F" strokeWidth="2" />
        <path d={`M${30 - w / 2} ${len + 6} L30 ${len - 6} L${30 + w / 2} ${len + 6} V${len + h} H${30 - w / 2} Z`} fill={fill} stroke="#18161F" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="30" cy={len + 10} r="4.5" fill="#FFFFFF" stroke="#18161F" strokeWidth="2" />
        <text x="30" y={len + 52} textAnchor="middle" className="font-hand" fontSize={big.length > 5 ? 20 : 28} fontWeight="700" fill="#18161F">
          {big}
        </text>
        <text x="30" y={len + 78} textAnchor="middle" className="font-sans" fontSize="10" fontWeight="700" fill="#18161F">
          {small}
        </text>
        {sub && (
          <text x="30" y={len + 94} textAnchor="middle" className="font-sans" fontSize="9" fontWeight="600" fill="#18161F">
            {sub}
          </text>
        )}
      </g>
    </g>
  );
  return (
    <div aria-hidden className="hidden min-w-[260px] flex-[0_1_440px] sm:block">
      <svg viewBox="0 0 380 260" width="100%" className="block overflow-visible">
        <circle cx="190" cy="150" r="104" fill="#EEE8FF" />
        <path d="M30 34 H350" stroke="#18161F" strokeWidth="3" strokeLinecap="round" />
        <circle cx="30" cy="34" r="6" fill="#18161F" />
        <circle cx="350" cy="34" r="6" fill="#18161F" />
        {tag(70, 24, 44, 98, "#FFF6E0", "0s", "free", "FREE")}
        {tag(160, 44, 56, 122, "#B9A3FF", "-1.2s", mid, "A MONTH", "placeholder")}
        {tag(250, 28, 48, 106, "#FDE6D6", "-2.4s", right, "PER CLIENT")}
        <g transform="translate(316 226)">
          <g className={s.bob}>
            <ellipse cx="0" cy="6" rx="18" ry="7" fill="#D99A12" />
            <ellipse cx="0" cy="0" rx="18" ry="7" fill="#FFC53D" stroke="#18161F" strokeWidth="2" />
            <ellipse cx="6" cy="-10" rx="18" ry="7" fill="#D99A12" />
            <ellipse cx="6" cy="-16" rx="18" ry="7" fill="#FFC53D" stroke="#18161F" strokeWidth="2" />
          </g>
        </g>
        <text x="58" y="236" className="font-hand" fontSize="22" fontWeight="700" fill="#18161F">
          {note}
        </text>
      </svg>
    </div>
  );
}

/** Two people and a speech bubble (prototype sales band). Decorative. */
export function SalesPeople() {
  return (
    <div aria-hidden className="min-w-[160px] max-w-[240px] flex-[0_1_220px]">
      <svg viewBox="0 0 220 170" width="100%" className="block overflow-visible">
        <circle cx="110" cy="96" r="70" fill="#FFFFFF" />
        <path d="M40 166 C40 134 58 120 80 120 C102 120 120 134 120 166 Z" fill="#7A5AF8" stroke="#18161F" strokeWidth="2.5" />
        <circle cx="80" cy="96" r="20" fill="#C68B6E" stroke="#18161F" strokeWidth="2.5" />
        <path d="M60 92 C60 76 72 70 82 70 C94 70 102 78 100 92 C92 84 76 82 60 92 Z" fill="#2B2233" />
        <path d="M100 166 C100 138 118 126 140 126 C162 126 180 138 180 166 Z" fill="#E0752D" stroke="#18161F" strokeWidth="2.5" />
        <circle cx="140" cy="104" r="20" fill="#8D5A3B" stroke="#18161F" strokeWidth="2.5" />
        <path d="M120 100 C118 84 130 78 142 78 C154 78 162 88 160 100 C150 92 132 90 120 100 Z" fill="#18161F" />
        <g className={cx(s.bob)}>
          <path d="M128 18 h64 a12 12 0 0 1 12 12 v22 a12 12 0 0 1 -12 12 h-36 l-12 12 v-12 h-16 a12 12 0 0 1 -12 -12 v-22 a12 12 0 0 1 12 -12 z" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.5" strokeLinejoin="round" />
          <text x="160" y="47" textAnchor="middle" className="font-hand" fontSize="20" fontWeight="700" fill="#18161F">
            20 min?
          </text>
        </g>
      </svg>
    </div>
  );
}
