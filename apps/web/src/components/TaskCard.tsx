import Link from "next/link";
import { approvePayrollAction, connectBankAction, nudgeAction, payBillAction } from "@/app/app/actions";
import type { Task } from "@/lib/tasks";
import { ICONS, Icon, cx } from "./ui";

const TINT = { late: "bg-late-bg", due: "bg-due-bg", violet: "bg-tint" } as const;
const ICON = { late: ICONS.clock, sort: ICONS.sort, payroll: ICONS.people, bill: ICONS.bill, draft: ICONS.doc, connect: ICONS.bank } as const;

const primary = "inline-flex min-h-11 items-center rounded-full bg-violet px-5 text-sm font-semibold text-ink hover:bg-[#a98ffb]";
const secondary = "inline-flex min-h-11 items-center rounded-full bg-ink/[0.07] px-4 text-sm font-semibold text-ink hover:bg-ink/[0.11]";

/** One "Needs you" item with its single obvious action. */
export function TaskCard({ task, back = "/app" }: { task: Task; back?: string }) {
  return (
    <article className="flex flex-wrap items-center gap-x-4.5 gap-y-3.5 rounded-[20px] border border-line bg-white px-5 py-4.5">
      <span className={cx("flex size-11 shrink-0 items-center justify-center rounded-[14px]", TINT[task.tone])}>
        <Icon d={ICON[task.kind]} size={22} strokeWidth={1.9} />
      </span>
      <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
        <h3 className="text-base font-bold">{task.title}</h3>
        <p className="text-sm leading-relaxed text-ink2">{task.body}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {task.kind === "late" && (
          <>
            <Link href={`/app/invoices/${task.invoiceId}`} className={secondary}>
              See invoice
            </Link>
            <form action={nudgeAction}>
              <input type="hidden" name="invoiceId" value={task.invoiceId} />
              <input type="hidden" name="back" value={back} />
              <button className={primary}>Send a friendly nudge</button>
            </form>
          </>
        )}
        {task.kind === "sort" && (
          <Link href="/app/out#sort" className={primary}>
            Sort them
          </Link>
        )}
        {task.kind === "payroll" && (
          <>
            <Link href="/app/out#payroll" className={secondary}>
              Review
            </Link>
            <form action={approvePayrollAction}>
              <input type="hidden" name="runId" value={task.runId} />
              <input type="hidden" name="back" value={back} />
              <button className={primary}>Approve</button>
            </form>
          </>
        )}
        {task.kind === "bill" && (
          <form action={payBillAction}>
            <input type="hidden" name="billId" value={task.billId} />
            <input type="hidden" name="back" value={back} />
            <button className={primary}>Pay now</button>
          </form>
        )}
        {task.kind === "draft" && (
          <Link href={`/app/invoices/${task.invoiceId}`} className={primary}>
            Review and send
          </Link>
        )}
        {task.kind === "connect" && (
          <form action={connectBankAction}>
            <input type="hidden" name="back" value={back} />
            <button className={primary}>Connect a bank</button>
          </form>
        )}
      </div>
    </article>
  );
}
