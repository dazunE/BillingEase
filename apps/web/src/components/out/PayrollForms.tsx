"use client";

import type { Employee } from "@billingease/contracts";
import { formatMoney, lkPay, minorToDecimal, parseMoney, ukLine } from "@billingease/core";
import { useActionState, useState } from "react";
import { deleteRun, payDue, saveEmployee, saveRun } from "@/app/app/out/payroll/actions";
import { Button, Field, Input, cx } from "@/components/ui";

type Cur = "GBP" | "LKR" | "USD";
const money = (v: string) => parseMoney(v.replace(/[^\d.-]/g, "") || "0") ?? 0;
const show = (minor: number, cur: Cur) => formatMoney(minor, cur, { decimals: "never" });
const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

export type RunPerson = {
  employee: Employee;
  on: boolean;
  /** Sri Lanka: overtime. UK: the figures from the payroll software. */
  values: { overtime?: number; gross?: number; paye?: number; eeNi?: number; erNi?: number; pensionEe?: number; pensionEr?: number };
};

const UK_FIELDS = [["gross", "Gross pay"], ["paye", "PAYE"], ["eeNi", "Employee NI"], ["pensionEe", "Employee pension"], ["erNi", "Employer NI"], ["pensionEr", "Employer pension"]] as const;

/**
 * The run being prepared. Sri Lanka: each person's month is worked out as you type overtime.
 * UK: type the figures from your payroll software's summary.
 */
export function RunForm({ mode, currency, id, month, label, payDate, people, canApprove }: {
  mode: "full" | "records"; currency: Cur; id?: string; month: string; label: string; payDate: string; people: RunPerson[]; canApprove: boolean;
}) {
  const [state, action, pending] = useActionState(saveRun, undefined);
  const [rows, setRows] = useState(() => people.map((p) => ({ ...p, text: Object.fromEntries(Object.entries(p.values).map(([k, v]) => [k, v ? minorToDecimal(v) : ""])) as Record<string, string> })));
  const lk = mode === "full";
  const set = (i: number, k: string, v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, text: { ...x.text, [k]: v } } : x)));
  const toggle = (i: number) => setRows((r) => r.map((x, j) => (j === i ? { ...x, on: !x.on } : x)));

  const calc = rows.map((r) => {
    if (lk) return lkPay({ basic: r.employee.basic, allowances: r.employee.allowances }, money(r.text.overtime ?? ""));
    const u = ukLine({ gross: money(r.text.gross ?? ""), paye: money(r.text.paye ?? ""), eeNi: money(r.text.eeNi ?? ""), erNi: money(r.text.erNi ?? ""), pensionEe: money(r.text.pensionEe ?? ""), pensionEr: money(r.text.pensionEr ?? "") });
    return { ...u, epfEe: 0, apit: 0 };
  });
  const sum = (k: "gross" | "net" | "epfEe" | "apit" | "paye" | "eeNi") => rows.reduce((a, r, i) => a + (r.on ? (calc[i] as Record<string, number>)[k] ?? 0 : 0), 0);

  return (
    <form action={action} className="flex flex-col gap-4">
      {id && <input type="hidden" name="id" value={id} />}
      <input type="hidden" name="month" value={month} />
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Pay day" className="w-[200px]"><Input type="date" name="payDate" defaultValue={payDate} required /></Field>
        <span className="pb-3 text-[13px] text-muted">{label}</span>
      </div>
      <ul className="flex flex-col">
        {rows.map((r, i) => {
          const c = calc[i];
          return (
            <li key={r.employee.id} className={cx("grid gap-3 border-t border-divider py-4 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]", !r.on && "opacity-60")}>
              <label className="flex items-start gap-3">
                <input type="checkbox" name="people" value={r.employee.id} checked={r.on} onChange={() => toggle(i)} className="mt-2 size-5 shrink-0 accent-[#18161F]" aria-label={`Pay ${r.employee.name} this month`} />
                <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-going-tint text-xs font-bold">{initials(r.employee.name)}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold">{r.employee.name}</span>
                  <span className="text-xs text-muted">{lk ? `Basic ${show(r.employee.basic, currency)}${r.employee.allowances.length ? ` · allowances ${show(r.employee.allowances.reduce((a, x) => a + x.amount, 0), currency)}` : ""}` : r.employee.taxCode ? `Tax code ${r.employee.taxCode}` : r.employee.job ?? ""}</span>
                  {lk && r.on && <span className="text-xs text-muted">Employer adds EPF 12% {show((c as ReturnType<typeof lkPay>).epfEr, currency)} · ETF 3% {show((c as ReturnType<typeof lkPay>).etf, currency)}</span>}
                </span>
              </label>
              {lk ? (
                <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-5">
                  <Stat label="Earnings" value={show(c.gross, currency)} />
                  <Stat label="EPF 8%" value={`−${show(c.epfEe, currency)}`} />
                  <Stat label="APIT" value={`−${show(c.apit, currency)}`} />
                  <Stat label="Net pay" value={show(c.net, currency)} strong />
                  <Field label="Overtime this month"><Input name={`l.${r.employee.id}.overtime`} inputMode="decimal" value={r.text.overtime ?? ""} onChange={(e) => set(i, "overtime", e.target.value)} placeholder="0" /></Field>
                </div>
              ) : (
                <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-4">
                  {UK_FIELDS.map(([k, l]) => (
                    <Field key={k} label={l}><Input name={`l.${r.employee.id}.${k}`} inputMode="decimal" value={r.text[k] ?? ""} onChange={(e) => set(i, k, e.target.value)} placeholder="0.00" /></Field>
                  ))}
                  <Stat label="Net pay" value={formatMoney(c.net, currency)} strong />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink pt-3">
        <span className="font-bold">Total · {rows.filter((r) => r.on).length} {rows.filter((r) => r.on).length === 1 ? "person" : "people"}</span>
        <span className="flex flex-wrap gap-5 text-sm">
          <span>Earnings <strong className="tabular-nums">{show(sum("gross"), currency)}</strong></span>
          {lk ? <><span>EPF 8% <strong className="tabular-nums">−{show(sum("epfEe"), currency)}</strong></span><span>APIT <strong className="tabular-nums">−{show(sum("apit"), currency)}</strong></span></> : null}
          <span>Net pay <strong className="tabular-nums">{show(sum("net"), currency)}</strong></span>
        </span>
      </div>
      <p className="text-xs text-muted">{lk ? "EPF and ETF are worked out on basic pay and fixed allowances marked for EPF; overtime is left out. APIT uses the monthly tables with Rs 150,000 a month tax-free. Rates are illustrative: check them against IRD and EPF guidance." : "Copy each figure from your payroll software's pay run summary. Approving posts the staff costs and what you owe HMRC and the pension provider to your books."}</p>
      <div className="flex flex-wrap items-center gap-3">
        {canApprove && <Button name="intent" value="approve" disabled={pending}>{pending ? "Saving…" : lk ? "Review and approve" : "Approve the pay run"}</Button>}
        <Button name="intent" value="save" variant="secondary" disabled={pending}>Save draft</Button>
        {id && <button formAction={deleteRun} formNoValidate className="text-sm font-semibold underline underline-offset-4">Delete draft</button>}
        {state?.message && <span role="status" className={cx("text-sm font-semibold", state.ok ? "text-pos" : "text-late")}>{state.message}</span>}
      </div>
      {!canApprove && <p className="text-[13px] text-muted">The owner or your accountant approves the run.</p>}
    </form>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <span className="flex flex-col pb-2">
      <span className="text-xs text-muted">{label}</span>
      <span className={cx("tabular-nums", strong ? "font-display text-[17px] font-bold" : "font-semibold")}>{value}</span>
    </span>
  );
}

/** Mark something a run owes as paid. */
export function PayDue({ id, today }: { id: string; today: string }) {
  const [state, action, pending] = useActionState(payDue, undefined);
  const [open, setOpen] = useState(false);
  if (state?.ok) return <span className="text-xs font-semibold text-pos">Marked paid</span>;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-9 items-center self-start rounded-full bg-ink px-3.5 text-[13px] font-semibold text-white">Mark paid</button>;
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs font-semibold">Paid on<input type="date" name="paidOn" defaultValue={today} max={today} className="min-h-9 rounded-[10px] border border-input px-2.5 text-sm" /></label>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold">Reference<input name="reference" placeholder="Optional" className="min-h-9 w-full rounded-[10px] border border-input px-2.5 text-sm" /></label>
      </div>
      <div className="flex items-center gap-2">
        <button disabled={pending} className="inline-flex min-h-9 items-center rounded-full bg-ink px-3.5 text-[13px] font-semibold text-white">{pending ? "Saving…" : "Save"}</button>
        <button type="button" onClick={() => setOpen(false)} className="text-[13px] font-semibold underline underline-offset-4">Cancel</button>
        {state?.message && <span role="alert" className="text-xs font-semibold text-late">{state.message}</span>}
      </div>
    </form>
  );
}

/** Add or edit someone on payroll. */
export function EmployeeForm({ mode, employee, currency }: { mode: "full" | "records"; employee?: Employee; currency: Cur }) {
  const [state, action, pending] = useActionState(saveEmployee, undefined);
  const e = state?.errors ?? {};
  const v = (k: string, d: string | null | undefined) => state?.values?.[k] ?? d ?? "";
  const lk = mode === "full";
  const allow = employee?.allowances ?? [];
  return (
    <form action={action} className="flex flex-col gap-4">
      {employee && <input type="hidden" name="id" value={employee.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={e.name}><Input name="name" defaultValue={v("name", employee?.name)} required /></Field>
        <Field label="Job"><Input name="job" defaultValue={v("job", employee?.job)} /></Field>
        <Field label="Started on"><Input type="date" name="startedOn" defaultValue={v("startedOn", employee?.startedOn)} /></Field>
        <Field label="Left on" hint="Leave empty while they work for you"><Input type="date" name="endedOn" defaultValue={v("endedOn", employee?.endedOn)} /></Field>
        <Field label={lk ? "NIC number" : "National Insurance number"}><Input name="idNumber" defaultValue={v("idNumber", employee?.idNumber)} /></Field>
        {lk ? <Field label="EPF member number"><Input name="epfNumber" defaultValue={v("epfNumber", employee?.epfNumber)} /></Field>
          : <Field label="Tax code" hint="From your payroll software, like 1257L"><Input name="taxCode" defaultValue={v("taxCode", employee?.taxCode)} /></Field>}
        {lk && <Field label={`Basic pay a month (${currency})`} error={e.basic}><Input name="basic" inputMode="decimal" defaultValue={v("basic", employee ? minorToDecimal(employee.basic) : "")} /></Field>}
        <Field label="Bank details" hint="For the bank transfer list"><Input name="bankDetails" defaultValue={v("bankDetails", employee?.bankDetails)} /></Field>
      </div>
      {lk ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[13px] font-semibold">Fixed allowances a month</legend>
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_140px_auto] items-center gap-2">
              <Input name={`a${i}name`} placeholder="Like transport" defaultValue={allow[i]?.name ?? ""} aria-label={`Allowance ${i + 1} name`} />
              <Input name={`a${i}amount`} inputMode="decimal" placeholder="0" defaultValue={allow[i] ? minorToDecimal(allow[i].amount) : ""} aria-label={`Allowance ${i + 1} amount`} />
              <label className="flex items-center gap-1.5 text-xs font-semibold"><input type="checkbox" name={`a${i}epf`} defaultChecked={allow[i]?.epf ?? true} className="size-4 accent-[#18161F]" />For EPF</label>
            </div>
          ))}
        </fieldset>
      ) : (
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="pension" defaultChecked={employee?.pension ?? false} className="size-5 accent-[#18161F]" />In the workplace pension</label>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={pending}>{pending ? "Saving…" : employee ? "Save" : "Add to payroll"}</Button>
        {state?.message && <span role="alert" className="text-sm font-semibold text-late">{state.message}</span>}
      </div>
    </form>
  );
}
