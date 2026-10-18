import { agents } from "@billingease/contracts";
import { formatDate, formatMoney } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { Badge, Button, cx } from "@/components/ui";
import { ApiFailure, call } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { approveMany } from "../../check/actions";
import { StatementUpload } from "../StatementUpload";
import { busy, STATUS } from "../status";
import { retryStatement } from "./actions";

export const metadata: Metadata = { title: "Bank statement" };

const LINE: Record<string, { label: string; tone: "pos" | "violet" | "neutral" | "due" }> = {
  matched: { label: "In your books", tone: "pos" },
  proposed: { label: "To check", tone: "violet" },
  unmatched: { label: "Not matched", tone: "due" },
  ignored: { label: "Left out", tone: "neutral" },
};

export default async function StatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { business } = await requireBusiness();
  const { id } = await params;
  let data;
  try {
    data = await call(agents.statement, { params: { id } });
  } catch (err) {
    if (err instanceof ApiFailure && err.status === 404) notFound();
    throw err;
  }
  const { statement: s, lines } = data;
  const money = (m: number) => formatMoney(Math.abs(m), business.currency, { decimals: "always" });
  const sure = lines.filter((l) => l.proposalStatus === "pending" && (l.proposalConfidence ?? 0) >= 85).map((l) => l.proposalId!);
  return (
    <>
      <AppCrumbs area="out" trail={[{ label: "Bank statements", href: "/app/statements" }, { label: s.filename }]} />
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-display text-[clamp(26px,3.5vw,36px)] font-bold tracking-[-0.03em] [overflow-wrap:anywhere]">{s.accountLabel ?? s.filename}</h1>
            <p className="text-sm text-ink2">
              {s.periodFrom && s.periodTo ? `${formatDate(s.periodFrom, { year: true })} to ${formatDate(s.periodTo, { year: true })} · ` : ""}
              {s.lineCount} lines · {s.format.toUpperCase()}{s.readBy === "model" ? ", read with AI" : s.readBy === "header" ? ", read from its columns" : ""}
            </p>
          </div>
          <Badge tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Badge>
        </div>

        {busy(s) && <StatementUpload setUp busy />}
        {s.status === "failed" && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-late-bg px-5 py-4 text-late">
            <span className="min-w-0 flex-1">{s.error}</span>
            <form action={retryStatement}><input type="hidden" name="id" value={s.id} /><Button variant="secondary">Try again</Button></form>
          </div>
        )}
        {s.balanceProblems > 0 && (
          <p role="status" className="rounded-2xl bg-due-bg px-5 py-3 text-sm text-due">
            {s.balanceProblems} running {s.balanceProblems === 1 ? "balance doesn't" : "balances don't"} follow from the lines, so a line may have been misread. Check the amounts against your statement.
          </p>
        )}

        {s.status === "done" && (
          <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-line bg-white p-5">
            <dl className="grid flex-[1_1_100%] grid-cols-4 gap-3 text-sm sm:flex-[1_1_320px]">
              {([["In your books", s.counts.matched], ["To check", s.counts.waiting], ["Not matched", s.counts.unmatched], ["Left out", s.counts.ignored]] as const).map(([k, n]) => (
                <div key={k} className="flex flex-col"><dt className="text-muted">{k}</dt><dd className="font-display text-2xl font-bold">{n}</dd></div>
              ))}
            </dl>
            {sure.length > 0 && (
              <form action={approveMany}>
                <input type="hidden" name="ids" value={sure.join(",")} />
                <input type="hidden" name="back" value={`/app/statements/${s.id}`} />
                <Button>Approve the {sure.length} sure {sure.length === 1 ? "one" : "ones"}</Button>
              </form>
            )}
            {s.counts.waiting > 0 && <Link href="/app/check" className="min-h-11 content-center text-sm font-semibold underline underline-offset-4">Check them one by one</Link>}
          </div>
        )}

        {lines.length > 0 && (
          <ul aria-label="Lines" className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-white">
            {lines.map((l) => (
              <li key={l.id} className="grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-1 border-b border-divider px-4 py-3 last:border-0 sm:grid-cols-[92px_1fr_auto_auto] sm:items-center">
                <span className="text-xs text-muted sm:text-sm">{formatDate(l.date, { year: true })}</span>
                <span className={cx("text-right font-semibold tabular-nums sm:order-3", l.amount > 0 ? "text-coming" : "text-ink")}>{l.amount > 0 ? "+" : "−"}{money(l.amount)}</span>
                <span className="col-span-2 flex min-w-0 flex-col sm:order-2 sm:col-span-1">
                  <span className="text-[15px] [overflow-wrap:anywhere]">{l.href ? <Link href={l.href} className="hover:underline">{l.description}</Link> : l.description}</span>
                  {l.note && <span className="text-xs text-muted">{l.note}</span>}
                </span>
                <span className="col-span-2 sm:order-4 sm:col-span-1">
                  <Badge tone={LINE[l.status].tone}>{l.status === "proposed" && l.proposalStatus && l.proposalStatus !== "pending" ? (l.proposalStatus === "applied" ? "In your books" : "Turned down") : LINE[l.status].label}</Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
