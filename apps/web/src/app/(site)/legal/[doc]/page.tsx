import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, Container, CtaLink, IconTile, MoreLink, PageHero, StartFree } from "@/components/site";
import { LegalArt } from "@/components/site/illustrations/resources/HeroArt";
import a from "@/components/site/illustrations/resources/resources.module.css";
import { cx } from "@/components/ui";
import { COMPANY } from "@/content/site/company";
import { longDate } from "@/content/site/guides";
import { COOKIE_ROWS, LEGAL, LEGAL_DRAFT, LEGAL_PAGE, LEGAL_UPDATED, type LegalBlock } from "@/content/site/legal";
import { LEGAL_DOCS, legalHref, ROUTES, type LegalDoc } from "@/content/site/routes";
import { getSiteCountry } from "@/lib/site-country";
import { CookieSettings } from "./CookieSettings";

export const dynamicParams = false;

export function generateStaticParams() {
  return LEGAL_DOCS.map((doc) => ({ doc }));
}

const isDoc = (d: string): d is LegalDoc => (LEGAL_DOCS as readonly string[]).includes(d);

export async function generateMetadata({ params }: PageProps<"/legal/[doc]">): Promise<Metadata> {
  const { doc } = await params;
  if (!isDoc(doc)) return {};
  return { title: LEGAL[doc].title, description: LEGAL[doc].description };
}

const wordsIn = (blocks: LegalBlock[]) =>
  blocks.reduce((n, b) => n + ("p" in b ? b.p.split(/\s+/).length : "list" in b ? b.list.reduce((m, i) => m + `${i.b ?? ""} ${i.t}`.split(/\s+/).length, 0) : 0), 0);

export default async function LegalPage({ params, searchParams }: PageProps<"/legal/[doc]">) {
  const { doc: key } = await params;
  if (!isDoc(key)) notFound();
  const country = await getSiteCountry(searchParams);
  const doc = LEGAL[key];
  const minutes = Math.max(2, Math.ceil(doc.sections.reduce((n, s) => n + wordsIn(s.blocks), 0) / 200));
  const others = LEGAL_DOCS.filter((d) => d !== key);

  return (
    <>
      <PageHero
        kicker={LEGAL_PAGE.kicker}
        title={LEGAL_PAGE.title}
        lead={LEGAL_PAGE.lead}
        art={<LegalArt title={doc.tab.toUpperCase()} />}
        actions={
          <span className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-due-bg px-3.5 py-1.5 text-sm font-bold text-due">
              <span aria-hidden className="size-2 rounded-full bg-due" />
              Draft, to be reviewed by a lawyer
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-bold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <path d="M4 6h16v14H4zM4 10h16M9 3v4M15 3v4" />
              </svg>
              Last updated {longDate(LEGAL_UPDATED)}
            </span>
          </span>
        }
      />

      <section aria-label="The short version" className="pb-[clamp(40px,5vw,64px)]">
        <ul className="mx-auto box-border grid max-w-[1200px] gap-3 px-[clamp(16px,4vw,40px)]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))" }}>
          {LEGAL_PAGE.promises.map((pm) => (
            <li key={pm.t} className="flex items-start gap-3.5 rounded-[20px] border border-line bg-white p-5">
              <IconTile d={pm.icon} tint={pm.tint} />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-base font-bold">{pm.t}</span>
                <span className="text-sm leading-normal text-ink2">{pm.d}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="doc-h" className="scroll-mt-20 border-y border-line bg-white">
        <Container className="flex flex-col gap-[clamp(28px,4vw,44px)] pb-[clamp(64px,8vw,104px)] pt-[clamp(28px,4vw,48px)]">
          <nav aria-label="Legal documents" className="max-w-full self-start overflow-x-auto">
            <ul className="flex gap-1 rounded-full bg-surface p-1">
              {LEGAL_DOCS.map((d) => (
                <li key={d}>
                  <Link
                    href={legalHref(d)}
                    aria-current={d === key ? "page" : undefined}
                    className={cx("inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-[clamp(14px,3vw,22px)] text-[15px] font-semibold", d === key ? "bg-ink text-white" : "text-ink hover:bg-white/70")}
                  >
                    {LEGAL[d].tab}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
            <nav aria-label="On this page" className="flex flex-col gap-0.5 self-start rounded-[20px] bg-bg px-3 py-4 max-lg:hidden lg:sticky lg:top-24">
              <span className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.06em] text-muted">On this page</span>
              {doc.sections.map((s, i) => (
                <a key={s.id} href={`#${s.id}`} className="flex gap-2.5 rounded-xl px-3 py-2 text-sm leading-snug text-ink2 hover:bg-white hover:text-ink">
                  <span className="w-[18px] flex-none tabular-nums text-muted">{i + 1}</span>
                  {s.h}
                </a>
              ))}
            </nav>

            <article className="min-w-0 max-w-[68ch]">
              <header className="mb-7 flex flex-col gap-2.5 border-b border-line pb-6">
                <h2 id="doc-h" className="font-display text-[clamp(30px,3.4vw,44px)] font-bold leading-[1.08] tracking-[-0.03em]">
                  {doc.title}
                </h2>
                <span className="text-sm text-muted">
                  Last updated {longDate(LEGAL_UPDATED)} · {minutes} minute read
                </span>
                <p className="pt-1.5 text-[17px] leading-relaxed text-ink2">{doc.intro}</p>
              </header>

              <p role="note" className="mb-6 flex items-start gap-3 rounded-[18px] bg-due-bg px-4 py-3.5 text-[15px] font-semibold leading-normal text-due">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 flex-none">
                  <path d="M12 3 2 20h20zM12 10v4M12 17h.01" />
                </svg>
                {LEGAL_DRAFT}
              </p>

              <details className="group mb-7 rounded-[18px] bg-bg p-2 lg:hidden">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-[15px] font-bold [&::-webkit-details-marker]:hidden">
                  On this page · {doc.sections.length} sections
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.4" strokeLinecap="round" aria-hidden className="transition-transform group-open:rotate-180">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>
                <div className="flex flex-col gap-0.5 pb-1.5">
                  {doc.sections.map((s, i) => (
                    <a key={s.id} href={`#${s.id}`} className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-[15px]">
                      <span className="w-[18px] text-muted">{i + 1}</span>
                      {s.h}
                    </a>
                  ))}
                </div>
              </details>

              <div className="mb-9 rounded-[20px] bg-tint px-6 py-[22px]">
                <h3 className="mb-3 font-display text-lg font-bold">In short</h3>
                <ul className="flex flex-col gap-2.5">
                  {doc.short.map((x) => (
                    <li key={x} className="flex items-start gap-2.5 text-base leading-normal">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-[3px] flex-none">
                        <path d="m5 12 5 5 9-10" />
                      </svg>
                      {x}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={cx(a.prose, "text-[17px] leading-[1.7] text-[#2E2B35]")}>
                {doc.sections.map((s, i) => (
                  <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-24 pb-5">
                    <h3 id={`${s.id}-h`} className="mb-3.5 mt-3 font-display text-[23px] font-bold leading-[1.25] tracking-[-0.02em] text-ink">
                      <span className="text-coming">{i + 1}.</span> {s.h}
                    </h3>
                    {s.blocks.map((b, k) => (
                      <Block key={k} b={b} />
                    ))}
                  </section>
                ))}
              </div>

              <div className="flex flex-wrap gap-2.5 border-t border-line pt-5">
                {others.map((d) => (
                  <Link key={d} href={legalHref(d)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-bg px-[18px] text-[15px] font-semibold hover:border-input">
                    Read the {LEGAL[d].title.toLowerCase()}
                    <ArrowIcon />
                  </Link>
                ))}
              </div>
            </article>

            <aside className="flex flex-col gap-3 self-start lg:sticky lg:top-24">
              <div className="flex flex-col gap-2.5 rounded-[20px] bg-ink p-[22px] text-white">
                <span className="font-display text-lg font-bold text-violet">A question about your data?</span>
                <span className="text-[14.5px] leading-normal text-tint">
                  Write to{" "}
                  <a href={`mailto:${COMPANY.email.privacy}`} className="font-bold text-white underline underline-offset-2">
                    {COMPANY.email.privacy}
                  </a>
                  . A person answers, and privacy requests are free.
                </span>
              </div>
              <div className="flex flex-col gap-2 rounded-[20px] bg-bg p-5">
                <span className="font-bold">How we keep your books safe</span>
                <span className="text-sm leading-normal text-ink2">Separate data for each business, an append-only ledger and locked periods.</span>
                <MoreLink href={ROUTES.security.href}>Security</MoreLink>
              </div>
              <div className="flex flex-col gap-2 rounded-[20px] bg-bg p-5">
                <span className="font-bold">Cookie settings</span>
                <span className="text-sm leading-normal text-ink2">Change your choice for this browser at any time.</span>
                <MoreLink href={`${legalHref("cookies")}#settings`}>Open cookie settings</MoreLink>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <section aria-labelledby="yours-h">
        <Container className="flex flex-wrap items-center justify-between gap-x-12 gap-y-6 py-[clamp(56px,8vw,96px)]">
          <div className="flex min-w-0 max-w-[640px] flex-[1_1_420px] flex-col gap-3">
            <h2 id="yours-h" className="font-display text-[clamp(30px,4vw,48px)] font-bold leading-[1.06] tracking-[-0.035em] text-balance">
              Your books stay yours. Start with them in good hands.
            </h2>
            <p className="text-lg text-ink2">Free to start, no card needed.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <StartFree country={country} size="lg" />
            <CtaLink href={ROUTES.contact.href} variant="soft" size="lg">
              Talk to us
            </CtaLink>
          </div>
        </Container>
      </section>
    </>
  );
}

function Block({ b }: { b: LegalBlock }) {
  if ("p" in b) return <p>{b.p}</p>;
  if ("list" in b)
    return (
      <ul>
        {b.list.map((li, i) => (
          <li key={i}>
            {li.b && <strong className="text-ink">{li.b} </strong>}
            {li.t}
          </li>
        ))}
      </ul>
    );
  if ("link" in b)
    return (
      <p>
        <Link href={b.link.href}>{b.link.label}</Link>
      </p>
    );
  if ("contacts" in b)
    return (
      <div className="mb-5 mt-1 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))" }}>
        {[
          { label: "Privacy and your data", value: COMPANY.email.privacy },
          { label: "Security problems", value: COMPANY.email.security },
          { label: "Everything else", value: COMPANY.email.hello },
        ].map((c) => (
          <span key={c.value} className="flex flex-col gap-0.5 rounded-2xl bg-bg px-4 py-3.5 text-[15px] leading-snug">
            <span className="text-[13px] font-bold text-muted">{c.label}</span>
            <a href={`mailto:${c.value}`} className="text-ink [overflow-wrap:anywhere]">
              {c.value}
            </a>
          </span>
        ))}
      </div>
    );
  if ("cookieTable" in b)
    return (
      <div className="mb-5 mt-1 overflow-x-auto rounded-[18px] border border-line">
        <table className="w-full min-w-[520px] border-collapse text-left text-[15px] leading-snug">
          <thead className="bg-bg text-[12.5px] uppercase tracking-[0.04em] text-muted">
            <tr>
              {["Name", "What it does", "Kind", "Kept for"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COOKIE_ROWS.map((r) => (
              <tr key={r.name} className="border-t border-line align-top">
                <th scope="row" className="px-4 py-3 font-mono text-[13.5px] font-semibold text-ink">
                  {r.name}
                </th>
                <td className="px-4 py-3 text-ink2">{r.what}</td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded-full bg-pos-bg px-2.5 py-0.5 text-[12.5px] font-bold text-ink">{r.kind}</span>
                </td>
                <td className="px-4 py-3 text-ink2">{r.keep}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  if ("settings" in b) return <CookieSettings />;
  return null;
}
