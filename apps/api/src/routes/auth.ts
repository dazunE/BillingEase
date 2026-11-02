import { auth } from "@billingease/contracts";
import { backupCodes, businesses, memberships, passwordResets, sessions, signInChallenges, signIns, userIdentities, users } from "@billingease/db/schema";
import bcrypt from "bcryptjs";
import { and, count, desc, eq, gt, isNull, lt } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { hashToken, newToken } from "../lib/auth";
import { hashBackup, looksLikeBackup, matchStep, newBackupCodes, newSecret, otpauthUri } from "../lib/totp";
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

/** A sign-in, or a failed attempt, for Recent sign-ins. A new device gets an email. */
async function recordSignIn(ctx: Ctx, userId: string, userAgent: string | undefined, method: string, ok: boolean, reason: string | null = null) {
  const ua = userAgent?.slice(0, 200) ?? null;
  let newDevice = false;
  if (ok) {
    const before = await ctx.db.select({ ua: signIns.userAgent }).from(signIns).where(and(eq(signIns.userId, userId), eq(signIns.ok, true))).limit(500);
    newDevice = before.length > 0 && !before.some((b) => b.ua === ua);
  }
  await ctx.db.insert(signIns).values({ userId, userAgent: ua, method, ok, reason });
  if (newDevice) {
    const [u] = await ctx.db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, userId));
    const link = `${ctx.config.appUrl}/app/settings/security`;
    const id = await ctx.services.email.queue(ctx.db, {
      businessId: null, to: u.email, subject: "A new sign-in to BillingEase",
      text: `Hi ${u.name},\n\nSomeone just signed in to your BillingEase account from a device you haven't used before:\n\n${ua ?? "An unknown device"}\n\nIf this was you, there's nothing to do. If it wasn't, sign out that device and change your password:\n\n${link}`,
      link,
    });
    await ctx.services.email.deliver(ctx.db, [id]);
  }
}

const TICKET_MINUTES = 10;
const TICKET_TRIES = 5;

/** With two-step on, a right password (or Google) gets a ticket for the code, not a session. */
async function signInOrTicket(ctx: Ctx, userId: string, method: "password" | "google" | "reset", userAgent?: string) {
  const [u] = await ctx.db.select({ on: users.totpEnabledAt }).from(users).where(eq(users.id, userId));
  if (!u?.on) {
    await recordSignIn(ctx, userId, userAgent, method, true);
    return startSession(ctx, userId, userAgent);
  }
  const ticket = newToken();
  const expiresAt = new Date(Date.now() + TICKET_MINUTES * 60_000);
  await ctx.db.delete(signInChallenges).where(lt(signInChallenges.expiresAt, new Date()));
  await ctx.db.insert(signInChallenges).values({ id: hashToken(ticket), userId, method, expiresAt });
  return { twoStep: true as const, ticket, expiresAt: expiresAt.toISOString() };
}

/**
 * Checks a code from the authenticator app, or a backup code (used up). Returns how it was
 * checked, or null when it's wrong.
 */
async function checkCode(ctx: Ctx, userId: string, code: string, allowBackup = true): Promise<"code" | "backup" | null> {
  const [u] = await ctx.db.select({ secret: users.totpSecret, last: users.totpLastStep }).from(users).where(eq(users.id, userId));
  if (!u?.secret) return null;
  const step = matchStep(u.secret, code, u.last);
  if (step !== null) {
    // Only moves forward, so the same code can't be used twice, even by two requests at once.
    const done = await ctx.db.update(users).set({ totpLastStep: step })
      .where(and(eq(users.id, userId), u.last === null ? isNull(users.totpLastStep) : eq(users.totpLastStep, u.last))).returning({ id: users.id });
    return done.length ? "code" : null;
  }
  if (allowBackup && looksLikeBackup(code)) {
    const used = await ctx.db.update(backupCodes).set({ usedAt: new Date() })
      .where(and(eq(backupCodes.userId, userId), eq(backupCodes.hash, hashBackup(code)), isNull(backupCodes.usedAt))).returning({ id: backupCodes.id });
    if (used.length) return "backup";
  }
  return null;
}

async function freshBackupCodes(ctx: Ctx, userId: string) {
  const codes = newBackupCodes();
  await ctx.db.transaction(async (tx) => {
    await tx.delete(backupCodes).where(eq(backupCodes.userId, userId));
    await tx.insert(backupCodes).values(codes.map((c) => ({ userId, hash: hashBackup(c) })));
  });
  return codes;
}

/** How this person can sign in, for Account → Sign-in methods. */
async function methodsFor(ctx: Ctx, userId: string) {
  const [user] = await ctx.db.select({ email: users.email, passwordHash: users.passwordHash, totpEnabledAt: users.totpEnabledAt }).from(users).where(eq(users.id, userId));
  const [google] = await ctx.db.select({ email: userIdentities.email }).from(userIdentities)
    .where(and(eq(userIdentities.userId, userId), eq(userIdentities.provider, "google")));
  const [left] = await ctx.db.select({ n: count() }).from(backupCodes).where(and(eq(backupCodes.userId, userId), isNull(backupCodes.usedAt)));
  return {
    email: user.email, hasPassword: !!user.passwordHash, google: google ?? null, googleAvailable: !!ctx.services.google,
    twoStep: { on: !!user.totpEnabledAt, since: user.totpEnabledAt?.toISOString() ?? null, backupLeft: user.totpEnabledAt ? Number(left?.n ?? 0) : 0 },
  };
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
    await recordSignIn(ctx, user.id, req.headers["user-agent"], "sign_up", true);
    return startSession(ctx, user.id, req.headers["user-agent"]);
  }, limited);

  route(app, auth.signIn, async ({ body, ctx, req }) => {
    const [user] = await ctx.db.select().from(users).where(eq(users.email, body.email));
    const ok = await bcrypt.compare(body.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user?.passwordHash || !ok) {
      if (user) await recordSignIn(ctx, user.id, req.headers["user-agent"], "password", false, "wrong_password");
      throw new AppError(401, "bad_credentials", "That email and password don't match.");
    }
    return signInOrTicket(ctx, user.id, "password", req.headers["user-agent"]);
  }, limited);

  route(app, auth.twoStep, async ({ body, ctx, req }) => {
    const ua = req.headers["user-agent"];
    const id = hashToken(body.ticket);
    const [c] = await ctx.db.select().from(signInChallenges).where(and(eq(signInChallenges.id, id), gt(signInChallenges.expiresAt, new Date())));
    if (!c || c.attempts >= TICKET_TRIES) {
      throw new AppError(401, "ticket_expired", "That took too long or had too many tries. Sign in again.");
    }
    const how = await checkCode(ctx, c.userId, body.code);
    if (!how) {
      await ctx.db.update(signInChallenges).set({ attempts: c.attempts + 1 }).where(eq(signInChallenges.id, id));
      await recordSignIn(ctx, c.userId, ua, `${c.method}+code`, false, "wrong_code");
      const left = TICKET_TRIES - c.attempts - 1;
      throw new AppError(400, "invalid", left > 0 ? "That code isn't right. Check the time on your phone, or use a backup code." : "That code isn't right, and that was the last try. Sign in again.", { code: "Not right" });
    }
    await ctx.db.delete(signInChallenges).where(eq(signInChallenges.id, id));
    await recordSignIn(ctx, c.userId, ua, `${c.method}+${how === "backup" ? "backup" : "code"}`, true);
    return startSession(ctx, c.userId, ua);
  }, limited);

  route(app, auth.twoStepSetup, async ({ ctx }) => {
    const [u] = await ctx.db.select({ on: users.totpEnabledAt }).from(users).where(eq(users.id, ctx.user.id));
    if (u.on) throw new AppError(409, "two_step_on", "Two-step sign-in is already on. Turn it off first to connect a different app.");
    const secret = newSecret();
    await ctx.db.update(users).set({ totpSecret: secret, totpLastStep: null }).where(eq(users.id, ctx.user.id));
    return { secret, uri: otpauthUri(secret, ctx.user.email) };
  });

  route(app, auth.twoStepEnable, async ({ body, ctx }) => {
    const [u] = await ctx.db.select({ on: users.totpEnabledAt, secret: users.totpSecret }).from(users).where(eq(users.id, ctx.user.id));
    if (u.on) throw new AppError(409, "two_step_on", "Two-step sign-in is already on.");
    if (!u.secret) throw new AppError(400, "no_setup", "Start again: connect your authenticator app first.");
    if ((await checkCode(ctx, ctx.user.id, body.code, false)) !== "code") throw new AppError(400, "invalid", "That code isn't right. Enter the 6 digits your app shows now.", { code: "Not right" });
    await ctx.db.update(users).set({ totpEnabledAt: new Date() }).where(eq(users.id, ctx.user.id));
    return { codes: await freshBackupCodes(ctx, ctx.user.id) };
  }, limited);

  route(app, auth.twoStepCodes, async ({ body, ctx }) => {
    const [u] = await ctx.db.select({ on: users.totpEnabledAt }).from(users).where(eq(users.id, ctx.user.id));
    if (!u.on) throw new AppError(400, "two_step_off", "Turn on two-step sign-in first.");
    if ((await checkCode(ctx, ctx.user.id, body.code, false)) !== "code") throw new AppError(400, "invalid", "That code isn't right. Enter the 6 digits your app shows now.", { code: "Not right" });
    return { codes: await freshBackupCodes(ctx, ctx.user.id) };
  }, limited);

  route(app, auth.twoStepDisable, async ({ body, ctx }) => {
    const [u] = await ctx.db.select({ on: users.totpEnabledAt }).from(users).where(eq(users.id, ctx.user.id));
    if (!u.on) return { ok: true as const };
    if (!(await checkCode(ctx, ctx.user.id, body.code))) throw new AppError(400, "invalid", "That code isn't right. Use the 6 digits from your app, or a backup code.", { code: "Not right" });
    await ctx.db.transaction(async (tx) => {
      await tx.update(users).set({ totpEnabledAt: null, totpSecret: null, totpLastStep: null }).where(eq(users.id, ctx.user.id));
      await tx.delete(backupCodes).where(eq(backupCodes.userId, ctx.user.id));
    });
    return { ok: true as const };
  }, limited);

  route(app, auth.signIns, async ({ ctx }) => {
    const rows = await ctx.db.select().from(signIns)
      .where(and(eq(signIns.userId, ctx.user.id), gt(signIns.at, new Date(Date.now() - 30 * 86400000))))
      .orderBy(desc(signIns.at)).limit(100);
    return { signIns: rows.map((r) => ({ id: r.id, at: r.at.toISOString(), userAgent: r.userAgent, method: r.method, ok: r.ok, reason: r.reason })) };
  });

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
    if (created) {
      await recordSignIn(ctx, userId, req.headers["user-agent"], "google", true);
      return { ...(await startSession(ctx, userId, req.headers["user-agent"])), created };
    }
    const r = await signInOrTicket(ctx, userId, "google", req.headers["user-agent"]);
    return "ticket" in r ? r : { ...r, created };
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
    // A new password doesn't get round two-step sign-in: the code is still needed.
    return signInOrTicket(ctx, reset.userId, "reset", req.headers["user-agent"]);
  }, limited);

  route(app, auth.changePassword, async ({ body, ctx }) => {
    const [user] = await ctx.db.select().from(users).where(eq(users.id, ctx.user.id));
    if (!user.passwordHash) throw new AppError(400, "no_password", "You don't have a password yet. Set one instead.");
    if (!(await bcrypt.compare(body.current, user.passwordHash))) throw new AppError(400, "invalid", "Your current password isn't right.", { current: "Not right" });
    await ctx.db.update(users).set({ passwordHash: await bcrypt.hash(body.password, 10) }).where(eq(users.id, user.id));
    return { ok: true as const };
  }, limited);
}
