"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { billSomeoneAction, type BillState } from "@/app/app/in/actions";
import { ICONS, Icon, cx, BrandMark } from "@/components/ui";
import { addDays, formatDate } from "@/lib/dates";
import { formatMoney, parseMoney } from "@/lib/money";
import { DUE_DAYS, NEW_CUSTOMER } from "./shared";

type Customer = { id: string; name: string; email: string | null };
type Line = { key: number; desc: string; amt: string };

const blank = "h-12 rounded-t-[10px] rounded-b-[4px] border-0 border-b-2 bg-tint px-3 font-sans text-lg font-semibold text-ink focus:outline-2 focus:outline-offset-1 focus:outline-coming";
const bad = "border-late bg-late-bg";
const small = "min-h-11 rounded-[10px] border border-input bg-white px-3 text-[15px] text-ink placeholder:text-muted/80 focus:border-ink focus:outline-none";

/**
 * "Bill [customer] [$ amount] for [what], due in [N days]." with a live
 * preview of what the customer will see.
 */
export function BillComposer({
  customers,
  initialCustomer,
  businessName,
  nextNumber,
  today,
}: {
  customers: Customer[];
  initialCustomer?: string;
  businessName: string;
  nextNumber: string;
  today: string;
}) {
  const [state, action, pending] = useActionState<BillState, FormData>(billSomeoneAction, undefined);
  const e = state?.errors ?? {};

  const [customer, setCustomer] = useState(initialCustomer && customers.some((c) => c.id === initialCustomer) ? initialCustomer : "");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [what, setWhat] = useState("");
  const [due, setDue] = useState("30");
  const [more, setMore] = useState(false);
  const [card, setCard] = useState(true);
  const [bank, setBank] = useState(true);
  const [repeat, setRepeat] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [seq, setSeq] = useState(1);

  const isNew = customer === NEW_CUSTOMER;
  const chosen = customers.find((c) => c.id === customer);
  const dirty = !!(customer || amount || what || lines.length || repeat || !card || !bank || due !== "30");

  const mainCents = parseMoney(amount) ?? 0;
  const rows = [
    { desc: what || "What it's for", cents: mainCents, placeholder: !what },
    ...lines.filter((l) => l.desc || l.amt).map((l) => ({ desc: l.desc || "Line item", cents: parseMoney(l.amt) ?? 0, placeholder: !l.desc })),
  ];
  const total = rows.reduce((s, r) => s + r.cents, 0);
  const custName = isNew ? newName || "New customer" : chosen?.name ?? "Choose a customer";
  const methods = [card && "card", bank && "bank transfer"].filter(Boolean).join(" or ");

  function clear() {
    setCustomer("");
    setNewName("");
    setNewEmail("");
    setAmount("");
    setWhat("");
    setDue("30");
    setCard(true);
    setBank(true);
    setRepeat(false);
    setLines([]);
  }

  const errorList = Object.entries(e);

  return (
    <section id="bill" aria-labelledby="bill-h" className="flex scroll-mt-4 flex-wrap items-start gap-7 rounded-3xl border border-line bg-white p-[clamp(20px,3vw,32px)]">
      <form action={action} noValidate className="flex min-w-0 flex-[999_1_440px] flex-col gap-4.5">
        <div className="flex flex-col gap-1">
          <h2 id="bill-h" className="font-display text-2xl font-bold tracking-[-0.02em]">
            Bill someone
          </h2>
          <p className="text-sm text-ink2">Fill in the sentence. We take care of the invoice number, the email and the pay link.</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-3 font-display text-[clamp(20px,2.4vw,26px)] font-semibold leading-[1.3] tracking-[-0.02em]">
          <span>Bill</span>
          <select
            name="customer"
            aria-label="Customer"
            value={customer}
            onChange={(ev) => setCustomer(ev.target.value)}
            aria-invalid={!!e.customer}
            className={cx(blank, "max-w-full cursor-pointer border-coming pr-8", e.customer && bad)}
          >
            <option value="">Choose a customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={NEW_CUSTOMER}>+ New customer…</option>
          </select>
          {isNew && (
            <input
              name="newName"
              aria-label="New customer's name"
              placeholder="their name"
              value={newName}
              autoFocus
              onChange={(ev) => setNewName(ev.target.value)}
              aria-invalid={!!e.newName}
              className={cx(blank, "w-[220px] max-w-full border-coming placeholder:text-muted/80", e.newName && bad)}
            />
          )}
          <span className={cx("inline-flex h-12 items-center rounded-t-[10px] rounded-b-[4px] border-b-2 bg-tint pl-3 font-sans text-lg font-semibold", e.amount ? bad : "border-coming")}>
            $
            <input
              name="amount"
              type="text"
              inputMode="decimal"
              aria-label="Amount in dollars"
              placeholder="0.00"
              value={amount}
              onChange={(ev) => setAmount(ev.target.value)}
              aria-invalid={!!e.amount}
              className="h-12 w-[110px] bg-transparent pl-1 pr-3 tabular placeholder:text-muted/80 focus:outline-2 focus:outline-offset-1 focus:outline-coming"
            />
          </span>
          <span>for</span>
          <span className="inline-flex min-w-0 flex-[1_1_220px] items-end gap-0.5">
            <input
              name="what"
              aria-label="What it's for"
              placeholder="what it's for"
              value={what}
              onChange={(ev) => setWhat(ev.target.value)}
              aria-invalid={!!e.what}
              className={cx(blank, "w-[100px] min-w-0 flex-auto border-coming placeholder:text-muted/80", e.what && bad)}
            />
            <span>,</span>
          </span>
          <span>due in</span>
          <span className="inline-flex items-end gap-0.5">
            <select name="due" aria-label="Due in" value={due} onChange={(ev) => setDue(ev.target.value)} className={cx(blank, "cursor-pointer border-coming pr-8")}>
              {DUE_DAYS.map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
            <span>.</span>
          </span>
        </div>

        {isNew && (
          <label className="flex max-w-[460px] flex-col gap-1.5">
            <span className="text-[13px] font-semibold">Their email (optional)</span>
            <input
              name="newEmail"
              type="email"
              autoComplete="off"
              placeholder="name@example.com"
              value={newEmail}
              onChange={(ev) => setNewEmail(ev.target.value)}
              aria-invalid={!!e.newEmail}
              className={cx(small, e.newEmail && "border-late")}
            />
            <span className={cx("text-xs", e.newEmail ? "font-semibold text-late" : "text-muted")}>
              {e.newEmail ?? (newEmail ? "We'll email them the invoice with a pay link." : "Without one, we create the invoice and give you a pay link to share yourself. Nothing is emailed.")}
            </span>
          </label>
        )}
        {chosen && !chosen.email && (
          <p className="flex flex-wrap items-center gap-x-2 rounded-[14px] bg-due-bg px-4 py-3 text-sm text-due">
            <strong>{chosen.name} has no email on file,</strong> so we won&apos;t email this. You&apos;ll get a pay link to share yourself.
            <Link href={`/app/customers/${chosen.id}#edit`} className="font-semibold underline underline-offset-4">
              Add their email
            </Link>
          </p>
        )}

        <div className="flex flex-col gap-3.5 border-t border-divider pt-3">
          <button type="button" aria-expanded={more} aria-controls="bill-more" onClick={() => setMore(!more)} className="inline-flex min-h-9 items-center gap-1.5 self-start text-sm font-semibold">
            <Icon d={ICONS.chevronDown} size={16} className={cx("transition-transform", more && "rotate-180")} />
            More options
          </button>
          <div id="bill-more" hidden={!more} className="flex flex-col gap-4.5">
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold" id="pay-by">
                Let them pay by
              </span>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="pay-by">
                {[
                  { label: "Card", on: card, set: setCard, icon: ICONS.card },
                  { label: "Bank transfer", on: bank, set: setBank, icon: ICONS.bank },
                ].map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    aria-pressed={m.on}
                    onClick={() => m.set(!m.on)}
                    className={cx("inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold", m.on ? "border-ink bg-tint" : "border-input bg-white text-ink2")}
                  >
                    <Icon d={m.on ? ICONS.check : m.icon} size={16} strokeWidth={2.4} />
                    {m.label}
                  </button>
                ))}
              </div>
              {e.pay && <span className="text-xs font-semibold text-late">{e.pay}</span>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold" id="repeat-l">
                  Repeat monthly
                </span>
                <span className="text-[13px] text-muted">Marks it as a monthly invoice so you can send it again each month.</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={repeat}
                aria-labelledby="repeat-l"
                onClick={() => setRepeat(!repeat)}
                className={cx("relative h-[30px] w-[52px] shrink-0 rounded-full", repeat ? "bg-coming" : "bg-input")}
              >
                <span className={cx("absolute top-[3px] size-6 rounded-full bg-white transition-[left]", repeat ? "left-[25px]" : "left-[3px]")} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold">Extra line items</span>
              {lines.map((l, i) => (
                <div key={l.key} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      name="lineDesc"
                      aria-label={`Line item ${i + 2} description`}
                      placeholder="Description"
                      value={l.desc}
                      onChange={(ev) => setLines(lines.map((x) => (x.key === l.key ? { ...x, desc: ev.target.value } : x)))}
                      aria-invalid={!!e[`line${i}`]}
                      className={cx(small, "min-w-0 flex-[1_1_200px]", e[`line${i}`] && "border-late")}
                    />
                    <input
                      name="lineAmount"
                      inputMode="decimal"
                      aria-label={`Line item ${i + 2} amount`}
                      placeholder="$0.00"
                      value={l.amt}
                      onChange={(ev) => setLines(lines.map((x) => (x.key === l.key ? { ...x, amt: ev.target.value } : x)))}
                      aria-invalid={!!e[`line${i}`]}
                      className={cx(small, "w-[120px] tabular", e[`line${i}`] && "border-late")}
                    />
                    <button
                      type="button"
                      aria-label={`Remove line item ${i + 2}`}
                      onClick={() => setLines(lines.filter((x) => x.key !== l.key))}
                      className="flex size-11 items-center justify-center rounded-full bg-ink/[0.07] hover:bg-ink/[0.11]"
                    >
                      <Icon d="M6 6l12 12M18 6 6 18" size={16} strokeWidth={2.2} />
                    </button>
                  </div>
                  {e[`line${i}`] && <span className="text-xs font-semibold text-late">{e[`line${i}`]}</span>}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setLines([...lines, { key: seq, desc: "", amt: "" }]);
                  setSeq(seq + 1);
                }}
                className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-full bg-ink/[0.07] px-4 text-sm font-semibold hover:bg-ink/[0.11]"
              >
                <Icon d={ICONS.plus} size={16} strokeWidth={2.4} />
                Add a line item
              </button>
            </div>
          </div>
        </div>
        <input type="hidden" name="allowCard" value={card ? "on" : ""} />
        <input type="hidden" name="allowBank" value={bank ? "on" : ""} />
        <input type="hidden" name="repeat" value={repeat ? "on" : ""} />

        {errorList.length > 0 && (
          <div role="alert" className="flex flex-col gap-1 rounded-[14px] bg-late-bg px-4 py-3 text-sm font-semibold text-late">
            {errorList.map(([k, msg]) => (
              <span key={k}>{msg}</span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-violet px-6 text-base font-semibold hover:bg-[#a98ffb] disabled:opacity-60">
            <Icon d={ICONS.send} size={18} strokeWidth={2.2} />
            {pending ? "Sending…" : isNew && !newEmail ? "Create invoice" : chosen && !chosen.email ? "Create invoice" : "Send invoice"}
          </button>
          {dirty && (
            <button type="button" onClick={clear} className="inline-flex min-h-12 items-center rounded-full bg-ink/[0.07] px-4.5 text-[15px] font-semibold hover:bg-ink/[0.11]">
              Clear
            </button>
          )}
        </div>
      </form>

      <aside aria-label="Invoice preview" className="min-w-0 flex-[1_1_300px] rounded-[20px] bg-bg p-4">
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(24,22,31,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <BrandMark size={26} />
              <span className="truncate text-sm font-bold">{businessName}</span>
            </span>
            <span className="text-right text-xs text-muted">
              Invoice
              <br />
              <strong className="text-[13px] text-ink">{nextNumber}</strong>
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted">Bill to</span>
            <span className={cx("text-[15px] font-bold", !chosen && !(isNew && newName) && "text-muted")}>{custName}</span>
          </div>
          <div className="flex flex-col border-t border-divider">
            {rows.map((r, i) => (
              <div key={i} className="flex justify-between gap-3 border-b border-divider py-2.5 text-sm">
                <span className={cx("min-w-0 [overflow-wrap:anywhere]", r.placeholder && "text-muted")}>{r.desc}</span>
                <span className="whitespace-nowrap tabular">{formatMoney(r.cents)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] text-ink2">Total due {formatDate(addDays(today, Number(due)))}</span>
            <span className="font-display text-[26px] font-bold tracking-[-0.02em] tabular">{formatMoney(total)}</span>
          </div>
          <span className="flex min-h-10 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">Pay {formatMoney(total)}</span>
          <span className="text-center text-xs text-muted">{methods ? `They can pay by ${methods}` : "No online payment, so they'll pay you directly"}</span>
          {repeat && (
            <span className="self-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-info-bg px-2.5 py-1 text-xs font-bold text-info">
                <span className="size-1.5 rounded-full bg-current" aria-hidden />
                Repeats monthly
              </span>
            </span>
          )}
        </div>
        <span className="mt-2.5 block text-center text-xs text-muted">This is what your customer sees</span>
      </aside>
    </section>
  );
}
