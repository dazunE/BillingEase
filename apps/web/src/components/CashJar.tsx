import { useId } from "react";
import styles from "./CashJar.module.css";

/**
 * The cash jar: a mason jar of bills and coins with a hand-written "Yours to
 * keep" label, and a kraft TAX envelope that one coin in four hops into.
 * Port of prototype/CashJar.dc.html. Animations stop under reduced motion.
 */
export function CashJar({
  size = 260,
  amount = "",
  envelope = true,
  line = "#18161F",
  taxPct = "25%",
  label,
  className,
}: {
  /** Rendered width in px (it still shrinks to fit its container). */
  size?: number;
  /** Amount written on the label, e.g. "$8,407". Empty hides the line. */
  amount?: string;
  envelope?: boolean;
  /** Outline color; use "#EEE8FF" on dark backgrounds. */
  line?: string;
  taxPct?: string;
  /** Accessible name. Without one the illustration is decorative (aria-hidden). */
  label?: string;
  className?: string;
}) {
  const clipId = "cj" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const vbW = envelope ? 330 : 200;
  const jar =
    "M58 46 H142 V58 C142 66 166 70 166 98 V214 C166 236 150 250 128 250 H72 C50 250 34 236 34 214 V98 C34 70 58 66 58 58 Z";
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };

  return (
    <svg
      className={[styles.jar, className].filter(Boolean).join(" ")}
      width={size}
      height={Math.round((size * 275) / vbW)}
      viewBox={`0 0 ${vbW} 275`}
      {...a11y}
    >
      <ellipse cx="100" cy="256" rx="74" ry="8" fill="#18161F" opacity="0.10" />
      {envelope && <ellipse cx="267" cy="246" rx="48" ry="6" fill="#18161F" opacity="0.08" />}

      {/* glass back */}
      <path d={jar} fill="#F6F4FF" opacity="0.9" />

      {/* what's inside: a pile of bills and coins */}
      <clipPath id={clipId}>
        <path d={jar} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <g className={styles.settle}>
          {PILE.map(([x, y, r, fill]) => (
            <Bill key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r})`} fill={fill} />
          ))}
          <Coin x={52} y={150} />
          <Coin x={140} y={158} />
          <g transform="translate(112 142)">
            <ellipse cx="0" cy="3" rx="13" ry="5.5" fill="#D99A12" />
            <ellipse cx="0" cy="0" rx="13" ry="5.5" fill="#FFC53D" stroke="#18161F" strokeWidth="1.8" />
            <ellipse cx="0" cy="-5" rx="13" ry="5.5" fill="#FFD465" stroke="#18161F" strokeWidth="1.8" />
          </g>
        </g>
      </g>

      {/* paper label */}
      <g transform="rotate(-5 100 132)">
        <rect x="54" y="98" width="92" height={amount ? 72 : 58} rx="6" fill="#FFF6E0" stroke="#18161F" strokeWidth="2" />
        <text x="100" y="124" textAnchor="middle" className="font-hand" fontSize="24" fontWeight="700" fill="#18161F">
          Yours
        </text>
        <text x="100" y="145" textAnchor="middle" className="font-hand" fontSize="24" fontWeight="700" fill="#18161F">
          to keep
        </text>
        {amount && (
          <text x="100" y="163" textAnchor="middle" className="font-display" fontSize="12" fontWeight="700" fill="#5B3FD6">
            {amount}
          </text>
        )}
      </g>

      {/* glass outline and shine */}
      <path d={jar} fill="none" stroke={line} strokeWidth="3" strokeLinejoin="round" />
      <path d="M46 104 C46 90 52 82 60 78" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
      <path d="M44 120 V196" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
      <path d="M150 112 L156 104 M152 120 L160 112" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" className={styles.glint} />

      {/* lid */}
      <rect x="52" y="20" width="96" height="26" rx="5" fill="#C4BFCE" stroke={line} strokeWidth="2.5" />
      <path d="M64 24 V42 M76 24 V42 M88 24 V42 M100 24 V42 M112 24 V42 M124 24 V42 M136 24 V42" stroke="#8D879B" strokeWidth="2" />
      <rect x="48" y="42" width="104" height="9" rx="3" fill="#9E98AC" stroke={line} strokeWidth="2" />

      {/* money dropping in */}
      <g transform="translate(96 40)">
        <g className={styles.coin}>
          <ellipse cx="0" cy="3" rx="12" ry="5" fill="#D99A12" />
          <ellipse cx="0" cy="0" rx="12" ry="5" fill="#FFC53D" stroke="#18161F" strokeWidth="1.8" />
        </g>
      </g>
      <g transform="translate(78 36)">
        <g className={`${styles.spin} ${styles.bill}`}>
          <rect width="58" height="28" rx="3" fill="#B6E0AE" stroke="#18161F" strokeWidth="1.8" />
          <circle cx="29" cy="14" r="7" fill="#D3EDCE" stroke="#4F7F49" strokeWidth="1.2" />
          <text x="29" y="18" textAnchor="middle" className="font-display" fontSize="9" fontWeight="800" fill="#2F5711">
            $
          </text>
        </g>
      </g>

      {envelope && (
        <g>
          {/* one in four coins hops into the tax envelope */}
          <g transform="translate(100 40)">
            <g className={styles.taxCoin}>
              <ellipse cx="0" cy="3" rx="11" ry="4.6" fill="#D99A12" />
              <ellipse cx="0" cy="0" rx="11" ry="4.6" fill="#FFC53D" stroke="#18161F" strokeWidth="1.8" />
            </g>
          </g>
          <g className={`${styles.spin} ${styles.env}`}>
            <rect x="222" y="176" width="92" height="64" rx="6" fill="#E3C38F" stroke={line} strokeWidth="2.5" />
            <path d="M222 180 L268 212 L314 180" fill="#D3AC70" stroke={line} strokeWidth="2.2" strokeLinejoin="round" />
            <text x="268" y="232" textAnchor="middle" className="font-display" fontSize="14" fontWeight="800" fill="#6B3E0E" letterSpacing="1.5">
              TAX
            </text>
            <circle cx="298" cy="196" r="11" fill="none" stroke="#A8200D" strokeWidth="1.8" />
            <text x="298" y="199" textAnchor="middle" className="font-display" fontSize="7.5" fontWeight="800" fill="#A8200D">
              {taxPct}
            </text>
          </g>
          <text x="268" y="266" textAnchor="middle" className="font-hand" fontSize="20" fontWeight="700" fill={line}>
            set aside
          </text>
        </g>
      )}
    </svg>
  );
}

const PILE: [number, number, number, string][] = [
  [22, 214, -6, "#A9D8A1"],
  [86, 206, 8, "#B6E0AE"],
  [30, 186, 4, "#9FD197"],
  [78, 176, -10, "#B0DCA8"],
  [84, 150, 6, "#A3D49B"],
  [20, 156, -9, "#B3DEAB"],
  [60, 138, -3, "#9DCF95"],
];

function Bill({ transform, fill }: { transform: string; fill: string }) {
  return (
    <g transform={transform}>
      <rect width="96" height="46" rx="4" fill={fill} stroke="#18161F" strokeWidth="2" />
      <rect x="6" y="6" width="84" height="34" rx="2" fill="none" stroke="#4F7F49" strokeWidth="1.3" />
      <circle cx="48" cy="23" r="11" fill="#D3EDCE" stroke="#4F7F49" strokeWidth="1.3" />
      <text x="48" y="28" textAnchor="middle" className="font-display" fontSize="14" fontWeight="800" fill="#2F5711">
        $
      </text>
    </g>
  );
}

function Coin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="3" rx="13" ry="5.5" fill="#D99A12" />
      <ellipse cx="0" cy="0" rx="13" ry="5.5" fill="#FFC53D" stroke="#18161F" strokeWidth="1.8" />
    </g>
  );
}
