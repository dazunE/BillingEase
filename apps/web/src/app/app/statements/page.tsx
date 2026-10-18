import { agents } from "@billingease/contracts";
import { formatDate } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { ago } from "@/components/home/format";
import { Badge } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { StatementUpload } from "./StatementUpload";
import { busy, STATUS } from "./status";

export const metadata: Metadata = { title: "Bank statements" };

export default async function StatementsPage() {
  const { business } = await requireBusiness();
  const [list, usage] = await Promise.all([load(agents.statements), load(agents.usage)]);
  return (
    <>
      <AppCrumbs area="out" trail={[{ label: "Bank statements" }]} />
      <div className="mx-auto flex w-full max-w-[860px] flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold tracking-[-0.03em]">Bank statements</h1>
          <p className="max-w-[660px] text-ink2">
            Upload a statement and BillingEase checks every line against {business.name}&apos;s books: payments into invoices, bills paid, expenses already there.
            What&apos;s new is drafted with a category in <Link href="/app/check" className="underline underline-offset-4">For you to check</Link>. It&apos;s not a bank feed: nothing connects to your bank.
          </p>
        </div>
        <StatementUpload setUp={usage.setUp} busy={list.statements.some(busy)} />
        {list.statements.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-input p-6 text-sm text-ink2">No statements yet. Most banks let you download the last month as CSV or PDF from online banking.</p>
        ) : (
          <ul aria-label="Statements" className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-white">
            {list.statements.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 border-b border-divider px-4 py-3.5 last:border-0">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Link href={`/app/statements/${s.id}`} className="text-[15px] font-semibold hover:underline [overflow-wrap:anywhere]">{s.filename}</Link>
                  <span className="text-xs text-muted">
                    {s.periodFrom && s.periodTo ? `${formatDate(s.periodFrom)} to ${formatDate(s.periodTo, { year: true })} · ` : ""}
                    {s.lineCount ? `${s.lineCount} lines · ` : ""}{s.status === "done" ? `${s.counts.matched} matched · ${s.counts.waiting} to check · ` : ""}uploaded {ago(s.createdAt)}
                    {s.error && ` · ${s.error}`}
                  </span>
                </div>
                <Badge tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
