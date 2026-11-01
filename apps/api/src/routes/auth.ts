import { auth } from "@billingease/contracts";
import { businesses, memberships, passwordResets, sessions, userIdentities, users } from "@billingease/db/schema";
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

/** How this person can sign in, for Account → Sign-in methods. */
async function methodsFor(ctx: Ctx, userId: string) {
  const [user] = await ctx.db.select({ email: users.email, passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId));
  const [google] = await ctx.db.select({ email: userIdentities.email }).from(userIdentities)
    .where(and(eq(userIdentities.userId, userId), eq(userIdentities.provider, "google")));
  return { email: user.email, hasPassword: !!user.passwordHash, google: google ?? null, googleAvailable: !!ctx.services.google };
}

function googleOrOff(ctx: Ctx) {
  if (!ctx.services.google) throw new AppError(404, "google_off", "Signing in with Google isn't set up here. Use your email and password.");
  return ctx.services.google;
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
    if (!user?.passwordHash || !ok) throw new AppError(401, "bad_credentials", "That email and password don't match.");
    return startSession(ctx, user.id, req.headers["user-agent"]);
  }, limited);

  route(app, auth.google, async ({ body, ctx, req }) => {
    const p = await googleOrOff(ctx).verify(body);
    const { userId, created } = await ctx.db.transaction(async (tx) => {
      const [known] = await tx.select().from(userIdentities).where(and(eq(userIdentities.provider, "google"), eq(userIdentities.subject, p.sub)));
      if (known) {
        if (known.email !== p.email) await tx.update(userIdentities).set({ email: p.email }).where(and(eq(userIdentities.provider, "google"), eq(userIdentities.subject, p.sub)));
        return { userId: known.userId, created: false };
      }
      // Only an email Google has verified may join an existing account or claim a new one.
      if (!p.emailVerified) throw new AppError(400, "google_unverified", "Google hasn't verified the email on that account yet. Verify it with Google, or sign up with your email and a password.");
      const [existing] = await tx.select().from(users).where(eq(users.email, p.email));
      if (existing) {
        const [other] = await tx.select({ email: userIdentities.email }).from(userIdentities)
          .where(and(eq(userIdentities.userId, existing.id), eq(userIdentities.provider, "google")));
        if (other) throw new AppError(409, "google_other", `Your BillingEase account is connected to a different Google account (${other.email}). Sign in with that one, or with your password.`);
        await tx.insert(userIdentities).values({ provider: "google", subject: p.sub, userId: existing.id, email: p.email });
        if (!existing.emailVerifiedAt) await tx.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, existing.id));
        return { userId: existing.id, created: false };
      }
      const [user] = await tx.insert(users).values({ email: p.email, name: p.name ?? p.email.split("@")[0], passwordHash: null, emailVerifiedAt: new Date() }).returning();
      await tx.insert(userIdentities).values({ provider: "google", subject: p.sub, userId: user.id, email: p.email });
      return { userId: user.id, created: true };
    });
    return { ...(await startSession(ctx, userId, req.headers["user-agent"])), created };
  }, limited);

  route(app, auth.signInMethods, ({ ctx }) => methodsFor(ctx, ctx.user.id));

  route(app, auth.linkGoogle, async ({ body, ctx }) => {
    const p = await googleOrOff(ctx).verify(body);
    const [known] = await ctx.db.select().from(userIdentities).where(and(eq(userIdentities.provider, "google"), eq(userIdentities.subject, p.sub)));
    if (known && known.userId !== ctx.user.id) throw new AppError(409, "google_taken", "That Google account already signs in to a different BillingEase account.");
    if (!known) {
      const [mine] = await ctx.db.select({ email: userIdentities.email }).from(userIdentities)
        .where(and(eq(userIdentities.userId, ctx.user.id), eq(userIdentities.provider, "google")));
      if (mine) throw new AppError(409, "google_other", `You're already connected to ${mine.email}. Disconnect it first.`);
      await ctx.db.insert(userIdentities).values({ provider: "google", subject: p.sub, userId: ctx.user.id, email: p.email });
    }
    return methodsFor(ctx, ctx.user.id);
  }, limited);

  route(app, auth.unlinkGoogle, async ({ ctx }) => {
    const m = await methodsFor(ctx, ctx.user.id);
    if (m.google && !m.hasPassword) throw new AppError(400, "last_method", "Google is the only way you sign in. Set a password first, then you can disconnect Google.");
    await ctx.db.delete(userIdentities).where(and(eq(userIdentities.userId, ctx.user.id), eq(userIdentities.provider, "google")));
    return methodsFor(ctx, ctx.user.id);
  });

  route(app, auth.setPassword, async ({ body, ctx }) => {
    const [user] = await ctx.db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, ctx.user.id));
    if (user.passwordHash) throw new AppError(409, "has_password", "You already have a password. Change it instead.");
    await ctx.db.update(users).set({ passwordHash: await bcrypt.hash(body.password, 10) }).where(eq(users.id, ctx.user.id));
    return methodsFor(ctx, ctx.user.id);
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
    if (!user.passwordHash) throw new AppError(400, "no_password", "You don't have a password yet. Set one instead.");
    if (!(await bcrypt.compare(body.current, user.passwordHash))) throw new AppError(400, "invalid", "Your current password isn't right.", { current: "Not right" });
    await ctx.db.update(users).set({ passwordHash: await bcrypt.hash(body.password, 10) }).where(eq(users.id, user.id));
    return { ok: true as const };
  }, limited);
}
