import { useId } from "react";
import s from "./audience.module.css";

/**
 * Hero for /countries: a globe with two pins (the UK and Sri Lanka), a £ coin
 * and an Rs coin, and one ledger per country. Adapted from prototype
 * SiteGlobal (no currency conversion: each business keeps one currency).
 */
export function GlobeScene({ hand }: { hand: string }) {
  const clip = "gl" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg viewBox="0 0 520 430" width="100%" className="block overflow-visible" aria-hidden>
      <circle cx="270" cy="206" r="166" fill="#FFF0B8" />
      <circle cx="440" cy="290" r="36" fill="#EEE8FF" />
      <ellipse cx="270" cy="372" rx="110" ry="10" fill="#18161F" opacity="0.08" />
      <clipPath id={clip}>
        <circle cx="270" cy="206" r="112" />
      </clipPath>
      <g>
        <circle cx="270" cy="206" r="112" fill="#E1EEF8" stroke="#18161F" strokeWidth="3" />
        <g clipPath={`url(#${clip})`} fill="#B6E0AE" stroke="#18161F" strokeWidth="2.5" strokeLinejoin="round">
          {/* stylised land: Europe and the British Isles top left, India and Sri Lanka bottom right */}
          <path d="M196 120 c10 -14 24 -10 30 2 c6 12 -4 20 -12 26 c-8 6 -20 4 -24 -6 c-3 -8 0 -16 6 -22 z" />
          <path d="M176 112 c6 -6 14 -4 14 4 c0 8 -6 12 -10 18 c-4 6 -12 4 -12 -2 c0 -8 4 -14 8 -20 z" fill="#B9A3FF" />
          <path d="M240 110 c30 -10 70 -6 96 10 c18 12 14 30 -6 36 c-22 6 -34 -6 -52 -2 c-16 4 -30 0 -40 -12 c-8 -10 -6 -26 2 -32 z" />
          <path d="M300 180 c14 -6 34 -2 40 12 c6 14 -6 32 -16 46 c-6 8 -14 6 -18 -2 c-6 -14 -16 -24 -16 -36 c0 -10 4 -16 10 -20 z" />
          <path d="M332 252 c6 -4 12 0 12 6 c0 8 -6 14 -10 12 c-6 -2 -6 -12 -2 -18 z" fill="#FDE6D6" />
          <path d="M180 220 c16 -8 34 0 38 16 c4 18 -10 34 -24 42 c-12 6 -22 -4 -24 -16 c-2 -14 0 -34 10 -42 z" />
        </g>
        <circle cx="270" cy="206" r="112" fill="none" stroke="#18161F" strokeWidth="3" />
        <path d="M158 206 H382 M270 94 C230 140 230 272 270 318 M270 94 C310 140 310 272 270 318" fill="none" stroke="#18161F" strokeWidth="1.5" opacity="0.25" />
      </g>
      {/* pins */}
      <g className={s.bob}>
        <path d="M182 118 c0 -14 22 -14 22 0 c0 10 -11 22 -11 22 s-11 -12 -11 -22 z" fill="#7A5AF8" stroke="#18161F" strokeWidth="2.5" />
        <circle cx="193" cy="117" r="4" fill="#FFFFFF" />
        <rect x="132" y="72" width="62" height="26" rx="13" fill="#18161F" />
        <text x="163" y="89" textAnchor="middle" className="font-sans" fontSize="12" fontWeight="700" fill="#FFFFFF">
          UK
        </text>
      </g>
      <g className={s.bob} style={{ animationDelay: "-3s" }}>
        <path d="M327 254 c0 -14 22 -14 22 0 c0 10 -11 22 -11 22 s-11 -12 -11 -22 z" fill="#E0752D" stroke="#18161F" strokeWidth="2.5" />
        <circle cx="338" cy="253" r="4" fill="#FFFFFF" />
        <rect x="350" y="276" width="92" height="26" rx="13" fill="#FFFFFF" stroke="#18161F" strokeWidth="2" />
        <text x="396" y="293" textAnchor="middle" className="font-sans" fontSize="12" fontWeight="700" fill="#18161F">
          Sri Lanka
        </text>
      </g>
      {/* coins */}
      <g className={s.float}>
        <circle cx="96" cy="196" r="30" fill="#B9A3FF" stroke="#18161F" strokeWidth="3" />
        <circle cx="96" cy="196" r="21" fill="none" stroke="#18161F" strokeWidth="1.5" opacity="0.4" />
        <text x="96" y="205" textAnchor="middle" className="font-display" fontSize="24" fontWeight="800" fill="#18161F">
          £
        </text>
      </g>
      <g className={s.float} style={{ animationDelay: "-3.5s" }}>
        <circle cx="440" cy="132" r="30" fill="#F4C3A1" stroke="#18161F" strokeWidth="3" />
        <circle cx="440" cy="132" r="21" fill="none" stroke="#18161F" strokeWidth="1.5" opacity="0.4" />
        <text x="440" y="139" textAnchor="middle" className="font-display" fontSize="17" fontWeight="800" fill="#18161F">
          Rs
        </text>
      </g>
      {/* two ledgers, one each */}
      <g transform="rotate(-6 110 320)">
        <rect x="64" y="282" width="92" height="66" rx="8" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.5" />
        <rect x="64" y="282" width="92" height="16" rx="8" fill="#B9A3FF" stroke="#18161F" strokeWidth="2.5" />
        <path d="M76 312 H144 M76 324 H130 M76 336 H138" stroke="#E2DFE8" strokeWidth="5" strokeLinecap="round" />
      </g>
      <text x="290" y="404" className="font-hand" fontSize="26" fontWeight="700" fill="#18161F">
        {hand}
      </text>
      <path d="M284 396 q-40 4 -112 -40" fill="none" stroke="#18161F" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
