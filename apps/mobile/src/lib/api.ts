import { APP_ENDPOINTS, type AppEndpointName, type BodyOf, type QueryOf, type ResponseOf } from "@billingease/contracts";

/**
 * The web app's public address plus /app-api, e.g. https://app.billingease.co.uk/app-api.
 * On a phone with Expo Go, use your computer's network address, not localhost.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/app-api").replace(/\/$/, "");

/** A request the API turned down, with its reason in plain words. */
export class ApiFailure extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}

type Endpoints = typeof APP_ENDPOINTS;
export type CallOpts<N extends AppEndpointName> = {
  params?: Record<string, string>;
  query?: Partial<QueryOf<Endpoints[N]>> & Record<string, string | number | boolean | undefined | null>;
  body?: BodyOf<Endpoints[N]>;
};

export type Auth = { token: string | null; businessId: string | null };

/** Fills `/invoices/:id` with `{ id }`, encoding each value. */
export function fillPath(path: string, params: Record<string, string> = {}) {
  return path.replace(/:([A-Za-z]+)/g, (_, k: string) => {
    if (!(k in params)) throw new Error(`Missing path parameter ${k} for ${path}`);
    return encodeURIComponent(params[k]);
  });
}

export function buildUrl(base: string, path: string, query: Record<string, unknown> = {}) {
  const qs = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return base + path + (qs ? `?${qs}` : "");
}

/** Calls one endpoint from APP_ENDPOINTS. Throws ApiFailure when the API says no. */
export async function call<N extends AppEndpointName>(
  name: N,
  opts: CallOpts<N>,
  auth: Auth,
  fetcher: typeof fetch = fetch,
): Promise<ResponseOf<Endpoints[N]>> {
  const e = APP_ENDPOINTS[name];
  const url = buildUrl(API_URL, fillPath(e.path, opts.params), opts.query as Record<string, unknown>);
  const headers: Record<string, string> = { accept: "application/json" };
  if (auth.token) headers.authorization = `Bearer ${auth.token}`;
  if (auth.businessId) headers["x-business-id"] = auth.businessId;
  const hasBody = e.method !== "GET" && e.method !== "DELETE";
  if (hasBody) headers["content-type"] = "application/json";
  let res: Response;
  try {
    res = await fetcher(url, { method: e.method, headers, body: hasBody ? JSON.stringify(opts.body ?? {}) : undefined });
  } catch {
    throw new ApiFailure(0, "offline", "Can't reach BillingEase. Check your connection and try again.");
  }
  const json = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string; fields?: Record<string, string> } } | null)?.error ?? {};
    throw new ApiFailure(res.status, err.code ?? "error", err.message ?? "Something went wrong.", err.fields);
  }
  return json as ResponseOf<Endpoints[N]>;
}

/** The first field problem, or the message: what to show under a form. */
export function problem(e: unknown) {
  if (e instanceof ApiFailure) return e.fields ? Object.values(e.fields)[0] ?? e.message : e.message;
  return "Something went wrong. Try again.";
}
