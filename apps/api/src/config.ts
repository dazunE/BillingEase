/** Settings from the environment. See .env.example at the repo root. */
export type Config = {
  env: "development" | "test" | "production";
  host: string;
  port: number;
  /** Where people open the web app; used in email links. */
  appUrl: string;
  /** Shared secret the web server sends so only it can call the API (optional in development). */
  internalKey: string | null;
  email: {
    provider: "outbox" | "postmark";
    from: string;
    postmarkToken: string | null;
  };
  storage: { dir: string };
  ask: { apiKey: string | null; model: string };
  sessionDays: number;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const mode = (env.NODE_ENV === "production" ? "production" : env.NODE_ENV === "test" ? "test" : "development") as Config["env"];
  const internalKey = env.API_INTERNAL_KEY || null;
  if (mode === "production" && !internalKey) throw new Error("API_INTERNAL_KEY must be set in production.");
  return {
    env: mode,
    host: env.API_HOST ?? "0.0.0.0",
    port: Number(env.API_PORT ?? env.PORT ?? 4000),
    appUrl: (env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    internalKey,
    email: {
      provider: env.POSTMARK_TOKEN ? "postmark" : "outbox",
      from: env.EMAIL_FROM ?? "BillingEase <hello@billingease.local>",
      postmarkToken: env.POSTMARK_TOKEN ?? null,
    },
    storage: { dir: env.STORAGE_DIR ?? ".data/files" },
    ask: { apiKey: env.ANTHROPIC_API_KEY ?? null, model: env.ASK_MODEL ?? "claude-sonnet-5-5" },
    sessionDays: Number(env.SESSION_DAYS ?? 30),
  };
}
