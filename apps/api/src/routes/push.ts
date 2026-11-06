import { push } from "@billingease/contracts";
import { pushDevices } from "@billingease/db/schema";
import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { route } from "../lib/route";

/** Phones that get push notifications, registered by the person signed in on them. */
export async function pushRoutes(app: FastifyInstance) {
  route(app, push.register, async ({ body, ctx }) => {
    const row = { userId: ctx.user.id, token: body.token, platform: body.platform, name: body.name ?? null, kinds: [...new Set(body.kinds)], disabledAt: null, lastSeenAt: new Date() };
    // A token belongs to one phone; if someone else signs in on it, it moves to them.
    const [d] = await ctx.db.insert(pushDevices).values(row)
      .onConflictDoUpdate({ target: pushDevices.token, set: row }).returning();
    return { token: d.token, platform: d.platform, kinds: d.kinds as (typeof body.kinds) };
  });

  route(app, push.unregister, async ({ body, ctx }) => {
    await ctx.db.delete(pushDevices).where(and(eq(pushDevices.token, body.token), eq(pushDevices.userId, ctx.user.id)));
    return { ok: true as const };
  });
}
