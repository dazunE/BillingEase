import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, H2, IconTile, RatesNote, Section } from "@/components/site";
import { LandlordScene } from "@/components/site/illustrations/audience";
import s from "@/components/site/site.module.css";
import { cx } from "@/components/ui";
import { money } from "@/content/site/country";
import { HOME_ICONS } from "@/content/site/home";
import { LANDLORD_LK, LANDLORD_META, LANDLORD_UK as P } from "@/content/site/landlords";
import { PLANS } from "@/content/site/plans";
import { ROUTES, routeText, type RouteKey } from "@/content/site/routes";
import { SAMPLES, sampleNumbers } from "@/content/site/samples";
import { getSiteCountry } from "@/lib/site-country";
import { AlsoFor, AudienceClose, AudienceHero, FaqBlock, FeatureCards, Heading, Kicker, MeetPersona, PlanPitch, QuoteWall } from "../_parts/blocks";
import { FlatCalculator } from "./FlatCalculator";
import { QuarterPicker } from "./QuarterPicker";

export const metadata: Metadata = { title: LANDLORD_META.title, description: LANDLORD_META.description };

const TONE = { pos: "bg-pos-bg text-pos", late: "bg-late-bg text-late" } as const;

export default async function LandlordsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const country = await getSiteCountry(searchParams);
  if (country === "lk") return <SriLanka />;

  const tom = SAMPLES.uk.find((b) => b.key === "landlord")!;
  const keep = sampleNumbers(tom).keep;
  const plan = PLANS.uk.find((p) => p.popular)!;

  return (
    <>
      <AudienceHero country="uk" chip={{ icon: ROUTES.landlords.icon, tint: "orange", label: P.chip }} title={P.hero.title} lead={P.hero.lead} link={P.hero.link} art={<LandlordScene t={P.scene} />} />

      <MeetPersona country="uk" avatar="tom" title={P.meet.title} story={P.meet.story} byline={P.meet.byline} first={P.meet.first} caption={P.meet.caption} numbers={tom} />

      <Section id="calc" labelledBy="calc-h">
        <Heading id="calc-h" kicker={P.calc.kicker} dot="bg-going" title={P.calc.title} lead={P.calc.lead} />
        <FlatCalculator />
        <RatesNote country="uk" />
      </Section>

      <Section tone="white" labelledBy="feat-h">
        <Heading id="feat-h" title={P.features.title} lead={P.features.lead} max={760} />
        <FeatureCards items={P.features.items} />
      </Section>

      <Section id="rent-roll" labelledBy="roll-h">
        <Heading id="roll-h" title={P.roll.title} lead={P.roll.lead} />
        <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(16px,2.4vw,24px)]">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">{P.roll.table}</h3>
            <span className="text-[13px] text-muted">Invented properties · illustrative</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th scope="col" className="py-2.5 pr-3 font-bold">Property</th>
                  <th scope="col" className="py-2.5 pr-3 font-bold">Managed</th>
                  <th scope="col" className="py-2.5 pr-3 text-right font-bold">Rent</th>
                  <th scope="col" className="py-2.5 pr-3 text-right font-bold">Your share</th>
                  <th scope="col" className="py-2.5 font-bold">October</th>
                </tr>
              </thead>
              <tbody>
                {P.roll.rows.map((r) => (
                  <tr key={r.name} className="border-b border-divider">
                    <th scope="row" className="py-3 pr-3 text-left font-bold">
                      <span className="flex items-center gap-2.5">
                        <span aria-hidden className="flex size-8 flex-none items-center justify-center rounded-lg bg-going-tint">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d={HOME_ICONS.house} />
                          </svg>
                        </span>
                        {r.name}
                      </span>
                    </th>
                    <td className="py-3 pr-3 text-ink2">{r.who}</td>
                    <td className="tabular py-3 pr-3 text-right font-bold">{money(r.rent, "uk")}</td>
                    <td className="py-3 pr-3 text-right">{r.share}</td>
                    <td className="py-3">
                      <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", TONE[r.tone])}>
                        <span aria-hidden className="size-1.5 rounded-full bg-current" />
                        {r.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="flex flex-wrap items-center gap-3 rounded-2xl bg-due-bg px-4 py-3 text-sm">
            <IconTile d={HOME_ICONS.bell} tint="grey" size={32} />
            <span className="min-w-0 flex-1">{P.roll.banner}</span>
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4">
          {[P.roll.agent, P.roll.mortgage].map((c) => (
            <div key={c.title} className="flex flex-col gap-3.5 rounded-3xl border border-line bg-white p-[clamp(18px,2.4vw,26px)]">
              <Kicker dot="bg-going">{c.kicker}</Kicker>
              <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">{c.title}</h3>
              <p className="text-[15px] leading-normal text-ink2">{c.body}</p>
              <dl className="flex flex-col gap-1.5 rounded-2xl bg-bg p-4 text-sm">
                {c.rows.map(([l, v], i) => (
                  <div key={l} className={cx("flex justify-between gap-3", i === c.rows.length - 1 && c === P.roll.agent && "border-t border-line pt-1.5 font-bold")}>
                    <dt>{l}</dt>
                    <dd className="tabular font-bold">{v}</dd>
                  </div>
                ))}
              </dl>
              <span className="text-[13px] text-muted">{c.foot}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="quarters" tone="white" labelledBy="q-h" innerClassName="flex-row! flex-wrap items-start gap-x-16 gap-y-10">
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-[18px]">
          <Kicker dot="bg-violet">{P.quarters.kicker}</Kicker>
          <h2 id="q-h" className={cx(H2, "text-balance")}>
            {P.quarters.title}
          </h2>
          <p className="text-lg leading-[1.55] text-ink2">{P.quarters.lead}</p>
          <RatesNote country="uk" />
        </div>
        <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5">
          <QuarterPicker label={P.quarters.pick} />
        </div>
      </Section>

      <QuoteWall title={P.quotes.title} main={{ ...P.quotes.main, tint: "yellow" }} side={P.quotes.side.map((q, i) => ({ ...q, tint: i ? "green" : "violet" }))} />

      <PlanPitch country="uk" title={P.plan.title} why={P.plan.why} rows={P.plan.rows} plan={plan} />

      <FaqBlock intro={P.faqIntro} items={P.faq} />

      <AlsoFor country="uk" keys={["soleTraders", "smallBusinesses", "accountants"]} />

      <AudienceClose country="uk" kicker={`Tom’s tax year so far: ${money(keep, "uk")} yours to keep`} title={P.close.title} keep={keep} />
    </>
  );
}

const LK_LINKS: RouteKey[] = ["soleTraders", "smallBusinesses", "accountants", "countries"];

/** Sri Lanka: landlord mode is UK only. A short, honest note and the pages that fit. */
function SriLanka() {
  const L = LANDLORD_LK;
  return (
    <>
      <AudienceHero
        country="lk"
        chip={{ icon: ROUTES.landlords.icon, tint: "orange", label: L.chip }}
        title={L.title}
        lead={L.lead}
        secondary={{ label: "UK and Sri Lanka", href: ROUTES.countries.href }}
        art={<LandlordScene t={L.scene} />}
      />
      <Section tone="white" labelledBy="lk-h" innerClassName="flex-row! flex-wrap items-start gap-x-16 gap-y-10">
        <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-[18px]">
          <Kicker dot="bg-going">Landlord mode is for the UK</Kicker>
          <h2 id="lk-h" className={cx(H2, "text-balance")}>
            {L.note.title}
          </h2>
          <ol className="flex flex-col gap-3.5">
            {L.note.points.map(([b, t], i) => (
              <li key={b} className="flex items-start gap-3">
                <span aria-hidden className="flex size-7 flex-none items-center justify-center rounded-full bg-going-tint font-display text-[13px] font-bold">
                  {i + 1}
                </span>
                <span className="text-base leading-[1.55] text-ink2">
                  <strong className="text-ink">{b}</strong> {t}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4 rounded-[28px] bg-bg p-[clamp(20px,3vw,32px)]">
          <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">{L.links.title}</h3>
          <p className="text-[15px] text-ink2">{L.links.lead}</p>
          <ul className="flex flex-col gap-2">
            {LK_LINKS.map((k) => {
              const r = ROUTES[k];
              const { label, hint } = routeText(r, "lk");
              return (
                <li key={k}>
                  <Link href={r.href} className={cx(s.lift, "flex min-h-11 items-center gap-3 rounded-2xl border border-line bg-white p-3.5")}>
                    <IconTile d={r.icon} tint={r.tone === "orange" ? "orange" : r.tone === "grey" ? "grey" : "violet"} size={36} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[15px] font-bold">{label}</span>
                      <span className="text-[13px] text-muted">{hint}</span>
                    </span>
                    <ArrowIcon size={16} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </Section>
      <AudienceClose country="lk" kicker="Rent, costs and everything else" title={L.close.title} />
    </>
  );
}
