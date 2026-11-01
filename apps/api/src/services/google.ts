import type { Config } from "../config";
import { AppError } from "../lib/errors";

/** Who Google says signed in. `sub` is Google's stable id for the person. */
export type GoogleProfile = { sub: string; email: string; emailVerified: boolean; name: string | null };

export type GoogleCodeInput = { code: string; codeVerifier: string; nonce: string; redirectUri: string };

/** Turns the code Google sent the person back with into who they are. */
export type GoogleSignIn = { verify(input: GoogleCodeInput): Promise<GoogleProfile> };

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);

const refused = () => new AppError(400, "google_failed", "Google didn't confirm who you are. Try again, or sign in with your email and password.");

function decodePayload(jwt: string): Record<string, unknown> {
  const part = jwt.split(".")[1];
  if (!part) throw refused();
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    throw refused();
  }
}

/**
 * Checks the ID token's claims: Google issued it, for this app, it hasn't expired, and it carries
 * the nonce the web app made for this attempt (so a code can't be replayed into another one).
 */
export function checkIdToken(claims: Record<string, unknown>, clientId: string, nonce: string, now = Date.now()): GoogleProfile {
  const aud = claims.aud;
  const audOk = aud === clientId || (Array.isArray(aud) && aud.includes(clientId));
  if (!ISSUERS.has(String(claims.iss)) || !audOk) throw refused();
  if (typeof claims.exp !== "number" || claims.exp * 1000 < now - 60_000) throw refused();
  if (claims.nonce !== nonce) throw refused();
  if (typeof claims.sub !== "string" || !claims.sub || typeof claims.email !== "string" || !claims.email) throw refused();
  return {
    sub: claims.sub,
    email: claims.email.trim().toLowerCase(),
    emailVerified: claims.email_verified === true || claims.email_verified === "true",
    name: typeof claims.name === "string" && claims.name.trim() ? claims.name.trim().slice(0, 120) : null,
  };
}

/**
 * Google sign-in (OpenID Connect, authorization code with PKCE). The code is swapped for an ID
 * token directly with Google's token endpoint over TLS, using the client secret, so the token's
 * signature needn't be checked separately (OpenID Connect Core 3.1.3.7); its claims are.
 * Null when GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET aren't set.
 */
export function googleSignIn(config: Config): GoogleSignIn | null {
  const g = config.google;
  if (!g) return null;
  return {
    async verify({ code, codeVerifier, nonce, redirectUri }) {
      let res: Response;
      try {
        res = await fetch(TOKEN_URL, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
          body: new URLSearchParams({
            grant_type: "authorization_code", code, code_verifier: codeVerifier, redirect_uri: redirectUri,
            client_id: g.clientId, client_secret: g.clientSecret,
          }),
          signal: AbortSignal.timeout(8000),
        });
      } catch {
        throw new AppError(502, "google_unreachable", "We couldn't reach Google just now. Try again in a minute.");
      }
      const json = (await res.json().catch(() => null)) as { id_token?: string } | null;
      if (!res.ok || !json?.id_token) throw refused();
      return checkIdToken(decodePayload(json.id_token), g.clientId, nonce);
    },
  };
}
