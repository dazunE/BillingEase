import Link from "next/link";
import type { ReactNode } from "react";
import { CashJar } from "@/components/CashJar";
import { ArrowIcon, Container, Faq, IllustrativeQuote, type Tint } from "@/components/site";
import { cx } from "@/components/ui";
import { COUNTRY_META, signUpHref, type SiteCountry } from "@/content/site/country";
import { ROUTES } from "@/content/site/routes";

/*
 * Pieces shared by the product pages (prototype SiteFeatures, SiteComingIn,
 * SiteGoingOut, SiteKeep, SitePricing, SiteSwitch, SiteSecurity). Server
 * components; the interactive demos live next to this file.
 */

export const H2_PROD = "font-display text-[clamp(32px,3.8vw,50px)] font-bold leading-[1.05] tracking-[-0.035em] text-balance";
export const H2_SMALL = "font-display text-[clamp(28px,3.4vw,44px)] font-bold leading-[1.08] tracking-[-0.03em] text-balance";
export const H1_PROD = "font-display text-[clamp(40px,5.2vw,68px)] font-bold leading-[1.02] tracking-[-0.035em] text-balance";

const DOTS = { in: "bg-coming", out: "bg-going", keep: "bg-ink ring-2 ring-violet ring-inset", violet: "bg-violet", tax: "bg-[#E3C38F]", green: "bg-[#7FB872]" } as const;
export type DotTone = keyof typeof DOTS;

/** "• Coming in" kicker with a coloured dot. */
export function Kicker({ dot = "in", children, light = false }: { dot?: DotTone; children: ReactNode; light?: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-2 text-sm font-bold", light ? "text-tint" : "text-ink")}>
      <span aria-hidden className={cx("inline-block size-2.5 flex-none rounded-full", DOTS[dot])} />
      {children}
    </span>
  );
}

/** Pill button (prototype sx-btn / sx-btn2 / sx-btnd). */
export function Pill({ href, children, variant = "primary", arrow = false, className }: { href: string; children: ReactNode; variant?: "primary" | "soft" | "dark" | "white"; arrow?: boolean; className?: string }) {
  const v = {
    primary: "bg-violet text-ink hover:bg-[#a98ffb] font-bold text-[17px] px-7",
    soft: "bg-ink/[0.07] text-ink hover:bg-ink/[0.11] font-semibold text-base px-6",
    dark: "bg-ink text-white hover:bg-black font-bold text-[17px] px-7",
    white: "bg-white text-ink hover:bg-white/80 font-semibold text-base px-6",
  }[variant];
  return (
    <Link href={href} className={cx("inline-flex min-h-14 items-center justify-center gap-2.5 whitespace-nowrap rounded-full transition-colors", v, className)}>
      {children}
      {arrow && <ArrowIcon size={18} />}
    </Link>
  );
}

/** Underlined arrow link, 44px tall (prototype sx-lnk). */
export function ArrowLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cx("inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold underline decoration-[1.5px] underline-offset-4", className)}>
      {children}
      <ArrowIcon size={16} />
    </Link>
  );
}

/** The page top used by the product pages: kicker, h1, lead, two buttons, small print, and a card on the right. */
export function ProductHero({
  kicker,
  dot = "in",
  title,
  lead,
  country,
  second,
  small,
  art,
  textBasis = "420px",
}: {
  kicker: ReactNode;
  dot?: DotTone;
  title: ReactNode;
  lead: ReactNode;
  country: SiteCountry;
  second?: { label: string; href: string };
  small?: ReactNode;
  art: ReactNode;
  textBasis?: string;
}) {
  return (
    <section aria-labelledby="hero-h">
      <Container className="flex flex-wrap items-center gap-x-14 gap-y-12 pb-[clamp(56px,8vw,104px)] pt-[clamp(40px,6vw,88px)]">
        <div className="flex min-w-0 flex-col items-start gap-[22px]" style={{ flex: `1 1 ${textBasis}` }}>
          <Kicker dot={dot}>{kicker}</Kicker>
          <h1 id="hero-h" className={H1_PROD}>
            {title}
          </h1>
          <p className="max-w-[560px] text-pretty text-[clamp(17px,1.6vw,20px)] leading-normal text-ink2">{lead}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-1.5">
            <Pill href={signUpHref(country)} arrow>
              Start free
            </Pill>
            {second && (
              <Pill href={second.href} variant="soft">
                {second.label}
              </Pill>
            )}
          </div>
          {small && <span className="text-[13px] leading-[1.45] text-muted">{small}</span>}
        </div>
        {art}
      </Container>
    </section>
  );
}

/** The white card the hero demos sit in. */
export function HeroCard({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      className={cx(
        "box-border flex min-w-0 max-w-[580px] flex-[1_1_440px] flex-col gap-[18px] rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)] shadow-[0_30px_60px_-30px_rgba(24,22,31,0.25)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A band with the standard rhythm; tone "white" adds the rules. */
export function Band({ id, labelledBy, tone = "plain", className, children }: { id?: string; labelledBy: string; tone?: "plain" | "white" | "dark"; className?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cx("scroll-mt-4", tone === "white" && "border-y border-line bg-white", tone === "dark" && "bg-ink text-white")}>
      <Container className={cx("py-[clamp(64px,9vw,120px)]", className)}>{children}</Container>
    </section>
  );
}

/** Kicker + h2 + lead. */
export function Heading({ id, kicker, dot, title, lead, small = false, light = false, className }: { id: string; kicker?: ReactNode; dot?: DotTone; title: ReactNode; lead?: ReactNode; small?: boolean; light?: boolean; className?: string }) {
  return (
    <div className={cx("flex min-w-0 max-w-[720px] flex-col gap-3.5", className)}>
      {kicker && (
        <Kicker dot={dot} light={light}>
          {kicker}
        </Kicker>
      )}
      <h2 id={id} className={cx(small ? H2_SMALL : H2_PROD, light && "text-white")}>
        {title}
      </h2>
      {lead && <p className={cx("text-pretty text-[17px] leading-[1.55]", light ? "text-[#D9D4E6]" : "text-ink2")}>{lead}</p>}
    </div>
  );
}

/** Small rounded label (prototype sx-pill). */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", className ?? "bg-tint")}>{children}</span>;
}

/** FAQ block: heading on the left, the shared disclosure list on the right. */
export function FaqBlock({ title, items, tone = "plain", note }: { title: string; items: { q: string; a: ReactNode }[]; tone?: "plain" | "white"; note?: ReactNode }) {
  return (
    <Band labelledBy="faq-h" tone={tone} className="flex flex-wrap gap-x-16 gap-y-8">
      <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
        <h2 id="faq-h" className={H2_SMALL}>
          {title}
        </h2>
        <p className="text-[15px] leading-[1.55] text-ink2">
          {note ?? (
            <>
              Something else?{" "}
              <Link href={ROUTES.help.href} className="font-semibold text-ink underline underline-offset-[3px]">
                Ask the help centre
              </Link>
              .
            </>
          )}
        </p>
      </div>
      <Faq items={items} className="flex-[999_1_520px]" />
    </Band>
  );
}

/** Three illustrative quotes (never presented as real customers). */
export function QuoteRow({ id, title, quotes }: { id: string; title: string; quotes: { quote: string; name: string; role: string; tint?: Tint }[] }) {
  return (
    <Band labelledBy={id} className="flex flex-col gap-8">
      <h2 id={id} className={H2_SMALL}>
        {title}
      </h2>
      <ul className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
        {quotes.map((q) => (
          <li key={q.name} className="flex">
            <div className="flex-1">
              <IllustrativeQuote quote={q.quote} name={q.name} role={q.role} tint={q.tint} />
            </div>
          </li>
        ))}
      </ul>
    </Band>
  );
}

/** The lavender closing band with the cash jar (prototype "CTA" on the product pages). */
export function ProductCta({
  country,
  kicker,
  dot = "in",
  title,
  text,
  jar,
  more,
}: {
  country: SiteCountry;
  kicker: ReactNode;
  dot?: DotTone;
  title: ReactNode;
  text?: ReactNode;
  jar: string;
  more?: { label: string; href: string };
}) {
  return (
    <section aria-labelledby="cta-h" className="px-[clamp(16px,4vw,40px)] pb-[clamp(64px,8vw,104px)] pt-[clamp(8px,2vw,16px)]">
      <div className="mx-auto box-border flex max-w-[1200px] flex-wrap items-center gap-x-12 gap-y-8 rounded-[32px] bg-tint px-[clamp(24px,6vw,80px)] py-[clamp(36px,5vw,72px)]">
        <div className="flex min-w-0 flex-[999_1_420px] flex-col items-start gap-5">
          <Kicker dot={dot}>{kicker}</Kicker>
          <h2 id="cta-h" className="text-balance font-display text-[clamp(34px,4.6vw,60px)] font-bold leading-[1.05] tracking-[-0.035em]">
            {title}
          </h2>
          {text && <p className="max-w-[520px] text-[17px] leading-[1.55] text-ink2">{text}</p>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Pill href={signUpHref(country)} variant="dark" arrow className="[&_svg]:stroke-white">
              Start free
            </Pill>
            <Pill href={ROUTES.pricing.href} variant="white">
              See pricing
            </Pill>
            {more && (
              <Link href={more.href} className="inline-flex min-h-11 items-center px-2 text-[15px] font-semibold underline underline-offset-4">
                {more.label}
              </Link>
            )}
          </div>
        </div>
        <div aria-hidden className="flex min-w-0 flex-[1_1_240px] justify-center">
          <CashJar size={320} amount={jar} sym={COUNTRY_META[country].sym} className="h-auto max-w-full" />
        </div>
      </div>
    </section>
  );
}

/** A visual-only switch track (inside a role="switch" button). */
export function SwitchTrack({ on, dark = false }: { on: boolean; dark?: boolean }) {
  return (
    <span aria-hidden className={cx("relative h-[26px] w-11 flex-none rounded-full transition-colors", on ? "bg-coming" : dark ? "bg-ink2" : "bg-input")}>
      <span className="absolute top-[3px] size-5 rounded-full bg-white transition-[left]" style={{ left: on ? 21 : 3 }} />
    </span>
  );
}

/** Check icon in a small circle. */
export function CheckDot({ tint = "bg-tint", stroke = "#18161F", size = 20 }: { tint?: string; stroke?: string; size?: number }) {
  return (
    <span aria-hidden className={cx("mt-px flex flex-none items-center justify-center rounded-full", tint)} style={{ width: size, height: size }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 12 5 5 9-10" />
      </svg>
    </span>
  );
}
