import type { Db } from "@billingease/db";
import type { businesses } from "@billingease/db/schema";
import type { Config } from "../config";
import type { Services } from "../services";

export type Role = "owner" | "accountant" | "admin";
export type BusinessRow = typeof businesses.$inferSelect;

/** What every handler gets: the database, settings, services, and who is calling. */
export type Ctx = {
  db: Db;
  config: Config;
  services: Services;
  user: { id: string; email: string; name: string } | null;
  sessionId: string | null;
  business: BusinessRow | null;
  role: Role | null;
};

/** A context where the caller is a signed-in member of the business. */
export type BizCtx = Ctx & { user: NonNullable<Ctx["user"]>; business: BusinessRow; role: Role };
