import type { Metadata } from "next";
import { CashJar } from "@/components/CashJar";
import { CtaLink, IconTile, MoreLink, PageHero, Section, SectionHeading, StartFree, Tick } from "@/components/site";
import { ContactArt } from "@/components/site/illustrations/resources/HeroArt";
import { COMPANY } from "@/content/site/company";
import { CONTACT } from "@/content/site/contact";
import { COUNTRY_META, pick } from "@/content/site/country";
import { ROUTES } from "@/content/site/routes";
import { getSiteCountry } from "@/lib/site-country";
import { CopyButton } from "../press/CopyButton";
import { MailtoForm } from "./MailtoForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Write to BillingEase: practices and tax practitioners, help, press, privacy and security. A person reads every message and replies by email.",
};

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const country = await getSiteCountry(searchParams);
  const practitioner = country === "uk" ? "Accountants and practices" : "Tax practitioners";

  return (
    <>
      <PageHero kicker={CONTACT.kicker} title={CONTACT.title} lead={pick(CONTACT.lead, country)} art={<ContactArt />} />

      {/* Three doors */}
      <section aria-label="Who to write to" className="pb-[clamp(56px,8vw,96px)]">
        <ul className="mx-auto box-border grid max-w-[1200px] gap-4 px-[clamp(16px,4vw,40px)]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}>
          {CONTACT.doors.map((d, i) => (
            <li key={d.key} className={`flex flex-col gap-4 rounded-3xl bg-white p-7 ${i === 0 ? "border-2 border-ink" : "border border-line"}`}>
              <IconTile d={d.icon} tint={d.tint} size={52} />
              <h2 className="font-display text-[23px] font-bold tracking-[-0.02em]">{pick(d.title, country)}</h2>
              <p className="text-[15px] leading-relaxed text-ink2">{pick(d.body, country)}</p>
              <p className="flex flex-wrap items-baseline gap-x-2 text-[15px]">
                <span className="text-muted">Email</span>
                <a href={`mailto:${d.email}`} className="break-all font-bold underline-offset-4 hover:underline">
                  {d.email}
                </a>
              </p>
              <CtaLink href={ROUTES[d.cta.route].href} variant={i === 0 ? "dark" : "soft"} className="mt-auto self-start">
                {d.cta.label}
              </CtaLink>
            </li>
          ))}
        </ul>
      </section>

      {/* Form */}
      <Section tone="white" labelledBy="write-h" innerClassName="flex-row! flex-wrap items-start gap-x-16 gap-y-10">
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-5">
          <span className="flex items-center gap-2 text-sm font-bold text-ink2">
            <span aria-hidden className="size-2 rounded-full bg-going" />
            Write to us
          </span>
          <h2 id="write-h" className="font-display text-[clamp(34px,4.4vw,56px)] font-bold leading-[1.04] tracking-[-0.035em] text-balance">
            We reply by email.
          </h2>
          <p className="text-[17px] leading-relaxed text-ink2">
            Tell us a little about your business or your practice. The form writes the email for you and opens it in your own email app, addressed to the right person. Nothing is sent from this page.
          </p>
          <ul className="flex flex-col gap-3 text-[15px]">
            {[
              "A person who knows small-business books, not a script",
              country === "uk" ? "Straight answers about Making Tax Digital and what BillingEase does today" : "Straight answers about Tax Invoices, payroll and what BillingEase does today",
              "No follow-up emails unless you ask for them",
            ].map((x) => (
              <li key={x} className="flex items-start gap-2.5">
                <Tick color="#7A5AF8" />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 flex-[1_1_480px] rounded-[28px] bg-bg p-[clamp(20px,3vw,32px)]">
          <MailtoForm
            to={COMPANY.email.hello}
            subjectPrefix="BillingEase"
            placeholder={country === "uk" ? "For example: a practice with 40 sole-trader clients joining MTD next April" : "For example: a practitioner with 25 clients, most VAT registered, two running payroll"}
            extra={{ label: "Business or practice name" }}
            topics={[
              { label: practitioner, to: COMPANY.email.practices },
              { label: "Help with BillingEase", to: COMPANY.email.help },
              { label: "Press", to: COMPANY.email.press },
              { label: "Privacy and my data", to: COMPANY.email.privacy },
              { label: "A security problem", to: COMPANY.email.security },
              { label: "Something else", to: COMPANY.email.hello },
            ]}
          />
        </div>
      </Section>

      {/* Every address */}
      <Section labelledBy="addr-h">
        <SectionHeading id="addr-h" title="Every address" lead="If you’d rather write from your own email, here’s who reads what." />
        <ul className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 330px), 1fr))" }}>
          {CONTACT.addresses.map((x) => (
            <li key={x.email} className="flex items-center justify-between gap-3 rounded-[20px] border border-line bg-white px-5 py-4">
              <span className="flex min-w-0 flex-col">
                <span className="text-[13px] font-bold text-muted">{x.label}</span>
                <a href={`mailto:${x.email}`} className="break-all text-base font-bold underline-offset-4 hover:underline">
                  {x.email}
                </a>
                <span className="text-sm text-ink2">{x.use}</span>
              </span>
              <CopyButton text={x.email} done="Copied" className="flex-none">
                Copy
              </CopyButton>
            </li>
          ))}
        </ul>
        <p className="max-w-[760px] text-sm leading-normal text-muted">
          We don’t have an office to visit or a phone line yet. Found a security problem? Write to {COMPANY.email.security}; please don’t include anyone’s personal data. <MoreLink href={ROUTES.privacy.href}>Privacy policy</MoreLink>
        </p>
      </Section>

      {/* Look around first */}
      <section aria-labelledby="look-h" className="px-[clamp(16px,4vw,40px)] pb-[clamp(48px,6vw,80px)]">
        <div className="mx-auto box-border flex max-w-[1200px] flex-wrap items-center justify-between gap-x-12 gap-y-8 rounded-[32px] bg-tint px-[clamp(24px,5vw,72px)] py-[clamp(36px,6vw,72px)]">
          <div className="flex min-w-0 max-w-[700px] flex-[1_1_420px] flex-col items-start gap-5">
            <span className="flex items-center gap-2 text-sm font-bold text-ink2">
              <span aria-hidden className="size-2 rounded-full bg-coming" />
              Rather look around first?
            </span>
            <h2 id="look-h" className="font-display text-[clamp(34px,5vw,60px)] font-bold leading-[1.04] tracking-[-0.04em] text-balance">
              Try it free. Write to us when you’re ready.
            </h2>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <StartFree country={country} variant="dark" size="lg" />
              <MoreLink href={ROUTES.pricing.href}>See pricing</MoreLink>
            </div>
          </div>
          <CashJar sym={COUNTRY_META[country].sym} size={220} className="max-w-full" />
        </div>
      </section>
    </>
  );
}
