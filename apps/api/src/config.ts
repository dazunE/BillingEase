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
    provider: "outbox" | "postmark" | "smtp";
    from: string;
    postmarkToken: string | null;
    /** Any SMTP server that takes a login on its submission port (e.g. Stalwart). */
    smtp: { host: string; port: number; secure: boolean; user: string | null; password: string | null } | null;
  };
  /**
   * Attachment files. On local disk under `dir`, unless S3_BUCKET is set: then in that bucket on
   * any S3-compatible store (AWS S3, MinIO, Silo, Garage…), under an optional key prefix.
   */
  storage: {
    dir: string;
    s3: { endpoint: string | null; region: string; bucket: string; accessKeyId: string; secretAccessKey: string; forcePathStyle: boolean; prefix: string } | null;
  };
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
  /** Sign in with Google (OpenID Connect). Null unless GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set. */
  google: { clientId: string; clientSecret: string } | null;
  /** The public API and MCP server: calls per business per day, and per token per minute. */
  api: { dailyQuota: number; perMinute: number };
  /**
   * Exchange rates for documents in another currency. When off (FX_RATES=off), or the service
   * can't be reached, people type the rate themselves.
   */
  fx: { enabled: boolean };
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
      provider: env.SMTP_HOST ? "smtp" : env.POSTMARK_TOKEN ? "postmark" : "outbox",
      from: env.EMAIL_FROM ?? "BillingEase <hello@billingease.local>",
      postmarkToken: env.POSTMARK_TOKEN || null,
      smtp: env.SMTP_HOST ? smtp(env) : null,
    },
    storage: { dir: env.STORAGE_DIR ?? ".data/files", s3: env.S3_BUCKET ? s3(env) : null },
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
    google: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } : null,
    api: { dailyQuota: Number(env.API_DAILY_QUOTA ?? 5000), perMinute: Number(env.API_RATE_PER_MINUTE ?? 120) },
    fx: { enabled: env.FX_RATES !== "off" && mode !== "test" },
  };
}

/** SMTP_PORT defaults to 465 (TLS from the start); 587 and 25 use STARTTLS unless SMTP_SECURE=true. */
function smtp(env: NodeJS.ProcessEnv): NonNullable<Config["email"]["smtp"]> {
  const port = Number(env.SMTP_PORT || 465);
  if (!Number.isInteger(port) || port <= 0) throw new Error("SMTP_PORT must be a port number.");
  const secure = env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465;
  return { host: env.SMTP_HOST!, port, secure, user: env.SMTP_USER || null, password: env.SMTP_PASSWORD || null };
}

function s3(env: NodeJS.ProcessEnv): NonNullable<Config["storage"]["s3"]> {
  const accessKeyId = env.S3_ACCESS_KEY_ID, secretAccessKey = env.S3_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) throw new Error("S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be set with S3_BUCKET.");
  const prefix = (env.S3_PREFIX ?? "").replace(/^\/+|\/+$/g, "");
  return {
    endpoint: env.S3_ENDPOINT ? env.S3_ENDPOINT.replace(/\/$/, "") : null,
    region: env.S3_REGION || "us-east-1",
    bucket: env.S3_BUCKET!,
    accessKeyId,
    secretAccessKey,
    // Self-hosted stores usually serve buckets at <endpoint>/<bucket>, not <bucket>.<endpoint>.
    forcePathStyle: env.S3_FORCE_PATH_STYLE ? env.S3_FORCE_PATH_STYLE !== "false" : !!env.S3_ENDPOINT,
    prefix: prefix ? prefix + "/" : "",
  };
}

/** "0.3,2.5" (US dollars per million input, output tokens) → micro-dollars per million. */
function price(v: string | undefined, fallback: [number, number]): [number, number] {
  const parts = v?.split(",").map(Number);
  const [i, o] = parts?.length === 2 && parts.every((n) => Number.isFinite(n) && n >= 0) ? parts : fallback;
  return [Math.round(i * 1_000_000), Math.round(o * 1_000_000)];
}
