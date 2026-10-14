import "server-only";
import type { BodyOf, Endpoint, ResponseOf } from "@billingease/contracts";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BUSINESS_COOKIE, SESSION_COOKIE } from "./cookies";

const API_URL = (process.env.API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
const INTERNAL_KEY = process.env.API_INTERNAL_KEY;

/** A request the API turned down, with its reason in plain words. */
export class ApiFailure extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

type CallOpts<E> = {
  params?: Record<string, string>;
  body?: BodyOf<E>;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Override the signed-in user's session (sign-up passes the new token). */
  token?: string | null;
};

function fill(path: string, params: Record<string, string> = {}) {
  return path.replace(/:([A-Za-z]+)/g, (_, k: string) => {
    if (!(k in params)) throw new Error(`Missing path parameter ${k} for ${path}`);
    return encodeURIComponent(params[k]);
  });
}

async function headers(token?: string | null) {
  const jar = await cookies();
  const t = token !== undefined ? token : jar.get(SESSION_COOKIE)?.value;
  const biz = jar.get(BUSINESS_COOKIE)?.value;
  const h: Record<string, string> = { accept: "application/json" };
  if (t) h.authorization = `Bearer ${t}`;
  if (biz) h["x-business-id"] = biz;
  if (INTERNAL_KEY) h["x-internal-key"] = INTERNAL_KEY;
  return h;
}

/** Calls one API endpoint from the server, with the user's session. Throws ApiFailure when refused. */
export async function call<E extends Endpoint>(e: E, opts: CallOpts<E> = {}): Promise<ResponseOf<E>> {
  const url = new URL(API_URL + fill(e.path, opts.params));
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  const h = await headers(opts.token);
  const hasBody = e.method !== "GET" && e.method !== "DELETE";
  if (hasBody) h["content-type"] = "application/json";
  const res = await fetch(url, { method: e.method, headers: h, body: hasBody ? JSON.stringify(opts.body ?? {}) : undefined, cache: "no-store" });
  const json = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const err = json?.error ?? {};
    throw new ApiFailure(res.status, err.code ?? "error", err.message ?? "Something went wrong.", err.fields);
  }
  return json as ResponseOf<E>;
}

/**
 * For pages: like call(), but a missing session goes to sign-in and a user without a
 * business goes to setup, instead of throwing.
 */
export async function load<E extends Endpoint>(e: E, opts: CallOpts<E> = {}): Promise<ResponseOf<E>> {
  try {
    return await call(e, opts);
  } catch (err) {
    if (err instanceof ApiFailure && err.status === 401) redirect("/sign-in");
    if (err instanceof ApiFailure && err.code === "no_business") redirect("/setup");
    throw err;
  }
}

/** Raw fetch to the API for files (PDFs, attachments), streamed back by a route handler. */
export async function callRaw(path: string, init: { method?: string; body?: BodyInit; contentType?: string } = {}) {
  const h = await headers();
  delete h.accept;
  if (init.contentType) h["content-type"] = init.contentType;
  return fetch(API_URL + path, { method: init.method ?? "GET", headers: h, body: init.body, cache: "no-store", duplex: "half" } as RequestInit);
}
