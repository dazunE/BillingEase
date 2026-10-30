import type { Db } from "@billingease/db";
import { jobs } from "@billingease/db/schema";
import { and, eq, lt, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

export type JobRow = typeof jobs.$inferSelect;
export type JobHandler = (app: FastifyInstance, job: JobRow) => Promise<unknown>;

const HANDLERS = new Map<string, JobHandler>();

/** Agents register what runs their queued work. */
export function onQueue(queue: string, handler: JobHandler) {
  HANDLERS.set(queue, handler);
}

/**
 * Adds work to the queue. With a dedupe key, at most one such job is queued or running at a
 * time (one run per business per agent); a second enqueue returns null.
 */
export async function enqueue(db: Db, j: { queue: string; businessId?: string | null; payload?: Record<string, unknown>; dedupeKey?: string | null; runAt?: Date; maxAttempts?: number }) {
  const [row] = await db.insert(jobs).values({
    queue: j.queue, businessId: j.businessId ?? null, payload: j.payload ?? {}, dedupeKey: j.dedupeKey ?? null,
    runAt: j.runAt ?? new Date(), maxAttempts: j.maxAttempts ?? 3,
  }).onConflictDoNothing().returning();
  return row ?? null;
}

/** Takes the next due job, so no other worker (or API instance) takes it too. */
export async function claim(db: Db, worker: string): Promise<JobRow | null> {
  const queues = [...HANDLERS.keys()];
  if (!queues.length) return null;
  const res = await db.execute(sql`
    update ${jobs} set status = 'running', locked_by = ${worker}, locked_at = now(), attempts = attempts + 1
    where id = (
      select id from ${jobs}
      where status = 'queued' and run_at <= now() and queue in (${sql.join(queues.map((q) => sql`${q}`), sql`, `)})
      order by run_at for update skip locked limit 1
    )
    returning id`);
  const id = (res as unknown as { rows: { id: string }[] }).rows[0]?.id;
  if (!id) return null;
  const [row] = await db.select().from(jobs).where(eq(jobs.id, id));
  return row ?? null;
}

/** Runs one job. A failure is retried later (30 s, 2 min, 8 min…) until its attempts run out. */
export async function runJob(app: FastifyInstance, job: JobRow) {
  const db = app.be.db;
  const handler = HANDLERS.get(job.queue);
  try {
    if (!handler) throw new Error(`No handler for queue ${job.queue}`);
    await handler(app, job);
    await db.update(jobs).set({ status: "done", finishedAt: new Date(), error: null }).where(eq(jobs.id, job.id));
  } catch (err) {
    const message = (err as Error).message ?? String(err);
    const retry = job.attempts < job.maxAttempts;
    await db.update(jobs).set(retry
      ? { status: "queued", error: message, lockedBy: null, lockedAt: null, runAt: new Date(Date.now() + 30_000 * 4 ** (job.attempts - 1)) }
      : { status: "failed", error: message, finishedAt: new Date() }).where(eq(jobs.id, job.id));
    app.log.warn({ err, job: job.id, queue: job.queue, retry }, "queued job failed");
  }
}

/** Jobs left running by a worker that died go back in the queue. */
export async function requeueStale(db: Db, olderThanMs = 15 * 60_000) {
  await db.update(jobs).set({ status: "queued", lockedBy: null, lockedAt: null })
    .where(and(eq(jobs.status, "running"), lt(jobs.lockedAt, new Date(Date.now() - olderThanMs))));
}

/** Runs due jobs until none are left (tests; and each worker tick). */
export async function drain(app: FastifyInstance, worker = "drain", max = 50) {
  let done = 0;
  for (; done < max; done++) {
    const job = await claim(app.be.db, worker);
    if (!job) break;
    await runJob(app, job);
  }
  return done;
}
