/** deep: hardest reasoning (Ask, reviews) · fast: reading documents · lite: quick checks. */
export type ModelTier = "deep" | "fast" | "lite";

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
  /**
   * Gemini on Vertex AI, for Ask and the agents. Null when GOOGLE_CLOUD_PROJECT isn't set:
   * Ask and the agents then say they aren't set up. Model IDs are config, not code, because
   * Google retires model versions on a schedule.
   */
  ai: {
    vertex: { project: string; location: string } | null;
    models: Record<ModelTier, string>;
    /** Price per million tokens in micro-dollars, [input, output]. Set from the Vertex AI price list. */
    prices: Record<ModelTier, [number, number]>;
    /** Default monthly cap per business, in micro-dollars. */
    monthlyBudgetMicros: number;
  };
  sessionDays: number;
  /** The public API and MCP server: calls per business per day, and per token per minute. */
  api: { dailyQuota: number; perMinute: number };
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
    ai: {
      vertex: env.GOOGLE_CLOUD_PROJECT ? { project: env.GOOGLE_CLOUD_PROJECT, location: env.GOOGLE_CLOUD_LOCATION ?? "europe-west2" } : null,
      models: {
        deep: env.AI_MODEL_DEEP ?? "gemini-4-argon",
        fast: env.AI_MODEL_FAST ?? "gemini-3.8-flash",
        lite: env.AI_MODEL_LITE ?? "gemini-3.5-flash-lite",
      },
      // Placeholders until set from the Vertex AI price list for the chosen region.
      prices: {
        deep: price(env.AI_PRICE_DEEP, [2, 12]),
        fast: price(env.AI_PRICE_FAST, [0.3, 2.5]),
        lite: price(env.AI_PRICE_LITE, [0.1, 0.4]),
      },
      monthlyBudgetMicros: Math.round(Number(env.AI_MONTHLY_BUDGET_USD ?? 5) * 1_000_000),
    },
    sessionDays: Number(env.SESSION_DAYS ?? 30),
    api: { dailyQuota: Number(env.API_DAILY_QUOTA ?? 5000), perMinute: Number(env.API_RATE_PER_MINUTE ?? 120) },
  };
}

/** "0.3,2.5" (US dollars per million input, output tokens) → micro-dollars per million. */
function price(v: string | undefined, fallback: [number, number]): [number, number] {
  const parts = v?.split(",").map(Number);
  const [i, o] = parts?.length === 2 && parts.every((n) => Number.isFinite(n) && n >= 0) ? parts : fallback;
  return [Math.round(i * 1_000_000), Math.round(o * 1_000_000)];
}
