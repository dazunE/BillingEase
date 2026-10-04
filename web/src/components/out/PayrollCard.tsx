import { approvePayrollOutAction } from "@/app/app/out/actions";
import { Badge, ICONS, Icon } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { initials } from "./format";

type Run = { id: string; payDate: string; totalCents: number; status: string; people: { name: string; netCents: number; grossCents: number }[] };

/** One payroll run in "Coming up": total, who gets what, and Approve. */
export function PayrollCard({ run, fundingAccount, back, anchor }: { run: Run; fundingAccount: string; back: string; anchor?: boolean }) {
  const approved = run.status === "approved";
  const n = run.people.length;
  const firstNames = run.people.map((p) => p.name.split(" ")[0]);
  const who = firstNames.length > 1 ? `${firstNames.slice(0, -1).join(", ")} and ${firstNames.at(-1)}` : firstNames[0];
  return (
    <article id={anchor ? "payroll" : undefined} className="scroll-mt-24 rounded-[20px] border border-line bg-white" aria-label={`Payroll for ${formatDate(run.payDate, { weekday: "long", month: "short", day: "numeric" })}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 sm:px-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-tint">
          <Icon d={ICONS.people} size={22} strokeWidth={1.9} />
        </span>
        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold">Payroll for {formatDate(run.payDate, { weekday: "long", month: "short", day: "numeric" })}</span>
            {approved ? (
              <Badge tone="pos">Approved · pays {formatDate(run.payDate, { weekday: "short", month: "short", day: "numeric" })}</Badge>
            ) : (
              <Badge tone="due">Needs approval</Badge>
            )}
          </span>
          <span className="text-sm text-ink2">
            {approved
              ? `${who} get${n === 1 ? "s" : ""} paid ${formatDate(run.payDate, { weekday: "long" })}. Payroll taxes are filed for you.`
              : `${n} ${n === 1 ? "person" : "people"}, paid by direct deposit. Payroll taxes are filed for you.`}
          </span>
        </div>
        <span className="ml-auto font-display text-lg font-bold tabular">{formatMoney(run.totalCents)}</span>
        {!approved && (
          <form action={approvePayrollOutAction}>
            <input type="hidden" name="runId" value={run.id} />
            <input type="hidden" name="back" value={back} />
            <button className="inline-flex min-h-11 items-center rounded-full bg-violet px-5 text-sm font-semibold text-ink hover:bg-[#a98ffb]">
              Approve {formatMoney(run.totalCents, { cents: false })}
            </button>
          </form>
        )}
      </div>
      <details className="group border-t border-divider">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-sm font-semibold sm:px-5 [&::-webkit-details-marker]:hidden">
          <Icon d={ICONS.chevronDown} size={16} className="transition-transform group-open:rotate-180" />
          See who gets paid
        </summary>
        <ul className="flex flex-col px-4 pb-2 sm:px-5">
          {run.people.map((p) => (
            <li key={p.name} className="flex items-center gap-3 border-t border-divider py-2.5 first:border-t-0">
              <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tint text-xs font-bold">
                {initials(p.name)}
              </span>
              <span className="flex-1 text-sm font-semibold">{p.name}</span>
              <span className="text-[13px] text-muted">
                net pay <span className="sr-only">of</span>
              </span>
              <span className="min-w-[80px] text-right text-sm font-bold tabular">{formatMoney(p.netCents)}</span>
            </li>
          ))}
        </ul>
        <p className="border-t border-divider px-4 py-3 text-[13px] text-ink2 sm:px-5">
          Paid from <strong className="text-ink">{fundingAccount}</strong>. The money lands on {formatDate(run.payDate, { weekday: "long", month: "short", day: "numeric" })}.
        </p>
      </details>
    </article>
  );
}
