import { home } from "@billingease/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { ago } from "@/components/home/format";
import { ICONS, Icon, cx } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { markAllRead, toggleRead } from "./actions";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { business } = await requireBusiness();
  const filter = (await searchParams).filter === "unread" ? "unread" : "all";
  const n = await load(home.notifications, { query: { filter } });
  const lk = business.country === "lk";
  const hear = lk
    ? ["Payments you record and invoices that go late", "Bills coming due, payroll and EPF and ETF dates", "VAT and SSCL return dates and income tax instalments"]
    : ["Payments you record and invoices that go late", "Bills coming due", "When a quarter closes and when its update is due"];
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section aria-labelledby="nt-h" className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 id="nt-h" className="font-display text-[clamp(30px,4vw,40px)] font-bold tracking-[-0.03em]">Notifications</h1>
            <p className="text-ink2">{n.total === 0 ? "Things that happened while you were away." : n.unread ? `${n.unread} new · ${n.total} in all` : `Nothing new · ${n.total} in all`}</p>
          </div>
          {n.total > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <nav aria-label="Show" className="flex gap-1 rounded-[22px] bg-surface p-1">
                {[["all", "All"], ["unread", `Unread${n.unread ? ` (${n.unread})` : ""}`]].map(([id, label]) => (
                  <Link key={id} href={id === "all" ? "/app/notifications" : "/app/notifications?filter=unread"} aria-current={filter === id ? "page" : undefined}
                    className={cx("flex min-h-10 items-center rounded-full px-4 text-sm font-semibold", filter === id ? "bg-ink text-white" : "text-ink")}>{label}</Link>
                ))}
              </nav>
              {n.unread > 0 && <form action={markAllRead}><button className="min-h-11 rounded-full bg-ink/[0.07] px-4 text-sm font-semibold hover:bg-ink/[0.11]">Mark all as read</button></form>}
            </div>
          )}
        </div>
        {n.items.length > 0 ? (
          <ul aria-label="Notifications" className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-white">
            {n.items.map((x) => (
              <li key={x.id} className={cx("flex items-start gap-3 border-b border-divider px-4 py-3.5 last:border-0", !x.read && "bg-[#F7F5FF]")}>
                <span className="mt-0.5 flex size-9 flex-none items-center justify-center rounded-xl bg-tint"><Icon d={ICONS.mail} size={18} /></span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cx("text-[15px]", x.read ? "font-medium" : "font-bold")}>
                    {!x.read && <span className="mr-1.5 text-coming">New:</span>}
                    {x.link ? <Link href={x.link} className="hover:underline">{x.title}</Link> : x.title}
                  </span>
                  {x.body && <span className="text-sm text-ink2">{x.body}</span>}
                  <span className="text-xs text-muted">{ago(x.createdAt)}</span>
                </div>
                <form action={toggleRead}>
                  <input type="hidden" name="id" value={x.id} />
                  <input type="hidden" name="read" value={x.read ? "false" : "true"} />
                  <button aria-label={`${x.read ? "Mark as unread" : "Mark as read"}: ${x.title}`} title={x.read ? "Mark as unread" : "Mark as read"}
                    className="flex size-11 items-center justify-center rounded-full hover:bg-surface">
                    <Icon d={x.read ? ICONS.mail : ICONS.check} size={18} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : n.total > 0 ? (
          <div className="flex flex-col items-start gap-2 rounded-3xl border border-dashed border-input p-6">
            <span className="font-display text-lg font-bold">You&apos;re all caught up</span>
            <span className="text-sm text-ink2">Nothing new since you last looked. Older ones are still under All.</span>
            <Link href="/app/notifications" className="min-h-11 content-center text-sm font-semibold underline underline-offset-4">Show all</Link>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2 rounded-3xl border border-dashed border-input p-6">
            <span className="font-display text-lg font-bold">Nothing here yet</span>
            <span className="text-sm text-ink2">When an invoice goes late, a payment comes in or a {lk ? "VAT return" : "quarter"} date comes up, you&apos;ll hear about it here.</span>
          </div>
        )}
      </section>
      <aside aria-labelledby="hear-h" className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-5">
        <h2 id="hear-h" className="font-display text-lg font-bold tracking-[-0.02em]">What you hear about</h2>
        <ul className="flex flex-col gap-2 text-sm text-ink2">{hear.map((h) => <li key={h}>{h}</li>)}</ul>
        <p className="text-sm text-muted">Everything else goes to Recent activity on Home, so this list stays short.</p>
        <Link href="/app" className="min-h-11 content-center text-sm font-semibold underline underline-offset-4">Back to Home</Link>
      </aside>
    </div>
  );
}
