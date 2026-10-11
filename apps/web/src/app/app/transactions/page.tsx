import type { Metadata } from "next";
import Link from "next/link";
import { changeCategoryAction, connectBankOutAction, syncNowAction } from "@/app/app/out/actions";
import { EquationStrip } from "@/components/EquationStrip";
import { niceMerchant } from "@/components/out/format";
import { Badge, Card, ICONS, Icon, cx, inputClass } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { formatDate, today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { threeNumbers } from "@/lib/numbers";
import { categoryChoices, listFeeds, listTransactions, TX_STATUSES, type TxStatus } from "@/lib/ops-out";

export const metadata: Metadata = { title: "Transactions" };

const STATUS_LABEL: Record<TxStatus, string> = { needs_review: "Needs a category", categorized: "Sorted", matched: "Matched to an invoice" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Search = { status?: string; account?: string; q?: string };

function href(base: Search, patch: Search) {
  const next = { ...base, ...patch };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `/app/transactions?${s}` : "/app/transactions";
}

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<Search & { flash?: string }> }) {
  const sp = await searchParams;
  const status = (TX_STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as TxStatus) : undefined;
  const feedId = sp.account && UUID.test(sp.account) ? sp.account : undefined;
  const q = (sp.q ?? "").slice(0, 80);
  const current: Search = { status, account: feedId, q: q || undefined };
  const back = href(current, {});

  const { business, db } = await requireBusiness();
  const t = today();
  const [n, feeds, rows, choices] = await Promise.all([
    threeNumbers(db, business.id, "month", t),
    listFeeds(db, business.id),
    listTransactions(db, business.id, { status, feedId, q }),
    categoryChoices(db, business.id),
  ]);
  const lastSync = feeds.map((f) => f.lastSyncedAt).filter((d): d is Date => !!d).sort((a, b) => b.getTime() - a.getTime())[0];
  const filtered = !!(status || feedId || q);

  return (
    <>
      <EquationStrip n={n} current="out" />

      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Link href="/app/out" className="text-sm font-semibold text-muted hover:text-ink">
            Going out
          </Link>
          <h1 className="font-display text-[clamp(28px,3.5vw,38px)] font-bold tracking-[-0.03em]">All transactions</h1>
          <p className="text-[15px] text-ink2">
            {feeds.length
              ? `Everything from ${feeds.map((f) => `${f.institution} ••${f.mask}`).join(" and ")}. We file most of it on our own.`
              : "Connect your bank and cards, and transactions flow in and mostly sort themselves."}
          </p>
        </div>
        {feeds.length === 0 ? (
          <form action={connectBankOutAction}>
            <input type="hidden" name="back" value={back} />
            <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-violet px-5 text-[15px] font-semibold text-ink hover:bg-[#a98ffb]">
              <Icon d={ICONS.bank} size={18} />
              Connect a bank
            </button>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {lastSync && (
              <span className="text-[13px] text-muted">
                Last synced {lastSync.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </span>
            )}
            <form action={syncNowAction}>
              <input type="hidden" name="back" value={back} />
              <button className="inline-flex min-h-11 items-center rounded-full bg-ink/[0.07] px-5 text-[15px] font-semibold text-ink hover:bg-ink/[0.11]">Sync now</button>
            </form>
          </div>
        )}
      </section>

      {feeds.length === 0 ? (
        <Card className="flex flex-col gap-2 rounded-[20px] p-6">
          <span className="font-display text-lg font-bold">No bank connected yet</span>
          <span className="text-[15px] text-ink2">Runs in sandbox mode until a bank provider is set up, so you can try it with sample transactions.</span>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <nav aria-label="Filter by status" className="flex flex-wrap gap-1 self-start rounded-full bg-surface p-1">
              {[undefined, ...TX_STATUSES].map((s) => (
                <Link
                  key={s ?? "all"}
                  href={href(current, { status: s })}
                  aria-current={status === s ? "page" : undefined}
                  className={cx("inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold", status === s ? "bg-ink text-white" : "text-ink hover:bg-white")}
                >
                  {s ? STATUS_LABEL[s] : "All"}
                </Link>
              ))}
            </nav>
            <form method="get" action="/app/transactions" role="search" className="flex flex-wrap items-end gap-2">
              {status && <input type="hidden" name="status" value={status} />}
              <label className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
                <span className="text-[13px] font-semibold">Search</span>
                <input name="q" defaultValue={q} placeholder="Merchant or description" className={inputClass} />
              </label>
              <label className="flex min-w-0 flex-[1_1_200px] flex-col gap-1">
                <span className="text-[13px] font-semibold">Account</span>
                <select name="account" defaultValue={feedId ?? ""} className={cx(inputClass, "pr-8")}>
                  <option value="">All accounts</option>
                  {feeds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.institution} ••{f.mask}
                    </option>
                  ))}
                </select>
              </label>
              <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-semibold text-white hover:bg-black">
                <Icon d={ICONS.search} size={16} />
                Find
              </button>
              {filtered && (
                <Link href="/app/transactions" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold underline underline-offset-4">
                  Clear
                </Link>
              )}
            </form>
          </div>

          <Card className="overflow-hidden rounded-[20px]">
            {rows.length === 0 ? (
              <p className="p-6 text-[15px] text-ink2">{filtered ? "No transactions match. Try a different search or filter." : "No transactions yet. Tap Sync now to check for new ones."}</p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                  <caption className="sr-only">Bank and card transactions</caption>
                  <thead>
                    <tr className="border-b border-line text-[13px] text-muted">
                      <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Description</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Account</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Category</th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">Amount</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Change category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const moneyIn = r.amountCents > 0;
                      const options = moneyIn ? choices.in : choices.out;
                      const preferred = r.categoryAccountId ?? r.suggestedAccountId;
                      const selected = preferred && options.some((o) => o.id === preferred) ? preferred : "";
                      const formId = `cat-${r.id}`;
                      return (
                        <tr key={r.id} className="border-b border-divider align-middle last:border-b-0">
                          <td className="whitespace-nowrap px-5 py-3 text-ink2">{formatDate(r.postedOn)}</td>
                          <td className="px-3 py-3">
                            <span className="flex flex-col">
                              <span className="font-semibold">{niceMerchant(r.description)}</span>
                              <span className="font-mono text-xs text-muted">{r.description}</span>
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-ink2">{r.account}</td>
                          <td className="px-3 py-3">
                            {r.status === "matched" ? (
                              r.invoiceId ? (
                                <Link href={`/app/invoices/${r.invoiceId}`} className="font-semibold underline underline-offset-4">
                                  Matched to {r.invoiceNumber}
                                </Link>
                              ) : (
                                <span>Matched to an invoice</span>
                              )
                            ) : r.status === "needs_review" ? (
                              <Badge tone="due">Needs a category</Badge>
                            ) : (
                              <span>{r.categoryName ?? "Uncategorized"}</span>
                            )}
                          </td>
                          <td className={cx("whitespace-nowrap px-3 py-3 text-right font-display font-bold tabular", moneyIn && "text-pos")}>
                            {moneyIn ? "+" : "−"}
                            {formatMoney(Math.abs(r.amountCents))}
                          </td>
                          <td className="px-5 py-2">
                            {r.status === "matched" ? (
                              <span className="text-[13px] text-muted">Paid an invoice, so it stays as is</span>
                            ) : (
                              <form id={formId} action={changeCategoryAction} className="flex items-center gap-2">
                                <input type="hidden" name="txId" value={r.id} />
                                <input type="hidden" name="back" value={back} />
                                <label htmlFor={`${formId}-sel`} className="sr-only">
                                  Category for {r.description}
                                </label>
                                <select id={`${formId}-sel`} name="categoryAccountId" defaultValue={selected} className={cx(inputClass, "min-h-10 w-[230px] pr-8 text-sm")}>
                                  {!selected && <option value="">Choose…</option>}
                                  {options.map((o) => (
                                    <option key={o.id} value={o.id}>
                                      {o.name}
                                    </option>
                                  ))}
                                </select>
                                <button className="inline-flex min-h-10 items-center rounded-full bg-ink/[0.07] px-4 text-sm font-semibold hover:bg-ink/[0.11]" aria-label={`Save category for ${r.description}`}>
                                  Save
                                </button>
                              </form>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <p className="text-[13px] text-muted">
            {rows.length} transaction{rows.length === 1 ? "" : "s"}
            {filtered ? " match" : ""}. Changing a category moves it in your books straight away.
          </p>
        </>
      )}
    </>
  );
}
