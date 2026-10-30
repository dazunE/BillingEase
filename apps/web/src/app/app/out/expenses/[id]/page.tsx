import { goingOut } from "@billingease/contracts";
import { formatDate, formatMoney } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteExpense } from "@/app/app/out/actions";
import { Avatar } from "@/components/out/bits";
import { ExpenseForm } from "@/components/out/ExpenseForm";
import { ActionButton, AttachmentList } from "@/components/out/quick";
import { Badge, Card } from "@/components/ui";
import { ApiFailure, load } from "@/lib/api";
import { AppCrumbs } from "@/components/app/AppCrumbs";

export const metadata: Metadata = { title: "Expense" };

export default async function ExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await load(goingOut.expense, { params: { id } }).catch((err) => {
    if (err instanceof ApiFailure && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  });
  const [setup, suppliers] = await Promise.all([load(goingOut.setup), load(goingOut.suppliers)]);
  const e = data.expense;
  const fmt = (m: number) => formatMoney(m, setup.currency, { decimals: "always" });
  const uk = setup.country === "uk";

  return (
    <>
      <AppCrumbs area="out" trail={[{ label: "Going out", href: "/app/out" }, { label: e.payee }]} />

      <Card className="flex flex-wrap items-center gap-x-6 gap-y-4 p-[clamp(20px,3vw,32px)]">
        <Avatar name={e.payee} className="size-16 rounded-2xl text-xl" />
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5">
          <h1 className="font-display text-[clamp(26px,3.5vw,36px)] font-bold leading-tight tracking-[-0.03em]">{e.payee}</h1>
          <span className="text-[15px] text-ink2">
            {formatDate(e.spentOn, { year: true })} · {e.chequeNumber ? `Cheque ${e.chequeNumber}${e.chequeBank ? `, ${e.chequeBank}` : ""}` : e.method}{e.note ? ` · ${e.note}` : ""}
          </span>
          <span className="flex flex-wrap gap-2">
            {e.categoryName ? <Badge tone="violet">{e.categoryName}</Badge> : <Badge tone="due">Needs a category</Badge>}
            {data.attachments.length > 0 ? <Badge tone="pos">Attached</Badge> : <Badge>No attachment</Badge>}
            {e.monthlyCostId && <Badge tone="info">Every month</Badge>}
          </span>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span className="font-display text-[clamp(32px,4vw,48px)] font-bold leading-none tracking-[-0.03em] tabular">{fmt(e.gross)}</span>
          <span className="text-[13px] text-ink2">
            {e.bizPct < 100 ? `${fmt(e.businessShare)} counts in Going out (${e.bizPct}% business)` : "Counts in Going out · paid"}
            {e.vat > 0 ? ` · ${fmt(e.vat)} ${uk ? "VAT" : "input VAT"}` : ""}
          </span>
        </div>
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <Card className="p-[clamp(18px,3vw,28px)]">
            <h2 className="mb-1 font-display text-[22px] font-bold tracking-[-0.02em]">{e.categoryId ? "What was it for?" : "Pick a category"}</h2>
            <p className="mb-5 text-sm text-ink2">Change anything here. Your books keep a record: the old entry is reversed and the new one posted.</p>
            <ExpenseForm setup={setup} suppliers={suppliers.suppliers.map((s) => s.name)} expense={e} />
          </Card>
          <Card className="p-[clamp(18px,3vw,28px)]">
            <h2 className="mb-4 font-display text-[22px] font-bold tracking-[-0.02em]">Receipt or invoice</h2>
            <AttachmentList ownerType="expense" ownerId={e.id} files={data.attachments} hint={{ uk: "Kept with your books. HMRC can ask to see it.", lk: "Kept with your books for your tax practitioner.", us: "Kept with your books. The IRS can ask to see it." }[setup.country]} />
          </Card>
        </div>
        <aside className="flex flex-col gap-5">
          <Card className="flex flex-col gap-3 p-6">
            <h2 className="font-display text-xl font-bold">History</h2>
            <p className="text-sm text-ink2">
              {e.createdVia === "agent" ? "Read by Capture, approved" : "Recorded by hand"}{e.createdByName ? ` by ${e.createdByName}` : ""} · {formatDate(e.createdAt.slice(0, 10))}
            </p>
            {e.supplierId && <Link href={`/app/out/suppliers/${e.supplierId}`} className="text-sm font-semibold underline underline-offset-4">See {e.payee}&apos;s page</Link>}
            {e.monthlyCostId && <Link href="/app/out/monthly" className="text-sm font-semibold underline underline-offset-4">Recorded from an every-month cost</Link>}
          </Card>
          <Card className="flex flex-col gap-3 p-6">
            <h2 className="font-display text-xl font-bold">Entered by mistake?</h2>
            <p className="text-sm text-ink2">Delete a duplicate or a mistake. It comes off Going out and your reports.</p>
            <ActionButton action={deleteExpense} fields={{ id: e.id }} variant="danger" confirm={`Delete this ${fmt(e.gross)} expense to ${e.payee}?`} className="self-start">Delete this expense</ActionButton>
          </Card>
        </aside>
      </div>
    </>
  );
}
