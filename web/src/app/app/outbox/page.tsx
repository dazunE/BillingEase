import type { Metadata } from "next";
import Link from "next/link";
import { ICONS, Icon } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { listOutbox } from "@/lib/ops-in";

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
  return (
    <>
      <Link href="/app" className="inline-flex min-h-10 items-center gap-1.5 self-start text-sm font-semibold">
        <Icon d={ICONS.arrowLeft} size={16} />
        Home
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[clamp(28px,3.4vw,38px)] font-bold tracking-[-0.03em]">Outbox</h1>
        <p className="max-w-[680px] rounded-[14px] bg-info-bg px-4 py-3 text-sm text-info">
          <strong>Development mode.</strong> No email provider is set up, so the emails BillingEase would send (invoices, reminders) are kept here instead. In production
          these go straight to your customers&apos; inboxes.
        </p>
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
                    {m.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    <Icon d={ICONS.chevronDown} size={16} className="group-open:rotate-180" />
                  </span>
                </summary>
                <div className="flex flex-col gap-3 border-t border-divider px-5 py-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink [overflow-wrap:anywhere]">{m.bodyText}</pre>
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
