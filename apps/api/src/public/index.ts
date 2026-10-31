import type { FastifyInstance } from "fastify";
import { AppError } from "../lib/errors";
import { accessRoutes } from "./access";
import { mcpRoutes } from "./mcp";
import { authorizeRoutes, oauthRoutes } from "./oauth";
import { v1Routes } from "./v1";

/**
 * What outside apps call: /v1, /mcp, /oauth/* and /.well-known/*. They reach the API through
 * the web app's public address, which forwards them with the internal key. Tokens, not web
 * sessions, authenticate here.
 */
export async function publicRoutes(app: FastifyInstance) {
  accessRoutes(app);
  authorizeRoutes(app);
  await app.register(async (scope) => {
    const key = app.be.config.internalKey;
    if (key) {
      scope.addHook("onRequest", async (req) => {
        if (req.headers["x-internal-key"] !== key) throw new AppError(401, "unauthorised", "Call BillingEase's public address, not the API directly.");
      });
    }
    await v1Routes(app, scope);
    await mcpRoutes(app, scope);
    await oauthRoutes(app, scope);
  });
}
