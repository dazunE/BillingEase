import { business, KINDS_BY_COUNTRY, LOGO_MAX_BYTES } from "@billingease/contracts";
import { rulesFor } from "@billingease/core";
import { seedAccounts } from "@billingease/db";
import { businesses, memberships } from "@billingease/db/schema";
import { eq } from "drizzle-orm";
import { PDFDocument } from "pdf-lib";
import { authenticate } from "../lib/auth";
import { AppError, notFound } from "../lib/errors";
import type { FastifyInstance } from "fastify";
import { logActivity } from "../lib/activity";
import type { BusinessRow, Role } from "../lib/context";
import { badRequest } from "../lib/errors";
import { route } from "../lib/route";

export function businessOut(b: BusinessRow, role: Role) {
  // The storage key stays private; the page only needs to know there is a logo, and when it changed.
  return { ...b, role, hasLogo: !!b.logoKey, logoVersion: b.logoKey ? b.logoKey.slice(-12).replace(/\W/g, "") : null };
}

/** PNG or JPEG, from the first bytes: the only image types a PDF can carry as they are. */
export function logoType(buf: Uint8Array): { mime: "image/png" | "image/jpeg"; ext: string } | null {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { mime: "image/png", ext: ".png" };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: ".jpg" };
  return null;
}

/** Invoice numbers start from the business's initials: Harper Studio → HS-. */
function prefixFor(name: string) {
  const letters = name.split(/\s+/).filter(Boolean).map((w) => w[0]!.toUpperCase()).join("").replace(/[^A-Z]/g, "").slice(0, 3);
  return (letters || "INV") + "-";
}

export async function businessRoutes(app: FastifyInstance) {
  route(app, business.create, async ({ body, ctx }) => {
    const rules = rulesFor(body.country);
    const row = await ctx.db.transaction(async (tx) => {
      const [b] = await tx.insert(businesses).values({
        ...body,
        currency: rules.currency,
        basis: body.basis ?? rules.defaultBasis,
        quarterType: body.country === "uk" ? body.quarterType : "standard",
        ssclRegistered: body.country === "lk" && body.ssclRegistered,
        termsDays: rules.defaultTermsDays,
        invoicePrefix: prefixFor(body.name),
      }).returning();
      await tx.insert(memberships).values({ businessId: b.id, userId: ctx.user.id, role: "owner" });
      await seedAccounts(tx, b.id, body.country);
      await logActivity(tx, b.id, `${b.name} set up in ${rules.name}`, { actorId: ctx.user.id });
      return b;
    });
    return businessOut(row, "owner");
  });

  route(app, business.get, ({ ctx }) => businessOut(ctx.business, ctx.role));

  route(app, business.update, async ({ body, ctx }) => {
    const b = ctx.business;
    const next = { ...body };
    const vatRegistered = next.vatRegistered ?? b.vatRegistered;
    const vatNumber = next.vatNumber !== undefined ? next.vatNumber : b.vatNumber;
    if (vatRegistered && !vatNumber) throw badRequest("Enter the VAT number.", { vatNumber: "Enter the VAT number" });
    if (b.country !== "lk" && next.ssclRegistered) throw badRequest("SSCL is for Sri Lankan businesses.");
    if (b.country === "us" && next.vatRegistered) throw badRequest("Sales tax isn't set up for US businesses yet.");
    if (next.kind) {
      if (!KINDS_BY_COUNTRY[b.country].includes(next.kind)) throw badRequest("Pick a business type for this country.", { kind: "Not for this country" });
    }
    if (next.settings) next.settings = { ...b.settings, ...next.settings };
    const [row] = await ctx.db.update(businesses).set({ ...next, updatedAt: new Date() }).where(eq(businesses.id, b.id)).returning();
    await logActivity(ctx.db, b.id, "Business details updated", { actorId: ctx.user.id });
    return businessOut(row, ctx.role);
  });

  route(app, business.uploadLogo, async ({ body, ctx }) => {
    const b = ctx.business;
    const bytes = new Uint8Array(Buffer.from(body.image.replace(/^data:[^,]*,/, ""), "base64"));
    if (!bytes.length) throw badRequest("Choose an image for your logo.", { image: "Choose an image" });
    if (bytes.length > LOGO_MAX_BYTES) throw new AppError(413, "too_large", "That image is over 1 MB. Save a smaller version and try again.", { image: "Over 1 MB" });
    const kind = logoType(bytes);
    if (!kind) throw new AppError(415, "file_type", "Use a PNG or JPEG for your logo. A PNG with a transparent background looks best.", { image: "PNG or JPEG only" });
    // It has to open as an image, or it would break every PDF.
    try {
      const probe = await PDFDocument.create();
      const img = kind.mime === "image/png" ? await probe.embedPng(bytes) : await probe.embedJpg(bytes);
      if (img.width < 16 || img.height < 16) throw new Error("tiny");
    } catch {
      throw badRequest("That image couldn't be read. Try saving it again as a PNG.", { image: "Couldn't read it" });
    }
    const key = await ctx.services.storage.put(b.id, bytes, kind.ext);
    const [row] = await ctx.db.update(businesses).set({ logoKey: key, logoMime: kind.mime, updatedAt: new Date() }).where(eq(businesses.id, b.id)).returning();
    if (b.logoKey) await ctx.services.storage.remove(b.logoKey).catch(() => {});
    await logActivity(ctx.db, b.id, b.logoKey ? "Logo changed" : "Logo added", { actorId: ctx.user.id, link: "/app/settings/branding" });
    return businessOut(row, ctx.role);
  });

  route(app, business.removeLogo, async ({ ctx }) => {
    const b = ctx.business;
    const [row] = await ctx.db.update(businesses).set({ logoKey: null, logoMime: null, updatedAt: new Date() }).where(eq(businesses.id, b.id)).returning();
    if (b.logoKey) {
      await ctx.services.storage.remove(b.logoKey).catch(() => {});
      await logActivity(ctx.db, b.id, "Logo removed", { actorId: ctx.user.id, link: "/app/settings/branding" });
    }
    return businessOut(row, ctx.role);
  });

  // The logo's bytes, for the settings page and previews: raw, so registered directly.
  app.get(business.logo.path, async (req, reply) => {
    const ctx = await authenticate(app, req, business.logo);
    const b = ctx.business!;
    if (!b.logoKey || !b.logoMime) throw notFound("A logo");
    const bytes = await ctx.services.storage.get(b.logoKey);
    return reply.header("content-type", b.logoMime).header("cache-control", "private, max-age=3600").header("x-content-type-options", "nosniff").send(Buffer.from(bytes));
  });
}
