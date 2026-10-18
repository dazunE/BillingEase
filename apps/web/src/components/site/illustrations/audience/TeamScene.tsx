import { useId } from "react";
import s from "./audience.module.css";

export type TeamSceneText = {
  docTitle: string;
  docSub: string;
  rows: [string, string][];
  total: string;
  stamp: string;
  /** Four labels, clockwise from top left. */
  people: [string, string, string, string];
  note: string;
  hand: string;
};

type Face = { bg: string; shirt: string; skin: string; hair: string; hairD: string; glasses?: boolean };
const FACES: Face[] = [
  { bg: "#EEE8FF", shirt: "#7A5AF8", skin: "#B97A55", hair: "#2A1A12", hairD: "M-15 -4 C-16 -18 -6 -22 0 -22 C8 -22 16 -18 15 -4 C10 -12 4 -14 -2 -14 C-8 -13 -12 -10 -15 -4 Z" },
  { bg: "#FDE6D6", shirt: "#E0752D", skin: "#8D5A3B", hair: "#18161F", hairD: "M-14 -8 C-14 -20 14 -20 14 -8 C8 -14 -8 -14 -14 -8 Z" },
  { bg: "#E2DFE8", shirt: "#18161F", skin: "#F1C7A3", hair: "#B0703C", hairD: "M-15 -4 C-16 -18 -6 -22 0 -22 C8 -22 16 -18 15 -4 C8 -14 -8 -14 -15 -4 Z", glasses: true },
  { bg: "#FFF0B8", shirt: "#B6E0AE", skin: "#C98E66", hair: "#18161F", hairD: "M-15 -4 C-16 -18 -6 -22 0 -22 C8 -22 16 -18 15 -4 C8 -12 -6 -12 -15 -4 Z" },
];
const SPOTS: [number, number][] = [
  [88, 92],
  [436, 92],
  [436, 330],
  [88, 330],
];

/**
 * Hero for /for/small-businesses: a pay run in the middle, approved, with the
 * owner, office admin, accountant and staff around it. Adapted from prototype
 * SiteTeams (the bill becomes a pay run; approval is the owner's).
 */
export function TeamScene({ t }: { t: TeamSceneText }) {
  const clip = "tm" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg viewBox="0 0 520 430" width="100%" className="block overflow-visible" aria-hidden>
      <defs>
        <clipPath id={clip}>
          <circle cx="0" cy="0" r="36" />
        </clipPath>
      </defs>
      <circle cx="262" cy="214" r="176" fill="#E2F6D5" />
      <circle cx="70" cy="200" r="34" fill="#EEE8FF" />
      <path
        className={s.dash}
        d="M120 112 C170 130 190 150 214 168 M404 112 C356 130 336 150 310 168 M120 316 C170 300 190 284 214 268 M404 316 C356 300 336 284 310 268"
        fill="none"
        stroke="#18161F"
        strokeWidth="2"
        opacity="0.45"
      />
      <g className={s.bob} style={{ animationDuration: "7s" }}>
        <rect x="184" y="120" width="156" height="188" rx="12" fill="#18161F" opacity="0.07" transform="translate(6 8)" />
        <rect x="184" y="120" width="156" height="188" rx="12" fill="#FFFFFF" stroke="#18161F" strokeWidth="3" />
        <text x="200" y="146" className="font-display" fontSize="11" fontWeight="800" fill="#18161F" letterSpacing="1">
          {t.docTitle}
        </text>
        <text x="200" y="164" className="font-sans" fontSize="11" fontWeight="700" fill="#5F5B68">
          {t.docSub}
        </text>
        {t.rows.map(([l, v], i) => (
          <g key={l}>
            <text x="200" y={190 + i * 18} className="font-sans" fontSize="10" fill="#47444F">
              {l}
            </text>
            <text x="324" y={190 + i * 18} textAnchor="end" className="font-sans" fontSize="10" fontWeight="700" fill="#18161F">
              {v}
            </text>
          </g>
        ))}
        <path d="M200 250 H324" stroke="#E2DFE8" strokeWidth="2" />
        <text x="200" y="280" className="font-sans" fontSize="11" fontWeight="600" fill="#5F5B68">
          Total
        </text>
        <text x="324" y="282" textAnchor="end" className="font-display" fontSize="16" fontWeight="800" fill="#18161F">
          {t.total}
        </text>
        <g transform="rotate(-12 262 210)">
          <g className={`${s.c} ${s.stamp}`} style={{ animationDuration: "8s", animationDelay: "1s" }}>
            <rect x="206" y="192" width="112" height="36" rx="8" fill="#E2F6D5" fillOpacity="0.94" stroke="#2F5711" strokeWidth="3" />
            <text x="262" y="216" textAnchor="middle" className="font-display" fontSize="15" fontWeight="800" fill="#2F5711" letterSpacing="1.2">
              {t.stamp}
            </text>
          </g>
        </g>
      </g>
      {SPOTS.map(([x, y], i) => {
        const f = FACES[i];
        const label = t.people[i];
        const w = Math.max(72, label.length * 7.4 + 24);
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <g clipPath={`url(#${clip})`}>
              <circle r="36" fill={f.bg} />
              <path d="M-26 40 C-26 20 -14 14 0 14 C14 14 26 20 26 40 Z" fill={f.shirt} stroke="#18161F" strokeWidth="2.2" />
              <circle cx="0" cy="-4" r="14" fill={f.skin} stroke="#18161F" strokeWidth="2.2" />
              <path d={f.hairD} fill={f.hair} />
              {f.glasses && (
                <g fill="none" stroke="#18161F" strokeWidth="1.8">
                  <circle cx="-6" cy="-3" r="5" />
                  <circle cx="7" cy="-3" r="5" />
                </g>
              )}
            </g>
            <circle r="36" fill="none" stroke="#18161F" strokeWidth="2.5" />
            <rect x={-w / 2} y="44" width={w} height="26" rx="13" fill={i === 0 ? "#18161F" : "#FFFFFF"} stroke="#18161F" strokeWidth="2" />
            <text x="0" y="61" textAnchor="middle" className="font-sans" fontSize="12" fontWeight="700" fill={i === 0 ? "#FFFFFF" : "#18161F"}>
              {label}
            </text>
          </g>
        );
      })}
      <g className={s.pop} style={{ animationDuration: "8s" }}>
        <rect x="140" y="12" width="246" height="40" rx="20" fill="#FFFFFF" stroke="#E2DFE8" strokeWidth="2" />
        <circle cx="162" cy="32" r="6" fill="#E0752D" />
        <text x="176" y="37" className="font-sans" fontSize="13" fontWeight="700" fill="#18161F">
          {t.note}
        </text>
      </g>
      <text x="186" y="352" className="font-hand" fontSize="25" fontWeight="700" fill="#18161F">
        {t.hand}
      </text>
      <path d="M232 330 q-10 -14 -2 -24" fill="none" stroke="#18161F" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
