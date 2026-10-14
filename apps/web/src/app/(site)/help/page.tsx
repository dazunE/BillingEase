import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink, Faq, IconTile, MoreLink, PageHero, Section, SectionHeading, StartFree } from "@/components/site";
import s from "@/components/site/site.module.css";
import { GuideCover } from "@/components/site/illustrations/resources/GuideCovers";
import { HelpArt } from "@/components/site/illustrations/resources/HeroArt";
import { cx } from "@/components/ui";
import { COMPANY } from "@/content/site/company";
import { pick, type SiteCountry } from "@/content/site/country";
import { getGuide, readMinutes } from "@/content/site/guides";
import { HELP_PAGE, HELP_TOPICS, helpFor, type HelpAnswer } from "@/content/site/help";
import { guideHref, ROUTES } from "@/content/site/routes";
import { getSiteCountry } from "@/lib/site-country";
import { MailtoForm } from "../contact/MailtoForm";
import { HelpFinder } from "./HelpFinder";

export const metadata: Metadata = {
  title: "Help centre",
  description: "Short answers about using BillingEase in the UK and Sri Lanka: invoices, Tax Invoices, expenses, bills, the three numbers and your accountant. And a person when you need one.",
};

const GUIDE_PICKS: Record<SiteCountry, string[]> = {
  uk: ["getting-ready-for-mtd-for-income-tax", "allowable-expenses-for-sole-traders", "working-with-your-accountant"],
  lk: ["writing-a-sri-lankan-tax-invoice", "cheques-lankaqr-and-getting-paid", "epf-etf-and-apit-basics"],
};

export default async function HelpPage({ searchParams }: PageProps<"/help">) {
  const country = await getSiteCountry(searchParams);
  const answers = helpFor(country);
  const resolve = (h: HelpAnswer) => ({ id: h.id, q: pick(h.q, country), a: pick(h.a, country), link: h.link ? pick(h.link, country) : undefined });
  const topicName = (id: string) => pick(HELP_TOPICS.find((t) => t.id === id)!.name, country);
  const popular = answers.filter((h) => h.popular).map(resolve);
  const practitioner = country === "uk" ? "accountant" : "tax practitioner";

  return (
    <>
      <PageHero
        kicker={HELP_PAGE.kicker}
        title={HELP_PAGE.title}
        lead={HELP_PAGE.lead}
        art={<HelpArt country={country} />}
        actions={
          <HelpFinder
            help={COMPANY.email.help}
            tries={HELP_PAGE.tries[country]}
            answers={answers.map((h) => ({ ...resolve(h), topic: topicName(h.topic), words: h.words }))}
          />
        }
      />

      {/* Topics */}
      <section aria-labelledby="topics-h" className="pb-[clamp(48px,6vw,72px)]">
        <div className="mx-auto box-border flex max-w-[1200px] flex-col gap-5 px-[clamp(16px,4vw,40px)]">
          <h2 id="topics-h" className="font-display text-2xl font-bold tracking-[-0.02em]">
            Browse by topic
          </h2>
          <ul className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))" }}>
            {HELP_TOPICS.map((t) => {
              const n = answers.filter((h) => h.topic === t.id).length;
              return (
                <li key={t.id} className="flex">
                  <a href={`#t-${t.id}`} className={cx(s.lift, "flex flex-1 items-start gap-3.5 rounded-[20px] border border-line bg-white p-5")}>
                    <IconTile d={t.icon} tint={t.tint} size={44} />
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="text-[17px] font-bold">{pick(t.name, country)}</span>
                      <span className="text-sm leading-snug text-ink2">{pick(t.line, country)}</span>
                      <span className="pt-1 text-[13px] font-bold text-muted">{n} answers</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Popular answers */}
      <section aria-labelledby="pop-h" className="pb-[clamp(56px,8vw,96px)]">
        <div className="mx-auto box-border max-w-[1200px] px-[clamp(16px,4vw,40px)]">
          <div className="flex flex-col gap-6 rounded-[32px] border border-line bg-white p-[clamp(20px,4vw,48px)]">
            <div className="flex flex-col gap-1">
              <h2 id="pop-h" className="font-display text-[clamp(28px,3.4vw,40px)] font-bold leading-[1.1] tracking-[-0.03em]">
                Popular answers
              </h2>
              <p className="text-base text-ink2">The questions people starting out in {country === "uk" ? "the UK" : "Sri Lanka"} ask first.</p>
            </div>
            <Faq
              defaultOpen={-1}
              items={popular.map((p) => ({
                q: p.q,
                a: (
                  <span className="flex flex-col items-start gap-2">
                    <span>{p.a}</span>
                    {p.link && <MoreLink href={p.link.href}>{p.link.label}</MoreLink>}
                  </span>
                ),
              }))}
            />
          </div>
        </div>
      </section>

      {/* Every answer, by topic */}
      <Section tone="white" labelledBy="all-h">
        <SectionHeading id="all-h" title="Every answer" lead={`Signed in? The links open the right page of the app. Not yet? They take you to sign in first.`} />
        <div className="grid gap-x-12 gap-y-12 lg:grid-cols-2">
          {HELP_TOPICS.map((t) => {
            const list = answers.filter((h) => h.topic === t.id).map(resolve);
            if (list.length === 0) return null;
            return (
              <section key={t.id} id={`t-${t.id}`} aria-labelledby={`t-${t.id}-h`} className="flex scroll-mt-24 flex-col gap-3">
                <h3 id={`t-${t.id}-h`} className="flex items-center gap-3 font-display text-[22px] font-bold tracking-[-0.02em]">
                  <IconTile d={t.icon} tint={t.tint} size={36} />
                  {pick(t.name, country)}
                </h3>
                <ul className="flex flex-col border-t border-line">
                  {list.map((h) => (
                    <li key={h.id} id={h.id} className="scroll-mt-24 border-b border-line">
                      <details className="group">
                        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-base font-semibold [&::-webkit-details-marker]:hidden">
                          <span>{h.q}</span>
                          <span aria-hidden className="flex size-7 flex-none items-center justify-center rounded-full bg-ink/[0.07] group-open:bg-violet">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.6" strokeLinecap="round">
                              <path className="group-open:hidden" d="M12 5v14M5 12h14" />
                              <path className="hidden group-open:block" d="M5 12h14" />
                            </svg>
                          </span>
                        </summary>
                        <div className="flex flex-col items-start gap-2 pb-5 pr-10 text-[15px] leading-relaxed text-ink2 max-[640px]:pr-0">
                          <p>{h.a}</p>
                          {h.link && <MoreLink href={h.link.href}>{h.link.label}</MoreLink>}
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </Section>

      {/* The longer version */}
      <Section labelledBy="longer-h">
        <SectionHeading id="longer-h" title="Want the longer version?" lead="Our guides explain the money side of running a business, with worked examples." aside={<MoreLink href={ROUTES.guides.href}>All guides</MoreLink>} />
        <ul className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))" }}>
          {GUIDE_PICKS[country].map((slug) => {
            const g = getGuide(slug)!;
            return (
              <li key={slug} className="flex">
                <Link href={guideHref(slug)} className={cx(s.lift, "flex flex-1 items-center gap-4 rounded-[20px] border border-line bg-white p-3.5")}>
                  <span className="w-[112px] flex-none overflow-hidden rounded-xl">
                    <GuideCover cover={g.cover} className="h-auto w-full" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-[13px] font-bold text-muted">
                      {g.category} · {readMinutes(g)} min
                    </span>
                    <span className="text-[15px] font-bold leading-snug">{g.title}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Talk to a person */}
      <Section tone="white" labelledBy="person-h" innerClassName="flex-row! flex-wrap items-start gap-x-16 gap-y-10">
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
          <span className="font-hand text-[28px] font-bold leading-none text-coming">a person, not a bot</span>
          <h2 id="person-h" className="font-display text-[clamp(32px,4vw,48px)] font-bold leading-[1.05] tracking-[-0.035em] text-balance">
            Still stuck? Write to a person.
          </h2>
          <p className="text-[17px] leading-normal text-ink2">
            Tell us what you were trying to do and what happened instead. We reply by email. If it’s a question about your own tax, your {practitioner} is the right person to ask.
          </p>
          <ul className="flex flex-col gap-3 pt-1 text-[15px]">
            <li className="flex items-center gap-3">
              <IconTile d="M4 6h16v12H4zM4 7l8 6 8-6" tint="orange" size={36} />
              <span>
                Or write to{" "}
                <a href={`mailto:${COMPANY.email.help}`} className="font-bold underline underline-offset-[3px]">
                  {COMPANY.email.help}
                </a>
              </span>
            </li>
            <li className="flex items-center gap-3">
              <IconTile d={ROUTES.accountants.icon} tint="green" size={36} />
              <span>
                {country === "uk" ? "An accounting practice?" : "A tax practitioner?"}{" "}
                <Link href={ROUTES.contact.href} className="font-bold underline underline-offset-[3px]">
                  Contact us
                </Link>
              </span>
            </li>
          </ul>
        </div>
        <div className="min-w-0 flex-[1_1_440px] rounded-[28px] border border-line bg-bg p-[clamp(20px,3vw,32px)]">
          <MailtoForm
            to={COMPANY.email.help}
            subjectPrefix="Help"
            messageLabel="What happened?"
            placeholder="I was trying to… and instead…"
            topics={[
              { label: "Getting started" },
              { label: "Invoices and getting paid" },
              { label: "Expenses and bills" },
              { label: "Tax and Ask" },
              { label: country === "uk" ? "My accountant" : "My tax practitioner" },
              { label: "My account" },
            ]}
          />
        </div>
      </Section>

      {/* New here */}
      <section aria-labelledby="new-h" className="px-[clamp(16px,4vw,40px)] py-[clamp(48px,6vw,80px)]">
        <div className="mx-auto box-border flex max-w-[1200px] flex-wrap items-center justify-between gap-x-12 gap-y-6 rounded-[32px] bg-tint px-[clamp(24px,5vw,56px)] py-[clamp(32px,5vw,56px)]">
          <div className="flex min-w-0 max-w-[680px] flex-[1_1_420px] flex-col gap-3">
            <h2 id="new-h" className="font-display text-[clamp(28px,3.6vw,42px)] font-bold leading-[1.08] tracking-[-0.03em] text-balance">
              New here? Add a customer and send your first invoice tonight.
            </h2>
            <p className="text-lg leading-normal text-ink2">Free to start, no card needed. Help from a person is included.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <StartFree country={country} variant="dark" />
            <CtaLink href={ROUTES.features.href} variant="outline" className="bg-white">
              See the features
            </CtaLink>
          </div>
        </div>
      </section>
    </>
  );
}
