import Link from "next/link";
import { remindAction } from "@/app/app/invoices/actions";

const primary = "inline-flex min-h-11 items-center rounded-full bg-violet px-5 text-sm font-semibold text-ink hover:bg-[#a98ffb]";
const secondary = "inline-flex min-h-11 items-center rounded-full bg-ink/[0.07] px-4 text-sm font-semibold text-ink hover:bg-ink/[0.11]";

/**
 * "See invoice" + "Send a friendly nudge", with an optional personal note.
 * Renders as fragments so the note can sit on its own full-width row in the
 * parent's flex layout; the textarea joins the form through `form=`.
 */
export function NudgeForm({
  invoiceId,
  customerId,
  customerName,
  hasEmail,
  back,
  showSee = true,
}: {
  invoiceId: string;
  customerId: string;
  customerName: string;
  hasEmail: boolean;
  back: string;
  showSee?: boolean;
}) {
  const formId = `nudge-${invoiceId}`;
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {showSee && (
          <Link href={`/app/invoices/${invoiceId}`} className={secondary}>
            See invoice
          </Link>
        )}
        {hasEmail ? (
          <form id={formId} action={remindAction}>
            <input type="hidden" name="invoiceId" value={invoiceId} />
            <input type="hidden" name="back" value={back} />
            <button className={primary}>Send a friendly nudge</button>
          </form>
        ) : (
          <Link href={`/app/customers/${customerId}#edit`} className={primary}>
            Add an email to nudge them
          </Link>
        )}
      </div>
      {hasEmail && (
        <details className="group basis-full">
          <summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-1.5 text-[13px] font-semibold text-ink2 underline underline-offset-4 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Add a personal note</span>
            <span className="hidden group-open:inline">Personal note</span>
          </summary>
          <label className="mt-1 flex flex-col gap-1.5">
            <span className="sr-only">Personal note to {customerName}</span>
            <textarea
              form={formId}
              name="note"
              maxLength={2000}
              rows={3}
              placeholder={`Hi! Just checking this didn't get lost. Happy to answer any questions.`}
              className="min-h-20 w-full rounded-[10px] border border-input bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/80 focus:border-ink focus:outline-none"
            />
            <span className="text-xs text-muted">Goes in the email instead of our standard wording. The pay link is added for you. Then press Send a friendly nudge.</span>
          </label>
        </details>
      )}
    </>
  );
}
