import Link from "next/link";
import type { ReactNode } from "react";
import { CashJar } from "@/components/CashJar";
import { ArrowIcon, Container, CtaLink, Faq, H2, IconTile, PlanCard, Section, StartFree, type Tint } from "@/components/site";
import { Avatar, type AvatarKey } from "@/components/site/illustrations/audience";
import s from "@/components/site/site.module.css";
import { cx } from "@/components/ui";
import { COUNTRY_META, money, type SiteCountry } from "@/content/site/country";
import type { Plan } from "@/content/site/plans";
import { PRICE_NOTE } from "@/content/site/plans";
import { ROUTES, routeText, type RouteKey } from "@/content/site/routes";

/*
 * The shared skeleton of the "who it's for" pages, after the prototype's
 * SiteFreelancers / SiteShops / SiteTeams / SiteGlobal: hero with a
 * "Who it's for / …" chip, "Meet …" with three numbers, feature cards,
 * illustrative quotes, the plan that fits, fair questions, "also for", and
 * the dark closing band with the cash jar. Server components only.
 */

const TINT_BG: Record<Tint, string> = { violet: "bg-tint", orange: "bg-going-tint", green: "bg-pos-bg", yellow: "bg-due-bg", grey: "bg-surface", dark: "bg-ink" };

/** A small dot + label above a heading ("A quarter in the life"). */
export function Kicker({ children, dot = "bg-coming", tone = "dark" }: { children: ReactNode; dot?: string; tone?: "dark" | "light" }) {
  return (
    <span className={cx("inline-flex items-center gap-2 text-sm font-bold", tone === "light" ? "text-tint" : "text-muted")}>
      <span aria-hidden className={cx("size-2.5 flex-none rounded-full", dot)} />
      {children}
    </span>
  );
}

/** A left-aligned section heading: kicker, h2, lead. */
export function Heading({ id, kicker, dot, title, lead, max = 780 }: { id: string; kicker?: ReactNode; dot?: string; title: ReactNode; lead?: ReactNode; max?: number }) {
  return (
    <div className="flex flex-col gap-3" style={{ maxWidth: max }}>
      {kicker && <Kicker dot={dot}>{kicker}</Kicker>}
      <h2 id={id} className={cx(H2, "text-balance")}>
        {title}
      </h2>
      {lead && <p className="text-lg leading-normal text-ink2">{lead}</p>}
    </div>
  );
}

/** Hero: "Who it's for / X" chip, h1, lead, Start free + a second action, small print and a link, art on the right. */
export function AudienceHero({
  country,
  chip,
  title,
  lead,
  secondary = { label: "See pricing", href: ROUTES.pricing.href },
  primary,
  note = "Free to start. No card needed.",
  link,
  art,
}: {
  country: SiteCountry;
  chip: { icon: string; tint: Tint; label: string; parent?: string };
  title: ReactNode;
  lead: ReactNode;
  secondary?: { label: string; href: string };
  /** Replaces "Start free" (e.g. the accountants page). */
  primary?: { label: string; href: string };
  note?: ReactNode;
  link?: { label: string; href: string };
  art: ReactNode;
}) {
  return (
    <section aria-labelledby="page-h">
      <Container className="flex flex-wrap items-center gap-x-14 gap-y-10 pb-[clamp(56px,8vw,104px)] pt-[clamp(32px,6vw,80px)]">
        <div className="flex min-w-0 flex-[1_1_460px] flex-col items-start gap-[22px]">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-4 text-sm font-semibold text-ink2">
            <span className={cx("flex size-[26px] flex-none items-center justify-center rounded-full", TINT_BG[chip.tint])}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={chip.icon} />
              </svg>
            </span>
            {chip.parent ?? "Who it’s for"}
            <span aria-hidden className="text-input">
              /
            </span>
            <span className="text-ink">{chip.label}</span>
          </span>
          <h1 id="page-h" className="text-balance font-display text-[clamp(40px,5.4vw,72px)] font-bold leading-[1.03] tracking-[-0.035em]">
            {title}
          </h1>
          <p className="max-w-[580px] text-[clamp(17px,1.5vw,19px)] leading-[1.55] text-ink2">{lead}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 pt-1">
            {primary ? (
              <CtaLink href={primary.href} size="lg" variant="dark" arrow>
                {primary.label}
              </CtaLink>
            ) : (
              <StartFree country={country} size="lg" />
            )}
            <CtaLink href={secondary.href} size="lg" variant="soft" className="font-semibold">
              {secondary.label}
            </CtaLink>
          </div>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
            <span>{note}</span>
            {link && (
              <Link href={link.href} className="inline-flex min-h-8 items-center gap-1.5 font-semibold text-ink underline underline-offset-[3px]">
                {link.label}
                <ArrowIcon />
              </Link>
            )}
          </span>
        </div>
        <div className="mx-auto flex min-w-0 max-w-[540px] flex-[1_1_380px] justify-center">{art}</div>
      </Container>
    </section>
  );
}

export type Numbers = { inPaid: number; inExp: number; outPaid: number; outSch: number; tax: number };

/** Coming in − Going out = Yours to keep, as three cards with split bars. */
export function ThreeNumbers({ n, country, caption, label }: { n: Numbers; country: SiteCountry; caption: string; label: string }) {
  const inT = n.inPaid + n.inExp;
  const outT = n.outPaid + n.outSch;
  const keep = inT - outT - n.tax;
  const pct = (a: number, b: number) => `${Math.round((a / Math.max(b, 1)) * 100)}%`;
  const keepPct = pct(keep, inT - outT);
  const num = cx("tabular whitespace-nowrap font-display font-bold leading-none tracking-[-0.035em]", country === "lk" ? "text-[clamp(26px,2.9vw,40px)]" : "text-[clamp(30px,3.6vw,48px)]");
  const op = "flex flex-none items-center justify-center font-display text-4xl font-bold text-muted max-[900px]:h-5 max-[900px]:basis-full max-[900px]:text-[26px]";
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2.5">
      <span className="text-[13px] text-muted">{caption}</span>
      <div className="flex flex-wrap items-stretch gap-3">
        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-3 rounded-3xl bg-bg p-6">
          <span className="flex items-center gap-2 text-[15px] font-bold">
            <span aria-hidden className="size-2.5 rounded-full bg-coming" />
            Coming in
          </span>
          <span className={num}>{money(inT, country)}</span>
          <span aria-hidden className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface">
            <span className="bg-coming" style={{ width: pct(n.inPaid, inT) }} />
            <span className="bg-coming-light" style={{ width: pct(n.inExp, inT) }} />
          </span>
          <span className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[13px] text-ink2">
            <span>
              <strong className="text-ink">{money(n.inPaid, country)}</strong> received
            </span>
            <span>
              <strong className="text-ink">{money(n.inExp, country)}</strong> on the way
            </span>
          </span>
        </div>
        <div aria-hidden className={op}>
          −
        </div>
        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-3 rounded-3xl bg-bg p-6">
          <span className="flex items-center gap-2 text-[15px] font-bold">
            <span aria-hidden className="size-2.5 rounded-full bg-going" />
            Going out
          </span>
          <span className={num}>{money(outT, country)}</span>
          <span aria-hidden className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface">
            <span className="bg-going" style={{ width: pct(n.outPaid, outT) }} />
            <span className="bg-going-light" style={{ width: pct(n.outSch, outT) }} />
          </span>
          <span className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[13px] text-ink2">
            <span>
              <strong className="text-ink">{money(n.outPaid, country)}</strong> paid
            </span>
            <span>
              <strong className="text-ink">{money(n.outSch, country)}</strong> still to pay
            </span>
          </span>
        </div>
        <div aria-hidden className={op}>
          =
        </div>
        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-3 rounded-3xl bg-ink p-6 text-white">
          <span className="flex items-center gap-2 text-[15px] font-bold text-tint">
            <span aria-hidden className="size-2.5 rounded-full bg-violet" />
            Yours to keep
          </span>
          <span className={cx(num, "text-violet")}>{money(keep, country)}</span>
          <span aria-hidden className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-white/[0.16]">
            <span className="bg-violet" style={{ width: keepPct }} />
            <span className="flex-1 bg-tint/45" />
          </span>
          <span className="text-[13px] text-tint">
            after <strong className="text-white">{money(n.tax, country)}</strong> set aside for {country === "uk" ? "Income Tax and NI" : "income tax"}
          </span>
        </div>
      </div>
    </div>
  );
}

/** "Meet …": portrait, headline, story, byline, then their three numbers. */
export function MeetPersona({
  country,
  avatar,
  glasses,
  title,
  story,
  byline,
  first,
  numbers,
  caption,
}: {
  country: SiteCountry;
  avatar: AvatarKey;
  glasses?: boolean;
  title: ReactNode;
  story: ReactNode;
  byline: string;
  first: string;
  numbers: Numbers;
  caption: string;
}) {
  return (
    <Section tone="white" labelledBy="meet-h" innerClassName="gap-9!">
      <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
        <Avatar who={avatar} glasses={glasses} />
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3">
          <h2 id="meet-h" className={cx(H2, "text-balance")}>
            {title}
          </h2>
          <p className="max-w-[760px] text-lg leading-[1.55] text-ink2">{story}</p>
          <span className="text-sm font-semibold text-muted">{byline}</span>
        </div>
      </div>
      <ThreeNumbers n={numbers} country={country} caption={caption} label={`${first}’s three numbers`} />
      <p className="text-[13px] text-muted">Invented business and illustrative figures.</p>
    </Section>
  );
}

export type AudienceFeature = { icon: string; tint: Tint; title: string; tag: string; body: string; link?: { label: string; href: string } };

/** The six grey feature cards (icon, Sora title, tag line, body, link). */
export function FeatureCards({ items, min = 300 }: { items: AudienceFeature[]; min?: number }) {
  return (
    <ul className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))` }}>
      {items.map((f) => (
        <li key={f.title} className="flex min-w-0 flex-col gap-3.5 rounded-3xl bg-bg p-[26px]">
          <IconTile d={f.icon} tint={f.tint} size={44} />
          <span className="flex flex-col gap-1">
            <span className="font-display text-xl font-bold tracking-[-0.02em]">{f.title}</span>
            <span className="text-[13px] font-semibold text-muted">{f.tag}</span>
          </span>
          <span className="text-[15px] leading-[1.55] text-ink2">{f.body}</span>
          {f.link && (
            <Link href={f.link.href} className={cx(s.more, "mt-auto inline-flex min-h-8 items-center gap-1.5 self-start text-sm font-bold underline underline-offset-[3px]")}>
              {f.link.label}
              <ArrowIcon />
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

export type Quote = { text: string; name: string; role: string; tint?: Tint };

/** One large quote and two small ones, all labelled illustrative. */
export function QuoteWall({ id = "quote-h", title, main, side }: { id?: string; title: ReactNode; main: Quote; side: Quote[] }) {
  const init = (n: string) =>
    n
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  return (
    <Section labelledBy={id}>
      <div className="flex flex-col gap-3">
        <h2 id={id} className={cx(H2, "max-w-[760px] text-balance")}>
          {title}
        </h2>
        <p className="text-[15px] text-muted">We’re new, so these are illustrative: invented people saying what BillingEase is built to do.</p>
      </div>
      <div className="flex flex-wrap gap-4">
        <figure className="flex min-w-0 flex-[999_1_520px] flex-col gap-7 rounded-[32px] border border-line bg-white p-[clamp(28px,4vw,52px)]">
          <span className="flex items-center justify-between gap-3">
            <svg width="56" height="44" viewBox="0 0 56 44" aria-hidden>
              <path d="M4 44V26C4 12 11 4 24 1l3 6c-8 3-11 8-11 15h10v22zm28 0V26c0-14 7-22 20-25l3 6c-8 3-11 8-11 15h10v22z" fill="#B9A3FF" stroke="#18161F" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-ink2">Illustrative</span>
          </span>
          <blockquote>
            <p className="text-pretty font-display text-[clamp(22px,2.5vw,32px)] font-semibold leading-[1.3] tracking-[-0.02em]">{main.text}</p>
          </blockquote>
          <figcaption className="mt-auto flex items-center gap-3.5">
            <span aria-hidden className={cx("flex size-[52px] flex-none items-center justify-center rounded-full border-2 border-ink font-display text-base font-bold", TINT_BG[main.tint ?? "violet"])}>
              {init(main.name)}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <strong className="text-base">{main.name}</strong>
              <span className="text-sm text-muted">{main.role} · invented example</span>
            </span>
          </figcaption>
        </figure>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          {side.map((q) => (
            <figure key={q.name} className="flex flex-auto flex-col gap-[18px] rounded-3xl border border-line bg-white p-[26px]">
              <blockquote>
                <p className="text-pretty text-[17px] leading-normal">“{q.text}”</p>
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                <span aria-hidden className={cx("flex size-10 flex-none items-center justify-center rounded-full font-display text-[13px] font-bold", TINT_BG[q.tint ?? "orange"])}>
                  {init(q.name)}
                </span>
                <span className="flex min-w-0 flex-col gap-px">
                  <strong className="text-[15px]">{q.name}</strong>
                  <span className="text-[13px] text-muted">{q.role} · illustrative</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </Section>
  );
}

/** "The plan that fits": the pitch and its add-on rows on the left, the plan card on the right. */
export function PlanPitch({
  country,
  title,
  why,
  rows,
  plan,
  extra,
}: {
  country: SiteCountry;
  title: ReactNode;
  why: ReactNode;
  rows: { name: string; line: string; value: string }[];
  plan: Plan;
  extra?: { label: string; href: string };
}) {
  return (
    <Section id="plan" tone="white" labelledBy="plan-h" innerClassName="flex-row! flex-wrap items-start gap-x-16 gap-y-10">
      <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-[18px]">
        <Kicker>The plan that fits</Kicker>
        <h2 id="plan-h" className={cx(H2, "text-balance")}>
          {title}
        </h2>
        <p className="text-lg leading-[1.55] text-ink2">{why}</p>
        {rows.length > 0 && (
          <ul className="mt-2 flex flex-col border-t border-line">
            {rows.map((r) => (
              <li key={r.name} className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-line py-4">
                <span className="flex min-w-0 flex-[1_1_260px] flex-col gap-[3px]">
                  <strong className="text-[15px]">{r.name}</strong>
                  <span className="text-sm leading-normal text-ink2">{r.line}</span>
                </span>
                <span className="text-sm font-bold">{r.value}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[13px] leading-normal text-muted">{PRICE_NOTE}</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href={ROUTES.pricing.href} className="inline-flex min-h-10 items-center gap-1.5 text-[15px] font-bold underline underline-offset-[3px]">
            Compare all plans
            <ArrowIcon />
          </Link>
          {extra && (
            <Link href={extra.href} className="inline-flex min-h-10 items-center text-[15px] font-semibold underline underline-offset-[3px]">
              {extra.label}
            </Link>
          )}
        </div>
      </div>
      <div className="flex min-w-0 max-w-[520px] flex-[1_1_380px] flex-col pt-3.5">
        <PlanCard plan={{ ...plan, popular: true }} country={country} index={1} />
      </div>
    </Section>
  );
}

/** "Fair questions": heading, intro and help link on the left, the FAQ on the right. */
export function FaqBlock({ title = "Fair questions", intro, items }: { title?: string; intro: ReactNode; items: { q: string; a: ReactNode }[] }) {
  return (
    <Section labelledBy="faq-h" innerClassName="flex-row! flex-wrap gap-x-16 gap-y-8">
      <div className="flex flex-[1_1_280px] flex-col items-start gap-[18px]">
        <h2 id="faq-h" className={cx(H2, "text-balance")}>
          {title}
        </h2>
        <p className="text-base leading-[1.55] text-ink2">{intro}</p>
        <CtaLink href={ROUTES.help.href} variant="soft" className="min-h-11! px-5! font-semibold">
          Visit the help centre
        </CtaLink>
      </div>
      <Faq items={items} className="flex-[999_1_520px]" />
    </Section>
  );
}

const ALSO_TINT: Record<string, Tint> = { violet: "violet", orange: "orange", grey: "yellow", dark: "green" };

/** "BillingEase is also for": the other audience pages, as linked cards. */
export function AlsoFor({ country, keys }: { country: SiteCountry; keys: RouteKey[] }) {
  return (
    <Section tone="white" labelledBy="also-h" innerClassName="gap-8!">
      <h2 id="also-h" className={cx(H2, "text-balance")}>
        BillingEase is also for
      </h2>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4">
        {keys.map((k) => {
          const r = ROUTES[k];
          const { label, hint } = routeText(r, country);
          return (
            <li key={k} className="flex">
              <Link href={r.href} className={cx(s.lift, "flex flex-1 flex-col gap-4 rounded-3xl border border-line bg-bg p-[26px]")}>
                <span className="flex items-center justify-between gap-3">
                  <IconTile d={r.icon} tint={ALSO_TINT[r.tone] ?? "violet"} size={48} />
                  <span aria-hidden className="flex size-10 items-center justify-center rounded-full border border-line bg-white">
                    <ArrowIcon size={16} />
                  </span>
                </span>
                <span className="flex flex-col gap-1.5">
                  <span className="font-display text-[22px] font-bold tracking-[-0.02em]">{label}</span>
                  <span className="text-[15px] leading-normal text-ink2">{hint}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/** The dark closing band with the cash jar and the persona's number. */
export function AudienceClose({ country, kicker, title, keep }: { country: SiteCountry; kicker: ReactNode; title: ReactNode; keep?: number }) {
  return (
    <section aria-labelledby="close-h" className="px-[clamp(16px,4vw,40px)] py-[clamp(48px,7vw,96px)]">
      <div className="mx-auto box-border flex max-w-[1200px] flex-wrap items-center gap-x-12 gap-y-8 rounded-[32px] bg-ink px-[clamp(24px,6vw,72px)] py-[clamp(36px,6vw,80px)] text-white">
        <div className="flex min-w-0 flex-[999_1_420px] flex-col items-start gap-6">
          <Kicker tone="light" dot="bg-violet">
            {kicker}
          </Kicker>
          <h2 id="close-h" className="max-w-[820px] text-balance font-display text-[clamp(36px,5.2vw,68px)] font-bold leading-[1.03] tracking-[-0.04em] text-violet">
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <StartFree country={country} size="lg" />
            <Link href={ROUTES.pricing.href} className="inline-flex min-h-11 items-center text-[15px] font-semibold text-white underline underline-offset-[3px]">
              See pricing
            </Link>
            <Link href={ROUTES.signIn.href} className="inline-flex min-h-11 items-center text-[15px] font-semibold text-tint underline underline-offset-[3px]">
              I already have an account
            </Link>
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_260px] justify-center">
          <CashJar size={360} amount={keep !== undefined ? money(keep, country) : ""} line="#EEE8FF" sym={COUNTRY_META[country].sym} />
        </div>
      </div>
    </section>
  );
}

