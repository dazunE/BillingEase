import { home, type Business } from "@billingease/contracts";
import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/(auth)/actions";
import { call } from "@/lib/api";
import { HeaderSearch } from "./app/HeaderSearch";
import { MenuCloser } from "./MenuCloser";
import { ICONS, Icon, Logo } from "./ui";

const BELL = "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0";
const SPARK = "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z";
const BILL = "M3 6h18v12H3zM3 10h18M7 15h3";

async function unread(): Promise<number> {
  try {
    return (await call(home.unreadCount)).unread;
  } catch {
    return 0;
  }
}

type Item = { label: string; hint: string; href: string; icon?: string; tint?: string };

/** What New offers, in the business's country (prototype AppHeader). */
function verbs(b: Business): Item[] {
  const lk = b.country === "lk";
  return [
    lk
      ? { label: b.vatRegistered ? "Send a tax invoice" : "Send an invoice", hint: b.vatRegistered ? "With VAT and SSCL on their own lines" : "In rupees", href: "/app/in/invoices/new", icon: ICONS.doc, tint: "bg-tint" }
      : { label: b.vatRegistered ? "Send a VAT invoice" : "Send an invoice", hint: b.vatRegistered ? "In pounds, with VAT" : "In pounds", href: "/app/in/invoices/new", icon: ICONS.doc, tint: "bg-tint" },
    { label: "Record an expense", hint: lk ? "Already paid: cash, cheque or transfer" : "Already paid, in an HMRC category", href: "/app/out#expense", icon: ICONS.bill, tint: "bg-going-tint" },
    { label: "Enter a bill", hint: "Something you’ll pay later", href: "/app/out/bills/new", icon: BILL, tint: "bg-going-tint" },
    { label: "Write a quote", hint: "A price before you start", href: "/app/in/quotes/new", icon: ICONS.doc, tint: "bg-tint" },
    { label: "Add a customer", hint: "Name and email is enough", href: "/app/in/customers#new", icon: ICONS.people, tint: "bg-tint" },
  ];
}

const ROLE: Record<Business["role"], string> = { owner: "Owner", accountant: "Accountant", admin: "Office admin" };

/**
 * One header for every signed-in screen (prototype AppHeader): your business, search, Ask,
 * New, notifications and the account menu. Where you are, and the three numbers, sit under it
 * in each page's AppCrumbs.
 */
export async function AppHeader({ userName, email, business }: { userName: string; email: string; business: Business }) {
  const count = await unread();
  const lk = business.country === "lk";
  const initials = userName.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const menu = "absolute right-0 top-[calc(100%+8px)] z-30 flex w-[280px] max-w-[calc(100vw-32px)] flex-col gap-0.5 rounded-[18px] border border-line bg-white p-2 shadow-[0_16px_40px_rgba(24,22,31,0.16)]";
  const chip = "shrink-0 rounded-full bg-surface px-2 text-[11.5px] font-bold leading-[18px] text-ink";
  const account: Item[] = [
    { label: "Business profile", hint: lk ? "Name, TIN, VAT and SSCL" : "Name, UTR and VAT", href: "/app/settings/business" },
    { label: "Notifications", hint: count ? `${count} new` : "Nothing new", href: "/app/notifications" },
    { label: "For you to check", hint: "What the AI drafted, waiting for you", href: "/app/check" },
    { label: "AI and agents", hint: "Costs, caps and what ran", href: "/app/settings/ai" },
    { label: "Everything BillingEase does", hint: "Every feature in plain words", href: "/features" },
    { label: "Help", hint: "Answers, and talk to a person", href: "/help" },
  ];
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto box-border flex max-w-[1200px] flex-wrap items-center gap-x-5 gap-y-3 px-[clamp(16px,4vw,40px)] py-3">
        <Link href="/app" aria-label="BillingEase home"><Logo /></Link>
        <span className="hidden min-w-0 items-center gap-2 border-l border-line pl-3.5 text-sm font-semibold text-ink2 min-[1100px]:flex">
          <span className="max-w-[200px] truncate">{business.name}</span>
          <span title={`${lk ? "Sri Lanka" : "United Kingdom"} business`} className={chip}>{lk ? "Sri Lanka" : "UK"}</span>
        </span>

        <HeaderSearch
          placeholder={lk ? "Find a customer, tax invoice, supplier or bill" : "Find a customer, invoice, supplier or bill"}
          noHint={`Try a customer, an invoice number like ${business.invoicePrefix}0001, or a supplier.`}
        />

        <div className="ml-auto flex items-center gap-2.5">
          <Link href="/app/ask" aria-label="Ask: AI answers about tax and your books" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface px-4 text-[15px] font-semibold hover:bg-line max-sm:px-3">
            <Icon d={SPARK} size={18} />
            <span className="max-sm:hidden">Ask</span>
          </Link>
          <details data-menu className="relative">
            <summary aria-label="New" className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full bg-violet px-5 text-[15px] font-semibold hover:bg-[#a98ffb] max-sm:px-3 [&::-webkit-details-marker]:hidden">
              <Icon d={ICONS.plus} size={18} strokeWidth={2.4} />
              <span className="max-sm:hidden">New</span>
            </summary>
            <div role="menu" className={menu}>
              {verbs(business).map((v) => (
                <Link key={v.label} role="menuitem" href={v.href} className="flex min-h-[52px] items-center gap-3 rounded-xl px-3 hover:bg-bg">
                  <span className={`flex size-[34px] shrink-0 items-center justify-center rounded-full ${v.tint}`}><Icon d={v.icon!} size={18} /></span>
                  <span className="flex flex-col"><span className="text-[15px] font-semibold">{v.label}</span><span className="text-xs text-muted">{v.hint}</span></span>
                </Link>
              ))}
            </div>
          </details>
          <Link href="/app/notifications" aria-label={count ? `Notifications, ${count} new` : "Notifications"} className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-surface hover:bg-line">
            <Icon d={BELL} />
            {count > 0 && (
              <span data-testid="bell-count" aria-hidden className="absolute right-0 top-0.5 box-border flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-going px-[5px] text-[11px] font-bold leading-none text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
          <details data-menu className="relative">
            <summary aria-label={`Your business: ${userName}, ${business.name}`} className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full bg-ink text-sm font-bold text-violet [&::-webkit-details-marker]:hidden">
              {initials}
            </summary>
            <div role="menu" className={`${menu} max-h-[calc(100vh-90px)] overflow-y-auto`}>
              <span className="mb-1 flex flex-col border-b border-surface px-3 pb-2.5 pt-2">
                <span className="flex items-center gap-2 text-[15px] font-bold">{business.name}<span className={chip}>{lk ? "Sri Lanka" : "UK"}</span></span>
                <span className="text-[13px] text-muted">{userName} · {ROLE[business.role]}</span>
              </span>
              {account.map((a) => (
                <Link key={a.label} role="menuitem" href={a.href} className="flex min-h-12 flex-col justify-center rounded-xl px-3 py-1 hover:bg-bg">
                  <span className="text-sm font-semibold">{a.label}</span>
                  <span className="text-xs text-muted">{a.hint}</span>
                </Link>
              ))}
              <form action={signOut}>
                <button role="menuitem" className="flex min-h-12 w-full flex-col justify-center rounded-xl px-3 py-1 text-left hover:bg-bg">
                  <span className="text-sm font-semibold">Sign out</span>
                  <span className="text-xs text-muted">{email}</span>
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>
      <Suspense><MenuCloser /></Suspense>
    </header>
  );
}
