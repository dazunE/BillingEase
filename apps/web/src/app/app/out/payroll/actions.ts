"use server";

import { payroll, type EmployeeBody } from "@billingease/contracts";
import { parseMoney } from "@billingease/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiFailure, call } from "@/lib/api";
import { failed, formValues, type FormState } from "@/lib/form";

const money = (v: string | undefined) => parseMoney((v ?? "").replace(/[^\d.-]/g, "") || "0") ?? 0;
const PATH = "/app/out/payroll";

function employeeBody(v: Record<string, string>): EmployeeBody {
  const allowances: { name: string; amount: number; epf: boolean }[] = [];
  for (let i = 0; i < 4; i++) {
    const name = (v[`a${i}name`] ?? "").trim();
    const amount = money(v[`a${i}amount`]);
    if (name || amount) allowances.push({ name: name || "Allowance", amount, epf: v[`a${i}epf`] === "on" });
  }
  return {
    name: v.name ?? "", job: v.job || null, startedOn: v.startedOn || null, endedOn: v.endedOn || null,
    idNumber: v.idNumber || null, epfNumber: v.epfNumber || null, taxCode: v.taxCode || null,
    basic: money(v.basic), allowances, pension: v.pension === "on", bankDetails: v.bankDetails || null,
    bankName: v.bankName || null, bankBranch: v.bankBranch || null, bankAccount: v.bankAccount || null,
  };
}

export async function saveEmployee(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    if (v.id) await call(payroll.updateEmployee, { params: { id: v.id }, body: employeeBody(v) });
    else await call(payroll.createEmployee, { body: employeeBody(v) });
  } catch (err) {
    return failed(err, v);
  }
  revalidatePath(PATH);
  redirect(PATH);
}

type Line = { employeeId: string; overtime?: number; gross?: number; paye?: number; eeNi?: number; erNi?: number; pensionEe?: number; pensionEr?: number };

/** The run's lines from the form: `l.<employeeId>.<field>`, only for people ticked in. */
function linesFrom(fd: FormData): Line[] {
  const out = new Map<string, Line>();
  for (const id of fd.getAll("people")) out.set(String(id), { employeeId: String(id) });
  for (const [k, raw] of fd.entries()) {
    const m = /^l\.([0-9a-f-]{36})\.(\w+)$/.exec(k);
    if (!m || !out.has(m[1])) continue;
    (out.get(m[1]) as Record<string, unknown>)[m[2]] = money(String(raw));
  }
  return [...out.values()];
}

/** Saves the draft run (creating it the first time), and approves it when asked. */
export async function saveRun(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  const body = { month: v.month ?? "", payDate: v.payDate ?? "", lines: linesFrom(fd) };
  let id = v.id;
  try {
    id = v.id ? (await call(payroll.updateRun, { params: { id: v.id }, body })).id : (await call(payroll.createRun, { body })).id;
    if (v.intent === "approve") await call(payroll.approveRun, { params: { id } });
  } catch (err) {
    if (err instanceof ApiFailure) {
      revalidatePath(PATH);
      return { message: err.message, values: v };
    }
    throw err;
  }
  revalidatePath(PATH);
  if (v.intent === "approve") redirect(`${PATH}/${id}`);
  return { ok: true, message: "Draft saved." };
}

export async function deleteRun(fd: FormData) {
  await call(payroll.deleteRun, { params: { id: String(fd.get("id")) } });
  revalidatePath(PATH);
  redirect(PATH);
}

export async function payDue(_: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    await call(payroll.payDue, { params: { id: v.id ?? "" }, body: { paidOn: v.paidOn ?? "", method: v.method || "Bank transfer", reference: v.reference || null } });
  } catch (err) {
    return failed(err, v);
  }
  revalidatePath(PATH, "layout");
  return { ok: true };
}
