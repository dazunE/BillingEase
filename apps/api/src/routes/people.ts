import { people } from "@billingease/contracts";
import { businesses, invites, memberships, sessions, users } from "@billingease/db/schema";
import { and, desc, eq, gt, inArray, isNull, max, ne, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { logActivity, notify } from "../lib/activity";
import { hashToken, newToken } from "../lib/auth";
import { AppError, badRequest, notFound } from "../lib/errors";
import { route } from "../lib/route";

const INVITE_DAYS = 14;
const ROLE_WORDS = { accountant: "accountant", admin: "office admin" } as const;

/** The short id a session is shown by: enough to pick it out of one person's list, never the whole hash. */
const shortId = (hash: string) => hash.slice(0, 16);

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export async function peopleRoutes(app: FastifyInstance) {
  // ---- People and access -------------------------------------------------------------------

  route(app, people.members, async ({ ctx }) => {
    const b = ctx.business;
    const rows = await ctx.db
      .select({ userId: users.id, name: users.name, email: users.email, role: memberships.role, since: memberships.createdAt })
      .from(memberships).innerJoin(users, eq(users.id, memberships.userId))
      .where(eq(memberships.businessId, b.id))
      .orderBy(sql`case ${memberships.role} when 'owner' then 0 when 'accountant' then 1 else 2 end`, memberships.createdAt);
    const ids = rows.map((r) => r.userId);
    const seen = ids.length
      ? await ctx.db.select({ userId: sessions.userId, at: max(sql<Date>`coalesce(${sessions.lastSeenAt}, ${sessions.createdAt})`) })
        .from(sessions).where(inArray(sessions.userId, ids)).groupBy(sessions.userId)
      : [];
    const lastSeen = new Map(seen.map((s) => [s.userId, s.at ? new Date(s.at as unknown as string) : null]));
    const open = await ctx.db
      .select({ id: invites.id, email: invites.email, role: invites.role, invitedBy: users.name, createdAt: invites.createdAt, expiresAt: invites.expiresAt })
      .from(invites).leftJoin(users, eq(users.id, invites.invitedBy))
      .where(and(eq(invites.businessId, b.id), isNull(invites.acceptedAt), isNull(invites.revokedAt), gt(invites.expiresAt, new Date())))
      .orderBy(desc(invites.createdAt));
    return {
      members: rows.map((r) => ({ ...r, you: r.userId === ctx.user.id, since: r.since.toISOString(), lastSeenAt: iso(lastSeen.get(r.userId) ?? null) })),
      invites: open.map((i) => ({ ...i, createdAt: i.createdAt.toISOString(), expiresAt: i.expiresAt.toISOString() })),
    };
  });

  route(app, people.invite, async ({ body, ctx }) => {
    const b = ctx.business;
    const [member] = await ctx.db.select({ id: users.id }).from(memberships).innerJoin(users, eq(users.id, memberships.userId))
      .where(and(eq(memberships.businessId, b.id), eq(users.email, body.email)));
    if (member) throw badRequest("They can already open these books.", { email: "Already has access" });
    const token = newToken();
    const result = await ctx.db.transaction(async (tx) => {
      // A new invitation to the same email replaces any still open.
      await tx.update(invites).set({ revokedAt: new Date() })
        .where(and(eq(invites.businessId, b.id), eq(invites.email, body.email), isNull(invites.acceptedAt), isNull(invites.revokedAt)));
      const [row] = await tx.insert(invites).values({
        businessId: b.id, tokenHash: hashToken(token), email: body.email, role: body.role, invitedBy: ctx.user.id,
        expiresAt: new Date(Date.now() + INVITE_DAYS * 86400000),
      }).returning();
      const link = `${ctx.config.appUrl}/invite/${encodeURIComponent(token)}`;
      const emailId = await ctx.services.email.queue(tx, {
        businessId: b.id, to: body.email,
        subject: `${ctx.user.name} invited you to ${b.name}'s books on BillingEase`,
        text: `Hi,\n\n${ctx.user.name} has invited you to open ${b.name}'s books on BillingEase as their ${ROLE_WORDS[body.role]}.\n\nAccept here (the link works for ${INVITE_DAYS} days):\n\n${link}\n\nSign in, or create an account, with ${body.email} to accept. If you weren't expecting this, you can ignore it.`,
        link,
      });
      await logActivity(tx, b.id, `${body.email} invited as ${ROLE_WORDS[body.role]}`, { actorId: ctx.user.id, link: "/app/settings/people" });
      return { row, emailId };
    });
    await ctx.services.email.deliver(ctx.db, [result.emailId]);
    const r = result.row;
    return { id: r.id, email: r.email, role: r.role, invitedBy: ctx.user.name, createdAt: r.createdAt.toISOString(), expiresAt: r.expiresAt.toISOString() };
  });

  route(app, people.revokeInvite, async ({ params, ctx }) => {
    const [row] = await ctx.db.update(invites).set({ revokedAt: new Date() })
      .where(and(eq(invites.id, params.id), eq(invites.businessId, ctx.business.id), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
      .returning();
    if (!row) throw notFound("That invitation");
    await logActivity(ctx.db, ctx.business.id, `Invitation to ${row.email} cancelled`, { actorId: ctx.user.id, link: "/app/settings/people" });
    return { ok: true as const };
  });

  route(app, people.removeMember, async ({ params, ctx }) => {
    const b = ctx.business;
    const [m] = await ctx.db.select({ role: memberships.role, name: users.name }).from(memberships).innerJoin(users, eq(users.id, memberships.userId))
      .where(and(eq(memberships.businessId, b.id), eq(memberships.userId, params.userId)));
    if (!m) throw notFound("That person");
    if (m.role === "owner") throw new AppError(400, "owner", "The owner can't be removed.");
    await ctx.db.delete(memberships).where(and(eq(memberships.businessId, b.id), eq(memberships.userId, params.userId)));
    await logActivity(ctx.db, b.id, `${m.name} no longer has access`, { actorId: ctx.user.id, link: "/app/settings/people" });
    return { ok: true as const };
  });

  const findInvite = async (db: typeof app.be.db, token: string) => {
    const [row] = await db
      .select({ invite: invites, businessName: businesses.name, country: businesses.country, invitedBy: users.name })
      .from(invites).innerJoin(businesses, eq(businesses.id, invites.businessId)).leftJoin(users, eq(users.id, invites.invitedBy))
      .where(eq(invites.tokenHash, hashToken(token)));
    if (!row) throw new AppError(404, "bad_invite", "That invitation link isn't right. Ask for a new one.");
    const i = row.invite;
    const state = i.acceptedAt ? "used" : i.revokedAt ? "revoked" : i.expiresAt <= new Date() ? "expired" : "ok";
    return { ...row, state } as const;
  };

  route(app, people.invitePreview, async ({ params, ctx }) => {
    const r = await findInvite(ctx.db, params.token);
    return { businessName: r.businessName, country: r.country, role: r.invite.role, email: r.invite.email, invitedBy: r.invitedBy, state: r.state };
  }, { rateLimit: { max: 30, timeWindow: "1 minute" } });

  route(app, people.acceptInvite, async ({ params, ctx }) => {
    const r = await findInvite(ctx.db, params.token);
    const i = r.invite;
    if (r.state !== "ok") {
      throw new AppError(400, "bad_invite", r.state === "expired" ? "That invitation has expired. Ask for a new one." : r.state === "used" ? "That invitation was already accepted." : "That invitation was cancelled.");
    }
    if (i.email !== ctx.user.email.toLowerCase()) {
      throw new AppError(403, "wrong_person", `This invitation is for ${i.email}. Sign in with that email to accept it.`);
    }
    await ctx.db.transaction(async (tx) => {
      await tx.update(invites).set({ acceptedAt: new Date() }).where(eq(invites.id, i.id));
      await tx.insert(memberships).values({ businessId: i.businessId, userId: ctx.user.id, role: i.role }).onConflictDoNothing();
      await logActivity(tx, i.businessId, `${ctx.user.name} accepted the invitation as ${ROLE_WORDS[i.role]}`, { actorId: ctx.user.id, link: "/app/settings/people" });
      await notify(tx, i.businessId, `${ctx.user.name} can now open your books`, { body: `They joined as your ${ROLE_WORDS[i.role]}.`, link: "/app/settings/people", userId: i.invitedBy });
    });
    return { businessId: i.businessId, businessName: r.businessName };
  });

  // ---- Where you're signed in --------------------------------------------------------------

  route(app, people.sessions, async ({ ctx }) => {
    const rows = await ctx.db.select().from(sessions)
      .where(and(eq(sessions.userId, ctx.user.id), gt(sessions.expiresAt, new Date())))
      .orderBy(desc(sql`coalesce(${sessions.lastSeenAt}, ${sessions.createdAt})`));
    return {
      sessions: rows.map((s) => ({
        id: shortId(s.id), userAgent: s.userAgent, createdAt: s.createdAt.toISOString(),
        lastSeenAt: iso(s.lastSeenAt), expiresAt: s.expiresAt.toISOString(), current: s.id === ctx.sessionId,
      })),
    };
  });

  route(app, people.endSession, async ({ params, ctx }) => {
    if (!/^[0-9a-f]{16}$/.test(params.id)) throw notFound("That session");
    if (ctx.sessionId && shortId(ctx.sessionId) === params.id) throw badRequest("That's this device. Use Sign out instead.");
    const ended = await ctx.db.delete(sessions)
      .where(and(eq(sessions.userId, ctx.user.id), sql`left(${sessions.id}, 16) = ${params.id}`))
      .returning({ id: sessions.id });
    if (!ended.length) throw notFound("That session");
    return { ok: true as const };
  });

  route(app, people.endOtherSessions, async ({ ctx }) => {
    const ended = await ctx.db.delete(sessions)
      .where(and(eq(sessions.userId, ctx.user.id), ctx.sessionId ? ne(sessions.id, ctx.sessionId) : undefined))
      .returning({ id: sessions.id });
    return { ended: ended.length };
  });
}
