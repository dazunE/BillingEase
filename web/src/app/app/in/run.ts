import "server-only";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireBusiness } from "@/lib/auth";
import { redirectWithFlash } from "@/lib/flash";
import { deliverOutbox, withDelivery } from "@/lib/email";
import { LedgerError, type Tx } from "@/lib/ledger";
import { OpError } from "@/lib/ops";

type Business = Awaited<ReturnType<typeof requireBusiness>>["business"];
export type ActionCtx = { db: Tx; business: Business };

/**
 * Runs a one-tap action for the Coming in screens: checks the session, runs
 * in a transaction, sends any emails it queued, then returns to `back` with a confirmation (or the
 * problem, in plain words).
 */
export async function runAction(back: string, fn: (ctx: ActionCtx) => Promise<string>): Promise<never> {
  const ctx = await requireBusiness();
  let done: string;
  try {
    done = await ctx.db.transaction(async (tx) => fn({ db: tx, business: ctx.business }));
  } catch (err) {
    if (err instanceof OpError || err instanceof LedgerError) redirectWithFlash(back, err.message);
    throw err;
  }
  // Emails go out only once the books are saved.
  const delivery = await deliverOutbox(ctx.db, ctx.business.id, { appUrl: await baseUrl() });
  revalidatePath("/app", "layout");
  redirectWithFlash(back, withDelivery(done, delivery));
}

/** Only ever go back to a page inside the app. */
export const safeBack = (v: FormDataEntryValue | null, fallback = "/app/in") =>
  typeof v === "string" && v.startsWith("/app") && !v.startsWith("//") ? v : fallback;

/**
 * The address customers use to reach pay links. APP_URL in production;
 * otherwise the address this request came in on, so local links work.
 */
export async function baseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
