import type { Metadata } from "next";
import Link from "next/link";
import { EquationStrip } from "@/components/EquationStrip";
import { dueBadge, initials } from "@/components/out/format";
import { VendorForm } from "@/components/out/VendorForm";
import { Badge, Card } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { threeNumbers } from "@/lib/numbers";
import { vendorSummaries } from "@/lib/ops-out";

export const metadata: Metadata = { title: "Vendors" };

export default async function VendorsPage() {
  const { business, db } = await requireBusiness();
  const t = today();
  const [n, vendors] = await Promise.all([threeNumbers(db, business.id, "month", t), vendorSummaries(db, business.id)]);
  const totalPaid = vendors.reduce((s, v) => s + v.paidCents, 0);
  const totalOwed = vendors.reduce((s, v) => s + v.owedCents, 0);

  return (
    <>
      <EquationStrip n={n} current="out" />

      <section className="flex flex-col gap-1.5">
        <Link href="/app/out" className="text-sm font-semibold text-muted hover:text-ink">
          Going out
        </Link>
        <h1 className="font-display text-[clamp(28px,3.5vw,38px)] font-bold tracking-[-0.03em]">Vendors</h1>
        <p className="text-[15px] text-ink2">
          The people and companies you pay. {vendors.length > 0 && (
            <>
              <strong className="text-ink">{formatMoney(totalPaid)}</strong> paid on bills so far, <strong className="text-ink">{formatMoney(totalOwed)}</strong> still owed.
            </>
          )}
        </p>
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <Card className="min-w-0 flex-[999_1_560px] overflow-hidden rounded-[20px]">
          {vendors.length === 0 ? (
            <p className="p-6 text-[15px] text-ink2">No vendors yet. They&apos;re added for you when you enter a bill, or add one here.</p>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                <caption className="sr-only">Vendors with totals paid and owed</caption>
                <thead>
                  <tr className="border-b border-line text-[13px] text-muted">
                    <th scope="col" className="px-5 py-3 font-semibold">Vendor</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Bills</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Paid</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Owed</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Next due</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => {
                    const due = v.nextDue ? dueBadge(v.nextDue, t) : null;
                    return (
                      <tr key={v.id} className="border-b border-divider last:border-b-0">
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-3">
                            <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-going-tint text-xs font-bold">
                              {initials(v.name)}
                            </span>
                            <span className="flex min-w-0 flex-col">
                              <span className="font-semibold">{v.name}</span>
                              {v.email && <span className="text-xs text-muted">{v.email}</span>}
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-3 text-ink2 tabular">{v.billCount}</td>
                        <td className="px-3 py-3 text-right font-semibold tabular">{formatMoney(v.paidCents)}</td>
                        <td className="px-3 py-3 text-right font-semibold tabular">{v.owedCents > 0 ? formatMoney(v.owedCents) : <span className="text-muted">$0</span>}</td>
                        <td className="px-5 py-3">{due ? <Badge tone={due.tone}>{due.label}</Badge> : <span className="text-[13px] text-muted">Nothing due</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card id="new" className="flex min-w-0 flex-[1_1_300px] scroll-mt-24 flex-col gap-4 rounded-[20px] p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">Add a vendor</h2>
            <p className="text-sm text-ink2">Or just type a new name when you add a bill.</p>
          </div>
          <VendorForm />
        </Card>
      </div>

      <nav aria-label="More detail" className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-2 text-sm text-ink2">
        <span>See also</span>
        <Link href="/app/bills" className="font-semibold text-ink underline underline-offset-4">
          Bills
        </Link>
        <Link href="/app/transactions" className="font-semibold text-ink underline underline-offset-4">
          All transactions
        </Link>
      </nav>
    </>
  );
}
