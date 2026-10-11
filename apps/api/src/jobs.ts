import type { FastifyInstance } from "fastify";

/**
 * Background work, run in the API process on a timer. Each job is safe to run twice
 * (it claims rows in the database), so more than one API instance can run them.
 * Areas add their jobs to JOBS.
 */
export type Job = { name: string; everyMs: number; run: (app: FastifyInstance) => Promise<unknown> };

export const JOBS: Job[] = [
  { name: "deliver-email", everyMs: 30_000, run: (app) => app.be.services.email.deliver(app.be.db) },
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
