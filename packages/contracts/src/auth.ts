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

/** The password (or Google) was right; now the code from the authenticator app. */
export const TwoStepNeeded = z.object({ twoStep: z.literal(true), ticket: z.string(), expiresAt: z.string() });
export type TwoStepNeeded = z.infer<typeof TwoStepNeeded>;

const Code = z.string().trim().min(6, "Enter the 6-digit code from your app, or a backup code").max(20);

export const TwoStepStatus = z.object({
  on: z.boolean(),
  since: z.string().nullable(),
  /** Backup codes not used yet. */
  backupLeft: z.number().int(),
});
export type TwoStepStatus = z.infer<typeof TwoStepStatus>;

export const SignInEvent = z.object({
  id: z.string(),
  at: z.string(),
  userAgent: z.string().nullable(),
  method: z.string(),
  ok: z.boolean(),
  reason: z.string().nullable(),
});
export type SignInEvent = z.infer<typeof SignInEvent>;

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
  twoStep: TwoStepStatus,
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
    /** A session, or (with two-step sign-in on) a ticket to finish with the code. */
    response: z.union([Session, TwoStepNeeded]),
  }),
  /** The second step: the 6-digit code (or a backup code) with the ticket from sign-in. */
  twoStep: endpoint({
    method: "POST", path: "/auth/two-step", auth: "public",
    body: z.object({ ticket: z.string().min(10).max(200), code: Code }),
    response: Session,
  }),
  /** Starts turning two-step on: a new secret to put in the authenticator app. */
  twoStepSetup: endpoint({
    method: "POST", path: "/auth/two-step/setup", auth: "user",
    response: z.object({ secret: z.string(), uri: z.string() }),
  }),
  /** Finishes turning it on with a code from the app. The backup codes are shown this once. */
  twoStepEnable: endpoint({
    method: "POST", path: "/auth/two-step/enable", auth: "user",
    body: z.object({ code: Code }), response: z.object({ codes: z.array(z.string()) }),
  }),
  /** New backup codes (the old ones stop working). Needs a code from the app. */
  twoStepCodes: endpoint({
    method: "POST", path: "/auth/two-step/codes", auth: "user",
    body: z.object({ code: Code }), response: z.object({ codes: z.array(z.string()) }),
  }),
  /** Turns it off. Needs a code from the app or a backup code. */
  twoStepDisable: endpoint({
    method: "POST", path: "/auth/two-step/disable", auth: "user",
    body: z.object({ code: Code }), response: Ok,
  }),
  /** Sign-ins and failed attempts in the last 30 days, newest first. */
  signIns: endpoint({ method: "GET", path: "/auth/sign-ins", auth: "user", response: z.object({ signIns: z.array(SignInEvent) }) }),
  signOut: endpoint({ method: "POST", path: "/auth/sign-out", auth: "user", response: Ok }),
  me: endpoint({ method: "GET", path: "/auth/me", auth: "user", response: Me }),
  /** Always answers ok, so it can't be used to find out who has an account. */
  forgotPassword: endpoint({ method: "POST", path: "/auth/forgot-password", auth: "public", body: z.object({ email: Email }), response: Ok }),
  resetPassword: endpoint({
    method: "POST", path: "/auth/reset-password", auth: "public",
    body: z.object({ token: z.string().min(10), password: Password }),
    /** Signed in, or (with two-step sign-in on) a ticket for the code. */
    response: z.union([Session, TwoStepNeeded]),
  }),
  /**
   * Sign in (or up) with Google. A Google account seen before signs in to its person; otherwise a
   * verified Google email that matches an account is linked to it; otherwise a new account is
   * made. `created` says it's new, so the web app goes on to set up a business.
   */
  google: endpoint({
    method: "POST", path: "/auth/google", auth: "public", body: GoogleCode,
    response: z.union([Session.extend({ created: z.boolean() }), TwoStepNeeded]),
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
