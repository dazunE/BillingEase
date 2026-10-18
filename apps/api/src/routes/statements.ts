import multipart from "@fastify/multipart";
import { agents, ATTACHMENT_MAX_BYTES } from "@billingease/contracts";
import { today } from "@billingease/core";
import { attachments, bankStatementLines, bankStatements, proposals } from "@billingease/db/schema";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { KINDS } from "../agents/platform/proposals";
import { enqueue } from "../agents/platform/queue";
import { budgetFor, BudgetReachedError, monthOf, spentThisMonth } from "../agents/platform/runner";
import { STATEMENT_QUEUE } from "../agents/statements";
import { logActivity } from "../lib/activity";
import type { BizCtx } from "../lib/context";
import { AppError, badRequest, notFound } from "../lib/errors";
import { route } from "../lib/route";
import { safeName, sniff } from "./going-out/attachments";

type S = typeof bankStatements.$inferSelect;
type A = typeof attachments.$inferSelect;

/** A CSV is text with commas, semicolons, tabs or pipes, and no zero bytes. */
function isCsv(filename: string, bytes: Buffer) {
  if (bytes.subarray(0, 4096).includes(0)) return false;
  const head = bytes.subarray(0, 4096).toString("utf8");
  return /\.(csv|txt|tsv)$/i.test(filename) || /[,;\t|]/.test(head.split("\n")[0] ?? "");
}

const HREF: Record<string, (id: string) => string> = {
  expenses: (id) => `/app/out/expenses/${id}`, bills: (id) => `/app/out/bills/${id}`, invoices: (id) => `/app/in/invoices/${id}`,
};

async function counts(ctx: BizCtx, ids: string[]) {
  if (!ids.length) return new Map<string, Record<string, number>>();
  const rows = await ctx.db.select({ id: bankStatementLines.statementId, status: bankStatementLines.status, n: count() }).from(bankStatementLines)
    .where(and(eq(bankStatementLines.businessId, ctx.business.id), inArray(bankStatementLines.statementId, ids))).groupBy(bankStatementLines.statementId, bankStatementLines.status);
  const waiting = await ctx.db.select({ id: bankStatementLines.statementId, n: count() }).from(bankStatementLines)
    .innerJoin(proposals, eq(proposals.id, bankStatementLines.proposalId))
    .where(and(eq(bankStatementLines.businessId, ctx.business.id), inArray(bankStatementLines.statementId, ids), eq(proposals.status, "pending"))).groupBy(bankStatementLines.statementId);
  const out = new Map<string, Record<string, number>>();
  for (const r of rows) out.set(r.id, { ...(out.get(r.id) ?? {}), [r.status]: r.n });
  for (const w of waiting) out.set(w.id, { ...(out.get(w.id) ?? {}), waiting: w.n });
  return out;
}

const out = (s: S, a: A, c: Record<string, number> = {}) => ({
  id: s.id, attachmentId: a.id, filename: a.filename, format: s.format, status: s.status, readBy: s.readBy, accountLabel: s.accountLabel,
  periodFrom: s.periodFrom, periodTo: s.periodTo, openingBalance: s.openingBalance, closingBalance: s.closingBalance, lineCount: s.lineCount, balanceProblems: s.balanceProblems,
  counts: { matched: c.matched ?? 0, proposed: c.proposed ?? 0, waiting: c.waiting ?? 0, unmatched: c.unmatched ?? 0, ignored: c.ignored ?? 0 },
  error: s.error, createdAt: s.createdAt.toISOString(),
});

/**
 * Bank statements the owner uploads (any bank's CSV or PDF; not a feed). Read and matched in
 * the background; the lines that become payments or expenses wait in For you to check.
 */
export async function statementRoutes(root: FastifyInstance) {
  await root.register(async (app) => {
    await app.register(multipart, { limits: { fileSize: ATTACHMENT_MAX_BYTES, files: 1, fields: 5, fieldSize: 200 } });

    route(app, agents.uploadStatement, async ({ req, ctx }) => {
      const b = ctx.business;
      if (!ctx.services.models) throw new AppError(503, "ai_not_set_up", "Reading statements needs Vertex AI, which isn't set up on this BillingEase yet.");
      const settings = await budgetFor(ctx.db, ctx.config, b.id, "statements");
      if (!settings.enabled) throw new AppError(409, "agent_off", "Bank statements is turned off for this business. The owner can turn it on in Settings.");
      if ((await spentThisMonth(ctx.db, b.id, monthOf(today()))) >= settings.budgetMicros) throw new BudgetReachedError();
      if (!req.isMultipart()) throw badRequest("Send the file as a form upload.");
      let file: { filename: string; bytes: Buffer } | null = null;
      try {
        for await (const part of req.parts()) if (part.type === "file" && !file) file = { filename: part.filename, bytes: await part.toBuffer() };
      } catch (err) {
        if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") throw new AppError(413, "too_large", "That file is over 10 MB. Export a shorter period.", { file: "Over 10 MB" });
        throw err;
      }
      if (!file || file.bytes.length === 0) throw badRequest("Choose your bank statement (CSV or PDF).", { file: "Choose a CSV or PDF" });
      const pdf = sniff(file.bytes)?.mime === "application/pdf";
      if (!pdf && !isCsv(file.filename, file.bytes)) throw new AppError(415, "file_type", "Send the statement as a CSV or PDF from your bank.", { file: "CSV or PDF only" });
      const key = await ctx.services.storage.put(b.id, file.bytes, pdf ? ".pdf" : ".csv");
      const row = await ctx.db.transaction(async (tx) => {
        const id = crypto.randomUUID();
        const [a] = await tx.insert(attachments).values({
          businessId: b.id, ownerType: "statement", ownerId: id, storageKey: key, filename: safeName(file.filename),
          mime: pdf ? "application/pdf" : "text/csv", size: file.bytes.length, createdBy: ctx.user.id,
        }).returning();
        const [s] = await tx.insert(bankStatements).values({ id, businessId: b.id, attachmentId: a.id, format: pdf ? "pdf" : "csv", createdBy: ctx.user.id }).returning();
        await logActivity(tx, b.id, `Bank statement ${a.filename} uploaded`, { actorId: ctx.user.id, link: `/app/statements/${s.id}` });
        return { s, a };
      });
      await enqueue(ctx.db, { queue: STATEMENT_QUEUE, businessId: b.id, payload: { statementId: row.s.id }, dedupeKey: `statement:${row.s.id}` });
      return out(row.s, row.a);
    }, { rateLimit: { max: 10, timeWindow: "1 minute" } });
  });

  route(root, agents.statements, async ({ ctx }) => {
    const rows = await root.be.db.select({ s: bankStatements, a: attachments }).from(bankStatements).innerJoin(attachments, eq(attachments.id, bankStatements.attachmentId))
      .where(eq(bankStatements.businessId, ctx.business.id)).orderBy(desc(bankStatements.createdAt)).limit(50);
    const c = await counts(ctx, rows.map((r) => r.s.id));
    return { statements: rows.map((r) => out(r.s, r.a, c.get(r.s.id))) };
  });

  const load = async (ctx: BizCtx, id: string) => {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw notFound("That statement");
    const [r] = await ctx.db.select({ s: bankStatements, a: attachments }).from(bankStatements).innerJoin(attachments, eq(attachments.id, bankStatements.attachmentId))
      .where(and(eq(bankStatements.id, id), eq(bankStatements.businessId, ctx.business.id)));
    if (!r) throw notFound("That statement");
    return r;
  };

  route(root, agents.statement, async ({ params, ctx }) => {
    const r = await load(ctx, params.id);
    const lines = await ctx.db.select({ l: bankStatementLines, p: proposals }).from(bankStatementLines).leftJoin(proposals, eq(proposals.id, bankStatementLines.proposalId))
      .where(eq(bankStatementLines.statementId, r.s.id)).orderBy(asc(bankStatementLines.seq));
    const c = await counts(ctx, [r.s.id]);
    return {
      statement: out(r.s, r.a, c.get(r.s.id)),
      lines: lines.map(({ l, p }) => {
        const appliedHref = p?.appliedId && KINDS[p.kind as keyof typeof KINDS] ? KINDS[p.kind as keyof typeof KINDS].href(p.appliedId) : null;
        const matchedHref = l.matchedTable && l.matchedId && HREF[l.matchedTable] ? HREF[l.matchedTable](l.matchedId) : null;
        return {
          id: l.id, seq: l.seq, date: l.date, description: l.description, amount: l.amount, balance: l.balance, reference: l.reference, status: l.status,
          href: appliedHref ?? matchedHref, proposalId: l.proposalId, proposalStatus: p?.status ?? null, proposalConfidence: p?.confidence ?? null, note: l.note,
        };
      }),
    };
  });

  route(root, agents.retryStatement, async ({ params, ctx }) => {
    const r = await load(ctx, params.id);
    if (r.s.status !== "failed") throw new AppError(409, "statement_busy", r.s.status === "done" ? "That statement has been read already." : "That statement is still being read.");
    const [s] = await ctx.db.update(bankStatements).set({ status: "queued", error: null, updatedAt: new Date() }).where(eq(bankStatements.id, r.s.id)).returning();
    await enqueue(ctx.db, { queue: STATEMENT_QUEUE, businessId: ctx.business.id, payload: { statementId: s.id }, dedupeKey: `statement:${s.id}` });
    return out(s, r.a);
  });
}
