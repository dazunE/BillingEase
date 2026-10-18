import type { ReactNode } from "react";

/*
 * Flat cover illustrations for the guides (prototype site-content.js COVERS),
 * redrawn for the UK and Sri Lanka guides. Each is a 400×240 scene on its own
 * background colour. Decorative: always aria-hidden.
 */

export type CoverKey = "mtd" | "expenses" | "landlord" | "vat" | "taxInvoice" | "payroll" | "cheque" | "accountant" | "papers";

export const COVER_BG: Record<CoverKey, string> = {
  mtd: "#EEE8FF",
  expenses: "#FDE6D6",
  landlord: "#E2F6D5",
  vat: "#FFF4E8",
  taxInvoice: "#EEE8FF",
  payroll: "#FDE6D6",
  cheque: "#E2F6D5",
  accountant: "#EEE8FF",
  papers: "#FDE6D6",
};

const INK = "#18161F";
const st = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const F = { fontFamily: "var(--font-sans), Arial, sans-serif", fontWeight: 700 };

const SCENES: Record<CoverKey, ReactNode> = {
  // A calendar with four quarters ticked off, and an MTD tag
  mtd: (
    <>
      <circle cx="310" cy="60" r="70" fill="#FFFFFF" opacity="0.6" />
      <rect x="70" y="50" width="180" height="160" rx="12" fill="#FFFFFF" {...st} />
      <rect x="70" y="50" width="180" height="36" rx="12" fill="#B9A3FF" {...st} />
      <path d="M110 40v22M210 40v22" {...st} />
      {[0, 1, 2, 3].map((i) => {
        const x = 90 + (i % 2) * 80;
        const y = 100 + Math.floor(i / 2) * 52;
        return (
          <g key={i}>
            <rect x={x} y={y} width="62" height="40" rx="8" fill={i < 3 ? "#EEE8FF" : "#F7F6F9"} stroke={INK} strokeWidth="2" />
            <text x={x + 10} y={y + 25} {...F} fontSize="15" fill={INK}>
              Q{i + 1}
            </text>
            {i < 3 && <path d={`M${x + 38} ${y + 20} l6 6 l10 -12`} fill="none" stroke="#7A5AF8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
          </g>
        );
      })}
      <g transform="rotate(8 320 150)">
        <rect x="270" y="112" width="104" height="80" rx="10" fill={INK} />
        <text x="322" y="152" textAnchor="middle" {...F} fontSize="26" fill="#B9A3FF">
          MTD
        </text>
        <text x="322" y="174" textAnchor="middle" {...F} fontSize="11" fill="#EEE8FF">
          EVERY QUARTER
        </text>
      </g>
    </>
  ),
  // A receipt with ticks and a cross: allowable or not
  expenses: (
    <>
      <path d="M90 34 H230 V214 L216 204 L202 214 L188 204 L174 214 L160 204 L146 214 L132 204 L118 214 L104 204 L90 214 Z" fill="#FFFFFF" {...st} />
      <path d="M110 66 H190 M110 98 H200 M110 130 H184 M110 162 H196" stroke="#F4C3A1" strokeWidth="6" strokeLinecap="round" />
      <path d="M206 62 l5 5 l9 -11 M206 94 l5 5 l9 -11 M206 158 l5 5 l9 -11" fill="none" stroke="#7A5AF8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M206 124 l12 12 M218 124 l-12 12" stroke="#E0752D" strokeWidth="3.5" strokeLinecap="round" />
      <g transform="rotate(-6 312 120)">
        <rect x="262" y="70" width="104" height="100" rx="14" fill="#FFFFFF" {...st} />
        <circle cx="314" cy="108" r="22" fill="#B6E0AE" stroke={INK} strokeWidth="2.5" />
        <path d="M304 108 l7 7 l13 -14" fill="none" {...st} />
        <text x="314" y="155" textAnchor="middle" {...F} fontSize="13" fill={INK}>
          ALLOWABLE
        </text>
      </g>
    </>
  ),
  // A house with a key tag
  landlord: (
    <>
      <circle cx="90" cy="60" r="44" fill="#FFFFFF" opacity="0.6" />
      <path d="M90 118 L170 56 L250 118" fill="none" {...st} />
      <rect x="106" y="112" width="128" height="100" fill="#FFFFFF" {...st} />
      <rect x="152" y="152" width="36" height="60" fill="#B9A3FF" {...st} />
      <rect x="120" y="128" width="26" height="24" fill="#EEE8FF" stroke={INK} strokeWidth="2.5" />
      <rect x="194" y="128" width="26" height="24" fill="#EEE8FF" stroke={INK} strokeWidth="2.5" />
      <g transform="rotate(14 312 120)">
        <circle cx="282" cy="96" r="18" fill="none" {...st} />
        <path d="M298 104 H352 M336 104 v16 M348 104 v12" fill="none" {...st} />
        <path d="M300 130 L360 130 L372 150 L360 170 L300 170 Z" fill="#FFFFFF" {...st} />
        <circle cx="312" cy="150" r="5" fill={INK} />
        <text x="342" y="156" textAnchor="middle" {...F} fontSize="15" fill={INK}>
          RENT
        </text>
      </g>
    </>
  ),
  // A price tag with VAT 20% and a threshold line
  vat: (
    <>
      <path d="M50 190 H350" stroke="#E2DFE8" strokeWidth="4" strokeLinecap="round" />
      <path d="M60 180 L60 150 M110 180 L110 128 M160 180 L160 110 M210 180 L210 86" stroke="#F4C3A1" strokeWidth="22" strokeLinecap="round" />
      <path d="M40 84 H250" stroke="#E0752D" strokeWidth="3" strokeDasharray="6 8" />
      <text x="44" y="74" {...F} fontSize="12" fill="#E0752D">
        THRESHOLD
      </text>
      <g transform="rotate(10 310 110)">
        <path d="M262 64 H352 V156 H262 L240 110 Z" fill="#FFFFFF" {...st} />
        <circle cx="262" cy="110" r="6" fill={INK} />
        <text x="306" y="106" textAnchor="middle" {...F} fontSize="16" fill={INK}>
          VAT
        </text>
        <text x="306" y="134" textAnchor="middle" {...F} fontSize="22" fill="#7A5AF8">
          20%
        </text>
      </g>
    </>
  ),
  // A Sri Lankan Tax Invoice with VAT and SSCL lines
  taxInvoice: (
    <>
      <circle cx="320" cy="56" r="60" fill="#FFFFFF" opacity="0.6" />
      <rect x="70" y="28" width="190" height="196" rx="10" fill="#FFFFFF" {...st} />
      <text x="90" y="62" {...F} fontSize="17" fill={INK}>
        TAX INVOICE
      </text>
      <path d="M90 82 H200 M90 102 H170" stroke="#C9BCFB" strokeWidth="6" strokeLinecap="round" />
      <path d="M90 128 H240" stroke="#E2DFE8" strokeWidth="2" />
      <text x="90" y="150" {...F} fontSize="12" fill={INK}>
        SSCL 2.5%
      </text>
      <text x="90" y="172" {...F} fontSize="12" fill={INK}>
        VAT 18%
      </text>
      <path d="M200 146 H240 M200 168 H240" stroke="#F4C3A1" strokeWidth="6" strokeLinecap="round" />
      <path d="M90 186 H240" stroke={INK} strokeWidth="2" />
      <text x="90" y="208" {...F} fontSize="13" fill={INK}>
        TOTAL
      </text>
      <path d="M196 204 H240" stroke="#7A5AF8" strokeWidth="7" strokeLinecap="round" />
      <g transform="rotate(-8 322 160)">
        <rect x="282" y="128" width="84" height="64" rx="10" fill={INK} />
        <text x="324" y="166" textAnchor="middle" {...F} fontSize="22" fill="#B9A3FF">
          Rs
        </text>
      </g>
    </>
  ),
  // A payslip with EPF and ETF chips
  payroll: (
    <>
      <circle cx="120" cy="96" r="34" fill="#C68B6E" {...st} />
      <path d="M88 90 C86 64 104 54 122 54 C142 54 154 66 152 88 C142 76 126 72 110 76 C100 78 92 82 88 90 Z" fill="#2B2233" />
      <path d="M58 214 C58 160 84 140 120 140 C156 140 182 160 182 214 Z" fill="#7A5AF8" {...st} />
      <rect x="216" y="44" width="140" height="168" rx="8" fill="#FFFFFF" {...st} />
      <text x="234" y="74" {...F} fontSize="13" fill={INK}>
        PAYSLIP
      </text>
      <path d="M234 94 H330 M234 114 H310" stroke="#F4C3A1" strokeWidth="6" strokeLinecap="round" />
      <rect x="234" y="132" width="52" height="24" rx="12" fill="#EEE8FF" stroke={INK} strokeWidth="2" />
      <text x="260" y="149" textAnchor="middle" {...F} fontSize="11" fill={INK}>
        EPF
      </text>
      <rect x="292" y="132" width="50" height="24" rx="12" fill="#FDE6D6" stroke={INK} strokeWidth="2" />
      <text x="317" y="149" textAnchor="middle" {...F} fontSize="11" fill={INK}>
        ETF
      </text>
      <rect x="234" y="170" width="108" height="26" rx="13" fill="#B6E0AE" stroke={INK} strokeWidth="2" />
      <text x="288" y="188" textAnchor="middle" {...F} fontSize="12" fill={INK}>
        APIT
      </text>
    </>
  ),
  // A cheque and a QR code
  cheque: (
    <>
      <g transform="rotate(-6 150 130)">
        <rect x="40" y="82" width="230" height="104" rx="8" fill="#FFFFFF" {...st} />
        <text x="58" y="110" {...F} fontSize="12" fill={INK}>
          PAY
        </text>
        <path d="M92 106 H210" stroke="#C9BCFB" strokeWidth="5" strokeLinecap="round" />
        <path d="M58 132 H170" stroke="#E2DFE8" strokeWidth="5" strokeLinecap="round" />
        <rect x="190" y="122" width="64" height="22" rx="4" fill="#F7F6F9" stroke={INK} strokeWidth="2" />
        <text x="222" y="138" textAnchor="middle" {...F} fontSize="11" fill={INK}>
          Rs
        </text>
        <path d="M58 164 q12 -14 24 0 t24 0" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g transform="rotate(6 320 120)">
        <rect x="272" y="54" width="100" height="132" rx="16" fill={INK} />
        <rect x="284" y="68" width="76" height="76" rx="6" fill="#FFFFFF" />
        {[
          [290, 74],
          [334, 74],
          [290, 118],
        ].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="20" height="20" fill="none" stroke={INK} strokeWidth="4" />
        ))}
        <path d="M318 82h6M318 96h10M336 106h6v10M318 124h6M332 128h10M346 120v14M326 112h4" stroke={INK} strokeWidth="4" />
        <text x="322" y="170" textAnchor="middle" {...F} fontSize="12" fill="#B9A3FF">
          LankaQR
        </text>
      </g>
    </>
  ),
  // Two people looking at the same book
  accountant: (
    <>
      <circle cx="200" cy="120" r="96" fill="#FFFFFF" opacity="0.55" />
      <circle cx="96" cy="92" r="26" fill="#C68B6E" {...st} />
      <path d="M52 200 C52 152 72 136 96 136 C120 136 140 152 140 200 Z" fill="#E0752D" {...st} />
      <circle cx="304" cy="92" r="26" fill="#8A5A3B" {...st} />
      <path d="M260 200 C260 152 280 136 304 136 C328 136 348 152 348 200 Z" fill="#7A5AF8" {...st} />
      <path d="M150 116 L200 104 L250 116 V196 L200 186 L150 196 Z" fill="#FFFFFF" {...st} />
      <path d="M200 104 V186" {...st} />
      <path d="M162 132 H190 M162 148 H186 M210 132 H238 M210 148 H232" stroke="#C9BCFB" strokeWidth="5" strokeLinecap="round" />
      <path d="M162 166 H188 M210 166 H236" stroke="#F4C3A1" strokeWidth="5" strokeLinecap="round" />
      <path d="M40 210 H360" {...st} />
    </>
  ),
  // Quote, invoice and credit note
  papers: (
    <>
      <g transform="rotate(-8 120 130)">
        <rect x="60" y="40" width="120" height="160" rx="8" fill="#FFFFFF" {...st} />
        <path d="M80 70 H140 M80 92 H160 M80 110 H150" stroke="#C9BCFB" strokeWidth="6" strokeLinecap="round" />
        <text x="80" y="176" {...F} fontSize="16" fill={INK}>
          QUOTE
        </text>
      </g>
      <rect x="140" y="30" width="124" height="170" rx="8" fill="#FFFFFF" {...st} />
      <path d="M160 60 H220 M160 84 H244 M160 104 H236 M160 124 H230" stroke="#F4C3A1" strokeWidth="6" strokeLinecap="round" />
      <text x="160" y="182" {...F} fontSize="16" fill={INK}>
        INVOICE
      </text>
      <g transform="rotate(7 300 140)">
        <rect x="262" y="60" width="96" height="150" rx="8" fill="#FFFFFF" {...st} />
        <path d="M278 86 H326 M278 106 H318" stroke="#B6E0AE" strokeWidth="6" strokeLinecap="round" />
        <circle cx="310" cy="150" r="22" fill="#B9A3FF" {...st} />
        <path d="M300 150 H320" {...st} />
        <text x="278" y="196" {...F} fontSize="12" fill={INK}>
          CREDIT
        </text>
      </g>
    </>
  ),
};

/** A guide's cover scene. `rounded` adds the card's top corners. */
export function GuideCover({ cover, className, height }: { cover: CoverKey; className?: string; height?: number }) {
  return (
    <svg viewBox="0 0 400 240" width="100%" height={height} preserveAspectRatio="xMidYMid meet" aria-hidden className={className} style={{ background: COVER_BG[cover], display: "block" }}>
      {SCENES[cover]}
    </svg>
  );
}
