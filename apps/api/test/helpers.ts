import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { connect, type DbHandle } from "@billingease/db";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app";
import { loadConfig } from "../src/config";
import { createServices } from "../src/services";
import type { EmailTransport } from "../src/services/email";

export type Sent = Parameters<EmailTransport["send"]>[0];

/** A fresh API on an in-memory database. Emails are captured in `sent`. */
export async function testApp(opts: { email?: boolean } = {}) {
  const h: DbHandle = await connect({ pgliteDir: "memory://" });
  const config = { ...loadConfig({ NODE_ENV: "test" }), storage: { dir: mkdtempSync(path.join(tmpdir(), "be-files-")) } };
  const sent: Sent[] = [];
  const transport: EmailTransport | null = opts.email === false ? null : { send: async (m) => { sent.push(m); } };
  const services = createServices(config, { transport });
  const app = await buildApp({ db: h.db, config, services, logger: false });
  return { app, db: h.db, sent, close: async () => { await app.close(); await h.close(); } };
}

/** Calls the API as a signed-in user. */
export function as(app: FastifyInstance, token?: string, businessId?: string) {
  const call = async (method: string, url: string, body?: unknown) => {
    const res = await app.inject({
      method: method as "GET",
      url,
      payload: body as object,
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(businessId ? { "x-business-id": businessId } : {}) },
    });
    return { status: res.statusCode, body: res.body ? res.json() : null };
  };
  return {
    get: (url: string) => call("GET", url),
    post: (url: string, body?: unknown) => call("POST", url, body ?? {}),
    patch: (url: string, body?: unknown) => call("PATCH", url, body ?? {}),
    put: (url: string, body?: unknown) => call("PUT", url, body ?? {}),
    del: (url: string) => call("DELETE", url),
  };
}

let n = 0;
/** Signs up a new user and sets up a business in a country. */
export async function signUpWithBusiness(app: FastifyInstance, country: "uk" | "lk", extra: Record<string, unknown> = {}) {
  n++;
  const s = await as(app).post("/auth/sign-up", { name: "Test Owner", email: `owner${n}@example.com`, password: "correct horse battery" });
  const token = s.body.token as string;
  const body = country === "uk"
    ? { country, kind: "sole_trader", name: "Harper Studio", ownerName: "Ellie Harper", vatRegistered: false, ...extra }
    : { country, kind: "sole_proprietor", name: "Serendib Design Studio", ownerName: "Ayesha Fernando", taxId: "104563218", vatRegistered: true, vatNumber: "104563218-7000", ssclRegistered: true, ...extra };
  const b = await as(app, token).post("/businesses", body);
  if (b.status !== 200) throw new Error(JSON.stringify(b.body));
  return { token, business: b.body, api: as(app, token, b.body.id) };
}
