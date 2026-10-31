import { createHash, randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";

/**
 * Outside apps, through the web app's public address: a personal token for a script, and an
 * AI assistant connecting over OAuth (consent screen in the browser) to the MCP server.
 */

const API = "http://127.0.0.1:4200";
const WEB = "http://127.0.0.1:3200";

test("a script's token and an assistant's OAuth sign-in both reach the books, and only suggest", async ({ page, request, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // An owner with a US business, signed in.
  const email = `apps-${Date.now()}@example.com`;
  const signUp = await (await request.post(`${API}/auth/sign-up`, { data: { name: "Jordan Lee", email, password: "correct horse battery" } })).json();
  const biz = await request.post(`${API}/businesses`, {
    headers: { authorization: `Bearer ${signUp.token}` },
    data: { country: "us", kind: "sole_proprietor", name: "Harbor Lane LLC", ownerName: "Jordan Lee", taxId: "12-3456789", vatRegistered: false },
  });
  expect(biz.ok()).toBe(true);
  await context.addCookies([{ name: "be_session", value: signUp.token, url: WEB }]);

  // Settings → Apps and API: make a read-only token.
  await page.goto("/app/settings/apps");
  await expect(page.getByRole("heading", { name: "Apps and API" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "MCP server", exact: true })).toHaveValue(`${WEB}/mcp`);
  await page.getByRole("textbox", { name: /^Name/ }).fill("Monthly report");
  await page.getByRole("button", { name: "Make a token" }).click();
  const tokenField = page.getByRole("textbox", { name: "Token", exact: true });
  await expect(tokenField).toBeVisible();
  const pat = await tokenField.inputValue();
  expect(pat).toMatch(/^be_pat_/);

  // The script calls the public address; the web app forwards it to the API.
  const me = await request.get(`${WEB}/v1/me`, { headers: { authorization: `Bearer ${pat}` } });
  expect(await me.json()).toMatchObject({ business: { name: "Harbor Lane LLC", currency: "USD" }, scopes: ["books:read"] });
  const nope = await request.post(`${WEB}/v1/proposals`, { headers: { authorization: `Bearer ${pat}` }, data: { kind: "expense.create" } });
  expect(nope.status()).toBe(403);
  expect(nope.headers()["www-authenticate"]).toContain("insufficient_scope");
  expect((await request.get(`${WEB}/v1/openapi.json`)).ok()).toBe(true);

  // An assistant finds the sign-in from a 401, registers, and sends the owner to the consent screen.
  const unauth = await request.post(`${WEB}/mcp`, { data: { jsonrpc: "2.0", id: 1, method: "tools/list" } });
  expect(unauth.status()).toBe(401);
  const metaUrl = /resource_metadata="([^"]+)"/.exec(unauth.headers()["www-authenticate"])![1];
  const resource = await (await request.get(metaUrl)).json();
  const as = await (await request.get(`${resource.authorization_servers[0]}/.well-known/oauth-authorization-server`)).json();
  expect(as.authorization_endpoint).toBe(`${WEB}/oauth/authorize`);
  const reg = await (await request.post(as.registration_endpoint, { data: { client_name: "Desk Assistant", redirect_uris: ["http://127.0.0.1:47123/callback"] } })).json();

  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const authorize = new URL(as.authorization_endpoint);
  for (const [k, v] of Object.entries({ response_type: "code", client_id: reg.client_id, redirect_uri: "http://127.0.0.1:47123/callback", code_challenge: challenge, code_challenge_method: "S256", state: "st8", resource: resource.resource, scope: "books:read books:propose" })) {
    authorize.searchParams.set(k, v);
  }
  // Nothing listens on the assistant's port: catch the redirect instead.
  let callback = "";
  await page.route("http://127.0.0.1:47123/**", (route) => {
    callback = route.request().url();
    return route.fulfill({ status: 200, body: "ok" });
  });
  await page.goto(authorize.toString());
  await expect(page.getByRole("heading", { name: "Desk Assistant wants to work with your books" })).toBeVisible();
  await expect(page.getByText("Not confirmed")).toBeVisible();
  await expect(page.getByText("Suggest changes for you to approve")).toBeVisible();
  await page.getByRole("button", { name: "Allow", exact: true }).click();
  await expect.poll(() => callback).toContain("code=");
  const back = new URL(callback);
  expect(back.searchParams.get("state")).toBe("st8");

  const tokens = await (await request.post(as.token_endpoint, {
    form: { grant_type: "authorization_code", code: back.searchParams.get("code")!, client_id: reg.client_id, redirect_uri: "http://127.0.0.1:47123/callback", code_verifier: verifier, resource: resource.resource },
  })).json();
  expect(tokens.access_token).toMatch(/^be_at_/);

  // The assistant suggests an expense over MCP; the owner sees it waiting.
  const mcp = await request.post(`${WEB}/mcp`, {
    headers: { authorization: `Bearer ${tokens.access_token}`, accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" },
    data: { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "propose_expense", arguments: {
      title: "Staples, $53.75", summary: "Printer paper, from the receipt in my email",
      payload: { spentOn: "2026-10-09", payee: "Staples", categoryId: "supplies", gross: 5375, vat: 0, method: "Card" },
    } } },
  });
  const body = await mcp.json();
  expect(body.result.structuredContent).toMatchObject({ status: "pending", agentName: "Desk Assistant" });

  await page.goto("/app/check");
  await expect(page.getByText("Staples, $53.75")).toBeVisible();
  await page.goto("/app/settings/apps");
  await expect(page.getByText("Desk Assistant", { exact: false }).first()).toBeVisible();
  await page.getByRole("button", { name: "Disconnect Desk Assistant" }).click();
  await expect(page.getByText("No apps connected.")).toBeVisible();
  const after = await request.post(`${WEB}/mcp`, { headers: { authorization: `Bearer ${tokens.access_token}` }, data: { jsonrpc: "2.0", id: 3, method: "tools/list" } });
  expect(after.status()).toBe(401);

  expect(errors).toEqual([]);
});
