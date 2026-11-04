import { isAppEndpoint } from "@billingease/contracts";
import { forward, preflight } from "@/lib/forward";

/**
 * The BillingEase phone app. It signs in with email and password and calls the endpoints listed
 * in APP_ENDPOINTS (packages/contracts/src/mobile.ts) with its session token; anything else is
 * refused here, so the rest of the API stays private.
 */
async function handler(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const target = "/" + path.join("/");
  if (!isAppEndpoint(req.method, target)) {
    return Response.json({ error: { code: "not_found", message: "The app can't call that." } }, { status: 404, headers: { "access-control-allow-origin": "*" } });
  }
  return forward(req, target, { passIn: ["x-business-id"] });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = preflight;
