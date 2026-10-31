import type { Exec } from "@billingease/db";
import { businesses, outboxEmails } from "@billingease/db/schema";
import { eq } from "drizzle-orm";
import type { Storage } from "./storage";

/** An image sent inside the email itself and shown with `cid:` (mail apps block outside images). */
export type InlineImage = { filename: string; contentType: string; content: Uint8Array; contentId: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * The HTML version of an email to a customer, in the business's colours with its logo on top.
 * The text is the same as the plain version, paragraph for paragraph; tables keep it readable in
 * every mail app.
 */
export function brandedEmailHtml(o: { businessName: string; accent: string; text: string; footer?: string | null; logoCid?: string | null }) {
  const accent = /^#[0-9a-f]{6}$/i.test(o.accent) ? o.accent : "#7A5AF8";
  const paras = o.text.trim().split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#18161f">${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  const head = o.logoCid
    ? `<img src="cid:${o.logoCid}" alt="${esc(o.businessName)}" style="display:block;max-height:56px;max-width:220px;border:0">`
    : `<span style="font-size:20px;font-weight:700;color:#18161f">${esc(o.businessName)}</span>`;
  const foot = o.footer?.trim() ? `<p style="margin:0;font-size:12px;line-height:1.5;color:#5f5b68">${esc(o.footer.trim())}</p>` : "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f3f7">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f7"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Helvetica,Arial,sans-serif">
<tr><td style="height:6px;background:${accent};font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:24px 28px 8px">${head}</td></tr>
<tr><td style="padding:12px 28px 14px">${paras}</td></tr>
${foot ? `<tr><td style="padding:14px 28px 22px;border-top:1px solid #e2dfe8">${foot}</td></tr>` : ""}
</table></td></tr></table></body></html>`;
}

/**
 * For an email about an invoice, quote or credit note: its HTML version and the logo to go inside
 * it. Other emails (sign-in, password resets) stay plain text.
 */
export async function customerEmailExtras(db: Exec, m: typeof outboxEmails.$inferSelect, storage?: Storage): Promise<{ html: string | null; inline: InlineImage[] }> {
  if (!m.businessId || (!m.attachInvoiceId && !m.attachQuoteId)) return { html: null, inline: [] };
  const [b] = await db.select().from(businesses).where(eq(businesses.id, m.businessId));
  if (!b) return { html: null, inline: [] };
  const inline: InlineImage[] = [];
  if (storage && b.logoKey && b.logoMime) {
    const bytes = await storage.get(b.logoKey).catch(() => null);
    if (bytes) inline.push({ filename: b.logoMime === "image/png" ? "logo.png" : "logo.jpg", contentType: b.logoMime, content: bytes, contentId: "logo" });
  }
  return { html: brandedEmailHtml({ businessName: b.name, accent: b.accent, text: m.bodyText, footer: b.footer, logoCid: inline.length ? "logo" : null }), inline };
}
