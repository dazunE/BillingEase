import { goingOut, type Endpoint, type Proposal, type ProposalKind } from "@billingease/contracts";
import type { Exec } from "@billingease/db";
import { attachments, bills, expenses, proposals, users, type ProposalSource } from "@billingease/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { logActivity, notify } from "../../lib/activity";
import type { BizCtx } from "../../lib/context";
import { AppError, notFound } from "../../lib/errors";
import { agentName } from "./registry";

/**
 * What each proposal kind does when approved: the endpoint it calls, and where the result
 * lives. Adding a kind here is the only way an agent gains a new kind of change.
 */
export const KINDS: Record<ProposalKind, { endpoint: Endpoint; table: "expenses" | "bills"; href: (id: string) => string; noun: string }> = {
  "expense.create": { endpoint: goingOut.createExpense, table: "expenses", href: (id) => `/app/out/expenses/${id}`, noun: "expense" },
  "bill.create": { endpoint: goingOut.createBill, table: "bills", href: (id) => `/app/out/bills/${id}`, noun: "bill" },
};

/** Proposals stay open this long, then expire. */
const OPEN_DAYS = 30;

type Row = typeof proposals.$inferSelect;

export function toProposal(r: Row, decidedBy: string | null = null): Proposal {
  return {
    id: r.id, agent: r.agent, agentName: agentName(r.agent), kind: r.kind as ProposalKind, payload: r.payload,
    title: r.title, summary: r.summary, confidence: r.confidence, sources: r.sources, status: r.status,
    proposedBy: r.proposedByKind, edits: r.edits, decidedBy, decidedAt: r.decidedAt?.toISOString() ?? null, reason: r.reason,
    appliedHref: r.appliedId && KINDS[r.kind as ProposalKind] ? KINDS[r.kind as ProposalKind].href(r.appliedId) : null,
    error: r.error, createdAt: r.createdAt.toISOString(),
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
  payload: Record<string, unknown>;
  title: string;
  summary: string;
  confidence?: number | null;
  sources?: ProposalSource[];
  proposedByKind?: "agent" | "api_client" | "practice";
}) {
  const k = KINDS[p.kind];
  const check = k.endpoint.body!.safeParse(p.payload);
  if (!check.success) {
    throw new AppError(400, "invalid_proposal", "That proposal doesn't fit what BillingEase accepts.", Object.fromEntries(check.error.issues.map((i) => [i.path.join(".") || "_", i.message])));
  }
  const [row] = await db.insert(proposals).values({
    businessId: p.businessId, runId: p.runId, agent: p.agent, kind: p.kind, payload: p.payload,
    title: p.title.slice(0, 200), summary: p.summary.slice(0, 1000),
    confidence: p.confidence == null ? null : Math.max(0, Math.min(100, Math.round(p.confidence))),
    sources: p.sources ?? [], proposedByKind: p.proposedByKind ?? "agent",
    expiresAt: new Date(Date.now() + OPEN_DAYS * 86_400_000),
  }).returning();
  await notify(db, p.businessId, `${agentName(p.agent)} has something for you to check`, { body: row.title, link: "/app/check" });
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
    res = await app.inject({ method: k.endpoint.method, url: k.endpoint.path, headers, payload: JSON.stringify(payload) });
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
  const appliedId = String(body.id);
  await ctx.db.transaction(async (tx) => {
    await tx.update(proposals).set({ status: "applied", appliedTable: k.table, appliedId, payload, edits: edits ?? (edited ? {} : null) }).where(eq(proposals.id, p.id));
    const table = k.table === "expenses" ? expenses : bills;
    await tx.update(table).set({ createdVia: "agent", proposalId: p.id }).where(and(eq(table.id, appliedId), eq(table.businessId, ctx.business.id)));
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
    await logActivity(tx, ctx.business.id, `${ctx.user.name} turned down ${agentName(p.agent)}'s suggestion: ${p.title}`, { actorId: ctx.user.id });
  });
  return loadProposal(ctx, id);
}
