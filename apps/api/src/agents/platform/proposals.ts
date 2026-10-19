import { comingIn, goingOut, type Endpoint, type Proposal, type ProposalKind } from "@billingease/contracts";
import type { Exec } from "@billingease/db";
import { attachments, bankStatementLines, bills, expenses, proposals, users, type ProposalSource } from "@billingease/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { logActivity, notify } from "../../lib/activity";
import type { BizCtx } from "../../lib/context";
import { AppError, notFound } from "../../lib/errors";
import { agentName } from "./registry";

type Kind = {
  endpoint: Endpoint;
  /** Where the result lives once applied. */
  table: "expenses" | "bills" | "invoices";
  /** The endpoint acts on an invoice or bill (its :id is the proposal's target). */
  target?: "invoices" | "bills";
  /** The new row's id (creates), or the target's (payments, reminders). */
  appliedId: (response: { id?: string; invoice?: { id: string } }, targetId: string | null) => string;
  href: (id: string) => string;
  noun: string;
  /** Keep what the endpoint said (a reminder's WhatsApp link) to show after approving. */
  keepResult?: boolean;
};

/**
 * What each proposal kind does when approved: the endpoint it calls, and where the result
 * lives. Adding a kind here is the only way an agent gains a new kind of change.
 */
export const KINDS: Record<ProposalKind, Kind> = {
  "expense.create": { endpoint: goingOut.createExpense, table: "expenses", appliedId: (r) => r.id!, href: (id) => `/app/out/expenses/${id}`, noun: "expense" },
  "bill.create": { endpoint: goingOut.createBill, table: "bills", appliedId: (r) => r.id!, href: (id) => `/app/out/bills/${id}`, noun: "bill" },
  "receipt.create": { endpoint: comingIn.recordPayment, table: "invoices", target: "invoices", appliedId: (_r, t) => t!, href: (id) => `/app/in/invoices/${id}`, noun: "payment" },
  "bill_payment.create": { endpoint: goingOut.payBill, table: "bills", target: "bills", appliedId: (_r, t) => t!, href: (id) => `/app/out/bills/${id}`, noun: "bill payment" },
  "invoice.remind": { endpoint: comingIn.remind, table: "invoices", target: "invoices", appliedId: (_r, t) => t!, href: (id) => `/app/in/invoices/${id}`, noun: "reminder", keepResult: true },
};

/** The endpoint's URL for this proposal: its target goes in the :id. */
const urlOf = (k: Kind, targetId: string | null) => (k.target ? k.endpoint.path.replace(":id", targetId ?? "") : k.endpoint.path);

/** Proposals stay open this long, then expire. */
const OPEN_DAYS = 30;

type Row = typeof proposals.$inferSelect;

export function toProposal(r: Row, decidedBy: string | null = null): Proposal {
  return {
    id: r.id, agent: r.agent, agentName: agentName(r.agent), kind: r.kind as ProposalKind, payload: r.payload,
    targetId: r.targetId, title: r.title, summary: r.summary, confidence: r.confidence, sources: r.sources, status: r.status,
    proposedBy: r.proposedByKind, edits: r.edits, decidedBy, decidedAt: r.decidedAt?.toISOString() ?? null, reason: r.reason,
    appliedHref: r.appliedId && KINDS[r.kind as ProposalKind] ? KINDS[r.kind as ProposalKind].href(r.appliedId) : null,
    error: r.error, result: r.result ?? null, createdAt: r.createdAt.toISOString(),
  };
}

/**
 * Records what an agent wants to do. The payload is checked against the endpoint's own
 * schema now, so a person never sees a proposal that couldn't be applied as it stands.
 */
export async function propose(db: Exec, p: {
  businessId: string;
  runId: string | null;
  agent: string;
  kind: ProposalKind;
  /** The invoice or bill it acts on, for kinds that need one. */
  targetId?: string | null;
  payload: Record<string, unknown>;
  title: string;
  summary: string;
  confidence?: number | null;
  sources?: ProposalSource[];
  proposedByKind?: "agent" | "api_client" | "practice";
}, opts: { notify?: boolean } = {}) {
  const k = KINDS[p.kind];
  if (!!k.target !== !!p.targetId) throw new AppError(400, "invalid_proposal", k.target ? "That needs the invoice or bill it is for." : "That doesn't act on an invoice or bill.");
  const check = k.endpoint.body!.safeParse(p.payload);
  if (!check.success) {
    throw new AppError(400, "invalid_proposal", "That proposal doesn't fit what BillingEase accepts.", Object.fromEntries(check.error.issues.map((i) => [i.path.join(".") || "_", i.message])));
  }
  const [row] = await db.insert(proposals).values({
    businessId: p.businessId, runId: p.runId, agent: p.agent, kind: p.kind, targetId: p.targetId ?? null, payload: p.payload,
    title: p.title.slice(0, 200), summary: p.summary.slice(0, 1000),
    confidence: p.confidence == null ? null : Math.max(0, Math.min(100, Math.round(p.confidence))),
    sources: p.sources ?? [], proposedByKind: p.proposedByKind ?? "agent",
    expiresAt: new Date(Date.now() + OPEN_DAYS * 86_400_000),
  }).returning();
  // Agents that make many at once (a statement) send one notice themselves.
  if (opts.notify !== false) await notify(db, p.businessId, `${agentName(p.agent)} has something for you to check`, { body: row.title, link: "/app/check" });
  return row;
}

/** Proposals past their date close as expired before anything reads them. */
export async function expireOld(db: Exec, businessId: string) {
  await db.update(proposals).set({ status: "expired" })
    .where(and(eq(proposals.businessId, businessId), eq(proposals.status, "pending"), sql`${proposals.expiresAt} < now()`));
}

export async function loadProposal(ctx: BizCtx, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw notFound("That proposal");
  await expireOld(ctx.db, ctx.business.id);
  const [r] = await ctx.db.select({ p: proposals, decidedBy: users.name }).from(proposals).leftJoin(users, eq(users.id, proposals.decidedByUserId))
    .where(and(eq(proposals.id, id), eq(proposals.businessId, ctx.business.id)));
  if (!r) throw notFound("That proposal");
  return r;
}

/** Fields a person changed before approving, as {field: [before, after]}. */
function diff(before: Record<string, unknown>, after: Record<string, unknown>) {
  const out: Record<string, [unknown, unknown]> = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null)) out[key] = [before[key] ?? null, after[key] ?? null];
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Applies an approved proposal by calling its endpoint as the approving person, through the
 * app itself, so every check a person's own entry goes through applies: validation, roles,
 * locked periods, the ledger. Claiming the row (pending → applying) first makes a double
 * click or a second tab do nothing. If the endpoint refuses, it goes back to waiting.
 */
export async function approve(app: FastifyInstance, req: FastifyRequest, ctx: BizCtx, id: string, edited?: Record<string, unknown>) {
  const { p } = await loadProposal(ctx, id);
  if (p.status !== "pending") throw new AppError(409, "proposal_decided", `This was already ${p.status === "applied" ? "approved" : p.status}.`);
  const k = KINDS[p.kind as ProposalKind];
  if (!k) throw new AppError(400, "invalid_proposal", "BillingEase doesn't know how to apply that.");
  const payload = edited ? { ...p.payload, ...edited } : p.payload;
  const edits = edited ? diff(p.payload, payload) : null;
  const claimed = await ctx.db.update(proposals)
    .set({ status: "applying", decidedByUserId: ctx.user.id, decidedAt: new Date(), error: null })
    .where(and(eq(proposals.id, p.id), eq(proposals.businessId, ctx.business.id), eq(proposals.status, "pending")))
    .returning({ id: proposals.id });
  if (!claimed.length) throw new AppError(409, "proposal_decided", "Someone has just decided this one.");

  const headers: Record<string, string> = { "content-type": "application/json", "x-business-id": ctx.business.id };
  for (const h of ["authorization", "x-internal-key"] as const) {
    const v = req.headers[h];
    if (typeof v === "string") headers[h] = v;
  }
  let res;
  try {
    res = await app.inject({ method: k.endpoint.method, url: urlOf(k, p.targetId), headers, payload: JSON.stringify(payload) });
  } catch (err) {
    await ctx.db.update(proposals).set({ status: "pending", decidedByUserId: null, decidedAt: null, error: "It couldn't be added just now." }).where(eq(proposals.id, p.id));
    throw err;
  }
  const body = res.body ? res.json() : null;
  if (res.statusCode >= 300) {
    // Refused (a locked period, a detail that doesn't fit): back to waiting, with the reason,
    // so the person can correct it and approve again, or turn it down.
    const message: string = body?.error?.message ?? "It couldn't be added.";
    await ctx.db.update(proposals).set({ status: "pending", decidedByUserId: null, decidedAt: null, error: message }).where(eq(proposals.id, p.id));
    const fields = body?.error?.fields as Record<string, string> | undefined;
    throw new AppError(res.statusCode === 409 ? 409 : 400, body?.error?.code ?? "proposal_failed", message, fields);
  }
  const appliedId = k.appliedId(body ?? {}, p.targetId);
  await ctx.db.transaction(async (tx) => {
    await tx.update(proposals).set({ status: "applied", appliedTable: k.table, appliedId, payload, edits: edits ?? (edited ? {} : null), result: k.keepResult ? body : null }).where(eq(proposals.id, p.id));
    if (!k.target && k.table !== "invoices") {
      const table = k.table === "expenses" ? expenses : bills;
      await tx.update(table).set({ createdVia: "agent", proposalId: p.id }).where(and(eq(table.id, appliedId), eq(table.businessId, ctx.business.id)));
    }
    // A statement line it came from is now matched to what was made or paid.
    const lines = p.sources.filter((s) => s.kind === "statement_line" && s.id).map((s) => s.id!);
    if (lines.length) {
      await tx.update(bankStatementLines).set({ status: "matched", matchedTable: k.table, matchedId: appliedId })
        .where(and(inArray(bankStatementLines.id, lines), eq(bankStatementLines.businessId, ctx.business.id)));
    }
    // The photo or PDF it was read from now belongs to the new expense or bill.
    const files = p.sources.filter((s) => s.kind === "attachment" && s.id).map((s) => s.id!);
    if (files.length) {
      await tx.update(attachments).set({ ownerType: k.table === "expenses" ? "expense" : "bill", ownerId: appliedId })
        .where(and(inArray(attachments.id, files), eq(attachments.businessId, ctx.business.id), eq(attachments.ownerType, "capture")));
    }
    await logActivity(tx, ctx.business.id, `${ctx.user.name} approved ${agentName(p.agent)}'s ${k.noun}: ${p.title}`, { actorId: ctx.user.id, link: k.href(appliedId) });
  });
  return loadProposal(ctx, id);
}

export async function reject(ctx: BizCtx, id: string, reason: string | null) {
  const { p } = await loadProposal(ctx, id);
  if (p.status !== "pending") throw new AppError(409, "proposal_decided", `This was already ${p.status === "applied" ? "approved" : p.status}.`);
  await ctx.db.transaction(async (tx) => {
    await tx.update(proposals).set({ status: "rejected", decidedByUserId: ctx.user.id, decidedAt: new Date(), reason })
      .where(and(eq(proposals.id, p.id), eq(proposals.businessId, ctx.business.id)));
    const lines = p.sources.filter((s) => s.kind === "statement_line" && s.id).map((s) => s.id!);
    if (lines.length) {
      await tx.update(bankStatementLines).set({ status: "ignored", note: `Turned down by ${ctx.user.name}${reason ? `: ${reason}` : ""}` })
        .where(and(inArray(bankStatementLines.id, lines), eq(bankStatementLines.businessId, ctx.business.id)));
    }
    await logActivity(tx, ctx.business.id, `${ctx.user.name} turned down ${agentName(p.agent)}'s suggestion: ${p.title}`, { actorId: ctx.user.id });
  });
  return loadProposal(ctx, id);
}
