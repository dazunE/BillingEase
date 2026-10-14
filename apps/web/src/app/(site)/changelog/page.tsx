import type { Metadata } from "next";
import { Container, IconTile, MoreLink, PageHero } from "@/components/site";
import { ChangelogVisual } from "@/components/site/illustrations/resources/ChangelogVisuals";
import { ChangelogArt } from "@/components/site/illustrations/resources/HeroArt";
import { COMPANY } from "@/content/site/company";
import { CHANGELOG, CHANGELOG_PAGE, type ChangeTag } from "@/content/site/changelog";
import { ROUTES } from "@/content/site/routes";
import { getSiteCountry } from "@/lib/site-country";
import { ChangelogList } from "./ChangelogList";

export const metadata: Metadata = {
  title: "What’s new",
  description: "Every BillingEase update, in plain words: sign-up by country, invoices and Tax Invoices, expenses and bills, Home and Ask.",
};

const shortDate = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function ChangelogPage({ searchParams }: PageProps<"/changelog">) {
  const country = await getSiteCountry(searchParams);
  const count = (t: ChangeTag) => CHANGELOG.filter((x) => x.tag === t).length;
  const latest = CHANGELOG[0];

  return (
    <>
      <PageHero
        kicker={CHANGELOG_PAGE.kicker}
        title={CHANGELOG_PAGE.title}
        lead={CHANGELOG_PAGE.lead}
        art={<ChangelogArt date={shortDate(latest.date).toUpperCase()} />}
        actions={
          <ul className="flex flex-wrap gap-2.5">
            {(
              [
                ["New", "new feature"],
                ["Improved", "improvement"],
                ["Fixed", "fix"],
              ] as [ChangeTag, string][]
            ).map(([t, word]) => {
              const n = count(t);
              return (
                <li key={t} className="flex items-baseline gap-2 rounded-2xl border border-line bg-white px-4 py-2.5">
                  <span className="font-display text-2xl font-bold">{n}</span>
                  <span className="text-[15px] text-ink2">{n === 1 ? word : `${word}s`}</span>
                </li>
              );
            })}
          </ul>
        }
      />

      <Container className="pb-[clamp(64px,9vw,120px)]">
        <div className="grid items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section aria-label="Updates">
            <ChangelogList
              items={CHANGELOG.map((x) => ({
                id: x.id,
                date: x.date,
                dateLabel: shortDate(x.date),
                tag: x.tag,
                title: x.title,
                body: x.body,
                points: x.points,
                link: x.link,
                visual: x.visual ? <ChangelogVisual kind={x.visual} country={country} /> : undefined,
              }))}
            />
          </section>
          <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="flex flex-col gap-3 rounded-[28px] bg-ink p-7 text-white">
              <IconTile d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" tint="violet" size={44} />
              <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">Where updates appear</h2>
              <p className="text-[15px] leading-normal text-tint">
                Every change worth knowing about goes on this page first. There’s no update email yet, so check back here, or ask us anything.
              </p>
              <MoreLink href={ROUTES.help.href} tone="light">
                Help centre
              </MoreLink>
            </div>
            <div className="flex flex-col gap-2.5 rounded-[28px] border border-line bg-white p-6">
              <h2 className="text-lg font-bold">Missing something?</h2>
              <p className="text-[15px] leading-normal text-ink2">Tell us what would save you time. A person reads every message.</p>
              <MoreLink href={`mailto:${COMPANY.email.hello}?subject=${encodeURIComponent("A suggestion")}`}>Suggest a change</MoreLink>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
