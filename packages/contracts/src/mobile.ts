import { agents } from "./agents";
import type { Endpoint } from "./endpoint";
import { auth } from "./auth";
import { business } from "./business";
import { comingIn } from "./coming-in";
import { goingOut } from "./going-out";
import { home } from "./home";

/**
 * Every API endpoint the phone app may call. The web app forwards these (and only these) from
 * `/app-api/*` to the API with the internal key, so the API stays private. The app signs in with
 * email and password and sends its session token as a Bearer token, like the web app's server does.
 */
export const APP_ENDPOINTS = {
  signIn: auth.signIn,
  twoStep: auth.twoStep,
  signOut: auth.signOut,
  me: auth.me,
  business: business.get,

  home: home.summary,
  notifications: home.notifications,
  markRead: home.markRead,
  markAllRead: home.markAllRead,

  inSummary: comingIn.summary,
  customers: comingIn.listCustomers,
  createCustomer: comingIn.createCustomer,
  items: comingIn.listItems,
  invoices: comingIn.listInvoices,
  invoice: comingIn.getInvoice,
  createInvoice: comingIn.createInvoice,
  issueInvoice: comingIn.issueInvoice,
  recordPayment: comingIn.recordPayment,
  remind: comingIn.remind,

  outSetup: goingOut.setup,
  outSummary: goingOut.summary,
  expenses: goingOut.expenses,
  createExpense: goingOut.createExpense,
  categoriseExpense: goingOut.categoriseExpense,
  bills: goingOut.bills,
  payBill: goingOut.payBill,
  /** Multipart: a receipt photo on an expense the phone just saved. */
  uploadAttachment: goingOut.uploadAttachment,

  /** Multipart: a receipt or bill photo for the capture agent to read. */
  capture: agents.upload,
  captures: agents.captures,
  retryCapture: agents.retryCapture,
  /** Multipart: a bank statement (CSV or PDF). */
  uploadStatement: agents.uploadStatement,
  statements: agents.statements,
  statement: agents.statement,
  retryStatement: agents.retryStatement,
  /** For you to check: what the agents drafted, approved or turned down by a person. */
  proposals: agents.proposals,
  proposal: agents.proposal,
  approve: agents.approve,
  reject: agents.reject,
  approveMany: agents.approveMany,
} satisfies Record<string, Endpoint>;

export type AppEndpointName = keyof typeof APP_ENDPOINTS;

const SEGMENT = /^[A-Za-z0-9._~-]+$/;

/**
 * Whether the phone app may call `method path` (a path like `/invoices/3f…/payments`, no query).
 * Path parameters match a single safe segment, so `..` or an encoded slash can't reach anything else.
 */
export function isAppEndpoint(method: string, path: string): boolean {
  const parts = path.split("/");
  if (parts[0] !== "" || parts.slice(1).some((p) => !SEGMENT.test(p) || p === "." || p === "..")) return false;
  return Object.values(APP_ENDPOINTS).some((e) => {
    if (e.method !== method.toUpperCase()) return false;
    const want = e.path.split("/");
    return want.length === parts.length && want.every((w, i) => (w.startsWith(":") ? parts[i].length > 0 : w === parts[i]));
  });
}
