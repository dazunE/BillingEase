import type { SiteCountry } from "@/content/site/country";
import a from "./resources.module.css";

/*
 * Hero illustrations for the guides, help, changelog, about, careers, press,
 * contact and legal pages (ports of the prototype Site*.dc.html hero SVGs,
 * with UK and Sri Lanka details in place of the US ones). All decorative.
 * Animations stop under prefers-reduced-motion.
 */

const INK = "#18161F";
const SANS = "var(--font-sans), DM Sans, sans-serif";
const DISPLAY = "var(--font-display), Sora, sans-serif";
const HAND = "var(--font-hand), Caveat, cursive";

function Sparkle({ x, y, r = 1, fill, delay }: { x: number; y: number; r?: number; fill: string; delay?: string }) {
  return (
    <g className={`${a.c} ${a.twinkle}`} style={delay ? { animationDelay: delay } : undefined}>
      <path transform={`translate(${x} ${y}) scale(${r})`} d="M0 -12 l5 12 l12 5 l-12 5 l-5 12 l-5 -12 l-12 -5 l12 -5 z" fill={fill} stroke={INK} strokeWidth="2" />
    </g>
  );
}

/** Open book with a worked example, a pencil and two floating topic tags. */
export function GuidesArt({ country }: { country: SiteCountry }) {
  const tags = country === "uk" ? ["MTD quarter", "VAT 20%"] : ["VAT 18%", "EPF and ETF"];
  return (
    <svg viewBox="0 0 440 330" width="100%" className="block max-w-[440px] overflow-visible" aria-hidden>
      <circle cx="220" cy="170" r="140" fill="#EEE8FF" />
      <Sparkle x={78} y={82} fill="#B9A3FF" />
      <Sparkle x={376} y={118} r={0.8} fill="#F4C3A1" delay="1.2s" />
      <ellipse cx="220" cy="300" rx="150" ry="10" fill={INK} opacity="0.08" />
      <path d="M220 130 C190 110 130 104 70 114 V280 C130 270 190 276 220 296 Z" fill="#FFFFFF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M220 130 C250 110 310 104 370 114 V280 C310 270 250 276 220 296 Z" fill="#FFFFFF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M92 146 C130 140 170 142 200 152 M92 172 C130 166 170 168 200 178 M92 198 C120 193 150 194 172 200" fill="none" stroke="#C9BCFB" strokeWidth="6" strokeLinecap="round" />
      <rect x="244" y="140" width="104" height="96" rx="8" fill="#F7F6F9" stroke={INK} strokeWidth="2" />
      <path d="M256 160 H300 M256 180 H292 M256 200 H304" stroke="#F4C3A1" strokeWidth="5" strokeLinecap="round" />
      <path d="M316 160 H336 M318 180 H336 M314 200 H336" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M254 214 H338" stroke={INK} strokeWidth="2" strokeDasharray="4 4" />
      <path d="M310 226 H336" stroke="#7A5AF8" strokeWidth="6" strokeLinecap="round" className={a.write} />
      <path d="M92 236 C130 230 170 232 200 242" fill="none" stroke="#C9BCFB" strokeWidth="6" strokeLinecap="round" />
      <g transform="rotate(32 360 230)">
        <rect x="350" y="170" width="20" height="96" rx="3" fill="#E0752D" stroke={INK} strokeWidth="2.5" />
        <path d="M350 266 L360 290 L370 266 Z" fill="#FDE6D6" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="350" y="160" width="20" height="14" rx="3" fill="#B9A3FF" stroke={INK} strokeWidth="2.5" />
      </g>
      <g className={a.bob}>
        <rect x="40" y="34" width="150" height="38" rx="19" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" />
        <circle cx="62" cy="53" r="6" fill="#E0752D" />
        <text x="76" y="59" fontFamily={SANS} fontSize="15" fontWeight="700" fill={INK}>
          {tags[0]}
        </text>
      </g>
      <g className={a.bob} style={{ animationDuration: "4.8s", animationDelay: "1.4s" }}>
        <rect x="262" y="40" width="140" height="38" rx="19" fill={INK} />
        <circle cx="284" cy="59" r="6" fill="#B9A3FF" />
        <text x="298" y="65" fontFamily={SANS} fontSize="15" fontWeight="700" fill="#FFFFFF">
          {tags[1]}
        </text>
      </g>
      <g className={a.bob2} style={{ animationDelay: ".6s" }}>
        <circle cx="220" cy="86" r="22" fill="#B6E0AE" stroke={INK} strokeWidth="2.5" />
        <text x="220" y={country === "uk" ? 94 : 92} textAnchor="middle" fontFamily={DISPLAY} fontSize={country === "uk" ? 22 : 16} fontWeight="800" fill="#2F5711">
          {country === "uk" ? "£" : "Rs"}
        </text>
      </g>
    </svg>
  );
}

/** A person with a headset answering a question bubble. */
export function HelpArt({ country }: { country: SiteCountry }) {
  return (
    <svg viewBox="0 0 400 330" width="100%" className="block max-w-[400px] overflow-visible" aria-hidden>
      <circle cx="200" cy="180" r="136" fill="#FDE6D6" />
      <g className={a.bob} style={{ animationDuration: "3.2s" }}>
        <path d="M30 44 h116 a14 14 0 0 1 14 14 v34 a14 14 0 0 1 -14 14 h-72 l-16 16 v-16 h-28 a14 14 0 0 1 -14 -14 v-34 a14 14 0 0 1 14 -14 z" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <text x="88" y="84" textAnchor="middle" fontFamily={SANS} fontSize="15" fontWeight="700" fill={INK}>
          {country === "uk" ? "VAT invoice?" : "Tax Invoice?"}
        </text>
      </g>
      <g className={a.pop}>
        <path d="M244 70 h120 a14 14 0 0 1 14 14 v44 a14 14 0 0 1 -14 14 h-18 v16 l-16 -16 h-86 a14 14 0 0 1 -14 -14 v-44 a14 14 0 0 1 14 -14 z" fill={INK} />
        <path d="M248 96 h96 M248 116 h70" stroke="#B9A3FF" strokeWidth="6" strokeLinecap="round" />
        <circle cx="354" cy="116" r="9" fill="#B9A3FF" />
        <path d="M350 116 l3 3 l6 -6" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="M120 316 C120 250 152 226 200 226 C248 226 280 250 280 316 Z" fill="#7A5AF8" stroke={INK} strokeWidth="2.5" />
      <rect x="188" y="198" width="24" height="30" fill="#8D5A3B" stroke={INK} strokeWidth="2.2" />
      <circle cx="200" cy="170" r="34" fill="#8D5A3B" stroke={INK} strokeWidth="2.5" />
      <path d="M166 166 C162 136 182 124 202 124 C224 124 238 140 234 162 C224 148 206 144 190 148 C180 150 172 156 166 166 Z" fill={INK} />
      <g className={`${a.c} ${a.blink}`}>
        <circle cx="188" cy="172" r="3.5" fill={INK} />
        <circle cx="212" cy="172" r="3.5" fill={INK} />
      </g>
      <path d="M190 188 q10 7 20 0" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M162 172 C160 136 240 136 238 172" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <rect x="154" y="164" width="14" height="24" rx="6" fill="#B9A3FF" stroke={INK} strokeWidth="2.2" />
      <rect x="232" y="164" width="14" height="24" rx="6" fill="#B9A3FF" stroke={INK} strokeWidth="2.2" />
      <path d="M160 188 C162 202 172 206 184 204" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="186" cy="204" r="4" fill={INK} />
      <path d="M108 268 H292 L308 300 H92 Z" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M92 300 H308 V308 H92 Z" fill="#CBC7D3" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={182 + i * 18} cy="284" r="4" fill="#7A5AF8" className={`${a.c} ${a.type}`} style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </svg>
  );
}

/** A stack of update cards with a NEW one on top. */
export function ChangelogArt({ date }: { date: string }) {
  return (
    <svg viewBox="0 0 420 320" width="100%" className="block max-w-[420px] overflow-visible" aria-hidden>
      <circle cx="210" cy="170" r="136" fill="#EEE8FF" />
      <Sparkle x={64} y={96} fill="#B9A3FF" />
      <Sparkle x={360} y={70} r={0.8} fill="#F4C3A1" delay="1s" />
      <Sparkle x={370} y={250} r={0.8} fill="#B6E0AE" delay="1.8s" />
      <g transform="rotate(-8 150 190)">
        <rect x="70" y="110" width="170" height="150" rx="16" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" />
        <rect x="88" y="128" width="64" height="20" rx="10" fill="#E2F6D5" />
        <path d="M88 170 H214 M88 192 H190" stroke="#E2DFE8" strokeWidth="7" strokeLinecap="round" />
      </g>
      <g transform="rotate(7 280 190)">
        <rect x="196" y="112" width="170" height="150" rx="16" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" />
        <rect x="214" y="130" width="84" height="20" rx="10" fill="#FDE6D6" />
        <path d="M214 172 H340 M214 194 H316" stroke="#E2DFE8" strokeWidth="7" strokeLinecap="round" />
      </g>
      <g className={a.bob} style={{ animationDuration: "4.4s" }}>
        <rect x="118" y="86" width="190" height="176" rx="18" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
        <rect x="136" y="104" width="58" height="24" rx="12" fill={INK} />
        <text x="165" y="121" textAnchor="middle" fontFamily={SANS} fontSize="13" fontWeight="700" fill="#B9A3FF">
          NEW
        </text>
        <text x="290" y="121" textAnchor="end" fontFamily={SANS} fontSize="12" fontWeight="700" fill="#5F5B68">
          {date}
        </text>
        <path d="M136 152 H272 M136 174 H252" stroke={INK} strokeWidth="8" strokeLinecap="round" />
        <path d="M136 202 H286 M136 220 H262" stroke="#C9BCFB" strokeWidth="6" strokeLinecap="round" />
      </g>
      <g className={a.bob} style={{ animationDuration: "3.6s", animationDelay: ".8s" }}>
        <circle cx="330" cy="98" r="26" fill="#B9A3FF" stroke={INK} strokeWidth="2.5" />
        <path d="M318 98 l8 8 l14 -15" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** The three numbers written on a napkin, with a mug and a pen. */
export function AboutArt() {
  return (
    <svg viewBox="0 0 460 380" width="100%" className="block max-w-[460px] overflow-visible" aria-hidden>
      <circle cx="232" cy="196" r="170" fill="#EEE8FF" />
      <g transform="rotate(-5 220 196)">
        <path d="M74 64 H366 V330 H74 Z" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M74 197 H366" stroke="#E2DFE8" strokeWidth="2" strokeDasharray="6 6" />
        <path d="M220 64 V330" stroke="#E2DFE8" strokeWidth="2" strokeDasharray="6 6" />
        <text x="100" y="116" fontFamily={HAND} fontSize="40" fontWeight="700" fill="#7A5AF8">
          Coming in
        </text>
        <text x="100" y="172" fontFamily={HAND} fontSize="40" fontWeight="700" fill="#E0752D">
          − Going out
        </text>
        <path d="M100 196 H330" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <text x="100" y="248" fontFamily={HAND} fontSize="44" fontWeight="700" fill={INK}>
          = Yours to keep
        </text>
        <path d="M98 262 C160 274 250 268 334 258" fill="none" stroke="#B9A3FF" strokeWidth="5" strokeLinecap="round" className={a.draw} />
        <text x="104" y="306" fontFamily={HAND} fontSize="26" fontWeight="600" fill="#5F5B68">
          that’s it. that’s the app.
        </text>
        <circle cx="338" cy="96" r="20" fill="none" stroke="#E0752D" strokeWidth="2" strokeDasharray="4 5" />
      </g>
      <g className={a.bob}>
        <path d="M360 300 L420 220 L432 230 L372 310 L356 316 Z" fill="#B9A3FF" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M412 230 L424 240" stroke={INK} strokeWidth="2" />
      </g>
      <path d="M30 262 h70 v58 a14 14 0 0 1 -14 14 h-42 a14 14 0 0 1 -14 -14 z" fill="#E0752D" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M100 276 h10 a14 14 0 0 1 0 28 h-10" fill="none" stroke={INK} strokeWidth="2.5" />
      <path d="M46 250 c-6 -10 6 -14 0 -24" fill="none" stroke="#5F5B68" strokeWidth="2.2" strokeLinecap="round" className={a.steam} />
      <path d="M66 250 c-6 -10 6 -14 0 -24" fill="none" stroke="#5F5B68" strokeWidth="2.2" strokeLinecap="round" className={a.steam} style={{ animationDelay: "1.2s" }} />
      <text x="40" y="302" fontFamily={DISPLAY} fontSize="11" fontWeight="800" fill={INK}>
        TEA
      </text>
    </svg>
  );
}

/** A door with a hanging "Say hello" sign. */
export function CareersArt() {
  return (
    <svg viewBox="0 0 440 380" width="100%" className="block max-w-[440px] overflow-visible" aria-hidden>
      <circle cx="220" cy="200" r="168" fill="#FDE6D6" />
      <path d="M120 360 V120 a100 100 0 0 1 200 0 V360 Z" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
      <path d="M146 360 V128 a74 74 0 0 1 148 0 V360" fill="#EEE8FF" stroke={INK} strokeWidth="2.5" />
      <path d="M220 54 V360 M146 190 H294" stroke={INK} strokeWidth="2" />
      <circle cx="276" cy="260" r="6" fill="#E0752D" stroke={INK} strokeWidth="2" />
      <g className={`${a.pivot} ${a.swing}`}>
        <path d="M184 150 L220 120 L256 150" fill="none" stroke={INK} strokeWidth="2" />
        <circle cx="220" cy="120" r="4" fill={INK} />
        <rect x="160" y="150" width="120" height="70" rx="12" fill="#B9A3FF" stroke={INK} strokeWidth="2.5" />
        <text x="220" y="182" textAnchor="middle" fontFamily={HAND} fontSize="28" fontWeight="700" fill={INK}>
          Knock,
        </text>
        <text x="220" y="208" textAnchor="middle" fontFamily={HAND} fontSize="24" fontWeight="700" fill={INK}>
          say hello
        </text>
      </g>
      <g className={a.bob} style={{ animationDuration: "5s" }}>
        <rect x="-14" y="238" width="168" height="44" rx="22" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
        <circle cx="10" cy="260" r="7" fill="#7A5AF8" />
        <text x="26" y="265" fontFamily={SANS} fontSize="14" fontWeight="700" fill={INK}>
          United Kingdom
        </text>
      </g>
      <g className={a.bob} style={{ animationDuration: "5s", animationDelay: "-2.5s" }}>
        <rect x="300" y="282" width="128" height="44" rx="22" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
        <circle cx="324" cy="304" r="7" fill="#E0752D" />
        <text x="340" y="309" fontFamily={SANS} fontSize="14" fontWeight="700" fill={INK}>
          Sri Lanka
        </text>
      </g>
      <g className={a.bob} style={{ animationDuration: "6s", animationDelay: "-1s" }}>
        <rect x="306" y="70" width="128" height="44" rx="22" fill={INK} />
        <text x="370" y="97" textAnchor="middle" fontFamily={SANS} fontSize="14" fontWeight="700" fill="#B9A3FF">
          No roles open
        </text>
      </g>
    </svg>
  );
}

/** A newspaper front page with a press-kit stamp. */
export function PressArt() {
  return (
    <svg viewBox="0 0 460 380" width="100%" className="block max-w-[460px] overflow-visible" aria-hidden>
      <circle cx="230" cy="196" r="168" fill="#EEE8FF" />
      <g transform="rotate(-4 230 200)">
        <path d="M70 70 H370 V330 H70 Z" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M90 92 H350" stroke="#CBC7D3" strokeWidth="10" strokeLinecap="round" />
        <path d="M90 116 H350 M90 120 H350" stroke={INK} strokeWidth="1.5" />
        <text x="90" y="156" fontFamily={DISPLAY} fontSize="26" fontWeight="800" fill={INK}>
          Three numbers,
        </text>
        <text x="90" y="186" fontFamily={DISPLAY} fontSize="26" fontWeight="800" fill="#7A5AF8">
          zero jargon
        </text>
        <rect x="90" y="204" width="120" height="96" rx="6" fill={INK} />
        <path d="M104 282 V252 M124 282 V236 M144 282 V246 M164 282 V224 M184 282 V232" stroke="#B9A3FF" strokeWidth="10" />
        <path d="M228 210 H350 M228 224 H350 M228 238 H330 M228 252 H350 M228 266 H310 M228 280 H350 M228 294 H290" stroke="#CBC7D3" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g className={`${a.c} ${a.bob}`} style={{ animationDuration: "4.5s" }}>
        <circle cx="372" cy="300" r="46" fill="#E0752D" stroke={INK} strokeWidth="2.5" />
        <circle cx="372" cy="300" r="36" fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray="4 4" />
        <text x="372" y="296" textAnchor="middle" fontFamily={HAND} fontSize="22" fontWeight="700" fill={INK}>
          press
        </text>
        <text x="372" y="316" textAnchor="middle" fontFamily={HAND} fontSize="22" fontWeight="700" fill={INK}>
          kit
        </text>
      </g>
      <g className={a.bob} style={{ animationDuration: "5s", animationDelay: "-2s" }}>
        <path d="M40 300 L110 230 L122 242 L52 312 L36 318 Z" fill="#B9A3FF" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** A letter flying to an inbox, with a reply bubble. */
export function ContactArt() {
  return (
    <svg viewBox="0 0 380 260" width="100%" className="block max-w-[380px] overflow-visible" aria-hidden>
      <circle cx="190" cy="140" r="110" fill="#EEE8FF" />
      <g transform="translate(70 120)">
        <path d="M0 20 H120 V100 H0 Z" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M0 20 L60 66 L120 20" fill="none" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M0 100 L46 58 M120 100 L74 58" stroke={INK} strokeWidth="2" />
        <rect x="88" y="0" width="36" height="22" rx="11" fill="#E0752D" stroke={INK} strokeWidth="2" />
        <text x="106" y="15" textAnchor="middle" fontFamily={SANS} fontSize="11" fontWeight="700" fill="#FFFFFF">
          1
        </text>
      </g>
      <rect x="30" y="220" width="320" height="12" rx="6" fill={INK} />
      <g transform="translate(222 100)">
        <rect width="110" height="120" rx="14" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" />
        <path d="M0 14 a14 14 0 0 1 14 -14 h82 a14 14 0 0 1 14 14 v20 H0 Z" fill={INK} />
        <text x="55" y="23" textAnchor="middle" fontFamily={SANS} fontSize="11" fontWeight="700" fill="#FFFFFF">
          REPLY
        </text>
        <rect x="12" y="44" width="86" height="12" rx="6" fill="#EFEDF3" />
        <rect x="12" y="62" width="64" height="12" rx="6" fill="#EFEDF3" />
        <rect x="12" y="84" width="86" height="24" rx="8" fill="#B9A3FF" stroke={INK} strokeWidth="1.8" />
        <text x="55" y="100" textAnchor="middle" fontFamily={SANS} fontSize="11" fontWeight="700" fill={INK}>
          From a person
        </text>
      </g>
      <g transform="translate(66 36)">
        <g className={a.fly}>
          <rect width="54" height="36" rx="4" fill="#FFFFFF" stroke={INK} strokeWidth="2.2" />
          <path d="M2 4 L27 22 L52 4" fill="none" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        </g>
      </g>
      <g transform="translate(236 26)" className={a.bob}>
        <path d="M0 10 a10 10 0 0 1 10 -10 h90 a10 10 0 0 1 10 10 v24 a10 10 0 0 1 -10 10 h-60 l-12 12 v-12 h-18 a10 10 0 0 1 -10 -10 z" fill="#FFFFFF" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <text x="55" y="28" textAnchor="middle" fontFamily={HAND} fontSize="20" fontWeight="700" fill={INK}>
          Write to us!
        </text>
      </g>
    </svg>
  );
}

/** A document being highlighted, with a padlock and "no small print". */
export function LegalArt({ title }: { title: string }) {
  return (
    <svg viewBox="0 0 360 260" width="100%" className="block max-w-[360px] overflow-visible" aria-hidden>
      <circle cx="190" cy="138" r="112" fill="#EEE8FF" />
      <g transform="rotate(-4 170 140)">
        <rect x="92" y="38" width="170" height="210" rx="10" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" />
        <text x="112" y="72" fontFamily={DISPLAY} fontSize="14" fontWeight="800" fill={INK}>
          {title}
        </text>
        <rect x="112" y="92" width="132" height="14" rx="3" fill="#B9A3FF" className={a.hl} />
        <path d="M112 99 H242" stroke={INK} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
        <path d="M112 122 H232 M112 140 H222 M112 158 H240 M112 176 H200 M112 194 H230 M112 212 H186" stroke="#CBC7D3" strokeWidth="3" strokeLinecap="round" />
        <g className={a.pen}>
          <g transform="translate(96 74) rotate(30)">
            <rect x="0" y="0" width="12" height="40" rx="3" fill="#7A5AF8" stroke={INK} strokeWidth="2" />
            <path d="M1 40 L6 50 L11 40 Z" fill="#B9A3FF" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          </g>
        </g>
      </g>
      <g className={a.bob} style={{ animationDuration: "4s" }}>
        <rect x="244" y="150" width="70" height="58" rx="12" fill={INK} />
        <path d="M260 150 v-12 a19 19 0 0 1 38 0 v12" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
        <circle cx="279" cy="175" r="7" fill="#B9A3FF" />
        <path d="M279 180 v12" stroke="#B9A3FF" strokeWidth="5" strokeLinecap="round" />
      </g>
      <text x="22" y="226" fontFamily={HAND} fontSize="28" fontWeight="700" fill={INK} transform="rotate(-6 60 220)">
        no small print
      </text>
      <path d="M28 236 q40 8 76 -2" fill="none" stroke="#E0752D" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
