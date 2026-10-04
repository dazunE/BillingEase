import type { Metadata } from "next";
import Link from "next/link";
import { EquationStrip } from "@/components/EquationStrip";
import { BillForm } from "@/components/out/BillForm";
import { BillList } from "@/components/out/BillList";
import { Card, cx } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { addDays, today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { threeNumbers } from "@/lib/numbers";
import { CATEGORY_KEYWORDS, categoryChoices, listBills, mainCashAccount, vendorNames } from "@/lib/ops-out";

export const metadata: Metadata = { title: "Bills" };

export default async function BillsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "paid" ? "paid" : "unpaid";
  const { business, db } = await requireBusiness();
  const t = today();
  const [n, unpaid, paid, cash, choices, vendors] = await Promise.all([
    threeNumbers(db, business.id, "month", t),
    listBills(db, business.id, "unpaid"),
    listBills(db, business.id, "paid"),
    mainCashAccount(db, business.id),
    categoryChoices(db, business.id),
    vendorNames(db, business.id),
  ]);
  const rows = tab === "paid" ? paid : unpaid;
  const owed = unpaid.reduce((s, b) => s + b.amountCents, 0);
  const back = tab === "paid" ? "/app/bills?tab=paid" : "/app/bills";
  const rules: [string, string][] = CATEGORY_KEYWORDS.map(([re, code]) => [re.source, code]);

  return (
    <>
      <EquationStrip n={n} current="out" />

      <section className="flex flex-col gap-1.5">
        <Link href="/app/out" className="text-sm font-semibold text-muted hover:text-ink">
          Going out
        </Link>
        <h1 className="font-display text-[clamp(28px,3.5vw,38px)] font-bold tracking-[-0.03em]">Bills</h1>
        <p className="text-[15px] text-ink2">
          {unpaid.length ? (
            <>
              You owe <strong className="text-ink">{formatMoney(owed)}</strong> across {unpaid.length} bill{unpaid.length === 1 ? "" : "s"}. Paying one takes it from {cash.name}.
            </>
          ) : (
            "You don't owe anyone right now."
          )}
        </p>
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-label={tab === "paid" ? "Paid bills" : "Bills to pay"} className="flex min-w-0 flex-[999_1_520px] flex-col gap-3">
          <nav aria-label="Bill status" className="flex gap-1 self-start rounded-full bg-surface p-1">
            {(
              [
                ["unpaid", `To pay · ${unpaid.length}`, "/app/bills"],
                ["paid", `Paid · ${paid.length}`, "/app/bills?tab=paid"],
              ] as const
            ).map(([key, label, href]) => (
              <Link
                key={key}
                href={href}
                aria-current={tab === key ? "page" : undefined}
                className={cx("inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold", tab === key ? "bg-ink text-white" : "text-ink hover:bg-white")}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="rounded-[20px] border border-line bg-white">
            {rows.length ? (
              <BillList bills={rows} today={t} back={back} payFromName={cash.name} />
            ) : (
              <p className="px-5 py-5 text-[15px] text-ink2">{tab === "paid" ? "No paid bills yet." : "No bills waiting. Every bill is paid."}</p>
            )}
          </div>
        </section>

        <Card id="new" className="flex min-w-0 flex-[1_1_340px] scroll-mt-24 flex-col gap-4 rounded-[20px] p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">Add a bill</h2>
            <p className="text-sm text-ink2">Something you&apos;ll pay later.</p>
          </div>
          <BillForm vendors={vendors} categories={choices.out.filter((c) => !c.code.startsWith("3"))} today={t} defaultDue={addDays(t, 14)} suggestions={rules} />
        </Card>
      </div>

      <nav aria-label="More detail" className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-2 text-sm text-ink2">
        <span>See also</span>
        <Link href="/app/vendors" className="font-semibold text-ink underline underline-offset-4">
          Vendors
        </Link>
        <Link href="/app/transactions" className="font-semibold text-ink underline underline-offset-4">
          All transactions
        </Link>
      </nav>
    </>
  );
}
