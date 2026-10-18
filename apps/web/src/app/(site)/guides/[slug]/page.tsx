import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, Breadcrumbs, Container, CtaLink, MoreLink, RatesNote, StartFree, Tick } from "@/components/site";
import s from "@/components/site/site.module.css";
import { COVER_BG, GuideCover } from "@/components/site/illustrations/resources/GuideCovers";
import a from "@/components/site/illustrations/resources/resources.module.css";
import { BrandMark, cx } from "@/components/ui";
import type { SiteCountry } from "@/content/site/country";
import { getGuide, GUIDES, guidesFor, longDate, readMinutes, type Guide, type GuideBlock } from "@/content/site/guides";
import { guideHref, ROUTES } from "@/content/site/routes";
import { getSiteCountry } from "@/lib/site-country";
import { CopyButton } from "../../press/CopyButton";
import { CategoryChip, CountryChip, GuideCard } from "../GuideCard";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const g = getGuide((await params).slug);
  if (!g) return {};
  return { title: g.title, description: g.dek };
}

const slugify = (x: string) =>
  x
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default async function GuidePage({ params, searchParams }: PageProps<"/guides/[slug]">) {
  const g = getGuide((await params).slug);
  if (!g) notFound();
  const site = await getSiteCountry(searchParams);
  // A one-country guide reads as that country; a "both" guide follows the visitor's country.
  const country: SiteCountry = g.country === "both" ? site : g.country;
  const blocks = g.blocks.filter((b) => !b.only || b.only === country);
  const toc = blocks.filter((b): b is Extract<GuideBlock, { t: "h" }> => b.t === "h").map((b) => ({ id: slugify(b.x), h: b.x }));
  const minutes = readMinutes(g);

  const list = GUIDES;
  const i = list.indexOf(g);
  const prev = list[(i - 1 + list.length) % list.length];
  const next = list[(i + 1) % list.length];
  const related = guidesFor(country)
    .filter((x) => x.slug !== g.slug)
    .sort((x, y) => Number(y.category === g.category) - Number(x.category === g.category))
    .slice(0, 3);
  const practitioner = country === "uk" ? "accountant" : "tax practitioner";

  return (
    <>
      {/* Header */}
      <section aria-labelledby="guide-h">
        <Container className="flex flex-wrap items-center gap-x-12 gap-y-8 pb-[clamp(36px,5vw,56px)] pt-[clamp(32px,5vw,64px)]">
          <div className="flex min-w-0 flex-[1_1_520px] flex-col items-start gap-4">
            <Breadcrumbs items={[{ label: "Guides", href: ROUTES.guides.href }, { label: g.category }, { label: g.title }]} />
            <span className="flex flex-wrap items-center gap-1.5">
              <CategoryChip category={g.category} />
              <CountryChip country={g.country} />
            </span>
            <h1 id="guide-h" className="max-w-[820px] text-balance font-display text-[clamp(34px,4.8vw,64px)] font-bold leading-[1.05] tracking-[-0.035em]">
              {g.title}
            </h1>
            <p className="max-w-[640px] text-[clamp(17px,1.6vw,20px)] leading-normal text-ink2">{g.dek}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
              <span className="flex items-center gap-3">
                <BrandMark size={44} />
                <span className="flex flex-col">
                  <span className="text-[15px] font-bold">BillingEase team</span>
                  <span className="text-sm text-ink2">General information, not advice</span>
                </span>
              </span>
              <span aria-hidden className="hidden h-9 w-px bg-line sm:block" />
              <span className="flex flex-col text-sm text-ink2">
                <span>{longDate(g.date)}</span>
                <span>{minutes} min read</span>
              </span>
            </div>
          </div>
          <div className="flex min-w-0 flex-[1_1_300px] justify-center">
            <div className="w-full max-w-[360px] overflow-hidden rounded-3xl border border-line" style={{ background: COVER_BG[g.cover] }}>
              <GuideCover cover={g.cover} className="h-auto w-full" />
            </div>
          </div>
        </Container>
      </section>

      {/* Body */}
      <Container className="pb-[clamp(56px,8vw,96px)]">
        <div className="grid gap-x-16 gap-y-8 lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            {toc.length > 0 && (
              <nav aria-label="On this page" className="rounded-[20px] border border-line bg-white p-5 max-lg:hidden">
                <p className="pb-3 text-xs font-bold uppercase tracking-[0.08em] text-ink2">On this page</p>
                <ol className="flex flex-col gap-1 border-l-2 border-line">
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`} className="-ml-0.5 block border-l-2 border-transparent py-1.5 pl-3 text-sm leading-snug text-ink2 hover:border-coming hover:text-ink">
                        {t.h}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            <div className="flex flex-col items-start gap-2 max-lg:hidden">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink2">Share this guide</p>
              <CopyButton icon done="Link copied">
                Copy link
              </CopyButton>
            </div>
          </aside>

          <article aria-labelledby="guide-h" className="flex min-w-0 max-w-[780px] flex-col">
            <div className="mb-9 rounded-3xl bg-tint p-[clamp(20px,3vw,28px)]">
              <h2 className="flex items-center gap-2.5 pb-3 text-lg font-bold">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="M4 6h16M4 12h16M4 18h10" />
                </svg>
                In short
              </h2>
              <ul className="flex flex-col gap-3">
                {g.summary.map((x) => (
                  <li key={x} className="flex items-start gap-3 text-[16.5px] leading-normal">
                    <span aria-hidden className="mt-0.5 flex size-[22px] flex-none items-center justify-center rounded-full bg-ink">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>

            <div className={cx(a.prose, "text-[17.5px] leading-[1.75] text-[#2E2B35]")}>
              {blocks.map((b, k) => (
                <Block key={k} b={b} />
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2 border-t border-line pt-5">
              <p className="text-sm leading-normal text-muted">
                {g.asOf
                  ? `Rates, thresholds and dates in this guide are as of ${longDate(g.asOf)}. They’re illustrative: rules change, so check with your ${practitioner} before a big decision. It’s general information, not tax or legal advice.`
                  : `General information, correct as of ${longDate(g.date)}. It isn’t tax or legal advice: check with your ${practitioner} before a big decision.`}
              </p>
              {g.asOf && <RatesNote country={country} />}
            </div>

            {/* Try it */}
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5 rounded-3xl bg-ink p-[clamp(22px,3.5vw,36px)] text-white">
              <BrandMark size={48} tile="#2E2B36" className="flex-none" />
              <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-violet">Try it in BillingEase</span>
                <span className="font-display text-xl font-bold tracking-[-0.02em]">{g.app.label}</span>
                <span className="text-[15px] leading-normal text-tint">{g.app.line}</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <StartFree country={country} />
                <CtaLink href={g.app.href} variant="outlineLight">
                  Learn more
                </CtaLink>
              </div>
            </div>

            {/* Previous / next */}
            <nav aria-label="More guides" className="mt-4 grid gap-3 sm:grid-cols-2">
              <PrevNext g={prev} dir="prev" />
              <PrevNext g={next} dir="next" />
            </nav>
            <div className="mt-5 lg:hidden">
              <CopyButton icon done="Link copied">
                Copy link to this guide
              </CopyButton>
            </div>
          </article>
        </div>
      </Container>

      {/* Read next */}
      {related.length > 0 && (
        <section aria-labelledby="next-h" className="border-y border-line bg-white">
          <Container className="flex flex-col gap-8 py-[clamp(56px,8vw,96px)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="next-h" className="font-display text-[clamp(28px,3.4vw,44px)] font-bold leading-[1.08] tracking-[-0.03em]">
                Read next
              </h2>
              <MoreLink href={ROUTES.guides.href}>All guides</MoreLink>
            </div>
            <ul className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))" }}>
              {related.map((r) => (
                <li key={r.slug} className="flex min-w-0">
                  <div className="flex-1">
                    <GuideCard compact g={{ slug: r.slug, title: r.title, dek: r.dek, category: r.category, country: r.country, cover: r.cover, minutes: readMinutes(r), date: r.date }} />
                  </div>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}

function PrevNext({ g, dir }: { g: Guide; dir: "prev" | "next" }) {
  return (
    <Link href={guideHref(g.slug)} className={cx(s.lift, "flex min-h-[84px] flex-col justify-center gap-1.5 rounded-[20px] border border-line bg-white px-5 py-4", dir === "next" && "sm:items-end sm:text-right")}>
      <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-muted">
        {dir === "prev" && (
          <span className="rotate-180">
            <ArrowIcon size={12} />
          </span>
        )}
        {dir === "prev" ? "Previous guide" : "Next guide"}
        {dir === "next" && <ArrowIcon size={12} />}
      </span>
      <span className="text-base font-bold leading-snug">{g.title}</span>
    </Link>
  );
}

function Block({ b }: { b: GuideBlock }) {
  switch (b.t) {
    case "h":
      return (
        <h2 id={slugify(b.x)} className="scroll-mt-24 pb-1 pt-8 font-display text-[clamp(23px,2.4vw,30px)] font-bold leading-[1.2] tracking-[-0.025em] text-ink">
          {b.x}
        </h2>
      );
    case "p":
      return (
        <p>
          {b.lead && <strong className="text-ink">{b.lead} </strong>}
          {b.x}
        </p>
      );
    case "list":
      return (
        <ul>
          {b.items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      );
    case "rule":
      return (
        <figure className="my-8 border-l-4 border-violet py-1 pl-6">
          <svg width="36" height="28" viewBox="0 0 36 28" aria-hidden className="mb-3">
            <path d="M2 28V16C2 7 7 2 15 1v6c-4 1-6 4-6 8h6v13zM21 28V16c0-9 5-14 13-15v6c-4 1-6 4-6 8h6v13z" fill="#B9A3FF" />
          </svg>
          <blockquote className="font-display text-[clamp(20px,2.2vw,26px)] font-bold leading-[1.35] tracking-[-0.02em] text-ink">{b.x}</blockquote>
          <figcaption className="pt-2 text-sm font-semibold text-muted">Rule of thumb</figcaption>
        </figure>
      );
    case "callout": {
      const tone = b.tone === "tip" ? "bg-pos-bg" : b.tone === "warn" ? "bg-due-bg" : "bg-info-bg";
      const d = b.tone === "tip" ? "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0 0 12 3z" : "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01";
      return (
        <div className={cx("my-7 flex gap-4 rounded-3xl p-[clamp(18px,2.5vw,24px)] text-base leading-relaxed", tone)}>
          <span aria-hidden className="flex size-9 flex-none items-center justify-center rounded-xl bg-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={d} />
            </svg>
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="font-bold text-ink">{b.title}</span>
            <span className="text-ink2">{b.x}</span>
          </span>
        </div>
      );
    }
    case "table":
      return (
        <div className="my-7 overflow-x-auto rounded-3xl border border-line bg-white">
          <table className="w-full min-w-[480px] border-collapse text-left text-[15px] leading-snug">
            <caption className="px-5 pb-1 pt-4 text-left font-display text-base font-bold text-ink">{b.caption}</caption>
            <thead>
              <tr className="border-b-2 border-ink">
                {b.head.map((h, j) => (
                  <th key={j} scope="col" className="px-5 py-3 text-[13px] font-bold text-ink2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, j) => (
                <tr key={j} className="border-b border-line last:border-b-0 even:bg-bg">
                  {r.map((c, k) =>
                    k === 0 ? (
                      <th key={k} scope="row" className="px-5 py-3 font-bold text-ink">
                        {c}
                      </th>
                    ) : (
                      <td key={k} className="px-5 py-3 text-ink2">
                        {c}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "example":
      return (
        <div className="my-8 flex flex-col gap-3 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)] text-[15px]">
          <span className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">Worked example</span>
            <span className="font-display font-bold text-ink">{b.title}</span>
          </span>
          <dl className="flex flex-col">
            {b.rows.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b border-dashed border-input py-2.5">
                <dt className="text-ink2">{k}</dt>
                <dd className="whitespace-nowrap font-bold text-ink tabular-nums">{v}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 border-t-2 border-ink pt-3">
              <dt className="font-bold text-ink">{b.total[0]}</dt>
              <dd className="whitespace-nowrap font-display text-xl font-bold text-ink tabular-nums">{b.total[1]}</dd>
            </div>
          </dl>
          {b.note && (
            <p className="m-0! flex items-start gap-2.5 rounded-2xl bg-bg px-4 py-3 text-sm leading-normal text-ink2">
              <span className="mt-0.5 text-coming">
                <Tick color="#7A5AF8" />
              </span>
              {b.note}
            </p>
          )}
        </div>
      );
  }
}
