import { z } from "zod";
import { Country, endpoint, Ok, optionalText } from "./endpoint";

export const Me = z.object({
  user: z.object({ id: z.string(), email: z.string(), name: z.string() }),
  businesses: z.array(z.object({ id: z.string(), name: z.string(), country: Country, role: z.enum(["owner", "accountant", "admin"]) })),
});
export type Me = z.infer<typeof Me>;

const Email = z.string().trim().toLowerCase().email("Enter an email address like name@example.com").max(200);
const Password = z.string().min(10, "Use at least 10 characters").max(200);

export const Session = z.object({ token: z.string(), expiresAt: z.string() });

/**
 * What the web app hands over after Google sends the person back: the one-time code, the PKCE
 * verifier and nonce it made when it sent them, and the exact redirect URI it used.
 */
const GoogleCode = z.object({
  code: z.string().min(1).max(2000),
  codeVerifier: z.string().min(43).max(128),
  nonce: z.string().min(16).max(200),
  redirectUri: z.string().url().max(500),
});

/** How a person can sign in. They always keep at least one way. */
export const SignInMethods = z.object({
  email: z.string(),
  hasPassword: z.boolean(),
  google: z.object({ email: z.string() }).nullable(),
  /** False when this BillingEase isn't set up for Google (no GOOGLE_CLIENT_ID). */
  googleAvailable: z.boolean(),
});
export type SignInMethods = z.infer<typeof SignInMethods>;

export const auth = {
  signUp: endpoint({
    method: "POST", path: "/auth/sign-up", auth: "public",
    body: z.object({ name: z.string().trim().min(1, "Enter your name").max(120), email: Email, password: Password }),
    response: Session,
  }),
  signIn: endpoint({
    method: "POST", path: "/auth/sign-in", auth: "public",
    body: z.object({ email: Email, password: z.string().min(1, "Enter your password") }),
    response: Session,
  }),
  signOut: endpoint({ method: "POST", path: "/auth/sign-out", auth: "user", response: Ok }),
  me: endpoint({ method: "GET", path: "/auth/me", auth: "user", response: Me }),
  /** Always answers ok, so it can't be used to find out who has an account. */
  forgotPassword: endpoint({ method: "POST", path: "/auth/forgot-password", auth: "public", body: z.object({ email: Email }), response: Ok }),
  resetPassword: endpoint({
    method: "POST", path: "/auth/reset-password", auth: "public",
    body: z.object({ token: z.string().min(10), password: Password }), response: Session,
  }),
  /**
   * Sign in (or up) with Google. A Google account seen before signs in to its person; otherwise a
   * verified Google email that matches an account is linked to it; otherwise a new account is
   * made. `created` says it's new, so the web app goes on to set up a business.
   */
  google: endpoint({
    method: "POST", path: "/auth/google", auth: "public", body: GoogleCode,
    response: Session.extend({ created: z.boolean() }),
  }),
  signInMethods: endpoint({ method: "GET", path: "/auth/sign-in-methods", auth: "user", response: SignInMethods }),
  linkGoogle: endpoint({ method: "POST", path: "/auth/google/link", auth: "user", body: GoogleCode, response: SignInMethods }),
  /** Refused when Google is the only way this person signs in. */
  unlinkGoogle: endpoint({ method: "DELETE", path: "/auth/google", auth: "user", response: SignInMethods }),
  /** For someone who signed up with Google and has no password yet. */
  setPassword: endpoint({ method: "POST", path: "/auth/set-password", auth: "user", body: z.object({ password: Password }), response: SignInMethods }),
  changePassword: endpoint({
    method: "POST", path: "/auth/change-password", auth: "user",
    body: z.object({ current: z.string().min(1), password: Password }), response: Ok,
  }),
};

export { optionalText };
