import { business, KINDS_BY_COUNTRY } from "@billingease/contracts";
import { rulesFor } from "@billingease/core";
import { seedAccounts } from "@billingease/db";
import { businesses, memberships } from "@billingease/db/schema";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { logActivity } from "../lib/activity";
import type { BusinessRow, Role } from "../lib/context";
import { badRequest } from "../lib/errors";
import { route } from "../lib/route";

export function businessOut(b: BusinessRow, role: Role) {
  return { ...b, role };
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
}
