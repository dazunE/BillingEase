import { hostname } from "node:os";
import type { FastifyInstance } from "fastify";
import { scanForLate } from "./agents/chaser";
import { drain, requeueStale } from "./agents/platform/queue";
import { tidyApi } from "./public/access";
import { runDueRecurring } from "./services/recurring-run";

/**
 * Background work, run in the API process on a timer. Each job is safe to run twice
 * (it claims rows in the database), so more than one API instance can run them.
 * Areas add their jobs to JOBS.
 */
export type Job = { name: string; everyMs: number; run: (app: FastifyInstance) => Promise<unknown> };

export const JOBS: Job[] = [
  { name: "deliver-email", everyMs: 30_000, run: (app) => app.be.services.email.deliver(app.be.db) },
  { name: "repeating-invoices", everyMs: 10 * 60_000, run: (app) => runDueRecurring(app.be.db, app.be.services) },
  // Agent work waits in the jobs table, so it survives a restart and runs on one instance.
  { name: "agent-queue", everyMs: 2_000, run: (app) => drain(app, `${hostname()}:${process.pid}`, 5) },
  { name: "chaser-scan", everyMs: 6 * 60 * 60_000, run: (app) => scanForLate(app) },
  { name: "agent-queue-stale", everyMs: 5 * 60_000, run: (app) => requeueStale(app.be.db) },
  { name: "api-tidy", everyMs: 24 * 60 * 60_000, run: (app) => tidyApi(app) },
];

export function startJobs(app: FastifyInstance) {
  const timers = JOBS.map((job) => {
    let running = false;
    return setInterval(async () => {
      if (running) return;
      running = true;
      try {
        await job.run(app);
      } catch (err) {
        app.log.error({ err, job: job.name }, "job failed");
      } finally {
        running = false;
      }
    }, job.everyMs);
  });
  return () => timers.forEach(clearInterval);
}
