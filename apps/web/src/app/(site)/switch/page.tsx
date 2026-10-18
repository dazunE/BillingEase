import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site";
import { ArrowLink, Band, CheckDot, FaqBlock, H2_PROD, Kicker, Pill, ProductCta } from "@/components/site/illustrations/product/kit";
import { MoverPerson, MoveScene } from "@/components/site/illustrations/product/SwitchArt";
import { MoveChecklist, SourceTabs } from "@/components/site/illustrations/product/SwitchDemos";
import { COMPANY } from "@/content/site/company";
import { pick, signUpHref } from "@/content/site/country";
import { ROUTES } from "@/content/site/routes";
import { SWITCH_CHECKLIST as CL, SWITCH_CTA, SWITCH_FAQ, SWITCH_HERO, SWITCH_META, SWITCH_SOURCES, SWITCH_STORY } from "@/content/site/switch";
import { getSiteCountry } from "@/lib/site-country";

export const metadata: Metadata = { title: SWITCH_META.title, description: SWITCH_META.description };

export default async function SwitchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const country = await getSiteCountry(searchParams);
  const lk = country === "lk";
  const story = SWITCH_STORY[country];

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="sw-h">
        <Container className="flex flex-wrap items-center gap-x-14 gap-y-10 pb-[clamp(56px,8vw,104px)] pt-[clamp(40px,6vw,88px)]">
          <div className="flex min-w-0 flex-[1_1_460px] flex-col items-start gap-5">
            <Kicker>{SWITCH_HERO.kicker}</Kicker>
            <h1 id="sw-h" className="text-balance font-display text-[clamp(40px,5.6vw,76px)] font-bold leading-[1.02] tracking-[-0.035em]">
              {SWITCH_HERO.title}
            </h1>
            <p className="max-w-[600px] text-pretty text-[clamp(17px,1.6vw,20px)] leading-normal text-ink2">{pick(SWITCH_HERO.lead, country)}</p>
            <div className="flex flex-wrap items-center gap-x-[18px] gap-y-3 pt-1.5">
              <Pill href={signUpHref(country)} arrow>
                Start free
              </Pill>
              <Link href="#from" className="inline-flex min-h-11 items-center text-[15px] font-semibold underline underline-offset-[3px]">
                {SWITCH_HERO.link}
              </Link>
            </div>
          </div>
          <MoveScene from={lk ? "your sheets" : "your spreadsheet"} inAmt={lk ? "Rs 5,280,000" : "£28,400"} outAmt={lk ? "Rs 2,830,000" : "£9,180"} keepAmt={lk ? "Rs 2,040,000" : "£16,260"} />
        </Container>
      </section>

      {/* Where from + plain words */}
      <Band id="from" labelledBy="from-h" tone="white" className="flex flex-col gap-8">
        <div className="flex max-w-[720px] flex-col gap-3">
          <h2 id="from-h" className={H2_PROD}>
            Where are you coming from?
          </h2>
          <p className="text-lg leading-[1.55] text-ink2">Pick where your books live today. We’ll show you what comes across, what stays where it is, and how long it takes.</p>
        </div>
        <SourceTabs
          key={country}
          sources={SWITCH_SOURCES[country]}
          wordsHeading={
            <>
              <h2 className={H2_PROD}>What changes, in plain words.</h2>
              <p className="text-lg leading-[1.55] text-ink2">Same books, friendlier names. The proper accounting terms are still there, one click down, for you and your {lk ? "practitioner" : "accountant"}.</p>
            </>
          }
        />
      </Band>

      {/* Checklist */}
      <Band id="move" labelledBy="move-h" className="flex flex-wrap items-start gap-x-16 gap-y-10">
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-[18px]">
          <Kicker dot="out">{CL.kicker}</Kicker>
          <h2 id="move-h" className={H2_PROD}>
            {CL.title}
          </h2>
          <p className="text-lg leading-[1.55] text-ink2">{pick(CL.lead, country)}</p>
          <ul className="flex flex-col gap-2.5 text-[15px]">
            {CL.bullets[country].map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                <CheckDot tint="bg-going-tint" size={22} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <ArrowLink href={ROUTES.accountants.href}>{lk ? "How practitioners help" : "How accountants help"}</ArrowLink>
        </div>
        <div className="min-w-0 flex-[999_1_480px]">
          <MoveChecklist
            key={country}
            items={CL.items[country]}
            done={
              <>
                <strong>That’s the move.</strong> Your three numbers are right from your start date.{" "}
                <Link href={signUpHref(country)} className="font-bold underline">
                  Start free
                </Link>{" "}
                to do it for real.
              </>
            }
          />
        </div>
      </Band>

      {/* Story */}
      <Band labelledBy="story-h">
        <h2 id="story-h" className="sr-only">
          What switching was like
        </h2>
        <figure className="flex flex-wrap items-center gap-x-14 gap-y-8 rounded-[32px] bg-going-tint p-[clamp(24px,5vw,56px)]">
          <MoverPerson chip={lk ? "TI-0001" : "HS-0001"} />
          <div className="flex min-w-0 flex-[999_1_460px] flex-col gap-6">
            <span className="self-start rounded-full bg-white px-3 py-1 text-xs font-bold">Illustrative example, not a real customer</span>
            <blockquote className="text-pretty font-display text-[clamp(22px,2.4vw,30px)] font-semibold leading-[1.3] tracking-[-0.02em]">“{story.quote}”</blockquote>
            <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="flex flex-col">
                <span className="text-base font-bold">{story.name}</span>
                <span className="text-sm text-ink2">{story.role}</span>
              </span>
              <span className="rounded-full bg-white px-3 py-[5px] text-xs font-bold">{story.badge}</span>
            </figcaption>
            <div className="grid gap-4 border-t border-ink/10" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}>
              {story.mini.map((q) => (
                <div key={q.who} className="flex flex-col gap-1.5 pt-3">
                  <span className="text-[15px] leading-normal">“{q.t}”</span>
                  <span className="text-[13px] text-ink2">
                    <strong className="text-ink">{q.who}</strong>, {q.biz}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </figure>
      </Band>

      <FaqBlock
        title="Before you move"
        items={SWITCH_FAQ[country]}
        tone="white"
        note={
          <>
            Still unsure? Write to <strong className="text-ink">{COMPANY.email.help}</strong> and tell us what you use today.
          </>
        }
      />
      <div aria-hidden className="h-[clamp(48px,7vw,96px)]" />

      <ProductCta country={country} kicker={SWITCH_CTA.kicker} title={SWITCH_CTA.title} jar={lk ? "Rs 2,040,000" : "£16,260"} />
    </>
  );
}
