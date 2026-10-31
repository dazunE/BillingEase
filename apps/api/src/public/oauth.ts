import { createHash, randomUUID } from "node:crypto";
import { apiAccess, ApiScope, type AuthorizeParams } from "@billingease/contracts";
import { apiTokens, businesses, memberships, oauthClients, oauthCodes } from "@billingease/db/schema";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";
import { hashToken, newToken } from "../lib/auth";
import { AppError } from "../lib/errors";
import { route } from "../lib/route";
import { mintToken, resources } from "./tokens";

const CODE_MINUTES = 10;
const ACCESS_SECONDS = 60 * 60;
const REFRESH_DAYS = 30;
const DOCUMENT_HOURS = 24;
const ALL_SCOPES = ApiScope.options;

type Client = typeof oauthClients.$inferSelect;

// ---------------------------------------------------------------------------
// Apps

/** Loopback addresses, where a desktop app listens for its sign-in (RFC 8252). */
const isLoopback = (u: URL) => u.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);

/**
 * Where an app may be sent back to: https, a loopback address, or an app's own scheme
 * (com.example.app:/callback, cursor://…). Never http elsewhere, nor schemes that run code.
 */
export function redirectAllowed(raw: string) {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.hash || u.username || u.password) return false;
  if (u.protocol === "https:") return true;
  if (u.protocol === "http:") return isLoopback(u);
  return /^[a-z][a-z0-9+.-]*:$/.test(u.protocol) && !["javascript:", "data:", "file:", "vbscript:", "blob:", "about:", "ftp:", "ws:", "wss:"].includes(u.protocol);
}

/** The redirect the request names must be one the app registered; a loopback one on any port. */
function redirectMatches(client: Client, raw: string) {
  if (client.redirectUris.includes(raw)) return true;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (!isLoopback(u)) return false;
  return client.redirectUris.some((r) => {
    const x = new URL(r);
    return isLoopback(x) && x.hostname === u.hostname && x.pathname === u.pathname && x.search === u.search;
  });
}

/** An app known by the URL of its metadata document: https, a path, nothing else in it. */
const isDocumentUrl = (id: string) => {
  try {
    const u = new URL(id);
    return u.protocol === "https:" && u.pathname !== "/" && !u.hash && !u.username && !u.password;
  } catch {
    return false;
  }
};

const DocumentShape = {
  check(doc: unknown, url: string) {
    const d = doc as Record<string, unknown> | null;
    if (!d || typeof d !== "object") return null;
    if (d.client_id !== url) return null;
    const uris = d.redirect_uris;
    if (!Array.isArray(uris) || !uris.length || uris.length > 20 || !uris.every((u) => typeof u === "string" && redirectAllowed(u))) return null;
    const method = d.token_endpoint_auth_method ?? "none";
    if (method !== "none") return null;
    const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
    const link = (v: unknown) => (typeof v === "string" && /^https:\/\//.test(v) ? v.slice(0, 500) : null);
    return { name: text(d.client_name, 100) ?? new URL(url).host, uri: link(d.client_uri), logoUri: link(d.logo_uri), redirectUris: uris as string[] };
  },
};

/**
 * The app a sign-in is for. Registered apps are in the table; apps known by a metadata
 * document are read from their URL (and read again after a day).
 */
async function findClient(app: FastifyInstance, clientId: string | undefined): Promise<Client> {
  const unknown = new AppError(400, "invalid_client", "BillingEase doesn't know this app. Try connecting again from the app.");
  if (!clientId) throw unknown;
  const { db, services } = app.be;
  const [known] = await db.select().from(oauthClients).where(eq(oauthClients.id, clientId));
  const fresh = known && (known.kind === "registered" || (known.fetchedAt && Date.now() - known.fetchedAt.getTime() < DOCUMENT_HOURS * 3_600_000));
  if (fresh) return known;
  if (!isDocumentUrl(clientId)) throw unknown;
  let doc: unknown;
  try {
    doc = await services.clientDocument(new URL(clientId));
  } catch (err) {
    app.log.warn({ err, clientId }, "client metadata document unreadable");
    throw new AppError(400, "invalid_client", "BillingEase couldn't read this app's details from its website. Try again later.");
  }
  const parsed = DocumentShape.check(doc, clientId);
  if (!parsed) throw new AppError(400, "invalid_client", "This app's details on its website aren't in a form BillingEase accepts.");
  const values = { ...parsed, kind: "metadata_url" as const, fetchedAt: new Date() };
  const [row] = await db.insert(oauthClients).values({ id: clientId, ...values })
    .onConflictDoUpdate({ target: oauthClients.id, set: values }).returning();
  return row;
}

// ---------------------------------------------------------------------------
// The consent screen

function parseScopes(scope: string | undefined): ApiScope[] | null {
  if (!scope?.trim()) return [...ALL_SCOPES];
  const asked = scope.trim().split(/\s+/);
  const known = asked.filter((s): s is ApiScope => (ALL_SCOPES as readonly string[]).includes(s));
  return known.length ? [...new Set(known)] : null;
}

function withParams(uri: string, params: Record<string, string | undefined>) {
  const u = new URL(uri);
  for (const [k, v] of Object.entries(params)) if (v !== undefined) u.searchParams.set(k, v);
  return u.toString();
}

type Checked = { client: Client; redirectUri: string; scopes: ApiScope[]; resource: string | null; errorRedirect: string | null };

/**
 * Checks a sign-in request. A bad app or redirect is shown to the person (sending them to an
 * unknown address would be unsafe); anything else goes back to the app as an OAuth error.
 */
async function checkAuthorize(app: FastifyInstance, p: AuthorizeParams): Promise<Checked> {
  const client = await findClient(app, p.client_id);
  const redirectUri = p.redirect_uri ?? (client.redirectUris.length === 1 ? client.redirectUris[0] : undefined);
  if (!redirectUri || !redirectMatches(client, redirectUri)) {
    throw new AppError(400, "invalid_redirect", "This app asked to send you back to an address it didn't register, so BillingEase stopped. Try connecting again from the app.");
  }
  const issuer = app.be.config.appUrl;
  const back = (error: string, description: string) => withParams(redirectUri, { error, error_description: description, state: p.state, iss: issuer });
  const r = resources(issuer);
  const scopes = parseScopes(p.scope);
  let errorRedirect: string | null = null;
  if (p.response_type !== "code") errorRedirect = back("unsupported_response_type", "Only response_type=code is supported.");
  else if (!p.code_challenge || p.code_challenge_method !== "S256" || !/^[A-Za-z0-9_-]{43}$/.test(p.code_challenge)) errorRedirect = back("invalid_request", "PKCE with S256 is required.");
  else if (!scopes) errorRedirect = back("invalid_scope", `Scopes: ${ALL_SCOPES.join(", ")}.`);
  else if (p.resource && p.resource !== r.mcp && p.resource !== r.rest) errorRedirect = back("invalid_target", `Resources: ${r.mcp}, ${r.rest}.`);
  return { client, redirectUri, scopes: scopes ?? [], resource: p.resource ?? null, errorRedirect };
}

const hostOf = (u: string | null) => {
  try {
    return u ? new URL(u).host : null;
  } catch {
    return null;
  }
};

/** Businesses the person can connect an app to. */
async function businessesFor(app: FastifyInstance, userId: string) {
  return app.be.db.select({ id: businesses.id, name: businesses.name, role: memberships.role })
    .from(memberships).innerJoin(businesses, eq(businesses.id, memberships.businessId))
    .where(eq(memberships.userId, userId)).orderBy(businesses.name);
}

// ---------------------------------------------------------------------------
// Tokens

async function issue(app: FastifyInstance, g: { userId: string; businessId: string; clientId: string; clientName: string; scopes: ApiScope[]; resource: string | null; grantId: string }) {
  const access = mintToken("access");
  const refresh = mintToken("refresh");
  const common = { userId: g.userId, businessId: g.businessId, clientId: g.clientId, name: g.clientName, scopes: g.scopes, resource: g.resource, grantId: g.grantId };
  await app.be.db.insert(apiTokens).values([
    { ...common, kind: "access", hash: access.hash, prefix: access.prefix, expiresAt: new Date(Date.now() + ACCESS_SECONDS * 1000) },
    { ...common, kind: "refresh", hash: refresh.hash, prefix: refresh.prefix, expiresAt: new Date(Date.now() + REFRESH_DAYS * 86_400_000) },
  ]);
  return { access_token: access.raw, token_type: "Bearer", expires_in: ACCESS_SECONDS, refresh_token: refresh.raw, scope: g.scopes.join(" ") };
}

/** OAuth's own error shape (RFC 6749 §5.2), not the API's. */
class OAuthError extends Error {
  constructor(public error: string, public description: string, public status = 400) {
    super(description);
  }
}

export async function revokeGrant(app: FastifyInstance, grantId: string) {
  await app.be.db.update(apiTokens).set({ revokedAt: new Date() }).where(and(eq(apiTokens.grantId, grantId), isNull(apiTokens.revokedAt)));
}

const s256 = (verifier: string) => createHash("sha256").update(verifier).digest("base64url");

async function exchangeCode(app: FastifyInstance, b: Record<string, string>) {
  const { db } = app.be;
  if (!b.code || !b.client_id || !b.code_verifier) throw new OAuthError("invalid_request", "code, client_id and code_verifier are required.");
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(b.code_verifier)) throw new OAuthError("invalid_grant", "The code_verifier isn't valid.");
  // Claim the code first, so a second use of the same code gets nothing.
  const [code] = await db.update(oauthCodes).set({ usedAt: new Date() })
    .where(and(eq(oauthCodes.id, hashToken(b.code)), isNull(oauthCodes.usedAt), gt(oauthCodes.expiresAt, new Date())))
    .returning();
  if (!code) throw new OAuthError("invalid_grant", "That code has expired or was already used.");
  if (code.clientId !== b.client_id) throw new OAuthError("invalid_grant", "That code was issued to a different app.");
  if ((b.redirect_uri ?? code.redirectUri) !== code.redirectUri) throw new OAuthError("invalid_grant", "redirect_uri doesn't match the one used to sign in.");
  if (s256(b.code_verifier) !== code.codeChallenge) throw new OAuthError("invalid_grant", "The code_verifier doesn't match.");
  if (b.resource && code.resource && b.resource !== code.resource) throw new OAuthError("invalid_target", "That isn't the resource this code was for.");
  const [member] = await db.select({ role: memberships.role }).from(memberships).where(and(eq(memberships.userId, code.userId), eq(memberships.businessId, code.businessId)));
  if (!member) throw new OAuthError("invalid_grant", "That person no longer has access to the business.");
  const [client] = await db.select().from(oauthClients).where(eq(oauthClients.id, code.clientId));
  return issue(app, {
    userId: code.userId, businessId: code.businessId, clientId: code.clientId, clientName: client?.name ?? "An app",
    scopes: code.scopes, resource: b.resource ?? code.resource, grantId: randomUUID(),
  });
}

async function refreshTokens(app: FastifyInstance, b: Record<string, string>) {
  const { db } = app.be;
  if (!b.refresh_token || !b.client_id) throw new OAuthError("invalid_request", "refresh_token and client_id are required.");
  const [t] = await db.select().from(apiTokens).where(and(eq(apiTokens.hash, hashToken(b.refresh_token)), eq(apiTokens.kind, "refresh")));
  if (!t || t.revokedAt || (t.expiresAt && t.expiresAt < new Date()) || t.clientId !== b.client_id) throw new OAuthError("invalid_grant", "That refresh token isn't valid.");
  // Each refresh token works once. Seeing one again means it leaked: end the whole grant.
  const [claimed] = await db.update(apiTokens).set({ usedAt: new Date() }).where(and(eq(apiTokens.id, t.id), isNull(apiTokens.usedAt))).returning({ id: apiTokens.id });
  if (!claimed) {
    if (t.grantId) await revokeGrant(app, t.grantId);
    throw new OAuthError("invalid_grant", "That refresh token was already used, so this connection has been ended. Connect again.");
  }
  const [member] = await db.select({ role: memberships.role }).from(memberships).where(and(eq(memberships.userId, t.userId), eq(memberships.businessId, t.businessId)));
  if (!member) throw new OAuthError("invalid_grant", "That person no longer has access to the business.");
  const narrower = b.scope ? parseScopes(b.scope) : t.scopes;
  if (!narrower || narrower.some((s) => !t.scopes.includes(s))) throw new OAuthError("invalid_scope", "A refresh can't add scopes.");
  return issue(app, { userId: t.userId, businessId: t.businessId, clientId: t.clientId!, clientName: t.name, scopes: narrower, resource: t.resource, grantId: t.grantId ?? randomUUID() });
}

// ---------------------------------------------------------------------------
// Routes

/** The consent screen's two calls, made by the web app for the signed-in person. */
export function authorizeRoutes(app: FastifyInstance) {
  route(app, apiAccess.authorizeCheck, async ({ body, ctx }) => {
    const c = await checkAuthorize(app, body);
    const list = await businessesFor(app, ctx.user.id);
    if (!list.length) throw new AppError(409, "no_business", "Set up your business first.");
    return {
      client: { name: c.client.name, host: hostOf(c.client.kind === "metadata_url" ? c.client.id : c.client.uri), logoUri: c.client.logoUri, verified: c.client.kind === "metadata_url" },
      scopes: c.scopes, redirectHost: hostOf(c.redirectUri) ?? c.redirectUri, businesses: list, errorRedirect: c.errorRedirect,
    };
  });

  route(app, apiAccess.authorizeDecide, async ({ body, ctx }) => {
    const c = await checkAuthorize(app, body);
    if (c.errorRedirect) return { redirect: c.errorRedirect };
    const issuer = app.be.config.appUrl;
    if (!body.allow) return { redirect: withParams(c.redirectUri, { error: "access_denied", error_description: "The person said no.", state: body.state, iss: issuer }) };
    const list = await businessesFor(app, ctx.user.id);
    const chosen = body.businessId ? list.find((b) => b.id === body.businessId) : list.length === 1 ? list[0] : undefined;
    if (!chosen) throw new AppError(400, "invalid", "Pick the business to connect.", { businessId: "Pick a business" });
    const code = newToken();
    await app.be.db.insert(oauthCodes).values({
      id: hashToken(code), clientId: c.client.id, userId: ctx.user.id, businessId: chosen.id, scopes: c.scopes,
      redirectUri: c.redirectUri, codeChallenge: body.code_challenge!, resource: c.resource,
      expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000),
    });
    return { redirect: withParams(c.redirectUri, { code, state: body.state, iss: issuer }) };
  });
}

function sendOAuthError(reply: FastifyReply, err: unknown) {
  if (err instanceof OAuthError) return reply.status(err.status).header("cache-control", "no-store").send({ error: err.error, error_description: err.description });
  if (err instanceof AppError) return reply.status(err.status).header("cache-control", "no-store").send({ error: err.code === "invalid_client" ? "invalid_client" : "invalid_request", error_description: err.message });
  throw err;
}

/** The public OAuth endpoints and metadata: what MCP clients discover and call. */
export async function oauthRoutes(root: FastifyInstance, scope: FastifyInstance) {
  const { config } = root.be;
  const r = resources(config.appUrl);
  const scopes = [...ALL_SCOPES];

  // OAuth sends forms; the rest of the API takes JSON.
  scope.addContentTypeParser("application/x-www-form-urlencoded", { parseAs: "string" }, (_req, body, done) => {
    done(null, Object.fromEntries(new URLSearchParams(body as string)));
  });

  const protectedResource = (resource: string) => ({
    resource, authorization_servers: [r.issuer], scopes_supported: scopes, bearer_methods_supported: ["header"],
    resource_name: "BillingEase", resource_documentation: `${config.appUrl}/v1/openapi.json`,
  });
  scope.get("/.well-known/oauth-protected-resource", async () => protectedResource(r.mcp));
  scope.get("/.well-known/oauth-protected-resource/mcp", async () => protectedResource(r.mcp));
  scope.get("/.well-known/oauth-protected-resource/v1", async () => protectedResource(r.rest));
  scope.get("/.well-known/oauth-authorization-server", async () => ({
    issuer: r.issuer,
    authorization_endpoint: `${config.appUrl}/oauth/authorize`,
    token_endpoint: `${config.appUrl}/oauth/token`,
    registration_endpoint: `${config.appUrl}/oauth/register`,
    revocation_endpoint: `${config.appUrl}/oauth/revoke`,
    scopes_supported: scopes,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    revocation_endpoint_auth_methods_supported: ["none"],
    authorization_response_iss_parameter_supported: true,
    client_id_metadata_document_supported: true,
    service_documentation: `${config.appUrl}/developers`,
  }));

  // Dynamic client registration (RFC 7591), for apps without a metadata document. Public
  // clients only: an app on someone's computer can't keep a secret.
  scope.post("/oauth/register", { config: { rateLimit: { max: 20, timeWindow: "1 hour" } } }, async (req, reply) => {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const uris = b.redirect_uris;
    if (!Array.isArray(uris) || !uris.length || uris.length > 10 || !uris.every((u) => typeof u === "string" && redirectAllowed(u))) {
      return reply.status(400).send({ error: "invalid_redirect_uri", error_description: "redirect_uris must be https, loopback or app-scheme addresses." });
    }
    const grants = (Array.isArray(b.grant_types) ? b.grant_types : ["authorization_code", "refresh_token"]) as string[];
    if (grants.some((g) => g !== "authorization_code" && g !== "refresh_token")) {
      return reply.status(400).send({ error: "invalid_client_metadata", error_description: "Only authorization_code and refresh_token are supported." });
    }
    const name = typeof b.client_name === "string" && b.client_name.trim() ? b.client_name.trim().slice(0, 100) : "An app";
    const uri = typeof b.client_uri === "string" && /^https:\/\//.test(b.client_uri) ? b.client_uri.slice(0, 500) : null;
    const id = `bec_${newToken().slice(0, 24)}`;
    const [row] = await root.be.db.insert(oauthClients).values({ id, kind: "registered", name, uri, redirectUris: uris as string[] }).returning();
    return reply.status(201).header("cache-control", "no-store").send({
      client_id: id, client_id_issued_at: Math.floor(row.createdAt.getTime() / 1000), client_name: name, ...(uri ? { client_uri: uri } : {}),
      redirect_uris: row.redirectUris, grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], token_endpoint_auth_method: "none",
    });
  });

  scope.post("/oauth/token", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (req, reply) => {
    const b = (req.body ?? {}) as Record<string, string>;
    try {
      const tokens = b.grant_type === "authorization_code" ? await exchangeCode(root, b)
        : b.grant_type === "refresh_token" ? await refreshTokens(root, b)
        : (() => { throw new OAuthError("unsupported_grant_type", "Use authorization_code or refresh_token."); })();
      return reply.header("cache-control", "no-store").send(tokens);
    } catch (err) {
      return sendOAuthError(reply, err);
    }
  });

  // Revocation (RFC 7009): always 200, whether or not the token was known.
  scope.post("/oauth/revoke", async (req, reply) => {
    const b = (req.body ?? {}) as Record<string, string>;
    if (b.token) {
      const [t] = await root.be.db.select().from(apiTokens).where(eq(apiTokens.hash, hashToken(b.token)));
      if (t?.grantId && (!b.client_id || b.client_id === t.clientId)) await revokeGrant(root, t.grantId);
    }
    return reply.status(200).send({});
  });
}
