import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/components/ui";
import { money, signUpHref, type SiteCountry } from "@/content/site/country";
import type { Plan } from "@/content/site/plans";
import s from "./site.module.css";

/*
 * Marketing building blocks (server components, no client JS). Every page
 * under (site) is made of these plus its own illustrations. Spacing, type and
 * colours follow the prototype's Site*.dc.html pages.
 */

/** Horizontal text sizes shared by headings across the site. */
export const H1 = "font-display text-[clamp(40px,6.6vw,88px)] font-bold leading-[1.02] tracking-[-0.035em]";
export const H1_PAGE = "font-display text-[clamp(38px,5.4vw,72px)] font-bold leading-[1.04] tracking-[-0.035em]";
export const H2 = "font-display text-[clamp(32px,4.2vw,56px)] font-bold leading-[1.05] tracking-[-0.035em]";
export const H3 = "font-display text-[22px] font-bold tracking-[-0.02em]";

/** The 1200px column with the site's side padding. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("mx-auto box-border w-full max-w-[1200px] px-[clamp(16px,4vw,40px)]", className)}>{children}</div>;
}

/**
 * A full-width band with the standard vertical rhythm.
 * tone: "plain" (page grey), "white" (white with top/bottom rules), "dark" (graphite).
 * Pass `labelledBy` with the id of the section's heading.
 */
export function Section({
  id,
  labelledBy,
  tone = "plain",
  className,
  innerClassName,
  children,
}: {
  id?: string;
  labelledBy?: string;
  tone?: "plain" | "white" | "dark";
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx("scroll-mt-20", tone === "white" && "border-y border-line bg-white", tone === "dark" && "bg-ink text-white", className)}
    >
      <Container className={cx("flex flex-col gap-10 py-[clamp(64px,9vw,120px)]", innerClassName)}>{children}</Container>
    </section>
  );
}

/** Arrow used on links and buttons. */
export function ArrowIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="flex-none">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Underlined "More about …" link with an arrow. tone="light" on dark backgrounds. */
export function MoreLink({ href, children, tone = "dark", className }: { href: string; children: ReactNode; tone?: "dark" | "light"; className?: string }) {
  return (
    <Link
      href={href}
      className={cx(
        s.more,
        "inline-flex min-h-8 items-center gap-1.5 self-start text-sm font-bold underline decoration-[1.5px] underline-offset-4",
        tone === "light" ? "text-white" : "text-ink",
        className,
      )}
    >
      {children}
      <ArrowIcon />
    </Link>
  );
}

const CTA = {
  primary: "bg-violet text-ink hover:bg-[#a98ffb]",
  dark: "bg-ink text-white hover:bg-black",
  soft: "bg-ink/[0.07] text-ink hover:bg-ink/[0.11]",
  outline: "border border-input text-ink hover:bg-ink/[0.04]",
  outlineLight: "border border-white/[0.28] text-white hover:bg-white/[0.08]",
};

/** Pill link button. size "lg" is the hero size (56px), "md" 48px. */
export function CtaLink({
  href,
  children,
  variant = "primary",
  size = "md",
  arrow = false,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof CTA;
  size?: "md" | "lg";
  arrow?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full font-bold transition-colors",
        size === "lg" ? "min-h-14 px-[30px] text-[17px]" : "min-h-12 px-[22px] text-[15px]",
        CTA[variant],
        className,
      )}
    >
      {children}
      {arrow && <ArrowIcon size={size === "lg" ? 18 : 16} />}
    </Link>
  );
}

/** "Start free" for the visitor's country: links to /sign-up?country=…. */
export function StartFree({ country, children = "Start free", size = "md", variant = "primary", className }: { country: SiteCountry; children?: ReactNode; size?: "md" | "lg"; variant?: keyof typeof CTA; className?: string }) {
  return (
    <CtaLink href={signUpHref(country)} size={size} variant={variant} arrow className={className}>
      {children}
    </CtaLink>
  );
}

/**
 * The top of a marketing page: optional breadcrumbs/kicker, the page's h1,
 * a lead paragraph, actions (buttons) and an illustration slot.
 * align="center" stacks everything (home style); "left" puts `art` beside the text.
 */
export function PageHero({
  kicker,
  title,
  lead,
  actions,
  note,
  art,
  crumbs,
  align = "left",
  id = "page-h",
}: {
  kicker?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  /** Small print under the actions, e.g. "Free to start. No card needed." */
  note?: ReactNode;
  art?: ReactNode;
  crumbs?: ReactNode;
  align?: "left" | "center";
  id?: string;
}) {
  const text = (
    <div className={cx("flex min-w-0 flex-col gap-[18px]", align === "center" ? "items-center text-center" : "flex-[1_1_440px] items-start")}>
      {crumbs}
      {kicker && (
        <span className="inline-flex items-center gap-2 rounded-full bg-tint px-3 py-1 text-[13px] font-bold">
          <span aria-hidden className="size-2 rounded-full bg-coming" />
          {kicker}
        </span>
      )}
      <h1 id={id} className={cx(align === "center" ? H1 : H1_PAGE, "max-w-[980px] text-balance")}>
        {title}
      </h1>
      {lead && <p className={cx("max-w-[640px] text-balance text-[clamp(17px,1.6vw,20px)] leading-normal text-ink2")}>{lead}</p>}
      {(actions || note) && (
        <div className={cx("flex flex-wrap items-center gap-x-[18px] gap-y-2.5 pt-2", align === "center" && "justify-center")}>
          {actions}
          {note && <span className="text-sm text-muted">{note}</span>}
        </div>
      )}
    </div>
  );
  return (
    <section aria-labelledby={id}>
      <Container className="pb-[clamp(56px,8vw,104px)] pt-[clamp(40px,7vw,96px)]">
        {align === "center" ? (
          <div className="flex flex-col gap-9">
            {text}
            {art}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-12 gap-y-10">
            {text}
            {art && <div className="flex min-w-0 flex-[1_1_360px] justify-center">{art}</div>}
          </div>
        )}
      </Container>
    </section>
  );
}

/**
 * A section's heading block: h2 (or h3), an optional kicker above, a lead
 * below and an `aside` on the right (a toggle, a link). Give it the `id` the
 * Section's `labelledBy` points at.
 */
export function SectionHeading({
  id,
  title,
  lead,
  kicker,
  aside,
  more,
  align = "left",
  as: Tag = "h2",
  tone = "dark",
}: {
  id?: string;
  title: ReactNode;
  lead?: ReactNode;
  kicker?: ReactNode;
  aside?: ReactNode;
  more?: { label: string; href: string };
  align?: "left" | "center";
  as?: "h2" | "h3";
  tone?: "dark" | "light";
}) {
  return (
    <div className={cx("flex flex-wrap items-end justify-between gap-x-10 gap-y-5", align === "center" && "justify-center text-center")}>
      <div className={cx("flex max-w-[720px] flex-col gap-3", align === "center" && "items-center")}>
        {kicker && <span className={cx("text-sm font-bold uppercase tracking-[0.06em]", tone === "light" ? "text-violet" : "text-coming")}>{kicker}</span>}
        <Tag id={id} className={cx(Tag === "h2" ? H2 : "font-display text-[clamp(24px,2.6vw,32px)] font-bold leading-[1.15] tracking-[-0.025em]", "text-balance")}>
          {title}
        </Tag>
        {lead && <p className={cx("text-lg leading-normal", tone === "light" ? "text-tint" : "text-ink2")}>{lead}</p>}
        {more && <MoreLink href={more.href} tone={tone === "light" ? "light" : "dark"}>{more.label}</MoreLink>}
      </div>
      {aside}
    </div>
  );
}

const TINT = { violet: "bg-tint", orange: "bg-going-tint", green: "bg-pos-bg", yellow: "bg-due-bg", grey: "bg-surface", dark: "bg-ink" } as const;
export type Tint = keyof typeof TINT;

/** A rounded icon tile (24×24 stroke path). */
export function IconTile({ d, tint = "violet", size = 40 }: { d: string; tint?: Tint; size?: number }) {
  return (
    <span className={cx("flex flex-none items-center justify-center rounded-xl", TINT[tint])} style={{ width: size, height: size }}>
      <svg width={size / 2} height={size / 2} viewBox="0 0 24 24" fill="none" stroke={tint === "dark" ? "#B9A3FF" : "#18161F"} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={d} />
      </svg>
    </span>
  );
}

export type FeatureItem = { icon: string; title: ReactNode; body: ReactNode; tag?: ReactNode; href?: string; tint?: Tint };

/** One feature: icon tile, title, optional tag line, body; the whole card links when `href` is set. */
export function FeatureCard({ icon, title, body, tag, href, tint = "violet", surface = "white" }: FeatureItem & { surface?: "white" | "grey" }) {
  const inner = (
    <>
      <IconTile d={icon} tint={tint} />
      <span className="flex flex-col gap-0.5">
        <span className="text-base font-bold">{title}</span>
        {tag && <span className="text-xs text-muted">{tag}</span>}
      </span>
      <span className="text-sm leading-normal text-ink2">{body}</span>
      {href && (
        <span className={cx(s.go, "mt-auto inline-flex items-center gap-1.5 text-sm font-bold")}>
          Learn more
          <ArrowIcon />
        </span>
      )}
    </>
  );
  const cls = cx("flex h-full flex-col gap-2.5 rounded-[20px] p-[22px]", surface === "white" ? "border border-line bg-white" : "bg-bg");
  return href ? (
    <Link href={href} className={cx(cls, s.lift)}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** A responsive grid of FeatureCards (min column width `min` px). */
export function FeatureGrid({ items, min = 240, surface = "white" }: { items: FeatureItem[]; min?: number; surface?: "white" | "grey" }) {
  return (
    <ul className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))` }}>
      {items.map((it, i) => (
        <li key={i} className="flex min-w-0">
          <div className="flex-1">
            <FeatureCard {...it} surface={surface} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Alternating text + illustration row (feature pages). `art` is the
 * illustration slot (decorative: mark it aria-hidden). `reverse` puts the art first on wide screens.
 */
export function FeatureRow({
  id,
  kicker,
  title,
  body,
  bullets,
  more,
  art,
  reverse = false,
}: {
  id?: string;
  kicker?: ReactNode;
  title: ReactNode;
  body: ReactNode;
  bullets?: ReactNode[];
  more?: { label: string; href: string };
  art: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className={cx("flex flex-wrap items-center gap-x-[clamp(32px,6vw,80px)] gap-y-8", reverse && "flex-row-reverse")}>
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
        {kicker && <span className="text-sm font-bold uppercase tracking-[0.06em] text-coming">{kicker}</span>}
        <h3 id={id} className="text-balance font-display text-[clamp(26px,3vw,40px)] font-bold leading-[1.1] tracking-[-0.03em]">
          {title}
        </h3>
        <p className="text-[17px] leading-relaxed text-ink2">{body}</p>
        {bullets && bullets.length > 0 && (
          <ul className="flex flex-col gap-2.5 text-[15px]">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Tick />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        {more && <MoreLink href={more.href}>{more.label}</MoreLink>}
      </div>
      <div className="flex min-w-0 flex-[1_1_380px] justify-center">
        <div className="w-full rounded-3xl border border-line bg-white p-[clamp(16px,3vw,28px)]">{art}</div>
      </div>
    </div>
  );
}

export function Tick({ color = "#18161F" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 flex-none">
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

/**
 * The dark rounded call-to-action band that ends most pages (inside a padded
 * wrapper, like the home page's closing band). `art` sits on the right.
 */
export function CtaBand({
  id = "cta-h",
  kicker,
  title,
  lead,
  primary,
  secondary,
  art,
}: {
  id?: string;
  kicker?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  art?: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="px-[clamp(16px,4vw,40px)] pb-[clamp(48px,6vw,80px)]">
      <div className="mx-auto box-border flex max-w-[1200px] flex-wrap items-center gap-x-12 gap-y-8 rounded-[32px] bg-ink px-[clamp(24px,6vw,80px)] py-[clamp(40px,7vw,96px)] text-white">
        <div className="flex min-w-0 flex-[999_1_420px] flex-col items-start gap-6">
          {kicker && (
            <span className="flex items-center gap-2 text-sm font-semibold text-tint">
              <span aria-hidden className="size-2.5 rounded-full bg-violet" />
              {kicker}
            </span>
          )}
          <h2 id={id} className="max-w-[900px] text-balance font-display text-[clamp(36px,5.6vw,76px)] font-bold leading-[1.02] tracking-[-0.04em] text-violet">
            {title}
          </h2>
          {lead && <p className="max-w-[640px] text-lg leading-normal text-tint">{lead}</p>}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <CtaLink href={primary.href} size="lg" arrow>
              {primary.label}
            </CtaLink>
            {secondary && (
              <Link href={secondary.href} className="inline-flex min-h-11 items-center text-[15px] font-semibold text-white underline underline-offset-[3px]">
                {secondary.label}
              </Link>
            )}
          </div>
        </div>
        {art && <div className="flex flex-[1_1_280px] justify-center">{art}</div>}
      </div>
    </section>
  );
}

const TAG_FILL = ["#FFF6E0", "#B9A3FF", "#FDE6D6"];

/** The swinging price tag on plan cards. Decorative. */
export function PriceTag({ fill, text, size = 22, delay }: { fill: string; text: string; size?: number; delay?: string }) {
  return (
    <svg className="absolute -top-3.5 right-[22px] overflow-visible" aria-hidden viewBox="0 0 80 110" width="72">
      <g className={cx(s.pivot, s.swing)} style={delay ? { animationDelay: delay } : undefined}>
        <path d="M40 0 V26" stroke="#18161F" strokeWidth="2" />
        <path d="M24 30 L40 22 L56 30 V96 H24 Z" fill={fill} stroke="#18161F" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="40" cy="34" r="4" fill="#FFFFFF" stroke="#18161F" strokeWidth="2" />
        <text x="40" y="68" textAnchor="middle" className="font-hand" fontSize={size} fontWeight="700" fill="#18161F">
          {text}
        </text>
      </g>
    </svg>
  );
}

/**
 * A plan card (home teaser and /pricing). `index` staggers the tag swing and
 * picks its colour. Prices come from content/site/plans.ts.
 */
export function PlanCard({ plan, country, index = 0 }: { plan: Plan; country: SiteCountry; index?: number }) {
  const free = plan.price === 0;
  const price = money(plan.price, country);
  const href = plan.href === "signup" ? signUpHref(country) : plan.href;
  const tagText = free ? "free" : country === "lk" ? "Rs" : price;
  return (
    <div className={cx(s.lift, "relative flex min-w-0 flex-col gap-[22px] rounded-3xl bg-white", plan.popular ? "border-2 border-ink p-[31px]" : "border border-line p-8")}>
      <PriceTag fill={TAG_FILL[index % 3]} text={tagText} size={free ? 22 : 17} delay={`${-index * 1.1}s`} />
      <span className="flex flex-col gap-1.5 pr-[70px]">
        <span className="text-lg font-bold">{plan.name}</span>
        {plan.popular ? (
          <span className="self-start rounded-full bg-violet px-2.5 text-[13px] font-bold leading-[19px]">{plan.tag}</span>
        ) : (
          <span className="text-sm leading-[21px] text-muted">{plan.tag}</span>
        )}
      </span>
      <span className="flex flex-col gap-1.5">
        <span className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="font-display text-[clamp(44px,4.6vw,56px)] font-bold leading-none tracking-[-0.04em]">{price}</span>
          {plan.per && <span className="text-base text-ink2">{plan.per}</span>}
        </span>
        <span className="min-h-[21px] text-sm text-muted">{free ? "Free for as long as you like" : "Billed monthly · cancel any time"}</span>
      </span>
      <span className="text-[15px] leading-normal text-ink2">{plan.line}</span>
      <ul className="flex flex-col gap-2.5 border-t border-divider pt-[18px] text-[15px]">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Tick />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <CtaLink href={href} variant={plan.popular ? "primary" : "soft"} className="mt-auto">
        {plan.cta}
      </CtaLink>
    </div>
  );
}

/**
 * A quote card that is always labelled as illustrative: we have no customers
 * to quote yet, so never present these as real people.
 */
export function IllustrativeQuote({
  quote,
  name,
  role,
  note = "Illustrative example, not a real customer.",
  tint = "violet",
}: {
  quote: ReactNode;
  name: string;
  role: string;
  note?: string;
  tint?: Tint;
}) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <figure className="flex h-full flex-col gap-5 rounded-3xl border border-line bg-white p-7">
      <span className="self-start rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-ink2">Illustrative</span>
      <blockquote className="font-display text-[clamp(19px,1.8vw,22px)] font-semibold leading-[1.35] tracking-[-0.01em]">“{quote}”</blockquote>
      <figcaption className="mt-auto flex items-center gap-3">
        <span aria-hidden className={cx("flex size-11 flex-none items-center justify-center rounded-full text-sm font-bold", TINT[tint], tint === "dark" && "text-violet")}>
          {initials}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[15px] font-bold">{name}</span>
          <span className="text-[13px] text-muted">{role}</span>
          <span className="text-xs text-muted">{note}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** Breadcrumbs for resource pages (guides, help, legal). The last item is the current page. */
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {it.href && !last ? (
                <Link href={it.href} className="inline-flex min-h-8 items-center font-semibold text-ink underline-offset-[3px] hover:underline">
                  {it.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined}>{it.label}</span>
              )}
              {!last && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5F5B68" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m9 6 6 6-6 6" />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** "Rates are illustrative" line: use wherever a tax rate or threshold appears. */
export function RatesNote({ country, className }: { country: SiteCountry; className?: string }) {
  return (
    <p className={cx("text-[13px] leading-normal text-muted", className)}>
      Rates shown are illustrative and are checked against {country === "uk" ? "gov.uk" : "ird.gov.lk"} before launch.
    </p>
  );
}
