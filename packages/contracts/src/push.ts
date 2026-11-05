import { z } from "zod";
import { endpoint, Ok } from "./endpoint";

/** The kinds of notification a phone can choose to be pushed. Anything else is always sent. */
export const PUSH_KINDS = ["paid", "late", "payroll", "accountant", "deadlines", "drafts", "budgets"] as const;
export const PushKind = z.enum(PUSH_KINDS);
export type PushKind = z.infer<typeof PushKind>;

/** An Expo push token, e.g. ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]. */
const Token = z.string().trim().regex(/^Expo(nent)?PushToken\[[A-Za-z0-9_-]{10,}\]$/, "Not an Expo push token");

export const PushDeviceBody = z.object({
  token: Token,
  platform: z.enum(["ios", "android"]),
  /** The phone's name, for "where you get notifications". */
  name: z.string().trim().max(80).optional().nullable(),
  kinds: z.array(PushKind).max(PUSH_KINDS.length),
});
export type PushDeviceBody = z.input<typeof PushDeviceBody>;

export const PushDevice = z.object({ token: z.string(), platform: z.enum(["ios", "android"]), kinds: z.array(PushKind) });

export const push = {
  /** Registers this phone (or changes what it wants), for the person signed in. */
  register: endpoint({ method: "PUT", path: "/push/devices", auth: "user", body: PushDeviceBody, response: PushDevice }),
  /** Stops pushes to this phone: on sign-out, or when notifications are turned off. */
  unregister: endpoint({ method: "POST", path: "/push/devices/remove", auth: "user", body: z.object({ token: Token }), response: Ok }),
};
