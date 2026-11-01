import type { Business } from "@billingease/contracts";

/** How a business's documents look, for the on-screen previews (the PDF draws the same). */
export type PreviewBrand = {
  template: "classic" | "modern" | "minimal";
  font: "sans" | "serif" | "mono";
  accent: string;
  footer: string | null;
  /** The uploaded logo, or null to show the business name. */
  logoUrl: string | null;
};

export const LOGO_URL = "/app/settings/branding/logo";

export function brandOf(b: Pick<Business, "template" | "font" | "accent" | "footer" | "hasLogo" | "logoVersion">): PreviewBrand {
  return { template: b.template, font: b.font, accent: b.accent, footer: b.footer, logoUrl: b.hasLogo ? `${LOGO_URL}?v=${b.logoVersion ?? ""}` : null };
}

export const FONT_STACKS: Record<PreviewBrand["font"], string> = {
  sans: '"DM Sans Variable", ui-sans-serif, system-ui, sans-serif',
  serif: '"Source Serif 4", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

const channels = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const valid = (h: string) => (/^#[0-9a-f]{6}$/i.test(h) ? h : "#7A5AF8");

function luminance(h: string) {
  const [r, g, b] = channels(valid(h)).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** White text on a dark brand colour, ink on a light one. */
export const textOn = (h: string) => (luminance(h) > 0.45 ? "#18161F" : "#FFFFFF");

/** The brand colour as text on white: darkened when it's too light to read (as in the PDF). */
export function readable(h: string) {
  if (luminance(h) <= 0.45) return valid(h);
  const [r, g, b] = channels(valid(h)).map((v) => Math.round(v * 0.55));
  return `rgb(${r}, ${g}, ${b})`;
}

/** A pale wash of the brand colour. */
export function wash(h: string, alpha = 0.12) {
  const [r, g, b] = channels(valid(h));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
