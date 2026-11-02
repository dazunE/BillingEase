import { z } from "zod";
import { Country, endpoint, Ok } from "./endpoint";

/**
 * Your business → People and access, and Security and data: who can open the books, invitations,
 * where you're signed in.
 */

export const InviteRole = z.enum(["accountant", "admin"]);
export type InviteRole = z.infer<typeof InviteRole>;

export const Member = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["owner", "accountant", "admin"]),
  /** The person looking at the page. */
  you: z.boolean(),
  since: z.string(),
  /** When they last used BillingEase, from their most recent session. */
  lastSeenAt: z.string().nullable(),
});
export type Member = z.infer<typeof Member>;

export const Invite = z.object({
  id: z.string(),
  email: z.string(),
  role: InviteRole,
  invitedBy: z.string().nullable(),
  createdAt: z.string(),
  expiresAt: z.string(),
});
export type Invite = z.infer<typeof Invite>;

/** What someone opening an invitation link sees before accepting. */
export const InvitePreview = z.object({
  businessName: z.string(),
  country: Country,
  role: InviteRole,
  email: z.string(),
  invitedBy: z.string().nullable(),
  /** "ok", or why it can't be used. */
  state: z.enum(["ok", "expired", "used", "revoked"]),
});
export type InvitePreview = z.infer<typeof InvitePreview>;

export const SignedInDevice = z.object({
  /** A short id for this session (never the token or its whole hash). */
  id: z.string(),
  userAgent: z.string().nullable(),
  createdAt: z.string(),
  lastSeenAt: z.string().nullable(),
  expiresAt: z.string(),
  current: z.boolean(),
});
export type SignedInDevice = z.infer<typeof SignedInDevice>;

const Email = z.string().trim().toLowerCase().email("Enter an email address like name@example.com").max(200);

export const people = {
  members: endpoint({
    method: "GET", path: "/business/members",
    response: z.object({ members: z.array(Member), invites: z.array(Invite) }),
  }),
  /** Emails a link that adds the person to this business when they accept it. Owner only. */
  invite: endpoint({
    method: "POST", path: "/business/invites", roles: ["owner"],
    body: z.object({ email: Email, role: InviteRole }),
    response: Invite,
  }),
  revokeInvite: endpoint({ method: "DELETE", path: "/business/invites/:id", roles: ["owner"], response: Ok }),
  /** Takes someone's access away. The owner can't be removed. */
  removeMember: endpoint({ method: "DELETE", path: "/business/members/:userId", roles: ["owner"], response: Ok }),
  /** Public: what an invitation is for, so the page can say so before sign-in. */
  invitePreview: endpoint({ method: "GET", path: "/invites/:token", auth: "public", response: InvitePreview }),
  /** Accepted by whoever is signed in, when their email is the one invited. */
  acceptInvite: endpoint({
    method: "POST", path: "/invites/:token/accept", auth: "user",
    response: z.object({ businessId: z.string(), businessName: z.string() }),
  }),

  sessions: endpoint({ method: "GET", path: "/auth/sessions", auth: "user", response: z.object({ sessions: z.array(SignedInDevice) }) }),
  /** Signs one session out (not this one: use sign out). */
  endSession: endpoint({ method: "DELETE", path: "/auth/sessions/:id", auth: "user", response: Ok }),
  /** Signs out every session but this one. */
  endOtherSessions: endpoint({ method: "POST", path: "/auth/sessions/end-others", auth: "user", response: z.object({ ended: z.number().int() }) }),
};
