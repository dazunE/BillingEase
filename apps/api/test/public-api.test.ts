import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { apiCalls, apiTokens, expenses, memberships, proposals } from "@billingease/db/schema";
import { and, eq } from "drizzle-orm";
import { isPrivateAddress } from "../src/services/client-document";
import { redirectAllowed } from "../src/public/oauth";
import { signUpWithBusiness } from "./helpers";
import { homeTestApp, seed } from "./home-helpers";

const APP = "http://localhost:3000";
const DOC_URL = "https://notes.example/oauth/client.json";
const documents: Record<string, unknown> = {
  [DOC_URL]: { client_id: DOC_URL, client_name: "Example Notes", client_uri: "https://notes.example", redirect_uris: ["https://notes.example/callback"] },
  "https://bad.example/client.json": { client_id: "https://someone-else.example/client.json", redirect_uris: ["https://bad.example/cb"] },
};

let t: Awaited<ReturnType<typeof homeTestApp>>;
beforeAll(async () => {
  t = await homeTestApp({
    config: (c) => ({ ...c, appUrl: APP, api: { dailyQuota: 40, perMinute: 1000 } }),
    clientDocument: async (url) => {
      if (!(url.toString() in documents)) throw new Error("404");
      return documents[url.toString()];
    },
  });
});
afterAll(() => t.close());

/** A call with an API token, as an outside app makes it. */
async function call(method: string, url: string, token: string | null, body?: unknown, headers: Record<string, string> = {}) {
  const res = await t.app.inject({
    method: method as "GET", url, payload: body as object,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
  });
  return { status: res.statusCode, body: res.body ? JSON.parse(res.body) : null, headers: res.headers };
}

async function form(url: string, fields: Record<string, string>) {
  const res = await t.app.inject({ method: "POST", url, payload: new URLSearchParams(fields).toString(), headers: { "content-type": "application/x-www-form-urlencoded" } });
  return { status: res.statusCode, body: JSON.parse(res.body), headers: res.headers };
}

const expense = { spentOn: "2026-10-09", payee: "Ochre Café", categoryId: "travel", gross: 1240, vat: 0, method: "Card" };

describe("Personal access tokens and /v1", () => {
  it("reads the books with a token, and nothing without one", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const s = seed(t.db, business.id);
    const c = await s.customer("Acme Ltd");
    const inv = await s.invoice({ customerId: c.id, number: "INV-0001", issueDate: "2026-10-01", dueDate: "2026-10-31", total: 12000 });

    const made = await api.post("/api-access/tokens", { name: "My script", scopes: ["books:read"], expiresInDays: 90 });
    expect(made.status).toBe(200);
    expect(made.body.token).toMatch(/^be_pat_/);
    expect(made.body.info).toMatchObject({ name: "My script", scopes: ["books:read"], mine: true, prefix: made.body.token.slice(0, 11) });
    const token = made.body.token as string;

    const me = await call("GET", "/v1/me", token);
    expect(me.body).toMatchObject({ business: { id: business.id, country: "uk", currency: "GBP" }, user: { role: "owner" }, scopes: ["books:read"], token: { kind: "personal", name: "My script" } });

    const list = await call("GET", "/v1/invoices?status=unpaid", token);
    expect(list.status).toBe(200);
    expect(list.body.invoices.map((i: { id: string }) => i.id)).toEqual([inv.id]);
    const one = await call("GET", `/v1/invoices/${inv.id}`, token);
    expect(one.body.number).toBe("INV-0001");

    const none = await call("GET", "/v1/invoices", null);
    expect(none.status).toBe(401);
    expect(none.headers["www-authenticate"]).toBe(`Bearer resource_metadata="${APP}/.well-known/oauth-protected-resource/v1"`);
    const wrong = await call("GET", "/v1/invoices", "be_pat_nope");
    expect(wrong.status).toBe(401);
    expect(wrong.headers["www-authenticate"]).toContain('error="invalid_token"');

    // A web session is not an API token.
    const session = await call("GET", "/v1/invoices", (await signUpWithBusiness(t.app, "uk")).token);
    expect(session.status).toBe(401);

    // Read-only means read-only.
    const p = await call("POST", "/v1/proposals", token, { kind: "expense.create", payload: expense, title: "Ochre Café, £12.40", summary: "Card receipt" });
    expect(p.status).toBe(403);
    expect(p.headers["www-authenticate"]).toContain('error="insufficient_scope", scope="books:propose"');

    // Revoked: gone at once.
    const listed = await api.get("/api-access");
    expect(listed.body.tokens).toHaveLength(1);
    expect(listed.body.calls.length).toBeGreaterThanOrEqual(3);
    expect(listed.body.calls[0]).toMatchObject({ surface: "rest", by: "My script" });
    await api.post(`/api-access/tokens/${made.body.info.id}/revoke`, {});
    expect((await call("GET", "/v1/me", token)).status).toBe(401);
    expect((await api.get("/api-access")).body.tokens).toHaveLength(0);
  });

  it("proposes, and nothing changes until a person approves", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const token = (await api.post("/api-access/tokens", { name: "Receipts bot", scopes: ["books:read", "books:propose"], expiresInDays: null })).body.token;

    const bad = await call("POST", "/v1/proposals", token, { kind: "expense.create", payload: { ...expense, gross: -5 }, title: "Ochre Café", summary: "x" });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.error.fields)).toContain("payload.gross");

    const p = await call("POST", "/v1/proposals", token, { kind: "expense.create", payload: expense, title: "Ochre Café, £12.40", summary: "Card receipt from 9 October", confidence: 90 });
    expect(p.status).toBe(200);
    expect(p.body).toMatchObject({ status: "pending", agentName: "Receipts bot", proposedBy: "api_client", kind: "expense.create" });
    expect(await t.db.select().from(expenses).where(eq(expenses.businessId, business.id))).toHaveLength(0);
    // Who sent it is part of the record.
    const renamed = await t.db.update(proposals).set({ sourceName: "Someone else" }).where(eq(proposals.id, p.body.id)).then(() => null, (e: Error & { cause?: Error }) => e.cause?.message ?? e.message);
    expect(renamed).toMatch(/never changes/);

    const waiting = await api.get("/proposals");
    expect(waiting.body.proposals[0]).toMatchObject({ id: p.body.id, agentName: "Receipts bot" });
    const ok = await api.post(`/proposals/${p.body.id}/approve`, {});
    expect(ok.body.status).toBe("applied");
    const [e] = await t.db.select().from(expenses).where(eq(expenses.businessId, business.id));
    expect(e).toMatchObject({ gross: 1240, payee: "Ochre Café", createdVia: "agent", proposalId: p.body.id });
    expect((await call("GET", `/v1/proposals/${p.body.id}`, token)).body).toMatchObject({ status: "applied", appliedHref: `/app/out/expenses/${e.id}` });

    // Another business's invoice is nobody's business here.
    const other = await signUpWithBusiness(t.app, "uk");
    const theirs = await seed(t.db, other.business.id).invoice({ customerId: (await seed(t.db, other.business.id).customer()).id, issueDate: "2026-10-01", dueDate: "2026-10-31", total: 500 });
    const cross = await call("POST", "/v1/proposals", token, { kind: "receipt.create", invoiceId: theirs.id, payload: { amount: 500, receivedOn: "2026-10-10", method: "Bank transfer" }, title: "Paid", summary: "x" });
    expect(cross.status).toBe(404);
  });

  it("stops at the daily quota, and stops working when the person leaves the business", async () => {
    const { api, business, token: session } = await signUpWithBusiness(t.app, "lk");
    const token = (await api.post("/api-access/tokens", { name: "Busy", scopes: ["books:read"], expiresInDays: 30 })).body.token;
    let last = 200;
    for (let i = 0; i < 41 && last === 200; i++) last = (await call("GET", "/v1/business", token)).status;
    expect(last).toBe(429);
    const r = await call("GET", "/v1/business", token);
    expect(r.body.error.code).toBe("quota_reached");
    expect(Number(r.headers["retry-after"])).toBeGreaterThan(0);

    const other = await api.post("/api-access/tokens", { name: "Second", scopes: ["books:read"], expiresInDays: 30 });
    const [u] = await t.db.select({ userId: apiTokens.userId }).from(apiTokens).where(eq(apiTokens.id, other.body.info.id));
    await t.db.delete(memberships).where(and(eq(memberships.userId, u.userId), eq(memberships.businessId, business.id)));
    expect((await call("GET", "/v1/me", other.body.token)).status).toBe(401);
    expect(session).toBeTruthy();
  });

  it("publishes an OpenAPI document made from the contracts", async () => {
    const doc = await call("GET", "/v1/openapi.json", null);
    expect(doc.status).toBe(200);
    expect(doc.body.openapi).toBe("3.1.0");
    expect(doc.body.servers).toEqual([{ url: APP }]);
    expect(doc.body.paths["/v1/invoices/{id}"].get).toMatchObject({ operationId: "get_invoice", "x-scope": "books:read" });
    expect(doc.body.paths["/v1/proposals"].post.operationId).toBe("propose");
    expect(doc.body.components.securitySchemes.oauth.flows.authorizationCode.tokenUrl).toBe(`${APP}/oauth/token`);
  });
});

// ---------------------------------------------------------------------------

const verifier = () => randomBytes(32).toString("base64url");
const challengeOf = (v: string) => createHash("sha256").update(v).digest("base64url");

/** Signs in an app the whole way: consent, code, tokens. */
async function connect(api: Awaited<ReturnType<typeof signUpWithBusiness>>["api"], clientId: string, redirectUri: string, extra: Record<string, string> = {}) {
  const v = verifier();
  const params = { response_type: "code", client_id: clientId, redirect_uri: redirectUri, code_challenge: challengeOf(v), code_challenge_method: "S256", state: "xyz", ...extra };
  const decided = await api.post("/oauth/authorize/decide", { ...params, allow: true });
  expect(decided.status).toBe(200);
  const back = new URL(decided.body.redirect);
  expect(back.searchParams.get("state")).toBe("xyz");
  expect(back.searchParams.get("iss")).toBe(APP);
  const code = back.searchParams.get("code")!;
  const tokens = await form("/oauth/token", { grant_type: "authorization_code", code, client_id: clientId, redirect_uri: redirectUri, code_verifier: v, ...(extra.resource ? { resource: extra.resource } : {}) });
  return { code, v, tokens };
}

describe("OAuth for outside apps", () => {
  it("describes itself the way MCP clients look for it", async () => {
    const pr = await call("GET", "/.well-known/oauth-protected-resource/mcp", null);
    expect(pr.body).toMatchObject({ resource: `${APP}/mcp`, authorization_servers: [APP], scopes_supported: ["books:read", "books:propose"] });
    const as = await call("GET", "/.well-known/oauth-authorization-server", null);
    expect(as.body).toMatchObject({
      issuer: APP, authorization_endpoint: `${APP}/oauth/authorize`, token_endpoint: `${APP}/oauth/token`, registration_endpoint: `${APP}/oauth/register`,
      code_challenge_methods_supported: ["S256"], token_endpoint_auth_methods_supported: ["none"], client_id_metadata_document_supported: true,
    });
  });

  it("registers an app, asks the person, and swaps the code for tokens with PKCE", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const reg = await call("POST", "/oauth/register", null, { client_name: "Desk Assistant", redirect_uris: ["http://127.0.0.1:33418/callback"] });
    expect(reg.status).toBe(201);
    expect(reg.body).toMatchObject({ client_name: "Desk Assistant", token_endpoint_auth_method: "none" });
    const clientId = reg.body.client_id as string;

    const check = await api.post("/oauth/authorize/check", { response_type: "code", client_id: clientId, redirect_uri: "http://127.0.0.1:50123/callback", code_challenge: challengeOf(verifier()), code_challenge_method: "S256", scope: "books:read" });
    expect(check.status).toBe(200);
    expect(check.body).toMatchObject({ client: { name: "Desk Assistant", verified: false }, scopes: ["books:read"], redirectHost: "127.0.0.1:50123", errorRedirect: null });
    expect(check.body.businesses).toEqual([{ id: business.id, name: "Harper Studio", role: "owner" }]);

    // Loopback redirects may use any port (RFC 8252).
    const { code, v, tokens } = await connect(api, clientId, "http://127.0.0.1:50123/callback", { resource: `${APP}/mcp` });
    expect(tokens.status).toBe(200);
    expect(tokens.headers["cache-control"]).toBe("no-store");
    expect(tokens.body).toMatchObject({ token_type: "Bearer", expires_in: 3600, scope: "books:read books:propose" });
    expect(tokens.body.access_token).toMatch(/^be_at_/);

    // Each code works once.
    const again = await form("/oauth/token", { grant_type: "authorization_code", code, client_id: clientId, redirect_uri: "http://127.0.0.1:50123/callback", code_verifier: v });
    expect(again.body.error).toBe("invalid_grant");

    // The token is for the MCP server it was asked for, not the REST API.
    const mcp = await mcpCall(tokens.body.access_token, "tools/call", { name: "whoami", arguments: {} });
    expect(mcp.result.structuredContent).toMatchObject({ business: { id: business.id }, token: { kind: "access", app: "Desk Assistant" } });
    expect((await call("GET", "/v1/me", tokens.body.access_token)).status).toBe(401);

    // Refresh tokens rotate; using an old one again ends the connection.
    const r1 = await form("/oauth/token", { grant_type: "refresh_token", refresh_token: tokens.body.refresh_token, client_id: clientId });
    expect(r1.status).toBe(200);
    expect(r1.body.refresh_token).not.toBe(tokens.body.refresh_token);
    expect((await mcpCall(r1.body.access_token, "tools/call", { name: "whoami", arguments: {} })).result.isError).toBeFalsy();
    const listed = await api.get("/api-access");
    expect(listed.body.apps).toHaveLength(1);
    expect(listed.body.apps[0]).toMatchObject({ name: "Desk Assistant", mine: true });

    const reused = await form("/oauth/token", { grant_type: "refresh_token", refresh_token: tokens.body.refresh_token, client_id: clientId });
    expect(reused.body.error).toBe("invalid_grant");
    expect((await mcpRaw(r1.body.access_token, "tools/list")).status).toBe(401);
    expect((await api.get("/api-access")).body.apps).toHaveLength(0);
  });

  it("refuses a wrong verifier, a strange redirect, and requests without PKCE", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const clientId = (await call("POST", "/oauth/register", null, { client_name: "Thing", redirect_uris: ["https://thing.example/cb"] })).body.client_id;

    const v = verifier();
    const decided = await api.post("/oauth/authorize/decide", { response_type: "code", client_id: clientId, redirect_uri: "https://thing.example/cb", code_challenge: challengeOf(v), code_challenge_method: "S256", allow: true });
    const code = new URL(decided.body.redirect).searchParams.get("code")!;
    const wrong = await form("/oauth/token", { grant_type: "authorization_code", code, client_id: clientId, redirect_uri: "https://thing.example/cb", code_verifier: verifier() });
    expect(wrong.body.error).toBe("invalid_grant");

    // An address the app didn't register is shown to the person, never followed.
    const evil = await api.post("/oauth/authorize/check", { response_type: "code", client_id: clientId, redirect_uri: "https://evil.example/cb", code_challenge: challengeOf(v), code_challenge_method: "S256" });
    expect(evil.status).toBe(400);
    expect(evil.body.error.code).toBe("invalid_redirect");

    const plain = await api.post("/oauth/authorize/check", { response_type: "code", client_id: clientId, redirect_uri: "https://thing.example/cb", code_challenge: "abc", code_challenge_method: "plain" });
    expect(new URL(plain.body.errorRedirect).searchParams.get("error")).toBe("invalid_request");

    const denied = await api.post("/oauth/authorize/decide", { response_type: "code", client_id: clientId, redirect_uri: "https://thing.example/cb", code_challenge: challengeOf(v), code_challenge_method: "S256", state: "s1", allow: false });
    expect(Object.fromEntries(new URL(denied.body.redirect).searchParams)).toMatchObject({ error: "access_denied", state: "s1" });

    expect((await call("POST", "/oauth/register", null, { redirect_uris: ["http://thing.example/cb"] })).status).toBe(400);
    expect((await call("POST", "/oauth/register", null, { redirect_uris: ["javascript:alert(1)"] })).status).toBe(400);
  });

  it("knows an app by its metadata document's URL, and checks the document names itself", async () => {
    const { api } = await signUpWithBusiness(t.app, "us");
    const check = await api.post("/oauth/authorize/check", { response_type: "code", client_id: DOC_URL, redirect_uri: "https://notes.example/callback", code_challenge: challengeOf(verifier()), code_challenge_method: "S256" });
    expect(check.status).toBe(200);
    expect(check.body.client).toEqual({ name: "Example Notes", host: "notes.example", logoUri: null, verified: true });
    const { tokens } = await connect(api, DOC_URL, "https://notes.example/callback");
    expect((await call("GET", "/v1/me", tokens.body.access_token)).body.token.app).toBe("Example Notes");

    const bad = await api.post("/oauth/authorize/check", { response_type: "code", client_id: "https://bad.example/client.json", redirect_uri: "https://bad.example/cb", code_challenge: challengeOf(verifier()), code_challenge_method: "S256" });
    expect(bad.body.error.code).toBe("invalid_client");

    // Revoking from the app's side ends it too.
    await form("/oauth/revoke", { token: tokens.body.refresh_token, client_id: DOC_URL });
    expect((await call("GET", "/v1/me", tokens.body.access_token)).status).toBe(401);
  });

  it("only fetches documents from public addresses, and only redirects to safe ones", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.1.1", "169.254.169.254", "::1", "fd00::1", "::ffff:10.0.0.1", "0.0.0.0"]) expect(isPrivateAddress(ip)).toBe(true);
    for (const ip of ["8.8.8.8", "142.250.180.14", "2a00:1450:4009::200e"]) expect(isPrivateAddress(ip)).toBe(false);
    expect(redirectAllowed("https://app.example/cb")).toBe(true);
    expect(redirectAllowed("http://localhost:8080/cb")).toBe(true);
    expect(redirectAllowed("cursor://anysphere.cursor-retrieval/oauth/callback")).toBe(true);
    expect(redirectAllowed("http://app.example/cb")).toBe(false);
    expect(redirectAllowed("https://app.example/cb#x")).toBe(false);
    expect(redirectAllowed("data:text/html,hi")).toBe(false);
  });
});

// ---------------------------------------------------------------------------

async function mcpRaw(token: string, method: string, params: Record<string, unknown> = {}) {
  const res = await t.app.inject({
    method: "POST", url: "/mcp",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" },
    payload: { jsonrpc: "2.0", id: 1, method, params },
  });
  return { status: res.statusCode, body: res.body ? JSON.parse(res.body) : null, headers: res.headers };
}
const mcpCall = async (token: string, method: string, params: Record<string, unknown> = {}) => (await mcpRaw(token, method, params)).body;

describe("MCP server", () => {
  it("answers initialize and lists the tools", async () => {
    const { api } = await signUpWithBusiness(t.app, "uk");
    const token = (await api.post("/api-access/tokens", { name: "Claude", scopes: ["books:read", "books:propose"], expiresInDays: 30 })).body.token;
    const init = await mcpRaw(token, "initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "test", version: "1" } });
    expect(init.status).toBe(200);
    expect(init.body.result).toMatchObject({ protocolVersion: "2025-11-25", serverInfo: { name: "billingease" }, capabilities: { tools: {} } });
    expect(init.body.result.instructions).toContain("minor units");

    const list = await mcpCall(token, "tools/list");
    const names = list.result.tools.map((x: { name: string }) => x.name);
    expect(names).toEqual(expect.arrayContaining(["whoami", "list_invoices", "get_invoice", "list_categories", "propose_expense", "propose_payment_received", "propose_reminder"]));
    const getInvoice = list.result.tools.find((x: { name: string }) => x.name === "get_invoice");
    expect(getInvoice.inputSchema).toMatchObject({ type: "object", required: ["id"] });
    expect(getInvoice.annotations.readOnlyHint).toBe(true);
  });

  it("reads and proposes through tools, with errors the model can act on", async () => {
    const { api, business } = await signUpWithBusiness(t.app, "uk");
    const s = seed(t.db, business.id);
    const inv = await s.invoice({ customerId: (await s.customer("Acme Ltd")).id, number: "INV-0042", issueDate: "2026-09-01", dueDate: "2026-09-30", total: 30000 });
    const token = (await api.post("/api-access/tokens", { name: "Claude", scopes: ["books:read", "books:propose"], expiresInDays: 30 })).body.token;

    const got = await mcpCall(token, "tools/call", { name: "get_invoice", arguments: { id: inv.id } });
    expect(got.result.structuredContent).toMatchObject({ number: "INV-0042", total: 30000 });
    expect(JSON.parse(got.result.content[0].text).number).toBe("INV-0042");

    const missing = await mcpCall(token, "tools/call", { name: "propose_payment_received", arguments: { invoiceId: inv.id, payload: { receivedOn: "2026-10-02" }, title: "Acme paid", summary: "Bank" } });
    expect(missing.result.isError).toBe(true);
    expect(missing.result.content[0].text).toMatch(/payload\.amount/);

    const paid = await mcpCall(token, "tools/call", {
      name: "propose_payment_received",
      arguments: { invoiceId: inv.id, payload: { amount: 30000, receivedOn: "2026-10-02", method: "Bank transfer", reference: "ACME OCT" }, title: "Acme Ltd paid INV-0042", summary: "Seen on the bank statement" },
    });
    expect(paid.result.structuredContent).toMatchObject({ kind: "receipt.create", targetId: inv.id, status: "pending", agentName: "Claude" });
    const approved = await api.post(`/proposals/${paid.result.structuredContent.id}/approve`, {});
    expect(approved.body.status).toBe("applied");
    expect((await mcpCall(token, "tools/call", { name: "get_invoice", arguments: { id: inv.id } })).result.structuredContent.status).toBe("paid");

    const logged = await t.db.select().from(apiCalls).where(and(eq(apiCalls.businessId, business.id), eq(apiCalls.surface, "mcp")));
    expect(logged.map((l) => l.operation)).toEqual(expect.arrayContaining(["get_invoice", "propose_payment_received"]));
    expect(logged.find((l) => l.operation === "propose_payment_received" && l.status === 400)).toBeTruthy();

    const readOnly = (await api.post("/api-access/tokens", { name: "Reader", scopes: ["books:read"], expiresInDays: 30 })).body.token;
    const refused = await mcpCall(readOnly, "tools/call", { name: "propose_expense", arguments: { payload: expense, title: "Ochre Café", summary: "x" } });
    expect(refused.result.isError).toBe(true);
    expect(refused.result.content[0].text).toMatch(/can't suggest changes/);
  });

  it("asks for sign-in the way MCP clients expect", async () => {
    const res = await t.app.inject({ method: "POST", url: "/mcp", headers: { "content-type": "application/json" }, payload: { jsonrpc: "2.0", id: 1, method: "tools/list" } });
    expect(res.statusCode).toBe(401);
    expect(res.headers["www-authenticate"]).toBe(`Bearer resource_metadata="${APP}/.well-known/oauth-protected-resource/mcp"`);
    expect((await t.app.inject({ method: "GET", url: "/mcp" })).statusCode).toBe(405);
  });
});
