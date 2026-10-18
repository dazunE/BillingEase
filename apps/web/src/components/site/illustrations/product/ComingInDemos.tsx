"use client";

import { useState } from "react";
import { BrandMark, cx } from "@/components/ui";
import type { Customer } from "@/content/site/coming-in";
import { money, type SiteCountry } from "@/content/site/country";
import { BTN_DARK, CHIP, INPUT, RANGE, SEG, SEG_BTN, SOFT } from "./cls";
import { SwitchTrack } from "./kit-client";
import s from "./product.module.css";
import { Toast, useToast } from "./Toast";

const m2 = (v: number, c: SiteCountry) => (c === "lk" ? "Rs " : "£") + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateIn = (days: number) => {
  const d = new Date(2026, 9, 4);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/** Tax lines for an invoice: SSCL 2.5% then VAT 18% on the total with SSCL (Sri Lanka, illustrative); optional VAT 20% (UK). */
function taxLines(amt: number, c: SiteCountry, ukVat: boolean) {
  if (c === "lk") {
    const sscl = Math.round(amt * 0.025 * 100) / 100;
    const vat = Math.round((amt + sscl) * 0.18 * 100) / 100;
    return { lines: [["SSCL 2.5%", sscl], ["VAT 18%", vat]] as [string, number][], total: amt + sscl + vat };
  }
  if (ukVat) {
    const vat = Math.round(amt * 0.2 * 100) / 100;
    return { lines: [["VAT 20%", vat]] as [string, number][], total: amt + vat };
  }
  return { lines: [] as [string, number][], total: amt };
}

/** Hero: write an invoice in one sentence (prototype SiteComingIn composer). Nothing is sent. */
export function Composer({ country, biz, place, inv, start, customers }: { country: SiteCountry; biz: string; place: string; inv: string; start: number; customers: Customer[] }) {
  const lk = country === "lk";
  const [cust, setCust] = useState(customers[0].id);
  const [amtStr, setAmtStr] = useState(customers[0].amt.toLocaleString("en-GB"));
  const [what, setWhat] = useState(customers[0].what);
  const [due, setDue] = useState("14");
  const [vat, setVat] = useState(false);
  const [sent, setSent] = useState(false);
  const [tried, setTried] = useState(false);
  const [toast, notify] = useToast();
  const cu = customers.find((x) => x.id === cust) ?? customers[0];
  const amt = parseFloat(amtStr.replace(/[^0-9.]/g, "")) || 0;
  const amtOk = amt > 0 && amt <= (lk ? 100000000 : 1000000);
  const whatOk = what.trim().length > 0;
  const t = taxLines(amt, country, vat);
  const err = tried && !amtOk ? `Add an amount above ${lk ? "Rs 0" : "£0"} so we know what to bill.` : tried && !whatOk ? `Say what the invoice is for, like “${customers[0].what}”.` : null;
  const sym = lk ? "Rs" : "£";
  const send = () => {
    if (!amtOk || !whatOk) return setTried(true);
    setSent(true);
    setTried(false);
    notify(`${inv} ready for ${cu.name} · ${money(t.total, country)} added to Coming in`);
  };

  return (
    <div className="box-border flex min-w-0 max-w-[580px] flex-[1_1_440px] flex-col gap-[18px] rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)] shadow-[0_30px_60px_-30px_rgba(24,22,31,0.25)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[15px] font-bold">Try it: write {lk ? "a Tax Invoice" : "an invoice"}</span>
        <span className="rounded-full bg-tint px-2.5 py-1 text-xs font-semibold">Sample · nothing is sent</span>
      </div>
      <div role="group" aria-label="Invoice in one sentence" className="flex flex-wrap items-center gap-2 rounded-[18px] bg-bg p-3.5 text-base font-semibold">
        <span>Invoice</span>
        <select
          aria-label="Customer"
          value={cust}
          onChange={(e) => {
            const n = customers.find((x) => x.id === e.target.value) ?? customers[0];
            setCust(n.id);
            setWhat(n.what);
            setAmtStr(n.amt.toLocaleString("en-GB"));
            setSent(false);
            setTried(false);
          }}
          className={cx(INPUT, "min-h-11 w-auto flex-[1_1_170px] font-semibold")}
        >
          {customers.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <span className="relative min-w-[110px] flex-[0_1_140px]">
          <span aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {sym}
          </span>
          <input
            aria-label={lk ? "Amount in rupees" : "Amount in pounds"}
            inputMode="decimal"
            value={amtStr}
            onChange={(e) => {
              setAmtStr(e.target.value);
              setSent(false);
            }}
            className={cx(INPUT, "min-h-11 font-bold tabular-nums", lk ? "pl-9" : "pl-7", tried && !amtOk && "border-late")}
          />
        </span>
        <span>for</span>
        <input
          aria-label="What it’s for"
          value={what}
          onChange={(e) => {
            setWhat(e.target.value);
            setSent(false);
          }}
          className={cx(INPUT, "min-h-11 w-auto flex-[1_1_200px]", tried && !whatOk && "border-late")}
        />
        <span>due in</span>
        <select aria-label="Due in" value={due} onChange={(e) => (setDue(e.target.value), setSent(false))} className={cx(INPUT, "min-h-11 w-auto flex-none font-semibold")}>
          <option value="7">7 days</option>
          <option value="14">14 days</option>
          <option value="30">30 days</option>
        </select>
        {!lk && (
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={vat} onChange={(e) => (setVat(e.target.checked), setSent(false))} className="size-5 accent-coming" />
            plus VAT
          </label>
        )}
      </div>
      {err && (
        <span role="alert" className="text-sm font-semibold text-late">
          {err}
        </span>
      )}

      <div className="relative flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex items-center gap-2.5">
            <BrandMark size={32} />
            <span className="flex flex-col">
              <span className="text-sm font-bold">{biz}</span>
              <span className="text-xs text-muted">{place}</span>
            </span>
          </span>
          <span className="flex flex-col items-end">
            <span className="text-[11px] font-bold tracking-[0.06em]">{lk ? "TAX INVOICE" : vat ? "VAT INVOICE" : "INVOICE"}</span>
            <span className="text-xs text-muted">{inv}</span>
          </span>
        </div>
        <div className="flex flex-wrap justify-between gap-3 text-[13px]">
          <span className="flex min-w-0 flex-col">
            <span className="text-muted">Bill to</span>
            <span className="font-bold">{cu.name}</span>
            <span className="break-all text-muted">{cu.email}</span>
          </span>
          <span className="flex flex-col items-end">
            <span className="text-muted">Due</span>
            <span className="font-bold">{dateIn(Number(due))}</span>
          </span>
        </div>
        <div className="flex flex-col gap-1.5 border-y border-divider py-2.5 text-sm">
          <span className="flex justify-between gap-3">
            <span className="min-w-0 [overflow-wrap:anywhere]">{whatOk ? what.trim() : "What the invoice is for"}</span>
            <span className="font-semibold tabular-nums">{m2(amt, country)}</span>
          </span>
          {t.lines.map(([k, v]) => (
            <span key={k} className="flex justify-between gap-3 text-ink2">
              <span>{k}</span>
              <span className="tabular-nums">{m2(v, country)}</span>
            </span>
          ))}
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold">Total</span>
          <span className="font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em] tabular-nums">{m2(t.total, country)}</span>
        </div>
        <span className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-surface px-3 text-center text-[13px] font-semibold text-ink2">
          {lk ? "Pay by bank transfer, cheque or LankaQR · details on the PDF" : "Pay by bank transfer · bank details on the PDF"}
        </span>
        {sent && (
          <span aria-hidden className={cx("absolute right-[18px] top-[74px] rotate-[-12deg] rounded-lg border-[3px] border-pos bg-pos-bg/90 px-3 py-1 font-display text-xl font-extrabold tracking-[0.06em] text-pos", s.pop)}>
            SENT
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm tabular-nums text-ink2">
          <span aria-hidden className="size-2.5 rounded-full bg-coming" />
          Coming in <strong className="text-ink">{money(start + (sent ? t.total : 0), country)}</strong>
          {sent && <span className="font-bold text-pos">+{money(t.total, country)}</span>}
        </span>
        {sent ? (
          <button type="button" className={CHIP} onClick={() => (setSent(false), setAmtStr(""), setWhat(""))}>
            Write another
          </button>
        ) : (
          <button type="button" className={BTN_DARK} onClick={send}>
            Send invoice
          </button>
        )}
      </div>
      <Toast text={toast} />
    </div>
  );
}

/** Quote → accepted → invoice (prototype quote card, without "viewed" or online accept). */
export function QuoteDemo({ country, q }: { country: SiteCountry; q: { no: string; from: string; title: string; who: string; valid: string; lines: [string, number][]; inv: string } }) {
  const [state, setState] = useState<"sent" | "accepted" | "invoiced">("sent");
  const [toast, notify] = useToast();
  const sub = q.lines.reduce((a, l) => a + l[1], 0);
  const t = taxLines(sub, country, false);
  const pill = { sent: ["Sent 30 Sep", "bg-info-bg text-info"], accepted: ["Accepted", "bg-pos-bg text-pos"], invoiced: ["Invoiced", "bg-pos-bg text-pos"] }[state];
  const steps: [string, boolean][] = [
    ["Sent 30 Sep", true],
    [state === "sent" ? "Waiting for their answer" : "Accepted today", state !== "sent"],
    [state === "invoiced" ? `${q.inv} drafted` : "Turn into an invoice", state === "invoiced"],
  ];
  return (
    <div className="box-border min-w-0 max-w-[560px] flex-[1_1_400px] rounded-[28px] bg-tint p-[clamp(16px,3vw,32px)]">
      <div className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-white p-[clamp(20px,2.4vw,28px)]">
        <div className="flex flex-wrap justify-between gap-3">
          <span className="flex flex-col">
            <span className="text-xs text-muted">
              Quote {q.no} from {q.from}
            </span>
            <span className="text-[17px] font-bold">{q.title}</span>
          </span>
          <span className={cx("inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-semibold", pill[1])}>
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {pill[0]}
          </span>
        </div>
        <span className="text-[13px] text-ink2">
          For {q.who} · {q.valid}
        </span>
        <div className="flex flex-col gap-2 border-t border-divider pt-3 text-sm">
          {q.lines.map(([k, v]) => (
            <span key={k} className="flex justify-between gap-3">
              <span>{k}</span>
              <span className="tabular-nums">{m2(v, country)}</span>
            </span>
          ))}
          {t.lines.map(([k, v]) => (
            <span key={k} className="flex justify-between gap-3 text-ink2">
              <span>{k}</span>
              <span className="tabular-nums">{m2(v, country)}</span>
            </span>
          ))}
        </div>
        <div className="flex items-baseline justify-between border-t border-divider pt-3">
          <span className="font-semibold">Total</span>
          <span className="font-display text-[26px] font-bold tabular-nums">{m2(t.total, country)}</span>
        </div>
        <div aria-live="polite">
          {state === "sent" && (
            <div className="flex flex-wrap gap-2.5">
              <button type="button" className={cx(BTN_DARK, "bg-coming hover:bg-[#6a4ae6]")} onClick={() => (setState("accepted"), notify(`${q.no} marked accepted`))}>
                They said yes: mark accepted
              </button>
            </div>
          )}
          {state === "accepted" && (
            <div className="flex flex-wrap gap-2.5">
              <button type="button" className={BTN_DARK} onClick={() => (setState("invoiced"), notify(`${q.inv} drafted for ${money(t.total, country)}`))}>
                Turn into an invoice
              </button>
              <button type="button" className={CHIP} onClick={() => setState("sent")}>
                Undo
              </button>
            </div>
          )}
          {state === "invoiced" && (
            <div role="status" className="flex flex-col gap-2 rounded-[14px] bg-pos-bg px-4 py-3.5 text-pos">
              <span className="font-bold">Accepted by {q.who}</span>
              <span className="text-sm leading-normal">
                {country === "lk" ? "Tax Invoice" : "Invoice"} {q.inv} for {money(t.total, country)} is drafted with the same lines. It adds to Coming in when you send it.
              </span>
              <button type="button" onClick={() => setState("sent")} className="min-h-9 self-start text-sm font-semibold underline">
                Show the quote again
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {steps.map(([t2, on]) => (
            <span key={t2} className={cx("inline-flex items-center rounded-full px-2.5 py-1 font-semibold", on ? "bg-pos-bg text-pos" : "bg-bg text-muted")}>
              {t2}
            </span>
          ))}
        </div>
      </div>
      <Toast text={toast} />
    </div>
  );
}

/** Getting paid: pick how they paid and how much; see what the invoice and Coming in do. */
export function PayDemo({ country, methods, invoice }: { country: SiteCountry; methods: { id: string; label: string; note: string }[]; invoice: { no: string; who: string; amt: number } }) {
  const lk = country === "lk";
  const [m, setM] = useState(methods[0].id);
  const [paid, setPaid] = useState(invoice.amt);
  const [chq, setChq] = useState("004512");
  const [bank, setBank] = useState("Commercial bank, Kandy branch");
  const step = lk ? 5000 : 50;
  const left = invoice.amt - paid;
  const method = methods.find((x) => x.id === m) ?? methods[0];
  const status = left <= 0 ? "Paid" : paid > 0 ? "Part paid" : "Waiting";
  return (
    <div className="flex flex-wrap items-stretch gap-4">
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5 rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)]">
        <div role="group" aria-label="How your customer paid" className={SEG}>
          {methods.map((x) => (
            <button key={x.id} type="button" aria-pressed={m === x.id} onClick={() => setM(x.id)} className={SEG_BTN}>
              {x.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="pay-amt" className="text-[13px] font-bold">
            Amount received for {invoice.no}
          </label>
          <div className="flex flex-wrap items-center gap-3.5">
            <input id="pay-amt" type="range" min={step} max={invoice.amt} step={step} value={paid} onChange={(e) => setPaid(Number(e.target.value))} className={cx(RANGE, "flex-[1_1_200px]")} />
            <span className="min-w-24 text-right font-display text-2xl font-bold tabular-nums">{money(paid, country)}</span>
          </div>
        </div>
        {m === "cheque" && (
          <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))" }}>
            <label className="flex flex-col gap-1 text-[13px] font-bold">
              Cheque number
              <input value={chq} onChange={(e) => setChq(e.target.value)} className={cx(INPUT, "min-h-11")} />
            </label>
            {lk && (
              <label className="flex flex-col gap-1 text-[13px] font-bold">
                Bank
                <input value={bank} onChange={(e) => setBank(e.target.value)} className={cx(INPUT, "min-h-11")} />
              </label>
            )}
          </div>
        )}
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))" }}>
          <div className={cx(SOFT, "flex flex-col gap-1")}>
            <span className="text-[13px] text-muted">Still to pay</span>
            <span className="font-display text-[22px] font-bold tabular-nums">{money(Math.max(0, left), country)}</span>
            <span className="text-[13px] text-muted">{left > 0 ? "Stays on Home until it’s in" : "Nothing left to chase"}</span>
          </div>
          <div className={cx(SOFT, "flex flex-col gap-1 bg-tint")}>
            <span className="text-[13px] text-ink2">Fee</span>
            <span className="font-display text-[22px] font-bold tabular-nums">{money(0, country)}</span>
            <span className="text-[13px] text-ink2">The money never passes through us</span>
          </div>
        </div>
        <p aria-live="polite" className="text-sm leading-[1.55] text-ink2">
          {method.note}
        </p>
      </div>
      <div aria-hidden className="box-border flex min-h-[340px] min-w-0 flex-[1_1_320px] items-center justify-center rounded-3xl bg-ink p-7">
        <span className={cx("box-border w-[240px] max-w-full rounded-[22px] bg-white p-[18px]", s.float)}>
          <span className="flex flex-col gap-2.5">
            <span className="flex items-center justify-between text-[11px] text-muted">
              <span>
                {invoice.no} · {invoice.who}
              </span>
            </span>
            <span className="font-display text-[26px] font-bold tabular-nums">{money(invoice.amt, country)}</span>
            <span className={cx("self-start rounded-full px-2.5 py-1 text-xs font-bold", status === "Paid" ? "bg-pos-bg text-pos" : status === "Part paid" ? "bg-due-bg text-due" : "bg-surface text-ink2")}>{status}</span>
            <span className="h-px bg-line" />
            <span className="text-[11px] font-bold text-muted">PAYMENTS</span>
            <span key={m + paid} className={cx("flex items-center justify-between gap-2 rounded-xl bg-tint px-3 py-2 text-xs", s.rowin)}>
              <span className="min-w-0 truncate font-semibold">
                {method.label}
                {m === "cheque" ? ` #${chq}` : ""}
              </span>
              <span className="font-bold tabular-nums">{money(paid, country)}</span>
            </span>
            {left > 0 && (
              <span className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-input px-3 py-2 text-xs text-muted">
                <span>Still to come</span>
                <span className="font-bold tabular-nums">{money(left, country)}</span>
              </span>
            )}
          </span>
        </span>
      </div>
    </div>
  );
}

/** Repeating invoices: each one drafts for review or emails itself (the app's two modes). */
export function RepeatList({ country, reps }: { country: SiteCountry; reps: { id: string; who: string; what: string; amt: number; next: string[]; count: string }[] }) {
  const [send, setSend] = useState<Record<string, boolean>>({ [reps[0].id]: true });
  const [toast, notify] = useToast();
  return (
    <>
      {reps.map((r) => {
        const on = !!send[r.id];
        return (
          <div key={r.id} className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="flex min-w-0 flex-col">
                <span className="font-bold">{r.who}</span>
                <span className="text-[13px] text-muted">{r.what}</span>
              </span>
              <span className="whitespace-nowrap font-display text-xl font-bold tabular-nums">{money(r.amt, country)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {r.next.map((d) => (
                <span key={d} className="rounded-full bg-tint px-2.5 py-1 text-xs font-semibold">
                  {d}
                </span>
              ))}
              <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-semibold text-ink2">{r.count}</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              onClick={() => {
                setSend({ ...send, [r.id]: !on });
                notify(`${r.who}: ${on ? "drafted for you to check each month" : "emailed on the day each month"}`);
              }}
              className="flex min-h-10 items-center justify-between gap-3 text-left text-sm font-semibold"
            >
              <span>{on ? "Emails the invoice on the day" : "Drafts it for you to check"}</span>
              <SwitchTrack on={on} />
            </button>
          </div>
        );
      })}
      <Toast text={toast} />
    </>
  );
}

/** Reminder preview: pick when, and (Sri Lanka) the channel. You send it. */
export function RemindDemo({ country, r }: { country: SiteCountry; r: { who: string; contact: string; inv: string; amt: number; what: string; due: string; biz: string; sender: string } }) {
  const lk = country === "lk";
  const [when, setWhen] = useState<"before" | "due" | "late">("late");
  const [ch, setCh] = useState<"email" | "whatsapp">("email");
  const [sent, setSent] = useState(false);
  const a = money(r.amt, country);
  const T = {
    before: [`Coming up: invoice ${r.inv} from ${r.biz}`, `Hi ${r.contact}, a quick note that ${a} for ${r.what} is due on ${r.due}. Bank details are on the invoice. Thank you!`],
    due: [`Due today: invoice ${r.inv}`, `Hi ${r.contact}, just a note that ${a} for ${r.what} is due today. If it’s already on its way, thank you and please ignore this.`],
    late: [`A friendly reminder about ${r.inv}`, `Hi ${r.contact}, ${a} for ${r.what} was due on ${r.due}. If something’s holding it up, just reply and we’ll sort it out. Thanks, ${r.sender}`],
  }[when];
  const opts: [typeof when, string][] = [
    ["before", "3 days before"],
    ["due", "On the due date"],
    ["late", "A week late"],
  ];
  return (
    <>
      <div role="group" aria-label="When to remind" className="flex flex-wrap gap-2">
        {opts.map(([k, l]) => (
          <button key={k} type="button" aria-pressed={when === k} onClick={() => (setWhen(k), setSent(false))} className={CHIP}>
            {l}
          </button>
        ))}
      </div>
      {lk ? (
        <div role="group" aria-label="Send by" className={cx(SEG, "bg-white")}>
          {(["email", "whatsapp"] as const).map((k) => (
            <button key={k} type="button" aria-pressed={ch === k} onClick={() => (setCh(k), setSent(false))} className={SEG_BTN}>
              {k === "email" ? "Email" : "WhatsApp"}
            </button>
          ))}
        </div>
      ) : (
        <span className="self-start rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold">By email</span>
      )}
      <div aria-live="polite" className={cx("flex flex-col gap-2 rounded-[18px] border border-line p-4", ch === "whatsapp" ? "bg-[#E7F7E1]" : "bg-white")}>
        <span className="text-[13px] text-muted">
          To {r.who} · {ch === "whatsapp" ? "opens WhatsApp with this message" : "by email, invoice attached"}
        </span>
        {ch === "email" && <span className="font-bold">{T[0]}</span>}
        <p className="text-sm leading-[1.55] text-ink2">{T[1]}</p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="button" className={cx(BTN_DARK, "min-h-10 px-4 text-[13px]")} onClick={() => setSent(true)} disabled={sent}>
            {sent ? "Sent in the real app" : ch === "whatsapp" ? "Open in WhatsApp" : "Send reminder"}
          </button>
          {sent && <span className="text-[13px] text-muted">Sample only: nothing was sent from this page.</span>}
        </div>
      </div>
    </>
  );
}
