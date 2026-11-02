import Link from "next/link";
import type { ReactNode } from "react";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { cx, Icon } from "@/components/ui";
import { requireBusiness } from "@/lib/session";

export type BizPage = "business" | "branding" | "people" | "security" | "ai" | "apps";

const I = {
  business: "M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6",
  branding: "M12 3a9 9 0 1 0 0 18c1 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.4-4-7.8-9-7.8zM7.5 12.5h.01M9.5 8.5h.01M14.5 8.5h.01",
  people: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.8M16 4.2a3.5 3.5 0 0 1 0 6.6",
  security: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  ai: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z",
  apps: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 17h6M17 14v6",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
};

const LABEL: Record<BizPage, string> = {
  business: "Business profile",
  branding: "Invoice branding",
  people: "People and access",
  security: "Security and data",
  ai: "AI and agents",
  apps: "Apps and API",
};

/**
 * Every page under Your business (prototype BizNav): the crumbs, and a card down the left with the
 * business and its settings. On a phone the card is left out: the bottom island lists the same pages.
 */
export async function BizShell({ here, sub, children }: { here: BizPage; sub?: string; children: ReactNode }) {
  const { business: b } = await requireBusiness();
  const lk = b.country === "lk";
  const role = { owner: "Owner", accountant: lk ? "Practitioner" : "Accountant", admin: "Office admin" }[b.role];
  const where = [role, b.currency, b.town].filter(Boolean).join(" · ");
  const items: { key: BizPage; hint: string; href: string }[] = [
    { key: "business", hint: lk ? "Name, TIN, VAT and SSCL" : b.country === "us" ? "Name, EIN, invoices" : "Name, UTR, invoices", href: "/app/settings/business" },
    { key: "branding", hint: "Logo, colour, layout", href: "/app/settings/branding" },
    { key: "people", hint: lk ? "You, your practitioner, your team" : "You, your accountant, your team", href: "/app/settings/people" },
    { key: "security", hint: "Sign-in, import, export", href: "/app/settings/security" },
    { key: "ai", hint: "Costs, caps and what ran", href: "/app/settings/ai" },
    { key: "apps", hint: "AI assistants and your software", href: "/app/settings/apps" },
  ];
  return (
    <>
      <AppCrumbs area="biz" trail={[{ label: "Your business", href: "/app/settings/business" }, ...(sub ? [{ label: LABEL[here], href: `/app/settings/${here}` }, { label: sub }] : [{ label: LABEL[here] }])]} />
      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <nav aria-label="Your business" className="flex flex-col gap-1 rounded-3xl border border-line bg-white p-4 max-lg:hidden lg:sticky lg:top-6">
          <div className="flex items-center gap-3 border-b border-divider px-1 pb-4 pt-1">
            <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-ink font-display text-lg font-bold text-violet">{b.name.trim()[0]?.toUpperCase()}</span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-display text-[16px] font-bold tracking-[-0.01em]">{b.name}</span>
              <span className="truncate text-xs text-muted">{where}</span>
            </span>
          </div>
          <span className="px-1.5 pb-1 pt-3 text-[11.5px] font-bold uppercase tracking-[0.06em] text-muted">Settings</span>
          {items.map((it) => {
            const on = it.key === here;
            return (
              <Link key={it.key} href={it.href} aria-current={on ? "page" : undefined} className={cx("flex min-h-[60px] items-center gap-3 rounded-2xl px-2.5 py-2 no-underline", on ? "bg-ink text-white" : "text-ink hover:bg-bg")}>
                <span className={cx("flex size-9 shrink-0 items-center justify-center rounded-[11px]", on ? "bg-violet text-ink" : "bg-surface text-ink")}>
                  <Icon d={I[it.key]} size={18} />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[14.5px] font-semibold">{LABEL[it.key]}</span>
                  <span className={cx("truncate text-xs", on ? "text-white/80" : "text-muted")}>{it.hint}</span>
                </span>
              </Link>
            );
          })}
          <div className="mt-2 flex flex-col gap-0.5 border-t border-divider pt-3">
            <Link href="/businesses" className="flex min-h-11 items-center gap-2.5 rounded-xl px-2.5 text-sm font-semibold text-ink2 hover:bg-bg">
              <Icon d={I.business} size={16} /> Your businesses
            </Link>
            <Link href="/features" className="flex min-h-11 items-center gap-2.5 rounded-xl px-2.5 text-sm font-semibold text-ink2 hover:bg-bg">
              <Icon d={I.list} size={16} /> Everything BillingEase does
            </Link>
            <Link href="/help" className="flex min-h-11 items-center gap-2.5 rounded-xl px-2.5 text-sm font-semibold text-ink2 hover:bg-bg">
              <Icon d={I.help} size={16} /> Help
            </Link>
          </div>
        </nav>
        <div className="flex min-w-0 flex-col gap-6">{children}</div>
      </div>
    </>
  );
}

/** The heading every Your business page starts with. */
export function BizHeading({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 max-w-[680px] flex-col gap-2">
        <span className="text-sm font-semibold text-muted">Your business</span>
        <h1 className="font-display text-[clamp(30px,4vw,44px)] font-bold leading-[1.05] tracking-[-0.03em]">{title}</h1>
        {children && <p className="text-ink2">{children}</p>}
      </div>
      {action}
    </div>
  );
}
