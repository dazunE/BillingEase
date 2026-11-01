import { addDays, formatDate, formatMoney, rulesFor } from "@billingease/core";
import type { Exec } from "@billingease/db";
import { bills, customers, expenses, invoices, suppliers } from "@billingease/db/schema";
import { and, asc, desc, eq, gte, inArray, isNull, lt, lte, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import type { BusinessRow } from "../lib/context";
import { OFFICIAL_SOURCES, OFFICIAL_TOPICS, topicsFor } from "./ask-sources";
import { threeNumbers } from "./home";

/** A source an answer can cite as [n]: a look at the books, or an official page. */
export type Source = { n: number; title: string; url?: string; kind: "books" | "official" };

type ToolCtx = { db: Exec; business: BusinessRow; today: string; cite: (s: Omit<Source, "n">) => number };

type ToolDef = {
  name: string;
  description: string;
  input: z.ZodType;
  /** JSON Schema sent to the model. */
  schema: Record<string, unknown>;
  run: (input: never, t: ToolCtx) => Promise<unknown>;
};

const n = (v: unknown) => Number(v ?? 0);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const dateSchema = { type: "string", description: "A date as YYYY-MM-DD" };
const LIMIT = 50;

function tool<S extends z.ZodType>(d: { name: string; description: string; input: S; schema: Record<string, unknown>; run: (input: z.output<S>, t: ToolCtx) => Promise<unknown> }): ToolDef {
  return d as unknown as ToolDef;
}

export function askTools(country: BusinessRow["country"]): ToolDef[] {
  const rules = rulesFor(country);
  const categoryIds = rules.categories.map((c) => c.id);
  const topics = topicsFor(country);
  return [
    tool({
      name: "get_numbers",
      description: "The three numbers for a period of this business: Coming in (received plus still owed on invoices issued in the period), Going out (paid plus still owed on bills), the tax estimate share and Yours to keep. Also late invoices and bills due soon. Use for any question about income, spending, profit or tax owed.",
      input: z.object({ period: z.enum(["month", "quarter", "year"]) }),
      schema: { type: "object", properties: { period: { type: "string", enum: ["month", "quarter", "year"], description: { uk: "month, quarter (this MTD quarter) or year (this tax year)", lk: "month (this VAT month) or year (this year of assessment)", us: "month, quarter (this calendar quarter) or year (this tax year)" }[country] } }, required: ["period"], additionalProperties: false },
      async run({ period }, t) {
        const r = await threeNumbers(t.db, t.business, period, t.today);
        const m = (x: number) => formatMoney(x, t.business.currency);
        const source = t.cite({ kind: "books", title: `Your books · the three numbers, ${r.period.label} (to ${formatDate(r.period.soFar, { year: true })})` });
        return {
          source,
          period: { label: r.period.label, from: r.period.from, to: r.period.to, soFar: r.period.soFar },
          comingIn: { total: m(r.comingIn.total), received: m(r.comingIn.received), stillOwed: m(r.comingIn.onTheWay), lateAnyPeriod: m(r.comingIn.late), lateInvoices: r.comingIn.lateCount },
          goingOut: { total: m(r.goingOut.total), paid: m(r.goingOut.paid), stillToPay: m(r.goingOut.toPay), dueWithin7Days: m(r.goingOut.dueSoon), billsDueSoon: r.goingOut.dueSoonCount },
          taxEstimate: {
            label: r.tax.label, thisPeriodShare: m(r.tax.share), wholeYear: m(r.tax.yearEstimate), taxYear: r.tax.taxYear,
            yearToDateProfit: m(r.tax.yearToDateProfit), projectedFullYearProfit: m(r.tax.projectedProfit),
            lines: r.tax.lines.map((l) => ({ label: l.label, amount: m(l.amount), note: l.note })),
            instalments: r.tax.instalments.map((i) => ({ due: i.due, amount: m(i.amount) })),
            note: r.tax.wording + ". Rates not yet verified against official sources.",
          },
          yoursToKeep: m(r.keep),
        };
      },
    }),
    tool({
      name: "list_invoices",
      description: `Invoices and credit notes of this business, newest first (up to ${LIMIT}). Filter by status and issue date.`,
      input: z.object({ status: z.enum(["draft", "sent", "part_paid", "paid", "void", "late", "unpaid"]).optional(), from: date.optional(), to: date.optional() }),
      schema: {
        type: "object", additionalProperties: false,
        properties: {
          status: { type: "string", enum: ["draft", "sent", "part_paid", "paid", "void", "late", "unpaid"], description: "late = owed and past its due date; unpaid = sent or part paid" },
          from: { ...dateSchema, description: "Issued on or after" }, to: { ...dateSchema, description: "Issued on or before" },
        },
      },
      async run({ status, from, to }, t) {
        const open = sql<string>`${invoices.total} - ${invoices.paid} - ${invoices.credited}`;
        const w: (SQL | undefined)[] = [eq(invoices.businessId, t.business.id)];
        if (status === "late") w.push(inArray(invoices.status, ["sent", "part_paid"]), lt(invoices.dueDate, t.today), sql`${open} > 0`);
        else if (status === "unpaid") w.push(inArray(invoices.status, ["sent", "part_paid"]));
        else if (status) w.push(eq(invoices.status, status));
        if (from) w.push(gte(invoices.issueDate, from));
        if (to) w.push(lte(invoices.issueDate, to));
        const rows = await t.db.select({ number: invoices.number, kind: invoices.kind, status: invoices.status, issued: invoices.issueDate, due: invoices.dueDate, net: invoices.net, vat: invoices.vat, sscl: invoices.sscl, total: invoices.total, open, currency: invoices.currency, homeTotal: invoices.homeTotal, customer: customers.name })
          .from(invoices).innerJoin(customers, eq(customers.id, invoices.customerId)).where(and(...w)).orderBy(desc(invoices.issueDate)).limit(LIMIT + 1);
        const m = (x: unknown) => formatMoney(n(x), t.business.currency);
        const source = t.cite({ kind: "books", title: `Your books · invoices${status ? ` (${status.replace("_", " ")})` : ""}${from || to ? `, ${from ?? "…"} to ${to ?? "…"}` : ""}` });
        return {
          source, count: Math.min(rows.length, LIMIT), more: rows.length > LIMIT,
          invoices: rows.slice(0, LIMIT).map((r) => ({
            number: r.number ?? "(draft)", kind: r.kind, status: r.status, customer: r.customer, issued: r.issued, due: r.due,
            ...(r.currency === t.business.currency
              ? { net: m(r.net), vat: m(r.vat), ...(country === "lk" ? { sscl: m(r.sscl) } : {}), total: m(r.total), stillOwed: m(r.open) }
              : {
                currency: r.currency,
                net: formatMoney(n(r.net), r.currency), vat: formatMoney(n(r.vat), r.currency), total: formatMoney(n(r.total), r.currency), stillOwed: formatMoney(n(r.open), r.currency),
                totalInHomeCurrency: m(r.homeTotal),
              }),
          })),
        };
      },
    }),
    tool({
      name: "list_expenses",
      description: `Expenses this business has paid, newest first (up to ${LIMIT}). Filter by category id and date. Amounts are what left the account; businessShare excludes the personal part.`,
      input: z.object({ category: z.enum(["uncategorised", ...categoryIds] as [string, ...string[]]).optional(), from: date.optional(), to: date.optional() }),
      schema: {
        type: "object", additionalProperties: false,
        properties: {
          category: { type: "string", enum: [...categoryIds, "uncategorised"], description: "A category id from get_country_rules, or uncategorised" },
          from: { ...dateSchema, description: "Spent on or after" }, to: { ...dateSchema, description: "Spent on or before" },
        },
      },
      async run({ category, from, to }, t) {
        const w: (SQL | undefined)[] = [eq(expenses.businessId, t.business.id)];
        if (category === "uncategorised") w.push(isNull(expenses.categoryId));
        else if (category) w.push(eq(expenses.categoryId, category));
        if (from) w.push(gte(expenses.spentOn, from));
        if (to) w.push(lte(expenses.spentOn, to));
        const rows = await t.db.select().from(expenses).where(and(...w)).orderBy(desc(expenses.spentOn)).limit(LIMIT + 1);
        const [sum] = await t.db.select({ gross: sql<string>`coalesce(sum(${expenses.gross}), 0)`, share: sql<string>`coalesce(sum(round(${expenses.gross} * ${expenses.bizPct} / 100.0)), 0)` }).from(expenses).where(and(...w));
        const m = (x: unknown) => formatMoney(n(x), t.business.currency);
        const cat = (id: string | null) => {
          const c = id ? rules.categories.find((x) => x.id === id) : null;
          return c ? { name: c.name, official: c.official, allowable: c.allowable } : { name: "Not sorted yet", official: null, allowable: null };
        };
        const source = t.cite({ kind: "books", title: `Your books · expenses${category ? ` (${cat(category === "uncategorised" ? null : category).name})` : ""}${from || to ? `, ${from ?? "…"} to ${to ?? "…"}` : ""}` });
        return {
          source, count: Math.min(rows.length, LIMIT), more: rows.length > LIMIT, total: m(sum.gross), businessShareTotal: m(sum.share),
          expenses: rows.slice(0, LIMIT).map((r) => ({ date: r.spentOn, payee: r.payee, category: cat(r.categoryId), amount: m(r.gross), vat: m(r.vat), businessPercent: r.bizPct, method: r.method, note: r.note })),
        };
      },
    }),
    tool({
      name: "list_bills",
      description: `Suppliers' bills this business has to pay or has paid, by due date (up to ${LIMIT}).`,
      input: z.object({ status: z.enum(["unpaid", "part_paid", "paid", "void", "overdue", "due_soon"]).optional() }),
      schema: { type: "object", additionalProperties: false, properties: { status: { type: "string", enum: ["unpaid", "part_paid", "paid", "void", "overdue", "due_soon"], description: "overdue = owed and past due; due_soon = owed and due within 7 days" } } },
      async run({ status }, t) {
        const w: (SQL | undefined)[] = [eq(bills.businessId, t.business.id)];
        const owing = inArray(bills.status, ["unpaid", "part_paid"]);
        if (status === "overdue") w.push(owing, lt(bills.dueDate, t.today));
        else if (status === "due_soon") w.push(owing, lte(bills.dueDate, addDays(t.today, 7)));
        else if (status) w.push(eq(bills.status, status));
        const rows = await t.db.select({ ref: bills.reference, description: bills.description, date: bills.billDate, due: bills.dueDate, total: bills.total, paid: bills.paid, vat: bills.vat, status: bills.status, supplier: suppliers.name })
          .from(bills).innerJoin(suppliers, eq(suppliers.id, bills.supplierId)).where(and(...w)).orderBy(asc(bills.dueDate)).limit(LIMIT + 1);
        const m = (x: unknown) => formatMoney(n(x), t.business.currency);
        const source = t.cite({ kind: "books", title: `Your books · bills${status ? ` (${status.replace("_", " ")})` : ""}` });
        return {
          source, count: Math.min(rows.length, LIMIT), more: rows.length > LIMIT,
          bills: rows.slice(0, LIMIT).map((r) => ({ supplier: r.supplier, reference: r.ref, description: r.description, dated: r.date, due: r.due, total: m(r.total), vat: m(r.vat), stillOwed: m(n(r.total) - n(r.paid)), status: r.status })),
        };
      },
    }),
    tool({
      name: "get_business_profile",
      description: "This business's set-up: country, kind, VAT and SSCL registration, accounting basis, MTD quarters, payment terms, and whether its tax ID is recorded.",
      input: z.object({}),
      schema: { type: "object", properties: {}, additionalProperties: false },
      async run(_input, t) {
        const b = t.business;
        const source = t.cite({ kind: "books", title: "Your business profile" });
        return {
          source, name: b.name, country: rules.name, kind: b.kind, currency: b.currency,
          [rules.wording.taxIdLabel]: b.taxId ? "recorded" : "not recorded yet",
          ...(country === "us" ? { salesTax: "not charged" } : { vatRegistered: b.vatRegistered }), ...(country === "lk" ? { ssclRegistered: b.ssclRegistered } : country === "uk" ? { mtdQuarters: b.quarterType } : {}),
          accountingBasis: b.basis === "cash" ? "cash basis (when money moves)" : "accruals basis (when invoiced or billed)",
          paymentTermsDays: b.termsDays,
        };
      },
    }),
    tool({
      name: "get_country_rules",
      description: "The rules BillingEase uses for this country: expense categories with their official names and whether they're allowable, VAT rates, SSCL, the tax year, the VAT threshold and the income tax estimate bands. verified=false means the figures still need checking against official sources.",
      input: z.object({}),
      schema: { type: "object", properties: {}, additionalProperties: false },
      async run(_input, t) {
        const m = (x: number) => formatMoney(x, rules.currency);
        const year = rules.taxYearOf(t.today);
        const sample = rules.estimate(0);
        const source = t.cite({ kind: "books", title: `BillingEase country rules · ${rules.name} ${rules.rulesYear} (not yet verified)` });
        return {
          source, country: rules.name, rulesYear: rules.rulesYear, verified: rules.verified, currency: rules.currency,
          taxYear: { label: year.label, from: year.from, to: year.to },
          categories: rules.categories.map((c) => ({ id: c.id, name: c.name, official: c.official, allowable: c.allowable, scope: c.scope })),
          vatRates: rules.vatRates.map((r) => r.label),
          vatThreshold: `${m(rules.vatThreshold)} a year`,
          ...(rules.features.sscl ? { sscl: `${rules.ssclBps / 100}% on turnover, shown as its own line on Tax Invoices${rules.ssclInVatBase ? "; counts in the value VAT is charged on" : ""}` } : {}),
          estimate: { label: sample.label, bands: sample.lines.map((l) => `${l.label}: ${l.note}${l.label.toLowerCase().includes("allowance") || l.label.toLowerCase().includes("relief") ? ` (${m(l.amount)})` : ""}`) },
          taxPeriods: rules.features.mtdQuarters ? "MTD for Income Tax quarterly updates, due on the 7th of the month after each standard quarter ends" : "Monthly VAT and SSCL returns, due on the 20th of the following month",
        };
      },
    }),
    tool({
      name: "get_official_sources",
      description: "Official pages (gov.uk, HMRC, IRD, EPF, ETF) on a topic, with titles and URLs. Cite them with the source number given. Only these URLs may be cited.",
      input: z.object({ topic: z.enum(OFFICIAL_TOPICS) }),
      schema: { type: "object", properties: { topic: { type: "string", enum: topics } }, required: ["topic"], additionalProperties: false },
      async run({ topic }, t) {
        const list = OFFICIAL_SOURCES[t.business.country].filter((s) => s.topic === topic);
        if (!list.length) return { sources: [], note: `No official pages on ${topic} for ${rules.name}. Topics: ${topics.join(", ")}` };
        return { sources: list.map((s) => ({ source: t.cite({ kind: "official", title: s.title, url: s.url }), title: s.title, url: s.url, about: s.about })) };
      },
    }),
  ];
}

/** Looks up tools by name; rejects names the model made up. */
export function findTool(tools: ToolDef[], name: string) {
  return tools.find((t) => t.name === name) ?? null;
}

export type { ToolDef, ToolCtx };
