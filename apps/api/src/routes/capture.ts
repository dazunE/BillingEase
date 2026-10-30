import multipart from "@fastify/multipart";
import { agents, ATTACHMENT_MAX_BYTES } from "@billingease/contracts";
import { attachments, documentExtractions } from "@billingease/db/schema";
import { and, desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { CAPTURE_QUEUE } from "../agents/capture";
import { enqueue } from "../agents/platform/queue";
import { budgetFor, spentThisMonth, monthOf, BudgetReachedError } from "../agents/platform/runner";
import { today } from "@billingease/core";
import { logActivity } from "../lib/activity";
import { AppError, badRequest, notFound } from "../lib/errors";
import { route } from "../lib/route";
import { safeName, sniff } from "./going-out/attachments";

type Row = { x: typeof documentExtractions.$inferSelect; a: typeof attachments.$inferSelect };
const out = ({ x, a }: Row) => ({
  id: x.id, attachmentId: a.id, filename: a.filename, mime: a.mime, status: x.status, error: x.error, proposalId: x.proposalId, createdAt: x.createdAt.toISOString(),
});

/**
 * Photos and PDFs for the capture agent. The upload is kept as a "capture" attachment and read
 * in the background (the jobs queue); what it read waits in For you to check.
 */
export async function captureRoutes(root: FastifyInstance) {
  // Its own scope, with its own upload limits (the multipart parser is per scope).
  await root.register(async (app) => {
    await app.register(multipart, { limits: { fileSize: ATTACHMENT_MAX_BYTES, files: 1, fields: 5, fieldSize: 200 } });
    route(app, agents.upload, async ({ req, ctx }) => {
      const b = ctx.business;
      if (!ctx.services.models) throw new AppError(503, "ai_not_set_up", "Reading receipts needs Vertex AI, which isn't set up on this BillingEase yet. You can still add the expense by hand.");
      const settings = await budgetFor(ctx.db, ctx.config, b.id, "capture");
      if (!settings.enabled) throw new AppError(409, "agent_off", "Capture is turned off for this business. The owner can turn it on in Settings.");
      if ((await spentThisMonth(ctx.db, b.id, monthOf(today()))) >= settings.budgetMicros) throw new BudgetReachedError();
      if (!req.isMultipart()) throw badRequest("Send the file as a form upload.");
      let file: { filename: string; bytes: Buffer } | null = null;
      try {
        for await (const part of req.parts()) if (part.type === "file" && !file) file = { filename: part.filename, bytes: await part.toBuffer() };
      } catch (err) {
        if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") throw new AppError(413, "too_large", "That file is over 10 MB. Try a smaller photo or PDF.", { file: "Over 10 MB" });
        throw err;
      }
      if (!file || file.bytes.length === 0) throw badRequest("Choose a photo or PDF of the receipt or bill.", { file: "Choose a photo or PDF" });
      const kind = sniff(file.bytes);
      if (!kind) throw new AppError(415, "file_type", "Send a photo (JPEG, PNG, WebP, HEIC) or a PDF.", { file: "Photos and PDFs only" });
      const key = await ctx.services.storage.put(b.id, file.bytes, kind.ext);
      const row = await ctx.db.transaction(async (tx) => {
        const id = crypto.randomUUID();
        const [a] = await tx.insert(attachments).values({
          businessId: b.id, ownerType: "capture", ownerId: id, storageKey: key, filename: safeName(file.filename), mime: kind.mime, size: file.bytes.length, createdBy: ctx.user.id,
        }).returning();
        const [x] = await tx.insert(documentExtractions).values({ id, businessId: b.id, attachmentId: a.id, createdBy: ctx.user.id }).returning();
        await logActivity(tx, b.id, `${a.filename} sent to Capture to read`, { actorId: ctx.user.id, link: "/app/check" });
        return { x, a };
      });
      await enqueue(ctx.db, { queue: CAPTURE_QUEUE, businessId: b.id, payload: { extractionId: row.x.id }, dedupeKey: `capture:${row.x.id}` });
      return out(row);
    }, { rateLimit: { max: 30, timeWindow: "1 minute" } });

    route(app, agents.captures, async ({ ctx }) => {
      const rows = await ctx.db.select({ x: documentExtractions, a: attachments }).from(documentExtractions)
        .innerJoin(attachments, eq(attachments.id, documentExtractions.attachmentId))
        .where(eq(documentExtractions.businessId, ctx.business.id)).orderBy(desc(documentExtractions.createdAt)).limit(30);
      return { captures: rows.map(out) };
    });

    route(app, agents.retryCapture, async ({ params, ctx }) => {
      if (!/^[0-9a-f-]{36}$/i.test(params.id)) throw notFound("That upload");
      const [row] = await ctx.db.select({ x: documentExtractions, a: attachments }).from(documentExtractions)
        .innerJoin(attachments, eq(attachments.id, documentExtractions.attachmentId))
        .where(and(eq(documentExtractions.id, params.id), eq(documentExtractions.businessId, ctx.business.id)));
      if (!row) throw notFound("That upload");
      if (row.x.status !== "failed") throw new AppError(409, "capture_busy", row.x.status === "done" ? "That one has been read already." : "That one is still being read.");
      const [x] = await ctx.db.update(documentExtractions).set({ status: "queued", error: null, updatedAt: new Date() }).where(eq(documentExtractions.id, row.x.id)).returning();
      await enqueue(ctx.db, { queue: CAPTURE_QUEUE, businessId: ctx.business.id, payload: { extractionId: x.id }, dedupeKey: `capture:${x.id}` });
      return out({ x, a: row.a });
    });
  });
}
