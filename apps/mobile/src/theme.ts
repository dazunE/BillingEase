/**
 * Graphite & Violet, the same tokens as the web app and the prototype's mobile.css.
 */
export const color = {
  ink: "#18161F",
  ink2: "#47444F",
  muted: "#5F5B68",
  faint: "#8C8896",
  bg: "#F7F6F9",
  surface: "#FFFFFF",
  line: "#E2DFE8",
  chip: "#EFEDF3",
  violet: "#B9A3FF",
  violetInk: "#7A5AF8",
  violetTint: "#EEE8FF",
  orange: "#E0752D",
  orangeTint: "#FDE6D6",
  green: "#2F5711",
  greenTint: "#E2F6D5",
  amber: "#6B5000",
  amberTint: "#FFF0B8",
  red: "#A1281B",
  redTint: "#FBE3DF",
  scrim: "rgba(24,22,31,0.42)",
} as const;

export const font = {
  head: "Sora_700Bold",
  headSemi: "Sora_600SemiBold",
  body: "DMSans_400Regular",
  medium: "DMSans_500Medium",
  semi: "DMSans_600SemiBold",
  bold: "DMSans_700Bold",
} as const;

export const radius = { card: 20, sheet: 28, pill: 9999, field: 14 } as const;

/** Tones for tags and banners: background and text. */
export const tone = {
  late: { bg: color.redTint, fg: color.red },
  warn: { bg: color.amberTint, fg: color.amber },
  ok: { bg: color.greenTint, fg: color.green },
  plain: { bg: color.chip, fg: color.ink2 },
  ai: { bg: color.violetTint, fg: "#4B2FC2" },
} as const;
export type Tone = keyof typeof tone;
