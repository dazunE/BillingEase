import { useId } from "react";

/** Hair and colour presets for the persona avatars (prototype Site* "Meet …" portraits). */
export const AVATARS = {
  /** Short dark hair, orange top (Ellie, sole trader). */
  ellie: {
    bg: "#EEE8FF",
    skin: "#E7B48F",
    hair: "#18161F",
    shirt: "#E0752D",
    hairBack: "M36 48 C33 62 35 74 44 78 C46 68 48 62 52 60 L68 60 C72 62 74 68 76 78 C85 74 87 62 84 48 Z",
    hairTop: "M37 52 C35 32 48 25 61 25 C75 25 86 34 83 52 C77 42 68 37 58 39 C48 41 41 46 37 52 Z",
  },
  /** Long hair with a bun, violet top (Ayesha, Sri Lanka). */
  ayesha: {
    bg: "#FDE6D6",
    skin: "#B97A55",
    hair: "#2A1A12",
    shirt: "#7A5AF8",
    hairBack: "M38 46 C30 60 30 84 40 96 C44 84 46 72 48 62 Z M82 46 C90 60 90 84 80 96 C76 84 74 72 72 62 Z",
    hairTop: "M37 50 C36 32 48 25 60 25 C72 25 84 32 83 50 C78 42 70 38 60 38 C50 38 42 42 37 50 Z M52 26 C52 16 68 16 68 26 Z",
  },
  /** Swept short hair, green top (Tom, landlord). */
  tom: {
    bg: "#FFF0B8",
    skin: "#F1C7A3",
    hair: "#6B4226",
    shirt: "#2F5711",
    hairBack: "M38 48 C36 58 38 66 42 70 L78 70 C82 66 84 58 82 48 Z",
    hairTop: "M37 52 C35 32 48 25 61 25 C75 25 86 34 83 52 C80 44 74 40 66 39 C58 38 52 44 46 42 C42 44 39 48 37 52 Z",
  },
  /** Close crop, violet top (Dan, electrician). */
  dan: {
    bg: "#E2F6D5",
    skin: "#8D5A3B",
    hair: "#18161F",
    shirt: "#7A5AF8",
    hairBack: "M40 46 C40 52 41 56 42 58 L78 58 C79 56 80 52 80 46 Z",
    hairTop: "M38 48 C37 32 48 26 60 26 C72 26 83 32 82 48 C76 40 68 36 60 36 C52 36 44 40 38 48 Z",
  },
  /** Bob with glasses colour, orange top (Chaminda, baker). */
  chaminda: {
    bg: "#E1EEF8",
    skin: "#8D5A3B",
    hair: "#18161F",
    shirt: "#E0752D",
    hairBack: "M38 48 C37 56 38 62 40 64 L80 64 C82 62 83 56 82 48 Z",
    hairTop: "M37 50 C36 32 48 25 60 25 C72 25 84 32 83 50 C78 42 70 38 60 38 C50 38 42 42 37 50 Z",
  },
  /** Curly hair, green top (Priya, accountant). */
  priya: {
    bg: "#EEE8FF",
    skin: "#B97A55",
    hair: "#18161F",
    shirt: "#2F5711",
    hairBack: "M34 50 C26 34 36 18 60 18 C84 18 94 34 86 50 C90 64 84 74 78 70 L42 70 C36 74 30 64 34 50 Z",
    hairTop: "M38 46 C38 28 50 22 60 22 C72 22 84 28 82 46 C74 38 66 36 60 36 C52 36 44 38 38 46 Z",
  },
} as const;

export type AvatarKey = keyof typeof AVATARS;

/** A round illustrated portrait (decorative). */
export function Avatar({ who, size = 120, glasses = false, className }: { who: AvatarKey; size?: number; glasses?: boolean; className?: string }) {
  const p = AVATARS[who];
  const clip = "av" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden className={className} style={{ flex: "none", display: "block" }}>
      <circle cx="60" cy="60" r="58" fill={p.bg} />
      <clipPath id={clip}>
        <circle cx="60" cy="60" r="58" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <path d="M18 124 C18 92 36 82 60 82 C84 82 102 92 102 124 Z" fill={p.shirt} stroke="#18161F" strokeWidth="2.5" />
        <rect x="51" y="66" width="18" height="20" fill={p.skin} stroke="#18161F" strokeWidth="2.2" />
        <path d={p.hairBack} fill={p.hair} stroke="#18161F" strokeWidth="2.2" />
        <circle cx="60" cy="50" r="22" fill={p.skin} stroke="#18161F" strokeWidth="2.5" />
        <path d={p.hairTop} fill={p.hair} />
        <circle cx="52" cy="52" r="2.6" fill="#18161F" />
        <circle cx="68" cy="52" r="2.6" fill="#18161F" />
        {glasses && (
          <g fill="none" stroke="#18161F" strokeWidth="2">
            <circle cx="52" cy="52" r="6" />
            <circle cx="68" cy="52" r="6" />
            <path d="M58 52 h4" />
          </g>
        )}
        <path d="M54 61 q6 4 12 0" fill="none" stroke="#18161F" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
