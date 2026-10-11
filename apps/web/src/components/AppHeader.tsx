import { home } from "@billingease/contracts";
import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { call } from "@/lib/api";
import { ICONS, Icon, Logo } from "./ui";

const BELL = "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0";
const SPARK = "M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5";

async function unread(): Promise<number> {
  try {
    return (await call(home.unreadCount)).unread;
  } catch {
    return 0;
  }
}

type Verb = { label: string; hint: string; href: string; icon: string; tint: string };

function verbs(country: "uk" | "lk"): Verb[] {
  return [
    { label: "New invoice", hint: country === "lk" ? "A Tax Invoice with VAT and SSCL" : "Bill a customer", href: "/app/in/invoices/new", icon: ICONS.doc, tint: "bg-tint" },
    { label: "Record an expense", hint: "Something you've paid for", href: "/app/out#expense", icon: ICONS.bill, tint: "bg-going-tint" },
    { label: "Add a bill", hint: "Something you'll pay later", href: "/app/out/bills/new", icon: ICONS.clock, tint: "bg-going-tint" },
    { label: "New quote", hint: "A price before you start", href: "/app/in/quotes/new", icon: ICONS.doc, tint: "bg-tint" },
    { label: "Add a customer", hint: "Name and email is enough", href: "/app/in/customers#new", icon: ICONS.people, tint: "bg-tint" },
  ];
}

const AREAS = [
  { label: "Home", href: "/app" },
  { label: "Coming in", href: "/app/in" },
  { label: "Going out", href: "/app/out" },
];

/** The app header. The three numbers are the navigation; search, Ask, notifications, New and the account menu sit on the right. */
export async function AppHeader({ userName, businessName, country }: { userName: string; businessName: string; country: "uk" | "lk" }) {
  const count = await unread();
  const round = "flex size-11 items-center justify-center rounded-full hover:bg-surface";
  const initials = userName.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const menu = "absolute right-0 top-[calc(100%+8px)] z-30 flex flex-col gap-0.5 rounded-[18px] border border-line bg-white p-2 shadow-[0_16px_40px_rgba(24,22,31,0.16)]";
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-5 gap-y-3 px-[clamp(16px,4vw,40px)] py-3">
        <Link href="/app" aria-label="Home"><Logo /></Link>
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="max-w-[200px] truncate">{businessName}</span>
          <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-ink2">{country === "uk" ? "UK" : "Sri Lanka"}</span>
        </span>
        <nav aria-label="Areas" className="order-last flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
          {AREAS.map((a) => (
            <Link key={a.href} href={a.href} className="flex min-h-10 items-center whitespace-nowrap rounded-full px-3.5 text-sm font-semibold text-ink2 hover:bg-surface hover:text-ink">{a.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          <form action="/app/search" role="search" className="relative hidden 2xl:block">
            <label htmlFor="header-search" className="sr-only">Search</label>
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Icon d={ICONS.search} size={18} /></span>
            <input id="header-search" name="q" type="search" placeholder="Search customers, invoices…" className="min-h-11 w-[200px] rounded-full border border-line bg-bg pl-10 pr-4 text-sm placeholder:text-muted focus:border-ink focus:bg-white focus:outline-none" />
          </form>
          <Link href="/app/search" aria-label="Search" className={`${round} 2xl:hidden`}><Icon d={ICONS.search} /></Link>
          <Link href="/app/ask" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-2.5 text-[15px] font-semibold hover:bg-surface sm:px-3.5">
            <Icon d={SPARK} size={18} /><span>Ask</span>
          </Link>
          <Link href="/app/notifications" aria-label={count ? `Notifications, ${count} new` : "Notifications"} className={`${round} relative`}>
            <Icon d={BELL} />
            {count > 0 && <span data-testid="bell-count" className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-late px-1 text-[11px] font-bold leading-none text-white">{count > 99 ? "99+" : count}</span>}
          </Link>
          <details className="relative">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full bg-violet px-5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
              <Icon d={ICONS.plus} size={18} strokeWidth={2.4} />
              New
            </summary>
            <div className={`${menu} w-[290px]`}>
              {verbs(country).map((v) => (
                <Link key={v.label} href={v.href} className="flex min-h-[52px] items-center gap-3 rounded-xl px-3 hover:bg-surface">
                  <span className={`flex size-[34px] shrink-0 items-center justify-center rounded-full ${v.tint}`}><Icon d={v.icon} size={18} /></span>
                  <span className="flex flex-col"><span className="text-[15px] font-semibold">{v.label}</span><span className="text-xs text-muted">{v.hint}</span></span>
                </Link>
              ))}
            </div>
          </details>
          <details className="relative">
            <summary aria-label={`Account: ${userName}, ${businessName}`} className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full bg-ink text-sm font-bold text-violet [&::-webkit-details-marker]:hidden">
              {initials}
            </summary>
            <div className={`${menu} w-[240px]`}>
              <div className="px-3 py-2"><div className="text-sm font-semibold">{userName}</div><div className="text-xs text-muted">{businessName}</div></div>
              <Link href="/app/settings/business" className="flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-surface">Business profile</Link>
              <form action={signOut}><button className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm hover:bg-surface">Sign out</button></form>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
