import { z } from "zod";
import { endpoint, IsoDate, Minor, Ok } from "./endpoint";

export const PeriodKey = z.enum(["month", "quarter", "year"]);
export type PeriodKey = z.infer<typeof PeriodKey>;

const EstimateLine = z.object({ label: z.string(), amount: Minor, note: z.string() });

/** One thing on Home that needs the owner: a late invoice, a bill due, a missing tax ID... */
export const NeedsItem = z.object({
  id: z.string(),
  kind: z.enum(["late", "draft", "bill", "uncategorised", "tax_id", "vat_number", "vat_threshold"]),
  title: z.string(),
  body: z.string(),
  href: z.string(),
  cta: z.string(),
  tone: z.enum(["late", "due", "info", "neutral"]),
  amount: Minor.nullable(),
});
export type NeedsItem = z.infer<typeof NeedsItem>;

const TaxPeriodCard = z.object({
  label: z.string(),
  from: IsoDate,
  to: IsoDate,
  due: IsoDate,
  daysToDue: z.number().int(),
});

/** UK: this MTD quarter (and the one before while its update is still due). */
export const QuarterCard = z.object({
  kind: z.literal("quarter"),
  current: TaxPeriodCard.extend({ income: Minor, expenses: Minor, profit: Minor }),
  previous: TaxPeriodCard.extend({ income: Minor, expenses: Minor, profit: Minor }).nullable(),
});

const VatMonth = TaxPeriodCard.extend({ outputVat: Minor, inputVat: Minor, vatPayable: Minor, sscl: Minor });
/** Sri Lanka: the monthly VAT and SSCL return, only when registered. */
export const VatMonthCard = z.object({
  kind: z.literal("vat-month"),
  title: z.string(),
  vat: z.boolean(),
  sscl: z.boolean(),
  current: VatMonth,
  previous: VatMonth.nullable(),
});

export const HomeSummary = z.object({
  today: IsoDate,
  currency: z.enum(["GBP", "LKR", "USD"]),
  period: z.object({ key: PeriodKey, from: IsoDate, to: IsoDate, label: z.string(), soFar: IsoDate }),
  periods: z.array(z.object({ key: PeriodKey, label: z.string() })),
  comingIn: z.object({ total: Minor, received: Minor, onTheWay: Minor, late: Minor, lateCount: z.number().int() }),
  goingOut: z.object({ total: Minor, paid: Minor, toPay: Minor, dueSoon: Minor, dueSoonCount: z.number().int() }),
  tax: z.object({
    label: z.string(),
    /** This period's share of the year's estimate. */
    share: Minor,
    /** The whole year's estimate, on the year-to-date profit scaled to a full year. */
    yearEstimate: Minor,
    yearToDateProfit: Minor,
    projectedProfit: Minor,
    taxYear: z.string(),
    lines: z.array(EstimateLine),
    wording: z.string(),
    verified: z.boolean(),
  }),
  keep: Minor,
  periodCard: z.discriminatedUnion("kind", [QuarterCard, VatMonthCard]).nullable(),
  needs: z.array(NeedsItem),
  activity: z.array(z.object({ id: z.string(), message: z.string(), link: z.string().nullable(), createdAt: z.string() })),
  deadlines: z.array(z.object({ date: IsoDate, label: z.string(), detail: z.string(), daysAway: z.number().int() })),
  /** Nothing recorded yet: show first steps. */
  empty: z.boolean(),
  firstSteps: z.array(z.object({ id: z.string(), label: z.string(), hint: z.string(), href: z.string(), done: z.boolean() })),
});
export type HomeSummary = z.infer<typeof HomeSummary>;

export const SearchResult = z.object({
  type: z.enum(["customer", "invoice", "supplier", "expense", "bill"]),
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  href: z.string(),
  amount: Minor.nullable(),
  date: IsoDate.nullable(),
});
export type SearchResult = z.infer<typeof SearchResult>;

export const Notification = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  link: z.string().nullable(),
  read: z.boolean(),
  createdAt: z.string(),
});
export type Notification = z.infer<typeof Notification>;

export const home = {
  summary: endpoint({
    method: "GET", path: "/home",
    query: z.object({ period: PeriodKey.optional() }),
    response: HomeSummary,
  }),
  search: endpoint({
    method: "GET", path: "/search",
    query: z.object({ q: z.string().trim().max(100).default("") }),
    response: z.object({ q: z.string(), results: z.array(SearchResult) }),
  }),
  notifications: endpoint({
    method: "GET", path: "/notifications",
    query: z.object({ filter: z.enum(["all", "unread"]).default("all") }),
    response: z.object({ items: z.array(Notification), unread: z.number().int(), total: z.number().int() }),
  }),
  unreadCount: endpoint({ method: "GET", path: "/notifications/unread-count", response: z.object({ unread: z.number().int() }) }),
  markRead: endpoint({
    method: "POST", path: "/notifications/:id/read",
    body: z.object({ read: z.boolean().default(true) }),
    response: Ok,
  }),
  markAllRead: endpoint({ method: "POST", path: "/notifications/read-all", response: z.object({ ok: z.literal(true), marked: z.number().int() }) }),
};
