import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { GOOGLE_COOKIE, googleEnabled, googleRedirectUri, publicUrl, safeNext, type GoogleAttempt } from "@/lib/google";

const random = () => randomBytes(32).toString("base64url");

/**
 * Sends the person to Google to choose an account (OpenID Connect, authorization code with
 * PKCE). `?intent=link` connects Google to the signed-in account instead of signing in.
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const intent = p.get("intent") === "link" ? "link" : "signin";
  const back = intent === "link" ? "/app/settings/sign-in" : "/sign-in";
  if (!googleEnabled()) return NextResponse.redirect(publicUrl(`${back}?google=google_off`, req));

  const country = p.get("country");
  const attempt: GoogleAttempt = {
    state: random(), verifier: random(), nonce: random(), intent,
    next: safeNext(p.get("next"), "") || null,
    country: country && /^(uk|lk|us)$/.test(country) ? country : null,
  };
  (await cookies()).set(GOOGLE_COOKIE, JSON.stringify(attempt), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/auth/google", maxAge: 600,
  });

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    state: attempt.state,
    nonce: attempt.nonce,
    code_challenge: createHash("sha256").update(attempt.verifier).digest("base64url"),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return NextResponse.redirect(url);
}
