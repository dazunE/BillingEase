import type { Metadata } from "next";
import { CashJar } from "@/components/CashJar";
import { CtaLink, H2, IconTile, PageHero, Section, SectionHeading, StartFree, Tick } from "@/components/site";
import { AboutArt } from "@/components/site/illustrations/resources/HeroArt";
import { cx } from "@/components/ui";
import { ABOUT } from "@/content/site/about";
import { COUNTRY_META, money, pick } from "@/content/site/country";
import { ROUTES } from "@/content/site/routes";
import { SAMPLES, sampleNumbers } from "@/content/site/samples";
import { getSiteCountry } from "@/lib/site-country";

export const metadata: Metadata = {
  title: "About",
  description: "Why we built BillingEase: bookkeeping in three numbers, for sole traders and landlords in the UK and small businesses in Sri Lanka.",
};

export default async function AboutPage({ searchParams }: PageProps<"/about">) {
  const country = await getSiteCountry(searchParams);
  const sample = SAMPLES[country][0];
  const n = sampleNumbers(sample);
  const meta = COUNTRY_META[country];

  return (
    <>
      <PageHero
        kicker={ABOUT.kicker}
        title={ABOUT.title}
        lead={pick(ABOUT.lead, country)}
        art={<AboutArt />}
        actions={
          <>
            <StartFree country={country} variant="dark" size="lg" />
            <CtaLink href={ROUTES.features.href} variant="soft" size="lg">
              How it works
            </CtaLink>
          </>
        }
      />

      {/* Why */}
      <Section tone="white" labelledBy="why-h" innerClassName="flex-row! flex-wrap items-start gap-x-16 gap-y-10">
        <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5">
          <h2 id="why-h" className={cx(H2, "text-balance")}>
            {ABOUT.why.title}
          </h2>
          {ABOUT.why.body.map((p) => (
            <p key={p} className="text-[17px] leading-relaxed text-ink2">
              {p}
            </p>
          ))}
        </div>
        <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-3xl bg-bg p-6">
            <span className="text-sm font-bold text-ink2">What bookkeeping software usually asks you</span>
            <ul className="flex flex-wrap gap-2">
              {ABOUT.why.jargon.map((j) => (
                <li key={j} className="rounded-full border border-line bg-white px-3 py-1.5 text-[13px] font-semibold text-muted line-through decoration-going decoration-2">
                  {j}
                </li>
              ))}
            </ul>
          </div>
          <svg aria-hidden width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="self-center">
            <path d="M12 4v16M6 14l6 6 6-6" />
          </svg>
          <span className="text-sm font-bold text-ink2">What you want to know ({sample.name}, an invented sample business)</span>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-2.5">
            {[
              { k: "Coming in", v: n.inT, cls: "border border-line bg-white", dot: "bg-coming", val: "" },
              { k: "Going out", v: n.outT, cls: "border border-line bg-white", dot: "bg-going", val: "" },
              { k: "Yours to keep", v: n.keep, cls: "bg-ink text-white", dot: "bg-violet", val: "text-violet" },
            ].map((x) => (
              <li key={x.k} className={cx("flex flex-col gap-1.5 rounded-[20px] p-4", x.cls)}>
                <span className="flex items-center gap-2 text-sm font-bold">
                  <span aria-hidden className={cx("size-2 rounded-full", x.dot)} />
                  {x.k}
                </span>
                <span className={cx("font-display text-[clamp(20px,2vw,26px)] font-bold tracking-[-0.02em]", x.val)}>{money(x.v, country)}</span>
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-muted">Illustrative figures. Yours to keep is after an estimated tax set-aside.</p>
        </div>
      </Section>

      {/* Beliefs */}
      <Section labelledBy="believe-h">
        <SectionHeading id="believe-h" title={ABOUT.beliefs.title} lead={ABOUT.beliefs.lead} />
        <ol className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}>
          {ABOUT.beliefs.items.map((b, i) => (
            <li key={b.title} className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-7">
              <span className="flex items-start justify-between">
                <span aria-hidden className="font-display text-[44px] font-bold leading-none tracking-[-0.04em]">
                  {i + 1}
                </span>
                <IconTile d={b.icon} tint={b.tint} size={44} />
              </span>
              <h3 className="font-display text-[21px] font-bold tracking-[-0.02em]">{b.title}</h3>
              <p className="text-[15px] leading-relaxed text-ink2">{b.body}</p>
            </li>
          ))}
          <li className="flex flex-col justify-between gap-6 rounded-3xl bg-ink p-7 text-white">
            <p className="font-hand text-[clamp(32px,3.4vw,40px)] font-bold leading-[1.1] text-violet">“{ABOUT.beliefs.rule}”</p>
            <p className="text-[13px] text-tint">The rule we design every screen by.</p>
          </li>
        </ol>
      </Section>

      {/* Two countries */}
      <Section tone="white" labelledBy="two-h">
        <SectionHeading id="two-h" title={ABOUT.countries.title} lead={ABOUT.countries.lead} />
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))" }}>
          {(["uk", "lk"] as const).map((c) => (
            <div key={c} className={cx("flex flex-col gap-4 rounded-3xl p-7", c === country ? "border-2 border-ink bg-white" : "border border-line bg-bg")}>
              <span className="flex items-center gap-3">
                <span className={cx("flex size-11 items-center justify-center rounded-full text-[15px] font-bold", c === "uk" ? "bg-tint" : "bg-going-tint")}>{COUNTRY_META[c].sym}</span>
                <span className="flex flex-col">
                  <span className="font-display text-xl font-bold tracking-[-0.02em]">{COUNTRY_META[c].name}</span>
                  {c === country && <span className="text-[13px] font-semibold text-coming">You’re on the {COUNTRY_META[c].short} site</span>}
                </span>
              </span>
              <ul className="flex flex-col gap-2.5 text-[15px]">
                {ABOUT.countries[c].map((x) => (
                  <li key={x} className="flex items-start gap-2.5">
                    <Tick />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Timeline */}
      <Section labelledBy="time-h">
        <SectionHeading id="time-h" title={ABOUT.timeline.title} lead={ABOUT.timeline.lead} aside={<CtaLink href={ROUTES.changelog.href} variant="soft" arrow>Every update, in plain words</CtaLink>} />
        <ol className="grid gap-x-4 gap-y-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))" }}>
          {ABOUT.timeline.items.map((t, i) => (
            <li key={i} className="flex flex-col gap-2">
              <span aria-hidden className="flex items-center">
                <span className={cx("size-4 flex-none rounded-full border-2", t.planned ? "border-dashed border-muted bg-bg" : i === 4 ? "border-ink bg-violet" : "border-ink bg-white")} />
                <span className={cx("h-0.5 flex-1", t.planned ? "border-t-2 border-dashed border-input" : i === 4 ? "bg-coming" : "bg-ink")} />
              </span>
              <span className="pt-2 text-[13px] font-bold uppercase tracking-[0.06em] text-muted">
                {t.when}
                {t.planned && " · Planned"}
              </span>
              <span className="font-display text-lg font-bold tracking-[-0.02em]">{t.title}</span>
              <span className="text-[15px] leading-normal text-ink2">{t.body}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* Two ways in */}
      <section aria-labelledby="ways-h" className="px-[clamp(16px,4vw,40px)] pb-[clamp(48px,6vw,80px)]">
        <div className="mx-auto box-border flex max-w-[1200px] flex-wrap items-center justify-between gap-x-12 gap-y-8 rounded-[32px] bg-tint px-[clamp(24px,5vw,72px)] py-[clamp(36px,6vw,72px)]">
          <div className="flex min-w-0 max-w-[700px] flex-[1_1_420px] flex-col items-start gap-5">
            <span className="flex items-center gap-2 text-sm font-bold text-ink2">
              <span aria-hidden className="size-2 rounded-full bg-coming" />
              Two ways in
            </span>
            <h2 id="ways-h" className="font-display text-[clamp(34px,5vw,60px)] font-bold leading-[1.04] tracking-[-0.04em] text-balance">
              Use it for your business, or tell us what to build.
            </h2>
            <div className="flex flex-wrap gap-2.5">
              <StartFree country={country} variant="dark" size="lg" />
              <CtaLink href={ROUTES.contact.href} variant="outline" size="lg" className="bg-white">
                Get in touch
              </CtaLink>
            </div>
          </div>
          <CashJar sym={meta.sym} size={240} amount={money(n.keep, country)} className="max-w-full" />
        </div>
      </section>
    </>
  );
}
