import { z } from "zod";
import { ProposeBody, SCOPES, V1, type ApiScope, type V1Op } from "./api";
import { ApiError, type Endpoint } from "./endpoint";

/**
 * The OpenAPI document and the MCP tools, both made from the V1 list so neither can drift
 * from what the API actually checks.
 */

type Json = Record<string, unknown>;

export const v1Path = (e: Endpoint) => `/v1${e.path}`;
const pathParams = (path: string) => [...path.matchAll(/:([A-Za-z]+)/g)].map((m) => m[1]);

function schema(s: z.ZodType, io: "input" | "output"): Json {
  const out = z.toJSONSchema(s, { io, unrepresentable: "any" }) as Json;
  delete out.$schema;
  return out;
}

/** The fields of an object schema, or none. */
const shapeOf = (s: z.ZodType | undefined): Record<string, z.ZodType> => (s instanceof z.ZodObject ? (s.shape as Record<string, z.ZodType>) : {});

const PARAM_DESCRIPTIONS: Record<string, string> = { id: "Its id (a UUID)" };

/**
 * One tool's arguments: the path's ids, the query and the body together, as one object.
 * The MCP server splits them back out by name.
 */
export function toolInput(op: V1Op): z.ZodObject {
  const params = Object.fromEntries(pathParams(op.endpoint.path).map((p) => [p, z.string().uuid().describe(PARAM_DESCRIPTIONS[p] ?? p)]));
  return z.object({ ...params, ...shapeOf(op.endpoint.query), ...shapeOf(op.endpoint.body) });
}

/** Splits a tool's arguments into the path's ids, the query and the body. */
export function splitToolArgs(op: V1Op, args: Record<string, unknown>) {
  const names = new Set(pathParams(op.endpoint.path));
  const queryKeys = new Set(Object.keys(shapeOf(op.endpoint.query)));
  const params: Record<string, string> = {};
  const query: Record<string, unknown> = {};
  const body: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    if (names.has(k)) params[k] = String(v);
    else if (queryKeys.has(k)) query[k] = v;
    else body[k] = v;
  }
  return { params, query, body };
}

export type ProposeTool = { name: string; kind: z.infer<typeof ProposeBody>["kind"]; description: string; input: z.ZodObject };

const PROPOSE_TOOL_INFO: Record<ProposeTool["kind"], [string, string]> = {
  "expense.create": ["propose_expense", "Suggest an expense (money already spent). Amounts are whole minor units: pence or cents."],
  "bill.create": ["propose_bill", "Suggest a bill from a supplier, to pay later. Amounts are whole minor units."],
  "receipt.create": ["propose_payment_received", "Suggest recording a payment a customer made against one of their invoices."],
  "bill_payment.create": ["propose_bill_payment", "Suggest recording a payment made against a supplier's bill."],
  "invoice.remind": ["propose_reminder", "Suggest a reminder about a late invoice. The person reads and can change it before it is sent."],
};

/** One MCP tool per kind of proposal: each has a plain object for its arguments. */
export const PROPOSE_TOOLS: ProposeTool[] = ProposeBody.options.map((o) => {
  const kind = o.shape.kind.value as ProposeTool["kind"];
  const { kind: _kind, ...rest } = o.shape;
  const [name, description] = PROPOSE_TOOL_INFO[kind];
  return { name, kind, description: `${description} Nothing changes until a person approves it.`, input: z.object(rest) };
});

/** The OpenAPI 3.1 document for /v1. */
export function openApiDocument(baseUrl: string): Json {
  const paths: Record<string, Record<string, Json>> = {};
  for (const op of V1) {
    const e = op.endpoint;
    const path = v1Path(e).replace(/:([A-Za-z]+)/g, "{$1}");
    const parameters: Json[] = pathParams(e.path).map((p) => ({ name: p, in: "path", required: true, schema: { type: "string", format: "uuid" } }));
    for (const [name, s] of Object.entries(shapeOf(e.query))) {
      const js = schema(s, "input");
      parameters.push({ name, in: "query", required: !s.safeParse(undefined).success, schema: js, ...(js.description ? { description: js.description } : {}) });
    }
    const error = { description: "Refused, with the reason", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } };
    paths[path] ??= {};
    paths[path][e.method.toLowerCase()] = {
      operationId: op.name,
      summary: op.summary,
      ...(op.scope ? { security: [{ bearer: [] }, { oauth: [op.scope] }], "x-scope": op.scope } : { security: [{ bearer: [] }, { oauth: [] }] }),
      ...(parameters.length ? { parameters } : {}),
      ...(e.body ? { requestBody: { required: true, content: { "application/json": { schema: schema(e.body, "input") } } } } : {}),
      responses: {
        200: { description: "OK", content: { "application/json": { schema: schema(e.response, "output") } } },
        400: error, 401: error, 403: error, 404: error, 409: error, 429: error,
      },
    };
  }
  const scopes = Object.fromEntries((Object.keys(SCOPES) as ApiScope[]).map((s) => [s, SCOPES[s].label]));
  return {
    openapi: "3.1.0",
    info: {
      title: "BillingEase API",
      version: "1",
      description: "Read a business's books and suggest changes. Money is in whole minor units (pence, cents). Suggestions (proposals) wait for a person to approve them; nothing an app sends changes the books on its own.",
    },
    servers: [{ url: baseUrl }],
    paths,
    components: {
      schemas: { Error: schema(ApiError, "output") },
      securitySchemes: {
        bearer: { type: "http", scheme: "bearer", description: "A personal access token from Settings → Apps and API, or an OAuth access token." },
        oauth: {
          type: "oauth2",
          flows: { authorizationCode: { authorizationUrl: `${baseUrl}/oauth/authorize`, tokenUrl: `${baseUrl}/oauth/token`, refreshUrl: `${baseUrl}/oauth/token`, scopes } },
        },
      },
    },
  };
}
