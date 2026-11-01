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

/** Where Google sends people back. Must be listed exactly in the Google Cloud console. */
export function googleRedirectUri(origin: string) {
  return `${(process.env.APP_URL ?? origin).replace(/\/$/, "")}/auth/google/callback`;
}

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
