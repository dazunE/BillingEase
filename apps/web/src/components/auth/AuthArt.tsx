import type { CSSProperties } from "react";
import { CashJar } from "@/components/CashJar";
import { cx } from "@/components/ui";
import s from "./auth.module.css";
import { SYMBOL, money, sampleDocs, type Cty } from "./country";

/**
 * Illustrations for the signed-out pages, in the landing page's hand (port of
 * prototype/AuthArt.dc.html). All decorative and aria-hidden; motion stops
 * under prefers-reduced-motion.
 */

type Variant = "signup" | "signin" | "forgot" | "reset";


const at = (side: "L" | "R", c: number, off: number, top: number): CSSProperties =>
  side === "L" ? { right: `calc(50% + ${c + off}px)`, top: `${top}%` } : { left: `calc(50% + ${c + off}px)`, top: `${top}%` };
const rot = (r: string) => ({ "--r": r }) as CSSProperties;

/* ======================= Backdrop: paper in the margins ======================= */

export function Backdrop({ country, variant = "signup", setup = false }: { country: Cty; variant?: Variant; setup?: boolean }) {
  const sym = SYMBOL[country];
  const w = sampleDocs(country, variant === "signin" ? "a" : "b");
  const C = setup ? 606 : 468;
  const P = setup
    ? { blobL: at("L", C, -30, 8), blobR: at("R", C, -40, 46), blob: 200, coins: at("L", C, 26, 34), note: at("L", C, 10, 68), rcpt: at("R", C, 12, 18), env: at("R", C, 18, 60) }
    : {
        blobL: at("L", C, -10, 8), blobR: at("R", C, -40, 42), blob: 300, inv: at("L", C, 74, 13), laneIn: at("L", C, 36, 44), laneOut: at("R", C, 36, 41),
        coins: at("L", C, 156, 58), note: at("L", C, 60, 72), rcpt: at("R", C, 96, 12), env: at("R", C, 130, 56), plane: at("R", C, 48, 77),
      };
  return (
    <div className={cx(s.backdrop, setup && s.noBand)} aria-hidden>
      <div className={setup ? s.xl : s.wide}>
        <span className={s.blob} style={{ ...P.blobL, width: P.blob, height: P.blob, background: "#EEE8FF" }} />
        <span className={s.blob} style={{ ...P.blobR, width: P.blob, height: P.blob, background: "#FDE6D6", opacity: 0.7 }} />

        {"inv" in P && (
          <span className={cx(s.item, s.drift)} style={{ ...P.inv, ...rot("-8deg") }}>
            <svg width="132" height="168" viewBox="0 0 132 168" style={{ display: "block", overflow: "visible" }}>
              <rect x="6" y="8" width="124" height="158" rx="9" fill="#18161F" opacity="0.06" />
              <rect x="2" y="2" width="124" height="158" rx="9" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.5" />
              <rect x="14" y="14" width="22" height="22" rx="7" fill="#B9A3FF" stroke="#18161F" strokeWidth="1.8" />
              <path d="M20 31 l4 -12 h6 l-4 12 z" fill="#18161F" />
              <text x="114" y="24" textAnchor="end" className="font-display" fontSize="9" fontWeight="800" fill="#18161F" letterSpacing="0.8">INVOICE</text>
              <text x="114" y="35" textAnchor="end" fontSize="8.5" fontWeight="600" fill="#5F5B68">{w.invNo}</text>
              <text x="14" y="56" fontSize="8.5" fontWeight="700" fill="#18161F">{w.invWho}</text>
              <path d="M14 70 H84 M14 82 H100 M14 94 H70" stroke="#EEE8FF" strokeWidth="5" strokeLinecap="round" />
              <path d="M14 70 H40" stroke="#B9A3FF" strokeWidth="5" strokeLinecap="round" />
              <path d="M14 122 H114" stroke="#E2DFE8" strokeWidth="1.5" />
              {/* Long amounts (Rs 640,000) go under their label instead of beside it. */}
              <text x="14" y={w.invAmt.length > 8 ? 134 : 142} fontSize="9" fontWeight="600" fill="#5F5B68">Total</text>
              <text x="114" y={w.invAmt.length > 8 ? 149 : 143} textAnchor="end" className="font-display" fontSize={w.invAmt.length > 8 ? 13 : 15} fontWeight="800" fill="#18161F">{w.invAmt}</text>
              <g transform="rotate(-14 86 98)">
                <g className={cx(s.c, s.stamp)}>
                  <rect x="56" y="85" width="60" height="26" rx="6" fill="#E2F6D5" fillOpacity="0.9" stroke="#2F5711" strokeWidth="2.5" />
                  <text x="86" y="103.5" textAnchor="middle" className="font-display" fontSize="14" fontWeight="800" fill="#2F5711" letterSpacing="1.2">PAID</text>
                </g>
              </g>
            </svg>
          </span>
        )}

        {"laneIn" in P && (
          <span className={s.item} style={{ ...P.laneIn, width: 168 }}>
            <span className={s.laneLabel}>COMING IN</span>
            <span className={s.lane} style={{ flex: "none", width: 168 }}>
              <span className={s.laneLine} />
              <span className={cx(s.pill, s.pillIn)}>{w.inPill}</span>
            </span>
          </span>
        )}

        <span className={cx(s.item, s.bob)} style={P.coins}>
          <Coins />
        </span>

        <span className={cx(s.item, s.drift14)} style={{ ...P.note, ...rot("10deg") }}>
          <svg width="100" height="50" viewBox="0 0 100 50" style={{ display: "block", overflow: "visible" }}>
            <rect x="2" y="2" width="96" height="46" rx="4" fill="#B6E0AE" stroke="#18161F" strokeWidth="2" />
            <rect x="8" y="8" width="84" height="34" rx="2" fill="none" stroke="#4F7F49" strokeWidth="1.3" />
            <circle cx="50" cy="25" r="11" fill="#D3EDCE" stroke="#4F7F49" strokeWidth="1.3" />
            <text x="50" y={sym.length > 1 ? 29 : 30} textAnchor="middle" className="font-display" fontSize={sym.length > 1 ? 10 : 14} fontWeight="800" fill="#2F5711">{sym}</text>
          </svg>
        </span>

        <span className={cx(s.item, s.drift13)} style={{ ...P.rcpt, ...rot("7deg") }}>
          <svg width="110" height="160" viewBox="0 0 110 160" style={{ display: "block", overflow: "visible" }}>
            <path d="M4 4 H106 V150 L99.6 157 L93.2 150 L86.9 157 L80.5 150 L74.1 157 L67.8 150 L61.4 157 L55.0 150 L48.6 157 L42.2 150 L35.9 157 L29.5 150 L23.1 157 L16.8 150 L10.4 157 L4.0 150 Z" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.5" strokeLinejoin="round" />
            <text x="55" y="26" textAnchor="middle" className="font-display" fontSize="9" fontWeight="800" fill="#18161F" letterSpacing="1">RECEIPT</text>
            <path d="M16 36 H94" stroke="#18161F" strokeWidth="1.2" strokeDasharray="3 3" />
            <text x="16" y="54" fontSize="9" fontWeight="700" fill="#18161F">{w.rcWho}</text>
            <path d="M16 66 H62 M16 78 H52 M16 90 H68" stroke="#FDE6D6" strokeWidth="5" strokeLinecap="round" />
            <path d="M16 66 H32" stroke="#E0752D" strokeWidth="5" strokeLinecap="round" />
            <path d="M16 106 H94" stroke="#18161F" strokeWidth="1.2" strokeDasharray="3 3" />
            <text x="16" y={w.outAmt.length > 8 ? 117 : 126} fontSize="9" fontWeight="600" fill="#5F5B68">Paid</text>
            <text x="94" y={w.outAmt.length > 8 ? 131 : 127} textAnchor="end" className="font-display" fontSize={w.outAmt.length > 8 ? 12 : 14} fontWeight="800" fill="#18161F">{w.outAmt}</text>
          </svg>
        </span>

        {"laneOut" in P && (
          <span className={s.item} style={{ ...P.laneOut, width: 168 }}>
            <span className={s.laneLabel}>GOING OUT</span>
            <span className={s.lane} style={{ flex: "none", width: 168 }}>
              <span className={cx(s.laneLine, s.laneOutLine)} />
              <span className={cx(s.pill, s.pillOut)}>{w.outPill}</span>
            </span>
          </span>
        )}

        <span className={s.item} style={P.env}>
          <svg width="100" height="96" viewBox="0 0 100 96" style={{ display: "block", overflow: "visible" }}>
            <ellipse cx="50" cy="72" rx="44" ry="5" fill="#18161F" opacity="0.08" />
            <g className={cx(s.foot, s.sway)}>
              <rect x="4" y="4" width="92" height="64" rx="6" fill="#E3C38F" stroke="#18161F" strokeWidth="2.5" />
              <path d="M4 8 L50 40 L96 8" fill="#D3AC70" stroke="#18161F" strokeWidth="2.2" strokeLinejoin="round" />
              <text x="50" y="60" textAnchor="middle" className="font-display" fontSize="14" fontWeight="800" fill="#6B3E0E" letterSpacing="1.5">TAX</text>
            </g>
            <text x="50" y="92" textAnchor="middle" className="font-hand" fontSize="19" fontWeight="700" fill="#18161F">set aside</text>
          </svg>
        </span>

        {"plane" in P && (
          <span className={s.item} style={P.plane}>
            <svg width="90" height="60" viewBox="0 0 90 60" style={{ display: "block", overflow: "visible" }}>
              <path d="M2 50 C 22 56, 30 34, 50 40" fill="none" stroke="#CBC7D3" strokeWidth="2" strokeDasharray="4 5" strokeLinecap="round" />
              <g transform="translate(50 20)">
                <g className={cx(s.c, s.plane)}>
                  <path d="M0 12 L32 0 L22 27 L16 17 Z" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.2" strokeLinejoin="round" />
                  <path d="M16 17 L32 0" stroke="#18161F" strokeWidth="1.8" />
                </g>
              </g>
            </svg>
          </span>
        )}
      </div>

      {!setup && (
        <div className={s.band} style={{ height: "100%", maxWidth: 440, margin: "0 auto", alignItems: "center", gap: 6 }}>
          <svg width="40" height="52" viewBox="0 0 40 52" style={{ flex: "none", display: "block", overflow: "visible", transform: "rotate(-8deg)" }}>
            <rect x="2" y="2" width="36" height="48" rx="5" fill="#FFFFFF" stroke="#18161F" strokeWidth="2" />
            <rect x="7" y="7" width="9" height="9" rx="3" fill="#B9A3FF" stroke="#18161F" strokeWidth="1.3" />
            <path d="M8 24 H30 M8 31 H26 M8 38 H22" stroke="#EEE8FF" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M8 24 H16" stroke="#7A5AF8" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
          <span className={s.lane}>
            <span className={s.laneLine} />
            <span className={cx(s.pill, s.pillIn)} style={{ animationDuration: "7s" }}>{w.inPill}</span>
          </span>
          <span style={{ flex: "none", display: "block", width: 58 }}>
            <CashJar size={58} envelope={false} sym={sym} />
          </span>
          <span className={s.lane}>
            <span className={cx(s.laneLine, s.laneOutLine)} />
            <span className={cx(s.pill, s.pillOut)} style={{ animationDuration: "8s" }}>{w.outPill}</span>
          </span>
          <svg width="38" height="54" viewBox="0 0 42 56" style={{ flex: "none", display: "block", overflow: "visible", transform: "rotate(7deg)" }}>
            <path d="M2 2 H40 V50 L36.2 54 L32.4 50 L28.6 54 L24.8 50 L21.0 54 L17.2 50 L13.4 54 L9.6 50 L5.8 54 L2.0 50 Z" fill="#FFFFFF" stroke="#18161F" strokeWidth="2" strokeLinejoin="round" />
            <path d="M8 12 H34 M8 20 H26 M8 28 H30" stroke="#FDE6D6" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M8 12 H18" stroke="#E0752D" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M8 38 H34" stroke="#18161F" strokeWidth="1" strokeDasharray="2 2" />
          </svg>
        </div>
      )}
    </div>
  );
}

function Coins() {
  return (
    <svg width="64" height="58" viewBox="0 0 64 58" style={{ display: "block", overflow: "visible" }}>
      <ellipse cx="32" cy="52" rx="28" ry="5" fill="#18161F" opacity="0.08" />
      {[[30, 44, "#FFC53D"], [30, 36, "#FFC53D"], [32, 28, "#FFD465"]].map(([x, y, f]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <ellipse cx="0" cy="3" rx="17" ry="7" fill="#D99A12" />
          <ellipse cx="0" cy="0" rx="17" ry="7" fill={f as string} stroke="#18161F" strokeWidth="2" />
        </g>
      ))}
      <g transform="translate(46 10) rotate(-24)">
        <ellipse cx="0" cy="3" rx="12" ry="5" fill="#D99A12" />
        <ellipse cx="0" cy="0" rx="12" ry="5" fill="#FFC53D" stroke="#18161F" strokeWidth="1.8" />
      </g>
    </svg>
  );
}

/* ======================= Scene: inside the dark side panel ======================= */

type Chip = { t: string; mark: string; bg: string; fg: string; mk: string; bd: string };
const chipIn = (t: string): Chip => ({ t, mark: "+", bg: "#7A5AF8", fg: "#FFFFFF", mk: "#FFFFFF", bd: "0" });
const chipOut = (t: string): Chip => ({ t, mark: "−", bg: "#FDE6D6", fg: "#18161F", mk: "#18161F", bd: "1px solid #E0752D" });
const chipKeep = (t: string): Chip => ({ t, mark: "=", bg: "#B9A3FF", fg: "#18161F", mk: "#18161F", bd: "0" });
const done = (t: string): Chip => ({ t, mark: "✓", bg: "#FFFFFF", fg: "#18161F", mk: "#2F5711", bd: "0" });

export function Scene({ country, variant, keep }: { country: Cty; variant: Variant; keep?: string }) {
  const lk = country === "lk";
  const w = sampleDocs(country, "b");
  const chips: Chip[] =
    variant === "signup"
      ? [chipIn(`${w.invAmt} invoice paid`), chipOut(`${w.outAmt} ${lk ? "office rent" : "desk rent"}`), chipKeep(`${keep ?? money(0, country)} yours to keep`)]
      : variant === "signin"
        ? lk
          ? [done("VAT and SSCL worked out"), done("Payroll ready to run"), done("Tax put aside")]
          : [done("Quarter totals up to date"), done("Mileage and property kept apart"), done("Tax put aside")]
        : [done("Invoices still go out"), done("Records stay as they are"), done("Every number adds up")];
  const lock = variant === "forgot" || variant === "reset";
  return (
    <div className={s.scene} aria-hidden>
      <span style={{ position: "relative", flex: "none", display: "block", width: 150 }}>
        <CashJar size={150} envelope={false} amount={variant === "signup" ? keep : ""} line="#EEE8FF" sym={SYMBOL[country]} />
        {lock && (
          <svg width="40" height="54" viewBox="0 0 40 54" style={{ position: "absolute", left: 94, top: 20, overflow: "visible" }}>
            <g className={cx(s.top, s.swing)}>
              <path d="M20 0 V6" stroke="#EEE8FF" strokeWidth="2" />
              <path d="M11 22 V15 a9 9 0 0 1 18 0 V22" fill="none" stroke="#EEE8FF" strokeWidth="3.5" strokeLinecap="round" />
              <rect x="5" y="21" width="30" height="26" rx="6" fill="#FFC53D" stroke="#18161F" strokeWidth="2.5" />
              <circle cx="20" cy="32" r="3.5" fill="#18161F" />
              <path d="M20 34 V40" stroke="#18161F" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </svg>
        )}
      </span>
      <div className={s.chips}>
        {chips.map((c, i) => (
          <span key={c.t} className={s.chip} style={{ background: c.bg, color: c.fg, border: c.bd, animationDelay: `${i * 1.2}s` }}>
            <span style={{ color: c.mk, flex: "none" }}>{c.mark}</span>
            <span style={{ minWidth: 0 }}>{c.t}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ======================= Setup: a small picture of the question ======================= */

export type StepPic = "biz" | "kind" | "tax" | "cal" | "done";

const NOTE: Record<string, string> = { sole_trader: "your work", landlord: "your flat", both: "a bit of both", sole_proprietor: "just you", partnership: "partners" };

export function StepArt({ pic, country, kind = "", stamp }: { pic: StepPic; country: Cty; kind?: string; stamp?: string }) {
  const lk = country === "lk";
  const sym = SYMBOL[country];
  if (pic === "done") {
    return (
      <span className={s.step} aria-hidden style={{ paddingTop: 4 }}>
        <CashJar size={168} envelope taxPct={lk ? "20%" : "25%"} sym={sym} />
      </span>
    );
  }
  const note = pic === "kind" ? (NOTE[kind] ?? "") : "";
  const shop = pic === "biz" || (pic === "kind" && lk);
  return (
    <span className={s.step} aria-hidden>
      <svg viewBox="0 0 180 130" width="100%" style={{ display: "block", overflow: "visible" }}>
        <circle cx="94" cy="70" r="58" fill="#EEE8FF" />
        <rect x="22" y="118" width="144" height="6" rx="3" fill="#18161F" opacity="0.9" />

        {shop && (
          <g>
            <rect x="52" y="56" width="90" height="62" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.5" />
            <path d="M46 40 H148 L142 58 H52 Z" fill="#B9A3FF" stroke="#18161F" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M64 40 L60 58 M82 40 L80 58 M100 40 L100 58 M118 40 L120 58 M136 40 L140 58" stroke="#18161F" strokeWidth="2" />
            <rect x="62" y="70" width="36" height="28" rx="2" fill="#EEE8FF" stroke="#18161F" strokeWidth="2" />
            <g className={cx(s.top, s.swing45)}>
              <path d="M74 70 L80 76 L86 70" fill="none" stroke="#18161F" strokeWidth="1.4" />
              <rect x="68" y="76" width="24" height="14" rx="3" fill="#FFF6E0" stroke="#18161F" strokeWidth="1.6" />
              <text x="80" y="87" textAnchor="middle" className="font-hand" fontSize="12" fontWeight="700" fill="#18161F">open</text>
            </g>
            <rect x="108" y="72" width="24" height="46" rx="2" fill="#FDE6D6" stroke="#18161F" strokeWidth="2" />
            <circle cx="113" cy="96" r="1.8" fill="#18161F" />
            <g transform="translate(156 12)">
              <g className={s.bob5}>
                <path d="M0 0 c-9 0 -15 7 -15 15 c0 11 15 25 15 25 s15 -14 15 -25 c0 -8 -6 -15 -15 -15 z" fill="#E0752D" stroke="#18161F" strokeWidth="2.2" strokeLinejoin="round" />
                <circle cx="0" cy="15" r="5.5" fill="#FFFFFF" stroke="#18161F" strokeWidth="1.8" />
              </g>
            </g>
          </g>
        )}

        {pic === "kind" && !lk && (
          <g>
            <g opacity={kind === "landlord" ? 0.25 : 1}>
              <circle cx="66" cy="76" r="30" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.5" />
              <path d="M66 50 V55 M66 97 V102 M40 76 H45 M87 76 H92" stroke="#18161F" strokeWidth="2" strokeLinecap="round" />
              <path d="M66 76 L56 70" stroke="#18161F" strokeWidth="3" strokeLinecap="round" />
              <path d="M66 76 V58" stroke="#7A5AF8" strokeWidth="3" strokeLinecap="round" className={s.spin24} />
              <circle cx="66" cy="76" r="3" fill="#18161F" />
            </g>
            <g opacity={kind === "sole_trader" ? 0.25 : 1}>
              <g className={s.bob6}>
                <path d="M102 80 L130 56 L158 80 Z" fill="#E0752D" stroke="#18161F" strokeWidth="2.2" strokeLinejoin="round" />
                <rect x="108" y="79" width="44" height="31" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.2" />
                <rect x="124" y="92" width="12" height="18" fill="#FDE6D6" stroke="#18161F" strokeWidth="2" />
                <rect x="112" y="85" width="9" height="9" fill="#EEE8FF" stroke="#18161F" strokeWidth="1.8" />
                <rect x="139" y="85" width="9" height="9" fill="#EEE8FF" stroke="#18161F" strokeWidth="1.8" />
              </g>
            </g>
          </g>
        )}

        {pic === "tax" && (
          <g>
            <g transform="rotate(-6 94 72)">
              <rect x="58" y="24" width="72" height="92" rx="4" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.5" />
              <path d="M68 40 H112 M68 52 H120 M68 64 H104 M68 76 H116" stroke="#E2DFE8" strokeWidth="5" strokeLinecap="round" />
              <path d="M68 40 H92" stroke="#7A5AF8" strokeWidth="5" strokeLinecap="round" />
            </g>
            <g transform="translate(118 92)">
              <g className={cx(s.c, s.pop)}>
                <circle r="21" fill="#EEE8FF" stroke="#7A5AF8" strokeWidth="2.5" />
                <circle r="16" fill="none" stroke="#7A5AF8" strokeWidth="1.2" strokeDasharray="3 2" />
                <text y="4.5" textAnchor="middle" className="font-display" fontSize="11" fontWeight="800" fill="#18161F">{stamp ?? (lk ? "TIN" : "VAT")}</text>
              </g>
            </g>
            <g transform="translate(40 96)">
              <g className={s.bob5}>
                <circle r="14" fill="#FFC53D" stroke="#18161F" strokeWidth="2" />
                <text y="4.5" textAnchor="middle" className="font-display" fontSize={lk ? 11 : 14} fontWeight="800" fill="#6B3E0E">{sym}</text>
              </g>
            </g>
          </g>
        )}

        {pic === "cal" && (
          <g>
            <rect x="44" y="30" width="100" height="84" rx="8" fill="#FFFFFF" stroke="#18161F" strokeWidth="2.5" />
            <path d="M44 48 H144" stroke="#18161F" strokeWidth="2.5" />
            <path d="M66 22 V36 M122 22 V36" stroke="#18161F" strokeWidth="3" strokeLinecap="round" />
            <rect x="54" y="56" width="38" height="22" rx="5" fill="#B6E0AE" stroke="#18161F" strokeWidth="1.8" />
            <rect x="96" y="56" width="38" height="22" rx="5" fill="#B6E0AE" stroke="#18161F" strokeWidth="1.8" />
            <rect x="54" y="84" width="38" height="22" rx="5" fill="#EEE8FF" stroke="#7A5AF8" strokeWidth="2" className={cx(s.c, s.pop4)} />
            <rect x="96" y="84" width="38" height="22" rx="5" fill="#F7F6F9" stroke="#CBC7D3" strokeWidth="1.8" />
            {[["73", "71", "Q1"], ["115", "71", "Q2"], ["73", "99", "Q3"], ["115", "99", "Q4"]].map(([x, y, t]) => (
              <text key={t} x={x} y={y} textAnchor="middle" className="font-display" fontSize="10" fontWeight="800" fill={t === "Q4" ? "#5F5B68" : "#18161F"}>{t}</text>
            ))}
          </g>
        )}
        {note && (
          <text x="94" y="20" textAnchor="middle" className="font-hand" fontSize="20" fontWeight="700" fill="#18161F">{note}</text>
        )}
      </svg>
    </span>
  );
}
