import { auth } from "@billingease/contracts";
import { businesses, memberships, passwordResets, sessions, users } from "@billingease/db/schema";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { hashToken, newToken } from "../lib/auth";
import type { Ctx } from "../lib/context";
import { AppError } from "../lib/errors";
import { route } from "../lib/route";

// A real hash to compare against when the email isn't known, so both paths take as long.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

async function startSession(ctx: Ctx, userId: string, userAgent?: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + ctx.config.sessionDays * 86400000);
  await ctx.db.insert(sessions).values({ id: hashToken(token), userId, expiresAt, userAgent: userAgent?.slice(0, 200) ?? null });
  return { token, expiresAt: expiresAt.toISOString() };
}

export async function authRoutes(app: FastifyInstance) {
  // Slows down password guessing and email bombing.
  const limited = { rateLimit: { max: 10, timeWindow: "1 minute" } };

  route(app, auth.signUp, async ({ body, ctx, req }) => {
    const [existing] = await ctx.db.select({ id: users.id }).from(users).where(eq(users.email, body.email));
    if (existing) throw new AppError(409, "email_taken", "There's already an account with that email. Sign in instead.", { email: "Already has an account" });
    const [user] = await ctx.db.insert(users).values({ email: body.email, name: body.name, passwordHash: await bcrypt.hash(body.password, 10) }).returning();
    return startSession(ctx, user.id, req.headers["user-agent"]);
  }, limited);

  route(app, auth.signIn, async ({ body, ctx, req }) => {
    const [user] = await ctx.db.select().from(users).where(eq(users.email, body.email));
    const ok = await bcrypt.compare(body.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new AppError(401, "bad_credentials", "That email and password don't match.");
    return startSession(ctx, user.id, req.headers["user-agent"]);
  }, limited);

  route(app, auth.signOut, async ({ ctx }) => {
    if (ctx.sessionId) await ctx.db.delete(sessions).where(eq(sessions.id, ctx.sessionId));
    return { ok: true as const };
  });

  route(app, auth.me, async ({ ctx }) => {
    const list = await ctx.db.select({ id: businesses.id, name: businesses.name, country: businesses.country, role: memberships.role })
      .from(memberships).innerJoin(businesses, eq(businesses.id, memberships.businessId))
      .where(eq(memberships.userId, ctx.user.id)).orderBy(businesses.createdAt);
    return { user: ctx.user, businesses: list };
  });

  route(app, auth.forgotPassword, async ({ body, ctx }) => {
    const [user] = await ctx.db.select().from(users).where(eq(users.email, body.email));
    if (user) {
      const token = newToken();
      await ctx.db.insert(passwordResets).values({ id: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
      const link = `${ctx.config.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
      const id = await ctx.services.email.queue(ctx.db, {
        businessId: null, to: user.email, subject: "Reset your BillingEase password",
        text: `Hi ${user.name},\n\nUse this link to choose a new password. It works for one hour.\n\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
        link,
      });
      await ctx.services.email.deliver(ctx.db, [id]);
    }
    return { ok: true as const };
  }, limited);

  route(app, auth.resetPassword, async ({ body, ctx, req }) => {
    const [reset] = await ctx.db.select().from(passwordResets)
      .where(and(eq(passwordResets.id, hashToken(body.token)), gt(passwordResets.expiresAt, new Date()), isNull(passwordResets.usedAt)));
    if (!reset) throw new AppError(400, "bad_token", "That link has expired or was already used. Ask for a new one.");
    await ctx.db.transaction(async (tx) => {
      await tx.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, reset.id));
      await tx.update(users).set({ passwordHash: await bcrypt.hash(body.password, 10) }).where(eq(users.id, reset.userId));
      // Signs out everywhere else.
      await tx.delete(sessions).where(eq(sessions.userId, reset.userId));
    });
    return startSession(ctx, reset.userId, req.headers["user-agent"]);
  }, limited);

  route(app, auth.changePassword, async ({ body, ctx }) => {
    const [user] = await ctx.db.select().from(users).where(eq(users.id, ctx.user.id));
    if (!(await bcrypt.compare(body.current, user.passwordHash))) throw new AppError(400, "invalid", "Your current password isn't right.", { current: "Not right" });
    await ctx.db.update(users).set({ passwordHash: await bcrypt.hash(body.password, 10) }).where(eq(users.id, user.id));
    return { ok: true as const };
  }, limited);
}
