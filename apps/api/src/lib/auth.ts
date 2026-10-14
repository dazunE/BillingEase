import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Endpoint } from "@billingease/contracts";
import { businesses, memberships, sessions, users } from "@billingease/db/schema";
import { and, eq, gt } from "drizzle-orm";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Ctx, Role } from "./context";
import { AppError, forbidden } from "./errors";

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Works out who is calling. The web server sends the user's session token as a Bearer token
 * and the business they're working in as X-Business-Id; with one business it can be left out.
 */
export async function authenticate(app: FastifyInstance, req: FastifyRequest, e: Endpoint): Promise<Ctx> {
  const { db, config, services } = app.be;
  const ctx: Ctx = { db, config, services, user: null, sessionId: null, business: null, role: null };
  if (config.internalKey) {
    const key = req.headers["x-internal-key"];
    if (typeof key !== "string" || !safeEqual(key, config.internalKey)) throw new AppError(401, "unauthorised", "This API only answers the BillingEase web app.");
  }
  const mode = e.auth ?? "business";
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    const [row] = await db
      .select({ sid: sessions.id, id: users.id, email: users.email, name: users.name })
      .from(sessions).innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())));
    if (row) {
      ctx.user = { id: row.id, email: row.email, name: row.name };
      ctx.sessionId = row.sid;
    }
  }
  if (mode === "public") return ctx;
  if (!ctx.user) throw new AppError(401, "unauthorised", "Please sign in.");
  if (mode === "user") return ctx;

  const wanted = req.headers["x-business-id"];
  const rows = await db
    .select({ business: businesses, role: memberships.role })
    .from(memberships).innerJoin(businesses, eq(businesses.id, memberships.businessId))
    .where(and(eq(memberships.userId, ctx.user.id), typeof wanted === "string" && wanted ? eq(businesses.id, wanted) : undefined));
  if (rows.length === 0) throw new AppError(typeof wanted === "string" && wanted ? 403 : 409, typeof wanted === "string" && wanted ? "forbidden" : "no_business", typeof wanted === "string" && wanted ? "You don't have access to that business." : "Set up your business first.");
  if (rows.length > 1) throw new AppError(400, "pick_business", "Say which business with X-Business-Id.");
  ctx.business = rows[0].business;
  ctx.role = rows[0].role as Role;
  if (e.roles && !e.roles.includes(ctx.role)) throw forbidden();
  return ctx;
}
