import type { ApiScope } from "@billingease/contracts";
import { apiTokens, businesses, memberships, oauthClients, users } from "@billingease/db/schema";
import { and, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { hashToken, newToken } from "../lib/auth";
import type { BizCtx, Role } from "../lib/context";
import { AppError } from "../lib/errors";

/** Prefixes make a leaked token easy to recognise (and for secret scanners to find). */
const PREFIX = { personal: "be_pat_", access: "be_at_", refresh: "be_rt_" } as const;
export type TokenKind = keyof typeof PREFIX;

export function mintToken(kind: TokenKind) {
  const raw = PREFIX[kind] + newToken();
  return { raw, hash: hashToken(raw), prefix: raw.slice(0, PREFIX[kind].length + 4) };
}

/** Where outside apps connect, and the address of each one's resource metadata. */
export function resources(appUrl: string) {
  return {
    issuer: appUrl,
    mcp: `${appUrl}/mcp`,
    rest: `${appUrl}/v1`,
    metadata: { mcp: `${appUrl}/.well-known/oauth-protected-resource/mcp`, rest: `${appUrl}/.well-known/oauth-protected-resource/v1` },
  };
}

export type Surface = "mcp" | "rest";

export type TokenInfo = {
  id: string;
  kind: "personal" | "access";
  name: string;
  clientId: string | null;
  appName: string | null;
  scopes: ApiScope[];
  expiresAt: Date | null;
};

/** A handler context for a call made with a token instead of a web session. */
export type TokenCtx = BizCtx & { token: TokenInfo };

/** A 401 or 403 that tells the app where to sign in (RFC 6750 and RFC 9728). */
function challenge(reply: FastifyReply, appUrl: string, surface: Surface, status: 401 | 403, error: string | null, message: string, scope?: ApiScope) {
  const parts = [`resource_metadata="${resources(appUrl).metadata[surface]}"`];
  if (error) parts.push(`error="${error}"`);
  if (scope) parts.push(`scope="${scope}"`);
  reply.header("www-authenticate", `Bearer ${parts.join(", ")}`);
  return new AppError(status, error ?? "unauthorised", message);
}

/**
 * Works out who a public API or MCP call is from. Only API tokens work here, never a web
 * session, and each is checked on every call: revoked, expired, for this API, and the person
 * still a member of the business (with their role now, not when the token was made).
 */
export async function authenticateToken(app: FastifyInstance, req: FastifyRequest, reply: FastifyReply, surface: Surface): Promise<TokenCtx> {
  const { db, config, services } = app.be;
  const header = req.headers.authorization;
  const raw = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!raw) throw challenge(reply, config.appUrl, surface, 401, null, "Send an API token as a Bearer token.");
  const [row] = await db
    .select({ t: apiTokens, user: users, business: businesses, role: memberships.role, appName: oauthClients.name })
    .from(apiTokens)
    .innerJoin(users, eq(users.id, apiTokens.userId))
    .innerJoin(businesses, eq(businesses.id, apiTokens.businessId))
    .leftJoin(memberships, and(eq(memberships.userId, apiTokens.userId), eq(memberships.businessId, apiTokens.businessId)))
    .leftJoin(oauthClients, eq(oauthClients.id, apiTokens.clientId))
    .where(eq(apiTokens.hash, hashToken(raw)));
  const t = row?.t;
  const ok = t && t.kind !== "refresh" && !t.revokedAt && (!t.expiresAt || t.expiresAt > new Date()) && row.role;
  if (!ok) throw challenge(reply, config.appUrl, surface, 401, "invalid_token", "That token isn't valid: it may have expired or been revoked.");
  const r = resources(config.appUrl);
  if (t.resource && t.resource !== r[surface]) throw challenge(reply, config.appUrl, surface, 401, "invalid_token", "That token was issued for a different BillingEase API.");
  // Recording every use would write on every call; once a minute is enough to show "last used".
  if (!t.lastUsedAt || Date.now() - t.lastUsedAt.getTime() > 60_000) {
    await db.update(apiTokens).set({ lastUsedAt: new Date() }).where(eq(apiTokens.id, t.id));
  }
  return {
    db, config, services,
    user: { id: row.user.id, email: row.user.email, name: row.user.name },
    sessionId: null,
    business: row.business,
    role: row.role as Role,
    token: { id: t.id, kind: t.kind as "personal" | "access", name: t.name, clientId: t.clientId, appName: row.appName, scopes: t.scopes, expiresAt: t.expiresAt },
  };
}

export function requireScope(reply: FastifyReply, ctx: TokenCtx, scope: ApiScope | null, surface: Surface) {
  if (scope && !ctx.token.scopes.includes(scope)) {
    const what = scope === "books:read" ? "read the books" : "suggest changes";
    throw challenge(reply, ctx.config.appUrl, surface, 403, "insufficient_scope", `This token can't ${what}. Connect again and allow it, or make a token that can.`, scope);
  }
}

/** The name proposals and the call log show for a token: the app's, or the token's own. */
export const callerName = (t: TokenInfo) => t.appName ?? t.name;
