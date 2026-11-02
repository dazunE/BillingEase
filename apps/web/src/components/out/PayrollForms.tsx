"use client";

import type { Employee } from "@billingease/contracts";
import { formatMoney, lkPay, minorToDecimal, parseMoney, ukCheck, ukLine } from "@billingease/core";
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

/** A pay run line from the payroll software to hold the check against. */
export type CheckAgainst = { key: string; label: string; gross: number; paye: number; eeNi: number; erNi: number; pensionEe: number; pensionEr: number; net: number; taxCode: string | null; pension: boolean };

const CHECK_ROWS = [
  ["paye", "PAYE"], ["eeNi", "Employee NI"], ["pensionEe", "Employee pension"], ["net", "Net pay"], ["erNi", "Employer NI"], ["pensionEr", "Employer pension"], ["hmrc", "To HMRC"],
] as const;
const CHECK_STRONG = new Set(["net", "hmrc"]);
const CHECK_DIFF = ["paye", "eeNi", "erNi", "pensionEe"] as const;
const CHECK_NAMES: Record<string, string> = { paye: "PAYE", eeNi: "employee NI", erNi: "employer NI", pensionEe: "employee pension" };

/**
 * UK: a rough monthly PAYE, NI and pension for a gross amount (core `ukCheck`), held against a
 * line from the payroll software when there is one. A check, not payroll.
 */
export function UkCheck({ against, contact }: { against: CheckAgainst[]; contact: string }) {
  const first = against[0];
  const [pick, setPick] = useState(first?.key ?? "");
  const [gross, setGross] = useState(first ? minorToDecimal(first.gross) : "");
  const [code, setCode] = useState(first?.taxCode ?? "1257L");
  const [pension, setPension] = useState(first?.pension ?? true);
  const g = money(gross);
  const ck = ukCheck(g, code.trim() || "1257L", pension);
  const line = against.find((a) => a.key === pick);
  const cmp = line && line.gross === g ? { ...line, hmrc: line.paye + line.eeNi + line.erNi } : null;
  const diffs = cmp ? CHECK_DIFF.filter((k) => Math.abs(cmp[k] - ck[k]) > 100) : [];
  const choose = (key: string) => {
    setPick(key);
    const a = against.find((x) => x.key === key);
    if (a) { setGross(minorToDecimal(a.gross)); setCode(a.taxCode ?? "1257L"); setPension(a.pension); }
  };
  const segBtn = (on: boolean) => cx("min-h-[38px] rounded-full px-3.5 text-sm font-semibold", on ? "bg-ink text-white" : "text-ink hover:bg-white/60");
  return (
    <section aria-labelledby="chk-h" className="flex min-w-0 flex-col gap-3.5 rounded-3xl border border-line bg-white p-5">
      <div className="flex flex-col gap-1.5">
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h2 id="chk-h" className="font-display text-[19px] font-bold tracking-[-0.02em]">Check the figures</h2>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#FFF0B8] px-2.5 py-0.5 text-xs font-semibold text-[#6B5000]"><i aria-hidden className="size-1.5 rounded-full bg-current" />A check, not payroll</span>
        </span>
        <span className="text-[13px] text-muted">A rough monthly sense check of a payroll summary. Your payroll software&apos;s figures are the record; use this to spot a typo.</span>
      </div>
      {against.length > 0 && (
        <Field label="Compare with"><select value={pick} onChange={(e) => choose(e.target.value)} className="min-h-11 w-full rounded-[10px] border border-input bg-white px-3 text-[15px]">
          {against.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
          <option value="">Nothing, just work it out</option>
        </select></Field>
      )}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,120px),1fr))] gap-3">
        <Field label="Gross pay for the month"><Input inputMode="decimal" value={gross} onChange={(e) => setGross(e.target.value)} placeholder="1,120" /></Field>
        <Field label="Tax code"><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="1257L" /></Field>
      </div>
      <div role="group" aria-label="Workplace pension" className="inline-flex max-w-full flex-wrap gap-1 self-start rounded-[22px] bg-surface p-1">
        <button type="button" aria-pressed={pension} onClick={() => setPension(true)} className={segBtn(pension)}>Enrolled in a pension</button>
        <button type="button" aria-pressed={!pension} onClick={() => setPension(false)} className={segBtn(!pension)}>Not enrolled</button>
      </div>
      {g > 0 ? (
        <table className="w-full border-collapse text-sm tabular-nums" aria-label="Expected figures">
          {cmp && <thead><tr className="text-xs text-muted"><th scope="col" className="py-1.5 text-left font-semibold"><span className="sr-only">Figure</span></th><th scope="col" className="py-1.5 text-right font-semibold">About</th><th scope="col" className="py-1.5 pl-3 text-right font-semibold">You entered</th></tr></thead>}
          <tbody>
            {CHECK_ROWS.map(([k, l]) => {
              const off = cmp && (CHECK_DIFF as readonly string[]).includes(k) && Math.abs(cmp[k] - ck[k]) > 100;
              return (
                <tr key={k} className={cx("border-t border-surface first:border-0", CHECK_STRONG.has(k) && "font-bold")}>
                  <th scope="row" className="py-2 text-left font-[inherit]">{l}{cmp ? "" : ", about"}</th>
                  <td className="py-2 text-right">{formatMoney(ck[k], "GBP", { decimals: "always" })}</td>
                  {cmp && <td className={cx("py-2 pl-3 text-right", off && "text-late")}>{formatMoney(cmp[k], "GBP", { decimals: "always" })}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : <p className="text-sm text-muted">Type a gross amount to see rough figures.</p>}
      {cmp && g > 0 && (
        <span role="status" className={cx("rounded-xl px-3 py-2.5 text-[13.5px] leading-snug", diffs.length ? "bg-[#FFF0B8] text-[#6B5000]" : "bg-pos-bg text-pos")}>
          {diffs.length ? `Your ${cmp.label} figures differ by more than £1 on ${diffs.map((k) => CHECK_NAMES[k]).join(", ")}. Worth a look, or ask ${contact}.` : `Close to your ${cmp.label} figures for ${formatMoney(g, "GBP", { decimals: "always" })} gross. Nothing stands out.`}
        </span>
      )}
      {line && !cmp && g > 0 && <span className="text-[13px] text-muted">Set gross pay back to {formatMoney(line.gross, "GBP", { decimals: "always" })} to compare with {line.label}.</span>}
      <span className="text-xs text-muted">Monthly, non-cumulative, no Employment Allowance, student loan or salary sacrifice. Rates are 2026/27 estimates.</span>
    </section>
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
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[13px] font-semibold">Where their pay goes <span className="font-normal text-muted">· optional{lk ? ", for the bank transfer list" : ""}</span></legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bank"><Input name="bankName" defaultValue={v("bankName", employee?.bankName)} placeholder={lk ? "e.g. Commercial Bank" : "e.g. Barclays"} /></Field>
          <Field label={lk ? "Branch" : "Sort code"}><Input name="bankBranch" defaultValue={v("bankBranch", employee?.bankBranch)} placeholder={lk ? "e.g. Kollupitiya" : "20-00-00"} /></Field>
          <Field label="Account number"><Input name="bankAccount" defaultValue={v("bankAccount", employee?.bankAccount)} inputMode="numeric" /></Field>
        </div>
        {employee?.bankDetails && <Field label="Bank details noted earlier" hint="Shown on the transfer list until the fields above are filled in"><Input name="bankDetails" defaultValue={v("bankDetails", employee.bankDetails)} /></Field>}
      </fieldset>
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
