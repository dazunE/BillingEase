import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { ICONS, Icon, Logo } from "./ui";

const VERBS = [
  { label: "Bill someone", hint: "Invoice a customer in one sentence", href: "/app/in#bill", icon: ICONS.doc, tint: "bg-tint" },
  { label: "Record an expense", hint: "Cash, card or a bill to pay later", href: "/app/out#expense", icon: ICONS.bill, tint: "bg-going-tint" },
  { label: "Add a bill", hint: "Something you'll pay later", href: "/app/out#bill", icon: ICONS.clock, tint: "bg-going-tint" },
  { label: "Add a customer", hint: "Name and email is enough", href: "/app/customers#new", icon: ICONS.people, tint: "bg-tint" },
];

/** The app header: no sidebar. The three numbers are the navigation. */
export function AppHeader({ userName, businessName }: { userName: string; businessName: string }) {
  const initials = userName
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-5 gap-y-3 px-[clamp(16px,4vw,40px)] py-3">
        <Link href="/app" aria-label="Home">
          <Logo />
        </Link>
        <form action="/app/search" className="flex min-h-11 max-w-[480px] flex-[1_1_260px] items-center gap-2.5 rounded-full bg-surface px-4">
          <Icon d={ICONS.search} size={18} className="text-ink2" />
          <label htmlFor="q" className="sr-only">
            Find anything
          </label>
          <input id="q" name="q" type="search" placeholder="Find a customer, invoice or expense" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" />
        </form>
        <div className="ml-auto flex items-center gap-2.5">
          <details className="group relative">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full bg-violet px-5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
              <Icon d={ICONS.plus} size={18} strokeWidth={2.4} />
              New
            </summary>
            <div className="absolute right-0 top-[calc(100%+8px)] z-30 flex w-[290px] flex-col gap-0.5 rounded-[18px] border border-line bg-white p-2 shadow-[0_16px_40px_rgba(24,22,31,0.16)]">
              {VERBS.map((v) => (
                <Link key={v.label} href={v.href} className="flex min-h-[52px] items-center gap-3 rounded-xl px-3 hover:bg-surface">
                  <span className={`flex size-[34px] shrink-0 items-center justify-center rounded-full ${v.tint}`}>
                    <Icon d={v.icon} size={18} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[15px] font-semibold">{v.label}</span>
                    <span className="text-xs text-muted">{v.hint}</span>
                  </span>
                </Link>
              ))}
            </div>
          </details>
          <details className="relative">
            <summary
              aria-label={`Account: ${userName}, ${businessName}`}
              className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full bg-ink text-sm font-bold text-violet [&::-webkit-details-marker]:hidden"
            >
              {initials}
            </summary>
            <div className="absolute right-0 top-[calc(100%+8px)] z-30 flex w-[240px] flex-col gap-0.5 rounded-[18px] border border-line bg-white p-2 shadow-[0_16px_40px_rgba(24,22,31,0.16)]">
              <div className="px-3 py-2">
                <div className="text-sm font-semibold">{userName}</div>
                <div className="text-xs text-muted">{businessName}</div>
              </div>
              <Link href="/app/settings" className="flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-surface">
                Settings
              </Link>
              <Link href="/app/outbox" className="flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-surface">
                Sent emails (dev outbox)
              </Link>
              <form action={logout}>
                <button className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm hover:bg-surface">Sign out</button>
              </form>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
