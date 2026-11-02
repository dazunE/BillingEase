import "server-only";

/** Google sign-in shows only when this BillingEase has a Google OAuth client (GOOGLE_CLIENT_ID). */
export const googleEnabled = () => !!process.env.GOOGLE_CLIENT_ID;

/** Holds this attempt's state, PKCE verifier and nonce between leaving for Google and coming back. */
export const GOOGLE_COOKIE = "be_google";

export type GoogleAttempt = {
  state: string;
  verifier: string;
  nonce: string;
  /** Signing in (or up), or connecting Google to the signed-in account. */
  intent: "signin" | "link";
  next: string | null;
  country: string | null;
};

/**
 * The address people open the app at, e.g. https://billingease.app. Behind a proxy or in a
 * container the request's own URL is the internal one (http://0.0.0.0:3000, a service name), which
 * neither Google nor the browser can use, so APP_URL comes first, then the proxy's forwarded host.
 */
export function publicOrigin(req: { headers: Headers; nextUrl: { origin: string } }) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (host) {
    const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    return `${proto}://${host}`;
  }
  return req.nextUrl.origin;
}

/**
 * Where Google sends the browser back: this web app's callback, on the public address. (Not the
 * API: the browser can't reach it, and the web app hands the code to the API itself.) It must be
 * listed exactly, character for character, under the OAuth client's "Authorised redirect URIs"
 * in the Google Cloud console. GOOGLE_REDIRECT_URI overrides it when the two must differ.
 */
export function googleRedirectUri(req: { headers: Headers; nextUrl: { origin: string } }) {
  return (process.env.GOOGLE_REDIRECT_URI || `${publicOrigin(req)}/auth/google/callback`).trim();
}

/** A path on the public address, for redirects after Google. */
export const publicUrl = (path: string, req: { headers: Headers; nextUrl: { origin: string } }) => new URL(path, publicOrigin(req) + "/");

/** Only same-site paths, so a crafted link can't send people elsewhere after sign-in. */
export function safeNext(next: string | null | undefined, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

/** Plain words for each way Google sign-in can fail, by the code in `?google=`. */
export const GOOGLE_ERRORS: Record<string, string> = {
  cancelled: "Google sign-in was cancelled. Try again, or use your email and password.",
  expired: "That Google sign-in took too long or was opened in another browser. Please try again.",
  google_failed: "Google didn't confirm who you are. Try again, or sign in with your email and password.",
  google_unreachable: "We couldn't reach Google just now. Try again in a minute.",
  google_unverified: "Google hasn't verified the email on that account yet. Verify it with Google, or sign up with your email and a password.",
  google_other: "Your BillingEase account is connected to a different Google account. Sign in with that one, or with your password.",
  google_taken: "That Google account already signs in to a different BillingEase account.",
  google_off: "Signing in with Google isn't set up here. Use your email and password.",
};
