import { agents, home } from "@billingease/contracts";
import { rulesFor } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { longDate, whole } from "@/components/home/format";
import { NeedsYou } from "@/components/home/NeedsYou";
import { PeriodCard } from "@/components/home/PeriodCard";
import { Deadlines, FirstSteps, RecentActivity } from "@/components/home/Sidebar";
import { ThreeNumbers } from "@/components/home/ThreeNumbers";
import { cx } from "@/components/ui";
import { ApiFailure, call, load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Home" };

const PERIODS = ["month", "quarter", "year"] as const;

export default async function HomePage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { me, business } = await requireBusiness();
  const { period } = await searchParams;
  const key = PERIODS.find((p) => p === period);
  const [s, waiting] = await Promise.all([load(home.summary, { query: { period: key } }), pendingCount()]);
  const rules = rulesFor(business.country);
  const first = me.user.name.split(/\s+/)[0];
  const practitioner = rules.wording.practitionerNoun;
  const profit = s.comingIn.total - s.goingOut.total;
  const when = { quarter: "so far this quarter.", month: "so far this month.", year: `so far this ${business.country === "lk" ? "year of assessment" : "tax year"}.` }[s.period.key];

  let sentence: React.ReactNode;
  if (s.empty) sentence = <>Welcome, {first}. Let&apos;s get <Mark>{business.name}</Mark> set up.</>;
  else if (profit < 0) sentence = <>Going out is ahead of Coming in by <Mark>{whole(-profit, s.currency)}</Mark> {when}</>;
  else sentence = <>You&apos;re on track to keep <Mark>{whole(s.keep, s.currency)}</Mark> {when}</>;

  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 max-w-[760px] flex-col gap-2">
          <span className="text-sm font-semibold text-muted">{longDate(s.today)} · {business.name}</span>
          <h1 className="font-display text-[clamp(30px,4vw,44px)] font-bold leading-[1.1] tracking-[-0.03em] [overflow-wrap:anywhere]">{sentence}</h1>
        </div>
        <nav aria-label="Period" className="flex flex-wrap gap-1 rounded-[22px] bg-surface p-1">
          {s.periods.map((p) => (
            <Link key={p.key} href={`/app?period=${p.key}`} aria-current={p.key === s.period.key ? "page" : undefined} scroll={false}
              className={cx("flex min-h-10 items-center rounded-full px-4 text-sm font-semibold", p.key === s.period.key ? "bg-ink text-white" : "text-ink hover:bg-white/60")}>
              {p.label}
            </Link>
          ))}
        </nav>
      </section>

      {waiting > 0 && (
        <Link href="/app/check" className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-tint px-5 py-4 hover:bg-[#e6ddff]">
          <span className="flex flex-col gap-0.5">
            <strong className="text-[15px]">{waiting === 1 ? "1 thing" : `${waiting} things`} for you to check</strong>
            <span className="text-sm text-ink2">The AI drafted {waiting === 1 ? "it" : "them"}. Nothing goes into your books until you approve.</span>
          </span>
          <span className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-[15px] font-semibold text-white">Check now</span>
        </Link>
      )}

      {s.periodCard && <PeriodCard card={s.periodCard} currency={s.currency} practitioner={practitioner} />}

      <ThreeNumbers s={s} country={business.country} practitioner={practitioner} />

      <div className="flex flex-wrap items-start gap-6">
        {s.empty ? <FirstSteps steps={s.firstSteps} /> : <NeedsYou items={s.needs} />}
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <Deadlines items={s.deadlines} />
          <RecentActivity items={s.activity} practitioner={practitioner} />
        </div>
      </div>

      <nav aria-label="More places" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="font-semibold text-muted">More:</span>
        <Link href="/app/ask" className="underline underline-offset-4">Ask about tax and your books</Link>
        <Link href="/app/notifications" className="underline underline-offset-4">Notifications</Link>
        <Link href="/app/settings/business" className="underline underline-offset-4">Business profile</Link>
      </nav>
    </>
  );
}

async function pendingCount() {
  try {
    return (await call(agents.proposals, { query: { status: "pending" } })).pending;
  } catch (err) {
    if (err instanceof ApiFailure) return 0;
    throw err;
  }
}

function Mark({ children }: { children: React.ReactNode }) {
  return <span className="rounded-xl bg-tint px-2.5 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">{children}</span>;
}
