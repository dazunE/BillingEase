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
  changePassword: endpoint({
    method: "POST", path: "/auth/change-password", auth: "user",
    body: z.object({ current: z.string().min(1), password: Password }), response: Ok,
  }),
};

export { optionalText };
