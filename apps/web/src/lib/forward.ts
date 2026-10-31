import "server-only";

const API_URL = (process.env.API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
const INTERNAL_KEY = process.env.API_INTERNAL_KEY;

/** Headers an outside app may send on to the API. Nothing else gets through. */
const PASS_IN = ["authorization", "content-type", "accept", "mcp-protocol-version", "mcp-session-id", "last-event-id", "user-agent"];
/** Headers the API's answer keeps. */
const PASS_OUT = ["content-type", "www-authenticate", "retry-after", "cache-control", "mcp-session-id", "allow", "x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"];

/**
 * Browser-based MCP clients and API explorers call from other sites. Tokens travel in the
 * Authorization header, never cookies, so any origin may call.
 */
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "access-control-allow-headers": "authorization, content-type, accept, mcp-protocol-version, mcp-session-id, last-event-id",
  "access-control-expose-headers": "www-authenticate, mcp-session-id, retry-after, x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset",
  "access-control-max-age": "86400",
};

export const preflight = () => new Response(null, { status: 204, headers: CORS });

/**
 * Sends an outside app's request on to the API: the public API, the MCP server and OAuth all
 * live at the web app's address, and only the web app holds the internal key.
 */
export async function forward(req: Request, path: string): Promise<Response> {
  const url = new URL(req.url);
  const headers = new Headers();
  for (const h of PASS_IN) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (INTERNAL_KEY) headers.set("x-internal-key", INTERNAL_KEY);
  const ip = req.headers.get("x-forwarded-for");
  if (ip) headers.set("x-forwarded-for", ip);
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${url.search}`, {
      method: req.method, headers, body: hasBody ? req.body : undefined, cache: "no-store", redirect: "manual",
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit);
  } catch {
    return Response.json({ error: { code: "unavailable", message: "BillingEase is having trouble. Try again in a moment." } }, { status: 503, headers: CORS });
  }
  const out = new Headers(CORS);
  for (const h of PASS_OUT) {
    const v = res.headers.get(h);
    if (v) out.set(h, v);
  }
  return new Response(res.body, { status: res.status, headers: out });
}

/** The route handlers for one forwarded path. */
export function forwarded(path: (req: Request, params: Record<string, string | string[]>) => string) {
  const handler = async (req: Request, ctx: { params: Promise<Record<string, string | string[]>> }) => forward(req, path(req, await ctx.params));
  return { GET: handler, POST: handler, PUT: handler, PATCH: handler, DELETE: handler, OPTIONS: preflight };
}
