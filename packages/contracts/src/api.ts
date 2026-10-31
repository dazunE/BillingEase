import { z } from "zod";
import { agents, Proposal } from "./agents";
import { business } from "./business";
import { comingIn, PaymentBody } from "./coming-in";
import { endpoint, Ok, type Endpoint } from "./endpoint";
import { BillBody, BillPaymentBody, ExpenseBody, goingOut } from "./going-out";
import { home } from "./home";

/**
 * The public API and MCP server: what outside apps (scripts, other software, AI assistants)
 * can do with a business's books. They read, and they propose. Nothing they send changes the
 * books until a person approves it on "For you to check".
 */

export const ApiScope = z.enum(["books:read", "books:propose"]);
export type ApiScope = z.infer<typeof ApiScope>;

export const SCOPES: Record<ApiScope, { label: string; detail: string }> = {
  "books:read": { label: "Read your books", detail: "Invoices, customers, spending, bills, suppliers and the totals on your home page." },
  "books:propose": { label: "Suggest changes for you to approve", detail: "Expenses, bills, payments and reminders wait on “For you to check” until you approve them." },
};

const Uuid = z.string().uuid();
const why = {
  title: z.string().trim().min(3).max(200).describe("One line the person sees, e.g. “Ochre Café, £12.40”"),
  summary: z.string().trim().min(1).max(1000).describe("Why: where it came from and anything to check"),
  confidence: z.number().int().min(0).max(100).optional().describe("How sure you are, 0–100"),
};

/** One proposal from an outside app. The payload is the body the matching endpoint takes. */
export const ProposeBody = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("expense.create"), payload: ExpenseBody, ...why }),
  z.object({ kind: z.literal("bill.create"), payload: BillBody, ...why }),
  z.object({ kind: z.literal("receipt.create"), invoiceId: Uuid.describe("The invoice that was paid"), payload: PaymentBody, ...why }),
  z.object({ kind: z.literal("bill_payment.create"), billId: Uuid.describe("The bill that was paid"), payload: BillPaymentBody, ...why }),
  z.object({ kind: z.literal("invoice.remind"), invoiceId: Uuid.describe("The late invoice"), payload: comingIn.remind.body!, ...why }),
]);
export type ProposeBody = z.input<typeof ProposeBody>;

export const ApiIdentity = z.object({
  business: z.object({ id: z.string(), name: z.string(), country: z.string(), currency: z.string() }),
  user: z.object({ name: z.string(), role: z.string() }),
  scopes: z.array(ApiScope),
  token: z.object({ kind: z.enum(["personal", "access"]), name: z.string(), app: z.string().nullable(), expiresAt: z.string().nullable() }),
  /** Calls left today for this business. */
  callsLeftToday: z.number().int(),
});

/** Endpoints only the public API has (under /v1). */
export const publicApi = {
  me: endpoint({ method: "GET", path: "/me", response: ApiIdentity }),
  propose: endpoint({ method: "POST", path: "/proposals", body: ProposeBody, response: Proposal }),
};

export type V1Op = {
  /** Also the MCP tool's name. */
  name: string;
  endpoint: Endpoint;
  scope: ApiScope | null;
  summary: string;
};

const read = (name: string, e: Endpoint, summary: string): V1Op => ({ name, endpoint: e, scope: "books:read", summary });

/**
 * Everything under /v1, each an endpoint the web app already uses (same handler, same
 * checks). The OpenAPI document and the MCP tools are made from this list.
 */
export const V1: V1Op[] = [
  { name: "whoami", endpoint: publicApi.me, scope: null, summary: "The business, person and permissions this token acts for" },
  read("get_business", business.get, "The business: name, country, currency, tax registrations and settings"),
  read("get_home", home.summary, "Money in, money out, profit and the tax estimate for a period"),
  read("search", home.search, "Search customers, invoices, quotes, suppliers, bills and expenses"),
  read("money_in_summary", comingIn.summary, "What's owed, late and on the way, and recent invoices"),
  read("list_customers", comingIn.listCustomers, "Customers, optionally matching a search"),
  read("get_customer", comingIn.getCustomer, "One customer with their invoices, quotes and what they paid this year"),
  read("list_items", comingIn.listItems, "Saved products and services"),
  read("list_invoices", comingIn.listInvoices, "Invoices and credit notes, filtered by status or customer"),
  read("get_invoice", comingIn.getInvoice, "One invoice with its lines, payments and history"),
  read("list_quotes", comingIn.listQuotes, "Quotes"),
  read("get_quote", comingIn.getQuote, "One quote with its lines"),
  read("list_recurring_invoices", comingIn.listRecurring, "Invoices that repeat on a schedule"),
  read("get_recurring_invoice", comingIn.getRecurring, "One repeating invoice and the invoices it made"),
  read("money_out_summary", goingOut.summary, "Spending by category, bills to pay and suppliers for a period"),
  read("money_out", goingOut.moneyOut, "Money paid out and still to pay"),
  read("list_categories", goingOut.setup, "Spending categories and payment methods for the business's country"),
  read("list_suppliers", goingOut.suppliers, "Suppliers"),
  read("get_supplier", goingOut.supplier, "One supplier with their expenses, bills and payments"),
  read("list_expenses", goingOut.expenses, "Expenses, filtered by category, supplier or dates"),
  read("get_expense", goingOut.expense, "One expense"),
  read("list_bills", goingOut.bills, "Bills from suppliers"),
  read("get_bill", goingOut.bill, "One bill with its payments"),
  read("list_monthly_costs", goingOut.monthly, "Costs that repeat every month"),
  read("list_proposals", agents.proposals, "Suggestions waiting for a person, or already decided"),
  read("get_proposal", agents.proposal, "One suggestion: whether it was approved, and where it landed"),
  { name: "propose", endpoint: publicApi.propose, scope: "books:propose", summary: "Suggest an expense, bill, payment or reminder for a person to approve" },
];

// ---------------------------------------------------------------------------
// The web app's side: tokens and connected apps in settings, and the consent screen.

export const ApiToken = z.object({
  id: z.string(),
  name: z.string(),
  prefix: z.string(),
  scopes: z.array(ApiScope),
  owner: z.string(),
  mine: z.boolean(),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
});

export const ConnectedApp = z.object({
  grantId: z.string(),
  name: z.string(),
  /** Where the app says it lives, for the person to recognise it. */
  host: z.string().nullable(),
  scopes: z.array(ApiScope),
  owner: z.string(),
  mine: z.boolean(),
  connectedAt: z.string(),
  lastUsedAt: z.string().nullable(),
});

export const ApiCall = z.object({
  at: z.string(),
  surface: z.enum(["rest", "mcp"]),
  operation: z.string(),
  status: z.number().int(),
  ms: z.number().int(),
  by: z.string(),
});

export const AuthorizeParams = z.object({
  response_type: z.string().optional(),
  client_id: z.string().max(2000).optional(),
  redirect_uri: z.string().max(2000).optional(),
  scope: z.string().max(500).optional(),
  state: z.string().max(2000).optional(),
  code_challenge: z.string().max(200).optional(),
  code_challenge_method: z.string().optional(),
  resource: z.string().max(2000).optional(),
});
export type AuthorizeParams = z.infer<typeof AuthorizeParams>;

export const apiAccess = {
  list: endpoint({
    method: "GET", path: "/api-access",
    response: z.object({
      tokens: z.array(ApiToken),
      apps: z.array(ConnectedApp),
      calls: z.array(ApiCall),
      usage: z.object({ today: z.number().int(), dailyQuota: z.number().int(), perMinute: z.number().int() }),
      /** Where outside apps connect: the MCP server and the REST API. */
      urls: z.object({ mcp: z.string(), rest: z.string(), docs: z.string() }),
    }),
  }),
  createToken: endpoint({
    method: "POST", path: "/api-access/tokens",
    body: z.object({
      name: z.string().trim().min(1, "Give it a name you'll recognise").max(80),
      scopes: z.array(ApiScope).min(1, "Pick at least one"),
      expiresInDays: z.union([z.literal(30), z.literal(90), z.literal(365)]).nullable(),
    }),
    /** The token itself is shown once and never again. */
    response: z.object({ token: z.string(), info: ApiToken }),
  }),
  revokeToken: endpoint({ method: "POST", path: "/api-access/tokens/:id/revoke", body: z.object({}), response: Ok }),
  revokeApp: endpoint({ method: "POST", path: "/api-access/apps/:id/revoke", body: z.object({}), response: Ok }),

  /** The consent screen: is this request sound, and who is asking? */
  authorizeCheck: endpoint({
    method: "POST", path: "/oauth/authorize/check", auth: "user",
    body: AuthorizeParams,
    response: z.object({
      client: z.object({ name: z.string(), host: z.string().nullable(), logoUri: z.string().nullable(), verified: z.boolean() }),
      scopes: z.array(ApiScope),
      redirectHost: z.string(),
      businesses: z.array(z.object({ id: z.string(), name: z.string(), role: z.string() })),
      /** Set when the request can't go ahead but the app should hear why: send the person here. */
      errorRedirect: z.string().nullable(),
    }),
  }),
  authorizeDecide: endpoint({
    method: "POST", path: "/oauth/authorize/decide", auth: "user",
    body: AuthorizeParams.extend({ businessId: z.string().uuid().optional(), allow: z.boolean() }),
    response: z.object({ redirect: z.string() }),
  }),
};
