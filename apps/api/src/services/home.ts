import type { HomeSummary, NeedsItem, PeriodKey, SearchResult } from "@billingease/contracts";
import { addDays, addMonths, daysBetween, formatDate, formatMoney, periodsFor, rulesFor, type Period } from "@billingease/core";
import type { Exec } from "@billingease/db";
import { activity, bills, customers, expenses, invoices, receipts, suppliers } from "@billingease/db/schema";
import { and, asc, between, desc, eq, ilike, inArray, isNull, lt, lte, ne, or, sql } from "drizzle-orm";
import type { BusinessRow } from "../lib/context";
import { comingIn, goingOut } from "./summary";

const n = (v: unknown) => Number(v ?? 0);
export const ESTIMATE_WORDING = "Estimate · your accountant confirms the final figure";

/** The period options Home switches between: UK and US quarter and tax year, Sri Lanka month and year of assessment. */
export function periodOptions(b: BusinessRow, today: string): { key: PeriodKey; label: string; period: Period }[] {
  const p = periodsFor({ country: b.country, quarterType: b.quarterType }, today);
  return b.country === "lk"
    ? [{ key: "month", label: "This month", period: p.month }, { key: "year", label: "This year of assessment", period: p.year }]
    : [{ key: "quarter", label: "This quarter", period: p.quarter }, { key: "year", label: "This tax year", period: p.year }];
}

/**
 * The three numbers for a period. Yours to keep = Coming in − Going out − the period's share of
 * the year's tax estimate, worked out on the year-to-date profit scaled up to a full year.
 */
export async function threeNumbers(db: Exec, b: BusinessRow, key: PeriodKey | undefined, today: string) {
  const rules = rulesFor(b.country);
  const all = periodsFor({ country: b.country, quarterType: b.quarterType }, today);
  const options = periodOptions(b, today);
  const chosen = options.find((o) => o.key === key) ?? (key && all[key] ? { key, label: all[key].label, period: all[key] } : options[0]);
  const period = chosen.period;
  const soFar = today < period.to ? today : period.to;

  const [inn, out] = await Promise.all([comingIn(db, b.id, period.from, period.to, today), goingOut(db, b.id, period.from, period.to, today)]);

  // Tax: the year's estimate on the profit so far, scaled to a full year, shared by days.
  const year = rules.taxYearOf(today);
  const [yIn, yOut] = key === "year" || chosen.key === "year"
    ? [inn, out]
    : await Promise.all([comingIn(db, b.id, year.from, year.to, today), goingOut(db, b.id, year.from, year.to, today)]);
  const ytdProfit = yIn.total - yOut.total;
  const yearDays = daysBetween(year.from, year.to) + 1;
  const elapsedYear = Math.max(1, daysBetween(year.from, today) + 1);
  const projected = Math.round((ytdProfit * yearDays) / elapsedYear);
  const est = rules.estimate(Math.max(0, projected), { year: Number(year.from.slice(0, 4)) });
  const periodElapsed = Math.max(0, daysBetween(period.from < year.from ? year.from : period.from, soFar) + 1);
  const share = ytdProfit > 0 ? Math.round((est.total * Math.min(periodElapsed, yearDays)) / yearDays) : 0;

  return {
    key: chosen.key,
    period: { key: chosen.key, from: period.from, to: period.to, label: chosen.key === "year" && b.country === "lk" ? period.label.replace("Tax year", "Year of assessment") : period.label, soFar },
    options,
    comingIn: inn,
    goingOut: out,
    tax: {
      label: est.label,
      share,
      yearEstimate: ytdProfit > 0 ? est.total : 0,
      yearToDateProfit: ytdProfit,
      projectedProfit: projected,
      taxYear: year.label,
      lines: est.lines,
      instalments: est.instalments,
      wording: ESTIMATE_WORDING,
      verified: rules.verified,
    },
    keep: inn.total - out.total - share,
  };
}

/** Output VAT, input VAT and SSCL for a month (Sri Lanka's VAT and SSCL return). */
async function vatFor(db: Exec, businessId: string, from: string, to: string) {
  const sign = sql`case when ${invoices.kind} = 'credit_note' then -1 else 1 end`;
  const [o] = await db.select({
    vat: sql<string>`coalesce(sum(${invoices.vat} * ${sign}), 0)`,
    sscl: sql<string>`coalesce(sum(${invoices.sscl} * ${sign}), 0)`,
  }).from(invoices).where(and(eq(invoices.businessId, businessId), ne(invoices.status, "draft"), ne(invoices.status, "void"), between(invoices.issueDate, from, to)));
  const [e] = await db.select({ vat: sql<string>`coalesce(sum(round(${expenses.vat} * ${expenses.bizPct} / 100.0)), 0)` }).from(expenses)
    .where(and(eq(expenses.businessId, businessId), between(expenses.spentOn, from, to)));
  const [bl] = await db.select({ vat: sql<string>`coalesce(sum(${bills.vat}), 0)` }).from(bills)
    .where(and(eq(bills.businessId, businessId), ne(bills.status, "void"), between(bills.billDate, from, to)));
  const outputVat = n(o.vat), inputVat = n(e.vat) + n(bl.vat);
  return { outputVat, inputVat, vatPayable: outputVat - inputVat, sscl: n(o.sscl) };
}

async function periodCard(db: Exec, b: BusinessRow, today: string): Promise<HomeSummary["periodCard"]> {
  const rules = rulesFor(b.country);
  if (rules.features.mtdQuarters) {
    const cur = rules.periodOf(today, { quarterType: b.quarterType });
    const prev = rules.periodOf(addDays(cur.from, -1), { quarterType: b.quarterType });
    const nums = async (p: { from: string; to: string }) => {
      const [i, o] = await Promise.all([comingIn(db, b.id, p.from, p.to, today), goingOut(db, b.id, p.from, p.to, today)]);
      return { income: i.total, expenses: o.total, profit: i.total - o.total };
    };
    const card = (p: typeof cur) => ({ label: p.label, from: p.from, to: p.to, due: p.due, daysToDue: daysBetween(today, p.due) });
    return {
      kind: "quarter",
      current: { ...card(cur), ...(await nums(cur)) },
      previous: prev.due >= today ? { ...card(prev), ...(await nums(prev)) } : null,
    };
  }
  if (!b.vatRegistered && !b.ssclRegistered) return null;
  const cur = rules.periodOf(today);
  const prev = rules.periodOf(addDays(cur.from, -1));
  const card = async (p: typeof cur) => ({ label: p.label, from: p.from, to: p.to, due: p.due, daysToDue: daysBetween(today, p.due), ...(await vatFor(db, b.id, p.from, p.to)) });
  const title = b.vatRegistered && b.ssclRegistered ? "VAT and SSCL return" : b.vatRegistered ? "VAT return" : "SSCL return";
  return { kind: "vat-month", title, vat: b.vatRegistered, sscl: b.ssclRegistered, current: await card(cur), previous: prev.due >= today ? await card(prev) : null };
}

async function needsYou(db: Exec, b: BusinessRow, today: string): Promise<NeedsItem[]> {
  const rules = rulesFor(b.country);
  const money = (m: number) => formatMoney(m, b.currency);
  const out: NeedsItem[] = [];
  const open = sql<string>`${invoices.total} - ${invoices.paid} - ${invoices.credited}`;
  const homeOpen = sql<string>`${invoices.homeTotal} - ${invoices.homeCleared}`;

  const late = await db.select({ id: invoices.id, number: invoices.number, due: invoices.dueDate, open, homeOpen, currency: invoices.currency, customer: customers.name })
    .from(invoices).innerJoin(customers, eq(customers.id, invoices.customerId))
    .where(and(eq(invoices.businessId, b.id), eq(invoices.kind, "invoice"), inArray(invoices.status, ["sent", "part_paid"]), lt(invoices.dueDate, today), sql`${open} > 0`))
    .orderBy(asc(invoices.dueDate)).limit(6);
  for (const r of late.slice(0, 5)) {
    const days = daysBetween(r.due, today);
    out.push({
      id: `late-${r.id}`, kind: "late", tone: "late", amount: n(r.homeOpen),
      title: `${r.number} to ${r.customer} is ${days} day${days === 1 ? "" : "s"} late`,
      body: `${formatMoney(n(r.open), r.currency, { homeOf: b.currency })} was due ${formatDate(r.due, { year: true })}. Send a reminder or record the payment.`,
      href: `/app/in/invoices/${r.id}`, cta: "Open invoice",
    });
  }
  if (late.length > 5) out.push({ id: "late-more", kind: "late", tone: "late", amount: null, title: "More late invoices", body: "See every invoice that's past its due date.", href: "/app/in/invoices?status=late", cta: "See all late" });

  const drafts = await db.select({ id: invoices.id, total: invoices.total, homeTotal: invoices.homeTotal, currency: invoices.currency, customer: customers.name, issued: invoices.issueDate })
    .from(invoices).innerJoin(customers, eq(customers.id, invoices.customerId))
    .where(and(eq(invoices.businessId, b.id), eq(invoices.status, "draft"))).orderBy(asc(invoices.issueDate)).limit(3);
  for (const d of drafts) {
    out.push({
      id: `draft-${d.id}`, kind: "draft", tone: "info", amount: n(d.homeTotal),
      title: `Draft for ${d.customer} not sent yet`,
      body: `${formatMoney(n(d.total), d.currency, { homeOf: b.currency })} · dated ${formatDate(d.issued, { year: true })}. Check it and send it so it counts as coming in.`,
      href: `/app/in/invoices/${d.id}`, cta: "Finish and send",
    });
  }

  const owed = sql<string>`${bills.total} - ${bills.paid}`;
  const due = await db.select({ id: bills.id, due: bills.dueDate, owed, supplier: suppliers.name, description: bills.description })
    .from(bills).innerJoin(suppliers, eq(suppliers.id, bills.supplierId))
    .where(and(eq(bills.businessId, b.id), inArray(bills.status, ["unpaid", "part_paid"]), lte(bills.dueDate, addDays(today, 7))))
    .orderBy(asc(bills.dueDate)).limit(5);
  for (const r of due) {
    const d = daysBetween(today, r.due);
    const when = d < 0 ? `${-d} day${d === -1 ? "" : "s"} overdue` : d === 0 ? "due today" : `due in ${d} day${d === 1 ? "" : "s"}`;
    out.push({
      id: `bill-${r.id}`, kind: "bill", tone: d < 0 ? "late" : "due", amount: n(r.owed),
      title: `${r.supplier} bill ${when}`,
      body: `${money(n(r.owed))} for ${r.description}, due ${formatDate(r.due, { year: true })}.`,
      href: `/app/out/bills/${r.id}`, cta: "Open bill",
    });
  }

  const [unc] = await db.select({ count: sql<string>`count(*)`, sum: sql<string>`coalesce(sum(${expenses.gross}), 0)` }).from(expenses)
    .where(and(eq(expenses.businessId, b.id), isNull(expenses.categoryId)));
  if (n(unc.count) > 0) {
    const c = n(unc.count);
    out.push({
      id: "uncategorised", kind: "uncategorised", tone: "due", amount: n(unc.sum),
      title: `${c} expense${c === 1 ? "" : "s"} to sort`,
      body: `Pick a category so ${c === 1 ? "it counts" : "they count"} in the right box for your ${rules.wording.practitionerNoun}.`,
      href: "/app/out?sort=1", cta: "Sort them",
    });
  }

  if (!b.taxId) {
    out.push({
      id: "tax-id", kind: "tax_id", tone: "neutral", amount: null,
      title: `Add your ${rules.wording.taxIdLabel}`,
      body: {
        uk: "Your Unique Taxpayer Reference is on letters from HMRC. Your accountant needs it to file.",
        lk: "Your Taxpayer Identification Number from the Inland Revenue Department goes on Tax Invoices and returns.",
        us: "Your Employer Identification Number is on the IRS letter you got when the LLC was set up. Customers may ask for it on a W-9.",
      }[b.country],
      href: "/app/settings/business", cta: `Add ${rules.wording.taxIdLabel}`,
    });
  }
  if (b.vatRegistered && !b.vatNumber) {
    out.push({ id: "vat-number", kind: "vat_number", tone: "neutral", amount: null, title: `Add your ${rules.wording.vatIdLabel}`, body: `It's printed on every ${rules.wording.vatInvoiceTitle}.`, href: "/app/settings/business", cta: "Add it" });
  }

  // No threshold (US: no sales tax set up) means no warning.
  if (!b.vatRegistered && rules.vatThreshold > 0) {
    const from = addDays(addMonths(today, -12), 1);
    const sign = sql`case when ${invoices.kind} = 'credit_note' then -1 else 1 end`;
    const [t] = await db.select({ sum: sql<string>`coalesce(sum(${invoices.homeNet} * ${sign}), 0)` }).from(invoices)
      .where(and(eq(invoices.businessId, b.id), ne(invoices.status, "draft"), ne(invoices.status, "void"), between(invoices.issueDate, from, today)));
    const turnover = n(t.sum);
    if (turnover >= rules.vatThreshold * 0.75) {
      const over = turnover >= rules.vatThreshold;
      out.push({
        id: "vat-threshold", kind: "vat_threshold", tone: over ? "late" : "due", amount: turnover,
        title: over ? "You've passed the VAT registration threshold" : "Your turnover is nearing the VAT threshold",
        body: `${money(turnover)} in the last 12 months, against ${money(rules.vatThreshold)}. ${over ? "You need to register for VAT. " : ""}Talk to your ${rules.wording.practitionerNoun}.`,
        href: "/app/settings/business", cta: over ? "Turn on VAT" : "VAT settings",
      });
    }
  }
  return out;
}

function deadlines(b: BusinessRow, today: string, instalments: { due: string; amount: number }[]): HomeSummary["deadlines"] {
  const rules = rulesFor(b.country);
  const list: { date: string; label: string; detail: string }[] = [];
  if (rules.features.mtdQuarters) {
    const cur = rules.periodOf(today, { quarterType: b.quarterType });
    const prev = rules.periodOf(addDays(cur.from, -1), { quarterType: b.quarterType });
    const next = rules.periodOf(addDays(cur.to, 1), { quarterType: b.quarterType });
    for (const p of [prev, cur, next]) list.push({ date: p.due, label: `${p.label} update`, detail: `Making Tax Digital quarterly update for ${formatDate(p.from)} – ${formatDate(p.to, { year: true })}` });
  } else if (b.vatRegistered || b.ssclRegistered) {
    const cur = rules.periodOf(today);
    const prev = rules.periodOf(addDays(cur.from, -1));
    const what = b.vatRegistered && b.ssclRegistered ? "VAT and SSCL return" : b.vatRegistered ? "VAT return" : "SSCL return";
    for (const p of [prev, cur]) list.push({ date: p.due, label: `${p.label} ${what}`, detail: `For ${formatDate(p.from)} – ${formatDate(p.to, { year: true })}, to the Inland Revenue Department` });
  }
  instalments.forEach((i, k) => list.push({
    date: i.due,
    label: b.country === "uk" ? (k === 0 ? "Self Assessment payment" : "Second payment on account") : `Income tax instalment ${k + 1}`,
    detail: `About ${formatMoney(i.amount, b.currency, { decimals: "never" })} on this year's estimate`,
  }));
  const year = rules.taxYearOf(today);
  list.push({ date: year.to, label: b.country === "lk" ? `Year of assessment ${year.label} ends` : `Tax year ${year.label} ends`, detail: "Your books for the year close on this date" });
  return list.filter((d) => d.date >= today).sort((a, z) => a.date.localeCompare(z.date)).slice(0, 6)
    .map((d) => ({ ...d, daysAway: daysBetween(today, d.date) }));
}

export async function homeSummary(db: Exec, b: BusinessRow, key: PeriodKey | undefined, today: string): Promise<HomeSummary> {
  const nums = await threeNumbers(db, b, key, today);
  const rules = rulesFor(b.country);
  const [card, needs, recent, counts] = await Promise.all([
    periodCard(db, b, today),
    needsYou(db, b, today),
    db.select().from(activity).where(eq(activity.businessId, b.id)).orderBy(desc(activity.createdAt)).limit(8),
    Promise.all([
      db.select({ c: sql<string>`count(*)` }).from(invoices).where(eq(invoices.businessId, b.id)),
      db.select({ c: sql<string>`count(*)` }).from(expenses).where(eq(expenses.businessId, b.id)),
      db.select({ c: sql<string>`count(*)` }).from(bills).where(eq(bills.businessId, b.id)),
      db.select({ c: sql<string>`count(*)` }).from(receipts).where(eq(receipts.businessId, b.id)),
    ]),
  ]);
  const [ni, ne_, nb, nr] = counts.map((r) => n(r[0].c));
  return {
    today,
    currency: b.currency,
    period: nums.period,
    periods: nums.options.map((o) => ({ key: o.key, label: o.label })),
    comingIn: nums.comingIn,
    goingOut: nums.goingOut,
    tax: { label: nums.tax.label, share: nums.tax.share, yearEstimate: nums.tax.yearEstimate, yearToDateProfit: nums.tax.yearToDateProfit, projectedProfit: nums.tax.projectedProfit, taxYear: nums.tax.taxYear, lines: nums.tax.lines, wording: nums.tax.wording, verified: nums.tax.verified },
    keep: nums.keep,
    periodCard: card,
    needs,
    activity: recent.map((a) => ({ id: a.id, message: a.message, link: a.link, createdAt: a.createdAt.toISOString() })),
    deadlines: deadlines(b, today, nums.tax.yearEstimate > 0 ? nums.tax.instalments : []),
    empty: ni + ne_ + nb + nr === 0,
    firstSteps: [
      { id: "invoice", label: b.country === "lk" && b.vatRegistered ? "Send your first Tax Invoice" : "Create your first invoice", hint: "Bill a customer for work you've done", href: "/app/in/invoices/new", done: ni > 0 },
      { id: "expense", label: "Record an expense", hint: "Something you've paid for the business", href: "/app/out#expense", done: ne_ + nb > 0 },
      { id: "tax-id", label: `Add your ${rules.wording.taxIdLabel}`, hint: { uk: "Your Unique Taxpayer Reference, from HMRC", lk: "Your Taxpayer Identification Number, from the IRD", us: "Your Employer Identification Number, from the IRS" }[b.country], href: "/app/settings/business", done: !!b.taxId },
    ],
  };
}

const like = (q: string) => `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;

/** Finds customers, invoices (by number), suppliers, expenses and bills in this business. */
export async function search(db: Exec, b: BusinessRow, q: string): Promise<SearchResult[]> {
  const term = q.trim();
  if (!term) return [];
  const p = like(term);
  const money = (m: number) => formatMoney(m, b.currency);
  const per = 8;
  const [cs, inv, sup, ex, bl] = await Promise.all([
    db.select({ id: customers.id, name: customers.name, email: customers.email }).from(customers)
      .where(and(eq(customers.businessId, b.id), or(ilike(customers.name, p), ilike(customers.email, p), ilike(customers.contactName, p)))).orderBy(asc(customers.name)).limit(per),
    db.select({ id: invoices.id, number: invoices.number, kind: invoices.kind, status: invoices.status, total: invoices.homeTotal, issued: invoices.issueDate, customer: customers.name })
      .from(invoices).innerJoin(customers, eq(customers.id, invoices.customerId))
      .where(and(eq(invoices.businessId, b.id), or(ilike(invoices.number, p), ilike(invoices.reference, p)))).orderBy(desc(invoices.issueDate)).limit(per),
    db.select({ id: suppliers.id, name: suppliers.name, email: suppliers.email }).from(suppliers)
      .where(and(eq(suppliers.businessId, b.id), or(ilike(suppliers.name, p), ilike(suppliers.email, p)))).orderBy(asc(suppliers.name)).limit(per),
    db.select({ id: expenses.id, payee: expenses.payee, gross: expenses.gross, spent: expenses.spentOn, note: expenses.note }).from(expenses)
      .where(and(eq(expenses.businessId, b.id), or(ilike(expenses.payee, p), ilike(expenses.note, p)))).orderBy(desc(expenses.spentOn)).limit(per),
    db.select({ id: bills.id, reference: bills.reference, description: bills.description, total: bills.homeTotal, date: bills.billDate, supplier: suppliers.name })
      .from(bills).innerJoin(suppliers, eq(suppliers.id, bills.supplierId))
      .where(and(eq(bills.businessId, b.id), or(ilike(bills.reference, p), ilike(bills.description, p), ilike(suppliers.name, p)))).orderBy(desc(bills.billDate)).limit(per),
  ]);
  const STATUS: Record<string, string> = { draft: "Draft", sent: "Sent", part_paid: "Part paid", paid: "Paid", void: "Void" };
  const out: SearchResult[] = [
    ...inv.map((r) => ({ type: "invoice" as const, id: r.id, title: r.number ?? `Draft for ${r.customer}`, subtitle: `${r.kind === "credit_note" ? "Credit note" : "Invoice"} · ${r.customer} · ${STATUS[r.status] ?? r.status}`, href: `/app/in/invoices/${r.id}`, amount: n(r.total), date: r.issued })),
    ...cs.map((r) => ({ type: "customer" as const, id: r.id, title: r.name, subtitle: ["Customer", r.email].filter(Boolean).join(" · "), href: `/app/in/customers/${r.id}`, amount: null, date: null })),
    ...sup.map((r) => ({ type: "supplier" as const, id: r.id, title: r.name, subtitle: ["Supplier", r.email].filter(Boolean).join(" · "), href: `/app/out/suppliers/${r.id}`, amount: null, date: null })),
    ...bl.map((r) => ({ type: "bill" as const, id: r.id, title: `${r.supplier}${r.reference ? " · " + r.reference : ""}`, subtitle: `Bill · ${r.description}`, href: `/app/out/bills/${r.id}`, amount: n(r.total), date: r.date })),
    ...ex.map((r) => ({ type: "expense" as const, id: r.id, title: r.payee, subtitle: `Expense${r.note ? " · " + r.note : ""} · ${money(n(r.gross))}`, href: `/app/out/expenses/${r.id}`, amount: n(r.gross), date: r.spent })),
  ];
  return out.slice(0, 20);
}
