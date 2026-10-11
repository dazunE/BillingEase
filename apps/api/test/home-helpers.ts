import { mkdtempSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { connect, type Db } from "@billingease/db";
import { bills, customers, expenses, invoices, receipts, suppliers } from "@billingease/db/schema";
import { buildApp } from "../src/app";
import { loadConfig } from "../src/config";
import { createServices } from "../src/services";
import type { AskClient } from "../src/services/ask-client";

/** A fresh API on an in-memory database, with an optional (fake) Ask client. */
export async function homeTestApp(opts: { ask?: AskClient | null } = {}) {
  const h = await connect({ pgliteDir: "memory://" });
  const config = { ...loadConfig({ NODE_ENV: "test" }), storage: { dir: mkdtempSync(path.join(tmpdir(), "be-files-")) } };
  const services = createServices(config, { transport: null, ask: opts.ask ?? null });
  const app = await buildApp({ db: h.db, config, services, logger: false });
  return { app, db: h.db, close: async () => { await app.close(); await h.close(); } };
}

/** Rows written straight into the tables, as the Coming in and Going out areas would leave them. */
export function seed(db: Db, businessId: string) {
  return {
    customer: async (name = "Acme Ltd", extra: Partial<typeof customers.$inferInsert> = {}) =>
      (await db.insert(customers).values({ businessId, name, ...extra }).returning())[0],
    invoice: async (v: { customerId: string; number?: string | null; status?: "draft" | "sent" | "part_paid" | "paid" | "void"; kind?: "invoice" | "credit_note"; issueDate: string; dueDate: string; net?: number; vat?: number; sscl?: number; total: number; paid?: number }) =>
      (await db.insert(invoices).values({
        businessId, customerId: v.customerId, kind: v.kind ?? "invoice", number: v.status === "draft" ? null : v.number ?? `INV-${randomBytes(3).toString("hex")}`,
        status: v.status ?? "sent", issueDate: v.issueDate, dueDate: v.dueDate, net: v.net ?? v.total, vat: v.vat ?? 0, sscl: v.sscl ?? 0, total: v.total, paid: v.paid ?? 0,
        publicToken: randomBytes(12).toString("hex"),
      }).returning())[0],
    receipt: async (invoiceId: string, amount: number, receivedOn: string) =>
      (await db.insert(receipts).values({ businessId, invoiceId, amount, receivedOn, method: "Bank transfer" }).returning())[0],
    expense: async (v: { spentOn: string; gross: number; vat?: number; bizPct?: number; categoryId?: string | null; payee?: string; note?: string }) =>
      (await db.insert(expenses).values({ businessId, spentOn: v.spentOn, gross: v.gross, vat: v.vat ?? 0, bizPct: v.bizPct ?? 100, categoryId: v.categoryId === undefined ? "office" : v.categoryId, payee: v.payee ?? "Ryman", note: v.note ?? null, method: "Card" }).returning())[0],
    supplier: async (name = "Northern Power") => (await db.insert(suppliers).values({ businessId, name }).returning())[0],
    bill: async (v: { supplierId: string; billDate: string; dueDate: string; net: number; vat?: number; paid?: number; status?: "unpaid" | "part_paid" | "paid" | "void"; description?: string; reference?: string }) =>
      (await db.insert(bills).values({ businessId, supplierId: v.supplierId, billDate: v.billDate, dueDate: v.dueDate, net: v.net, vat: v.vat ?? 0, total: v.net + (v.vat ?? 0), paid: v.paid ?? 0, status: v.status ?? "unpaid", description: v.description ?? "Electricity", reference: v.reference ?? null }).returning())[0],
  };
}
