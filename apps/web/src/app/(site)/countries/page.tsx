import type { Metadata } from "next";
import { H2, RatesNote, Section } from "@/components/site";
import { Avatar, GlobeScene, type AvatarKey } from "@/components/site/illustrations/audience";
import { cx } from "@/components/ui";
import { COUNTRIES, COUNTRIES_META } from "@/content/site/countries";
import { COUNTRY_META, money, type SiteCountry } from "@/content/site/country";
import { ROUTES } from "@/content/site/routes";
import { SAMPLES, sampleNumbers, type SampleBusiness } from "@/content/site/samples";
import { getSiteCountry } from "@/lib/site-country";
import { AlsoFor, AudienceClose, AudienceHero, FaqBlock, FeatureCards, Heading, Kicker } from "../for/_parts/blocks";
import { InvoicePicker } from "./InvoicePicker";

export const metadata: Metadata = { title: COUNTRIES_META.title, description: COUNTRIES_META.description };

const P = COUNTRIES;

function MiniNumbers({ c, b, who, line }: { c: SiteCountry; b: SampleBusiness; who: AvatarKey; line: string }) {
  const n = sampleNumbers(b);
  const tiles: [string, string, string, boolean][] = [
    ["Coming in", money(n.inT, c), "bg-coming", false],
    ["Going out", money(n.outT, c), "bg-going", false],
    ["Yours to keep", money(n.keep, c), "bg-violet", true],
  ];
  return (
    <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5 rounded-3xl bg-bg p-[clamp(18px,2.6vw,28px)]">
      <div className="flex items-center gap-4">
        <Avatar who={who} size={72} />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[13px] font-bold text-muted">
            {COUNTRY_META[c].name} · {COUNTRY_META[c].currency} · {COUNTRY_META[c].taxYear}
          </span>
          <span className="font-display text-xl font-bold tracking-[-0.02em]">{b.name}</span>
          <span className="text-sm text-ink2">{line}</span>
        </span>
      </div>
      <div role="group" aria-label={`${b.name}’s three numbers`} className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,140px),1fr))] gap-2">
        {tiles.map(([l, v, dot, dark]) => (
          <span key={l} className={cx("flex min-w-0 flex-col gap-2 rounded-2xl p-4", dark ? "bg-ink text-white" : "bg-white")}>
            <span className={cx("flex items-center gap-1.5 text-xs font-bold", dark && "text-tint")}>
              <span aria-hidden className={cx("size-2 rounded-full", dot)} />
              {l}
            </span>
            <span className={cx("tabular whitespace-nowrap font-display font-bold tracking-[-0.03em]", c === "lk" ? "text-[18px]" : "text-[clamp(18px,1.9vw,24px)]", dark && "text-violet")}>{v}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default async function CountriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const country = await getSiteCountry(searchParams);

  return (
    <>
      <AudienceHero
        country={country}
        chip={{ icon: ROUTES.countries.icon, tint: "yellow", label: P.chip }}
        title={P.hero.title}
        lead={P.hero.lead}
        link={{ label: "See what changes", href: "#differs" }}
        art={<GlobeScene hand={P.hero.hand} />}
      />

      <Section tone="white" labelledBy="meet-h" innerClassName="gap-9!">
        <Heading id="meet-h" title={P.meet.title} lead={P.meet.lead} />
        <div className="flex flex-wrap gap-4">
          <MiniNumbers c="uk" b={SAMPLES.uk[0]} who="ellie" line="Ellie Harper, graphic designer · Leeds" />
          <MiniNumbers c="lk" b={SAMPLES.lk[0]} who="ayesha" line="Ayesha Fernando, design studio · Colombo 03" />
        </div>
        <p className="text-[13px] text-muted">Invented businesses and illustrative figures, each in its own country’s tax year so far.</p>
      </Section>

      <Section id="invoice" labelledBy="pick-h">
        <Heading id="pick-h" kicker={P.pick.kicker} dot="bg-due" title={P.pick.title} lead={P.pick.lead} />
        <InvoicePicker key={country} initial={country} />
        <RatesNote country={country} />
      </Section>

      <Section tone="white" labelledBy="same-h">
        <Heading id="same-h" title={P.same.title} lead={P.same.lead} max={760} />
        <FeatureCards items={P.same.items} />
      </Section>

      <Section id="differs" labelledBy="diff-h">
        <Heading id="diff-h" title={P.matrix.title} lead={P.matrix.lead} />
        <div className="overflow-hidden rounded-3xl border border-line bg-white">
          <table className="w-full border-collapse text-sm max-[760px]:hidden">
            <thead>
              <tr className="border-b border-line bg-bg text-left">
                <th scope="col" className="w-[22%] px-5 py-3.5 text-xs font-bold text-muted">
                  Feature
                </th>
                <th scope="col" className="w-[39%] px-5 py-3.5 font-display text-base font-bold">
                  United Kingdom
                </th>
                <th scope="col" className="w-[39%] px-5 py-3.5 font-display text-base font-bold">
                  Sri Lanka
                </th>
              </tr>
            </thead>
            <tbody>
              {P.matrix.rows.map(([f, uk, lk]) => (
                <tr key={f} className="border-b border-divider align-top last:border-b-0">
                  <th scope="row" className="px-5 py-3.5 text-left text-[13px] font-bold">
                    {f}
                  </th>
                  <td className={cx("px-5 py-3.5 leading-normal text-ink2", country === "uk" && "bg-tint/40")}>{uk}</td>
                  <td className={cx("px-5 py-3.5 leading-normal text-ink2", country === "lk" && "bg-tint/40")}>{lk}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="hidden flex-col max-[760px]:flex">
            {P.matrix.rows.map(([f, uk, lk]) => (
              <div key={f} className="flex flex-col gap-2 border-b border-divider p-4 last:border-b-0">
                <dt className="text-[13px] font-bold">{f}</dt>
                <dd className="flex flex-col gap-1.5 text-sm text-ink2">
                  <span className="flex gap-2">
                    <span className="w-9 flex-none text-xs font-bold text-ink">UK</span>
                    <span>{uk}</span>
                  </span>
                  <span className="flex gap-2">
                    <span className="w-9 flex-none text-xs font-bold text-ink">LK</span>
                    <span>{lk}</span>
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <RatesNote country={country} />
      </Section>

      <Section id="fixed" tone="white" labelledBy="fixed-h" innerClassName="flex-row! flex-wrap items-stretch gap-4!">
        <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-[18px] rounded-3xl bg-bg p-[clamp(20px,3vw,36px)]">
          <Kicker dot="bg-going">{P.fixed.kicker}</Kicker>
          <h2 id="fixed-h" className={cx(H2, "text-balance")}>
            {P.fixed.title}
          </h2>
          <p className="text-lg leading-[1.55] text-ink2">{P.fixed.lead}</p>
          <ul className="flex flex-col gap-2.5">
            {P.fixed.points.map(([b, t]) => (
              <li key={b} className="flex flex-col gap-0.5 rounded-2xl border border-line bg-white p-4">
                <strong className="text-[15px]">{b}</strong>
                <span className="text-sm text-ink2">{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4 rounded-3xl bg-ink p-[clamp(20px,3vw,32px)] text-white">
          <span className="self-start rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-tint">{P.data.kicker}</span>
          <h3 className="font-display text-[clamp(22px,2.4vw,28px)] font-bold leading-tight tracking-[-0.02em]">{P.data.title}</h3>
          <p className="text-[15px] leading-normal text-tint">{P.data.body}</p>
          <dl className="flex flex-col gap-2.5">
            {P.data.rows.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 rounded-2xl bg-white/[0.06] p-3.5">
                <dt className="text-sm font-bold text-violet">{k}</dt>
                <dd className="text-sm text-tint">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-auto text-[13px] text-tint">{P.data.foot}</p>
        </div>
      </Section>

      <FaqBlock intro={P.faqIntro} items={P.faq} />

      <AlsoFor country={country} keys={["soleTraders", "smallBusinesses", "accountants"]} />

      <AudienceClose country={country} kicker={`You’re looking at the ${COUNTRY_META[country].name} site`} title={P.close.title} />
    </>
  );
}
