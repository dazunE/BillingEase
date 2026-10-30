import multipart from "@fastify/multipart";
import { ATTACHMENT_MAX_BYTES, AttachmentOwnerQuery, goingOut } from "@billingease/contracts";
import type { Exec } from "@billingease/db";
import { attachments, bills, expenses } from "@billingease/db/schema";
import { and, asc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { logActivity } from "../../lib/activity";
import { AppError, badRequest, notFound } from "../../lib/errors";
import { route } from "../../lib/route";

type AttachmentRow = typeof attachments.$inferSelect;

/** What the bytes really are: only photos and PDFs are kept. Returns the type and file extension. */
export function sniff(buf: Uint8Array): { mime: string; ext: string } | null {
  const at = (i: number, ...bytes: number[]) => bytes.every((b, j) => buf[i + j] === b);
  const ascii = (i: number, s: string) => at(i, ...[...s].map((c) => c.charCodeAt(0)));
  if (ascii(0, "%PDF-")) return { mime: "application/pdf", ext: ".pdf" };
  if (at(0, 0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: ".jpg" };
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { mime: "image/png", ext: ".png" };
  if (ascii(0, "GIF87a") || ascii(0, "GIF89a")) return { mime: "image/gif", ext: ".gif" };
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return { mime: "image/webp", ext: ".webp" };
  if (ascii(4, "ftyp")) {
    const brand = String.fromCharCode(...buf.slice(8, 12));
    if (["heic", "heix", "heim", "heis", "hevc", "hevx"].includes(brand)) return { mime: "image/heic", ext: ".heic" };
    if (["mif1", "msf1"].includes(brand)) return { mime: "image/heif", ext: ".heif" };
  }
  return null;
}

const out = (a: AttachmentRow) => ({
  id: a.id, ownerType: a.ownerType as "expense" | "bill", ownerId: a.ownerId, filename: a.filename, mime: a.mime, size: a.size, createdAt: a.createdAt.toISOString(),
});

/** The expense or bill must belong to the business. */
async function checkOwner(db: Exec, businessId: string, ownerType: "expense" | "bill", ownerId: string) {
  const table = ownerType === "expense" ? expenses : bills;
  const [row] = await db.select({ id: table.id }).from(table).where(and(eq(table.id, ownerId), eq(table.businessId, businessId)));
  if (!row) throw notFound(ownerType === "expense" ? "That expense" : "That bill");
}

async function attachmentRow(db: Exec, businessId: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw notFound("That file");
  const [a] = await db.select().from(attachments).where(and(eq(attachments.id, id), eq(attachments.businessId, businessId)));
  if (!a || (a.ownerType !== "expense" && a.ownerType !== "bill" && a.ownerType !== "capture")) throw notFound("That file");
  return a;
}

export const safeName = (s: string) => s.replace(/[\r\n"\\/]/g, "").replace(/[^\x20-\x7e]/g, "_").slice(0, 150) || "file";

export async function attachmentRoutes(app: FastifyInstance) {
  // Only this area takes uploads: photos and PDFs up to 10 MB, one file at a time.
  await app.register(multipart, { limits: { fileSize: ATTACHMENT_MAX_BYTES, files: 1, fields: 10, fieldSize: 1000 } });

  route(app, goingOut.uploadAttachment, async ({ req, ctx }) => {
    const b = ctx.business;
    if (!req.isMultipart()) throw badRequest("Send the file as a form upload.");
    const fields: Record<string, string> = {};
    let file: { filename: string; bytes: Buffer } | null = null;
    try {
      for await (const part of req.parts()) {
        if (part.type === "file") file = { filename: part.filename, bytes: await part.toBuffer() };
        else fields[part.fieldname] = String(part.value ?? "");
      }
    } catch (err) {
      if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") throw new AppError(413, "too_large", "That file is over 10 MB. Try a smaller photo or PDF.", { file: "Over 10 MB" });
      throw err;
    }
    const owner = AttachmentOwnerQuery.safeParse(fields);
    if (!owner.success) throw badRequest("Say which expense or bill the file is for.");
    if (!file || file.bytes.length === 0) throw badRequest("Choose a photo or PDF to attach.", { file: "Choose a photo or PDF" });
    const kind = sniff(file.bytes);
    if (!kind) throw new AppError(415, "file_type", "Attach a photo (JPEG, PNG, WebP, HEIC) or a PDF.", { file: "Photos and PDFs only" });
    await checkOwner(ctx.db, b.id, owner.data.ownerType, owner.data.ownerId);
    const key = await ctx.services.storage.put(b.id, file.bytes, kind.ext);
    const [row] = await ctx.db.insert(attachments).values({
      businessId: b.id, ownerType: owner.data.ownerType, ownerId: owner.data.ownerId, storageKey: key,
      filename: safeName(file.filename), mime: kind.mime, size: file.bytes.length, createdBy: ctx.user.id,
    }).returning();
    await logActivity(ctx.db, b.id, `${row.filename} attached to ${row.ownerType === "expense" ? "an expense" : "a bill"}`, { actorId: ctx.user.id, link: `/app/out/${row.ownerType === "expense" ? "expenses" : "bills"}/${row.ownerId}` });
    return out(row);
  });

  route(app, goingOut.attachments, async ({ query, ctx }) => {
    await checkOwner(ctx.db, ctx.business.id, query.ownerType, query.ownerId);
    const rows = await ctx.db.select().from(attachments)
      .where(and(eq(attachments.businessId, ctx.business.id), eq(attachments.ownerType, query.ownerType), eq(attachments.ownerId, query.ownerId))).orderBy(asc(attachments.createdAt));
    return { attachments: rows.map(out) };
  });

  route(app, goingOut.attachmentFile, async ({ params, req, reply, ctx }) => {
    const a = await attachmentRow(ctx.db, ctx.business.id, params.id);
    const bytes = await ctx.services.storage.get(a.storageKey).catch(() => {
      throw notFound("That file");
    });
    const download = (req.query as Record<string, string> | undefined)?.download === "1";
    const name = safeName(a.filename);
    return reply
      .header("content-type", a.mime)
      .header("content-length", bytes.length)
      .header("content-disposition", `${download ? "attachment" : "inline"}; filename="${name}"; filename*=UTF-8''${encodeURIComponent(a.filename)}`)
      .header("x-content-type-options", "nosniff")
      .header("cache-control", "private, no-store")
      .send(Buffer.from(bytes));
  });

  route(app, goingOut.deleteAttachment, async ({ params, ctx }) => {
    const a = await attachmentRow(ctx.db, ctx.business.id, params.id);
    await ctx.db.delete(attachments).where(and(eq(attachments.id, a.id), eq(attachments.businessId, ctx.business.id)));
    await ctx.services.storage.remove(a.storageKey).catch(() => {});
    await logActivity(ctx.db, ctx.business.id, `${a.filename} removed`, { actorId: ctx.user.id });
    return { ok: true as const };
  });
}
