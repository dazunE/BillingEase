import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { ButtonLink, Icon, ICONS, Logo } from "@/components/ui";
import { BUSINESS_COOKIE } from "@/lib/cookies";
import { requireMe } from "@/lib/session";
import { switchBusiness } from "./actions";

export const metadata: Metadata = { title: "Your businesses" };

const COUNTRY = { uk: "United Kingdom · pounds", lk: "Sri Lanka · rupees", us: "United States · dollars" } as const;
const ROLE = { owner: "Owner", accountant: "Accountant", admin: "Office admin" } as const;

/** Every business this person can open, to pick one or add another. */
export default async function BusinessesPage() {
  const me = await requireMe();
  if (me.businesses.length === 0) redirect("/setup");
  const current = (await cookies()).get(BUSINESS_COOKIE)?.value;
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto flex max-w-[720px] items-center justify-between gap-4 px-[clamp(16px,4vw,40px)] pt-5">
        <Link href="/" aria-label="BillingEase home" className="no-underline"><Logo /></Link>
        <form action={signOut}>
          <button className="min-h-11 text-sm font-semibold underline underline-offset-2">Sign out</button>
        </form>
      </div>
      <main className="mx-auto flex max-w-[720px] flex-col gap-6 px-[clamp(16px,4vw,40px)] pb-16 pt-10">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-muted">Signed in as {me.user.email}</span>
          <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold tracking-[-0.03em]">Your businesses</h1>
          <p className="text-ink2">Each business keeps its own books, customers and settings. Pick one to work in; you can switch any time from the menu under your initials.</p>
        </div>
        <ul className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-white">
          {me.businesses.map((b) => (
            <li key={b.id} className="border-b border-divider last:border-0">
              <form action={switchBusiness}>
                <input type="hidden" name="id" value={b.id} />
                <button className="flex min-h-[68px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-bg" aria-label={`Open ${b.name}`}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-violet">{b.name.slice(0, 1).toUpperCase()}</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[16px] font-semibold">{b.name}{b.id === current && <span className="ml-2 rounded-full bg-surface px-2 text-[11.5px] font-bold">Open now</span>}</span>
                    <span className="text-[13px] text-muted">{COUNTRY[b.country]} · {ROLE[b.role]}</span>
                  </span>
                  <Icon d="M9 6l6 6-6 6" size={18} />
                </button>
              </form>
            </li>
          ))}
        </ul>
        <ButtonLink href="/setup" variant="secondary" className="self-start">
          <Icon d={ICONS.plus} size={18} strokeWidth={2.4} />Add a business
        </ButtonLink>
        <p className="text-sm text-ink2">A business in another country is its own business here, with that country&apos;s currency and tax rules.</p>
      </main>
    </div>
  );
}
