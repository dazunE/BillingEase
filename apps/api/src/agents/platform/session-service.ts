import { BaseSessionService, createSession, type AppendEventRequest, type CreateSessionRequest, type DeleteSessionRequest, type Event, type GetSessionRequest, type ListSessionsRequest, type ListSessionsResponse, type Session } from "@google/adk";
import type { Exec } from "@billingease/db";
import { agentEvents, agentSessions } from "@billingease/db/schema";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";

/**
 * ADK sessions kept in our Postgres, one service per business: every read and write is
 * scoped to that business, so a session id from another business is simply not found.
 * (ADK's DatabaseSessionService uses MikroORM, which can't reach the embedded PGlite that
 * development and tests use.)
 */
export class DbSessionService extends BaseSessionService {
  constructor(private db: Exec, private scope: { businessId: string; runId?: string | null }) {
    super();
  }

  private key(appName: string, userId: string) {
    return [eq(agentSessions.businessId, this.scope.businessId), eq(agentSessions.appName, appName), eq(agentSessions.userId, userId)];
  }

  async createSession({ appName, userId, state, sessionId }: CreateSessionRequest): Promise<Session> {
    const id = sessionId?.trim() || crypto.randomUUID();
    const clean = Object.fromEntries(Object.entries(state ?? {}).filter(([k]) => !k.startsWith("temp:")));
    const [row] = await this.db.insert(agentSessions).values({ id, appName, userId, businessId: this.scope.businessId, runId: this.scope.runId ?? null, state: clean }).returning();
    return createSession({ id: row.id, appName, userId, state: { ...clean }, events: [], lastUpdateTime: row.updatedAt.getTime() });
  }

  async getSession({ appName, userId, sessionId, config }: GetSessionRequest): Promise<Session | undefined> {
    const [row] = await this.db.select().from(agentSessions).where(and(eq(agentSessions.id, sessionId), ...this.key(appName, userId)));
    if (!row) return undefined;
    const rows = await this.db.select({ event: agentEvents.event }).from(agentEvents).where(eq(agentEvents.sessionId, sessionId)).orderBy(asc(agentEvents.seq));
    // An event re-appended with the same id replaces the earlier copy, as in ADK's own services.
    const byId = new Map<string, Event>();
    for (const r of rows) {
      const e = r.event as unknown as Event;
      byId.delete(e.id);
      byId.set(e.id, e);
    }
    let events = [...byId.values()];
    if (config?.afterTimestamp) events = events.filter((e) => e.timestamp >= config.afterTimestamp!);
    if (config?.numRecentEvents) events = events.slice(-config.numRecentEvents);
    return createSession({ id: row.id, appName, userId, state: { ...row.state }, events, lastUpdateTime: row.updatedAt.getTime() });
  }

  async listSessions({ appName, userId, limit = 50, offset = 0, order = "desc" }: ListSessionsRequest): Promise<ListSessionsResponse> {
    const where = and(eq(agentSessions.businessId, this.scope.businessId), eq(agentSessions.appName, appName), userId ? eq(agentSessions.userId, userId) : undefined);
    const [{ n }] = await this.db.select({ n: count() }).from(agentSessions).where(where);
    const rows = await this.db.select().from(agentSessions).where(where)
      .orderBy(order === "asc" ? asc(agentSessions.updatedAt) : desc(agentSessions.updatedAt)).limit(limit).offset(offset);
    return {
      sessions: rows.map((r) => createSession({ id: r.id, appName: r.appName, userId: r.userId, state: {}, events: [], lastUpdateTime: r.updatedAt.getTime() })),
      page: limit ? Math.floor(offset / limit) + 1 : 1,
      limit,
      totalItems: n,
      totalPages: limit ? Math.ceil(n / limit) : 1,
    };
  }

  async deleteSession({ appName, userId, sessionId }: DeleteSessionRequest): Promise<void> {
    await this.db.delete(agentSessions).where(and(eq(agentSessions.id, sessionId), ...this.key(appName, userId)));
  }

  async appendEvent(req: AppendEventRequest): Promise<Event> {
    const event = await super.appendEvent(req);
    if (event.partial) return event;
    const { session } = req;
    await this.db.insert(agentEvents).values({
      sessionId: session.id,
      seq: sql`(select coalesce(max(${agentEvents.seq}), 0) + 1 from ${agentEvents} where ${agentEvents.sessionId} = ${session.id})`,
      author: event.author ?? null,
      event: JSON.parse(JSON.stringify(event)),
    });
    if (event.actions?.stateDelta && Object.keys(event.actions.stateDelta).length) {
      const state = Object.fromEntries(Object.entries(session.state).filter(([k]) => !k.startsWith("temp:") && !k.startsWith("app:") && !k.startsWith("user:")));
      await this.db.update(agentSessions).set({ state, updatedAt: new Date() }).where(and(eq(agentSessions.id, session.id), eq(agentSessions.businessId, this.scope.businessId)));
    } else {
      await this.db.update(agentSessions).set({ updatedAt: new Date() }).where(and(eq(agentSessions.id, session.id), eq(agentSessions.businessId, this.scope.businessId)));
    }
    session.lastUpdateTime = Date.now();
    return event;
  }
}
