import { publicApi, PROPOSE_TOOLS, splitToolArgs, toolInput, V1, type V1Op } from "@billingease/contracts";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema, type Tool } from "@modelcontextprotocol/sdk/types.js";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { AppError } from "../lib/errors";
import { logCall } from "./metering";
import { authenticateToken, type TokenCtx } from "./tokens";
import { invoke } from "./v1";

const INSTRUCTIONS = `BillingEase keeps the books for a small business in the UK, Sri Lanka or the United States.
- Money is always in whole minor units (pence or cents): 1240 means 12.40. Dates are YYYY-MM-DD.
- Start with whoami to see the business, its country and currency, and what this connection may do.
- The propose_ tools never change the books. Each makes a suggestion the owner approves, changes or turns down in BillingEase. Say so when you use them, and don't claim something was recorded until get_proposal shows it applied.
- Use list_categories for the category ids an expense or bill can use.`;

type Entry = { tool: Tool; run: (ctx: TokenCtx, args: Record<string, unknown>, req: FastifyRequest, reply: FastifyReply) => Promise<unknown> };

function inputSchema(s: z.ZodObject): Tool["inputSchema"] {
  const js = z.toJSONSchema(s, { io: "input", unrepresentable: "any" }) as Record<string, unknown>;
  delete js.$schema;
  return { ...js, type: "object" } as Tool["inputSchema"];
}

/** The tools: one per read in V1, one per kind of proposal, all running the /v1 code. */
function tools(app: FastifyInstance): Map<string, Entry> {
  const out = new Map<string, Entry>();
  const reads = V1.filter((op) => op.endpoint.method === "GET");
  for (const op of reads) {
    out.set(op.name, {
      tool: {
        name: op.name, description: op.summary, inputSchema: inputSchema(toolInput(op)),
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
      run: (ctx, args, req, reply) => invoke(app, op, ctx, splitToolArgs(op, args), req, reply, "mcp"),
    });
  }
  const proposeOp = V1.find((op) => op.endpoint === publicApi.propose) as V1Op;
  for (const t of PROPOSE_TOOLS) {
    out.set(t.name, {
      tool: {
        name: t.name, description: t.description, inputSchema: inputSchema(t.input),
        // It adds a suggestion, but changes nothing in the books.
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      },
      run: (ctx, args, req, reply) => invoke(app, proposeOp, ctx, { params: {}, body: { ...args, kind: t.kind } }, req, reply, "mcp"),
    });
  }
  return out;
}

/** A tool's failure as the model should read it: what was wrong, field by field. */
function failure(err: unknown) {
  if (err instanceof AppError) {
    const fields = err.fields ? Object.entries(err.fields).map(([k, v]) => `\n- ${k}: ${v}`).join("") : "";
    return { status: err.status, text: `${err.message}${fields}` };
  }
  return { status: 500, text: "Something went wrong on BillingEase's side. Try again in a moment." };
}

/**
 * The MCP server, over Streamable HTTP at /mcp. Stateless: each request carries its token and
 * gets a fresh server, so any API instance can answer it. Replies are plain JSON (no stream).
 */
export async function mcpRoutes(root: FastifyInstance, scope: FastifyInstance) {
  const registry = tools(root);

  scope.post("/mcp", {
    config: { rateLimit: { max: root.be.config.api.perMinute, timeWindow: "1 minute", keyGenerator: (req: FastifyRequest) => req.headers.authorization ?? req.ip } },
  }, async (req, reply) => {
    const ctx = await authenticateToken(root, req, reply, "mcp");
    const server = new Server({ name: "billingease", title: "BillingEase", version: "1.0.0" }, { capabilities: { tools: {} }, instructions: INSTRUCTIONS });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [...registry.values()].map((e) => e.tool) }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const entry = registry.get(request.params.name);
      if (!entry) return { isError: true, content: [{ type: "text" as const, text: `There's no tool called ${request.params.name}.` }] };
      const startedAt = performance.now();
      try {
        const result = await entry.run(ctx, request.params.arguments ?? {}, req, reply);
        await logCall(ctx, "mcp", request.params.name, 200, startedAt);
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result as Record<string, unknown> };
      } catch (err) {
        const f = failure(err);
        if (f.status === 500) req.log.error({ err, tool: request.params.name }, "MCP tool failed");
        await logCall(ctx, "mcp", request.params.name, f.status, startedAt);
        return { isError: true, content: [{ type: "text" as const, text: f.text }] };
      }
    });

    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    await server.connect(transport);
    try {
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
      const request = new Request(`${root.be.config.appUrl}/mcp`, { method: "POST", headers, body: JSON.stringify(req.body) });
      const res = await transport.handleRequest(request, { parsedBody: req.body });
      reply.status(res.status);
      res.headers.forEach((v, k) => reply.header(k, v));
      const text = await res.text();
      return reply.send(text || undefined);
    } finally {
      await transport.close();
      await server.close();
    }
  });

  // Stateless: no stream to open and no session to end.
  const notHere = async (_req: FastifyRequest, reply: FastifyReply) => reply.status(405).header("allow", "POST").send({ error: { code: "method_not_allowed", message: "This MCP server takes POST requests only." } });
  scope.get("/mcp", notHere);
  scope.delete("/mcp", notHere);
}
