import type { Metadata } from "next";
import Link from "next/link";
import { Badge, ICONS, Icon } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { canRetry } from "@/lib/email";
import { invoicePdfFilename } from "@/lib/invoice-pdf";
import { listOutbox } from "@/lib/ops-in";
import { emailProvider } from "@/lib/providers";
import { retryEmailAction } from "../invoices/actions";

function deliveryBadge(m: { status: string; createdAt: Date }) {
  if (m.status === "sent") return <Badge tone="pos">Sent</Badge>;
  if (m.status === "failed") return <Badge tone="late">Not sent</Badge>;
  if (m.status === "queued" || m.status === "sending") return canRetry(m) ? <Badge tone="late">Not sent</Badge> : <Badge tone="info">Sending</Badge>;
  return <Badge tone="neutral">Kept here</Badge>;
}

export const metadata: Metadata = { title: "Outbox" };

/** Pay links point at APP_URL; open them on this server so they work in development. */
function localHref(link: string) {
  try {
    const u = new URL(link);
    return u.pathname.startsWith("/i/") ? u.pathname + u.search : link;
  } catch {
    return link;
  }
}

export default async function OutboxPage() {
  const { business, db } = await requireBusiness();
  const mail = await listOutbox(db, business.id);
  const live = emailProvider() !== null;
  return (
    <>
      <Link href="/app" className="inline-flex min-h-10 items-center gap-1.5 self-start text-sm font-semibold">
        <Icon d={ICONS.arrowLeft} size={16} />
        Home
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[clamp(28px,3.4vw,38px)] font-bold tracking-[-0.03em]">Outbox</h1>
        {live ? (
          <p className="max-w-[680px] text-[15px] text-ink2">Every email BillingEase sends for you, with its invoice PDF attached.</p>
        ) : (
          <p className="max-w-[680px] rounded-[14px] bg-info-bg px-4 py-3 text-sm text-info">
            <strong>Not sending yet.</strong> No email service is set up, so the emails BillingEase would send (invoices with their PDFs, reminders) are kept here
            instead. Add a Resend API key (<code>RESEND_API_KEY</code>) and they go straight to your customers&apos; inboxes.
          </p>
        )}
      </div>

      {mail.length === 0 ? (
        <p className="rounded-[20px] border border-line bg-white p-6 text-[15px] text-ink2">Nothing sent yet. Send an invoice and its email shows up here.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {mail.map((m) => (
            <li key={m.id} className="rounded-[20px] border border-line bg-white">
              <details className="group">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-4 [&::-webkit-details-marker]:hidden">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tint" aria-hidden>
                    <Icon d={ICONS.mail} size={18} />
                  </span>
                  <span className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
                    <span className="text-[15px] font-semibold [overflow-wrap:anywhere]">{m.subject}</span>
                    <span className="text-[13px] text-ink2 [overflow-wrap:anywhere]">To {m.toEmail}</span>
                  </span>
                  <span className="ml-auto flex items-center gap-3 text-[13px] text-muted">
                    {deliveryBadge(m)}
                    {m.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    <Icon d={ICONS.chevronDown} size={16} className="group-open:rotate-180" />
                  </span>
                </summary>
                <div className="flex flex-col gap-3 border-t border-divider px-5 py-4">
                  {m.error && (m.status === "failed" || canRetry(m)) && (
                    <div className="flex flex-wrap items-center gap-3 rounded-[14px] bg-late-bg px-4 py-3 text-sm text-late">
                      <span className="min-w-0 flex-[1_1_240px] [overflow-wrap:anywhere]">
                        <strong>Didn&apos;t go out:</strong> {m.error}
                      </span>
                      {live && (
                        <form action={retryEmailAction}>
                          <input type="hidden" name="emailId" value={m.id} />
                          <button className="inline-flex min-h-10 items-center rounded-full bg-late px-4 text-sm font-semibold text-white hover:bg-[#8c1a0a]">Try again</button>
                        </form>
                      )}
                    </div>
                  )}
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink [overflow-wrap:anywhere]">{m.bodyText}</pre>
                  {m.invoiceId && m.invoiceNumber && (
                    <a
                      href={`/app/invoices/${m.invoiceId}/pdf?view=1`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center gap-2.5 self-start rounded-[14px] border border-line px-3.5 text-sm font-semibold hover:border-ink/40"
                    >
                      <span className="flex size-7 items-center justify-center rounded-lg bg-late-bg text-[10px] font-bold text-late" aria-hidden>
                        PDF
                      </span>
                      {invoicePdfFilename({ number: m.invoiceNumber })}
                      <span className="sr-only">(attachment, opens in a new tab)</span>
                    </a>
                  )}
                  {m.link && (
                    <a href={localHref(m.link)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-black">
                      Open the link in this email
                      <span className="sr-only">(opens in a new tab)</span>
                      <Icon d={ICONS.arrowRight} size={16} />
                    </a>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
