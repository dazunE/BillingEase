import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { resetDbForTests, type Db } from "@/db/client";
import { businesses, customers, invoices, outboxEmails, payments, users } from "@/db/schema";
import { accountBySubtype, balancesAsOf, createDefaultAccounts, trialBalance } from "@/lib/ledger";
import { createCustomer, createInvoice, OpError, recordPayment, sendInvoice, sendReminder } from "@/lib/ops";
import {
  comingInOverview,
  createAndSendInvoice,
  invoiceByToken,
  invoiceDetail,
  invoiceStatus,
  listCustomers,
  listInvoices,
  markViewed,
  payInvoiceOnline,
  updateCustomer,
  voidInvoiceAndLog,
} from "@/lib/ops-in";

const T = "2026-10-04";
const send = { appUrl: "http://localhost:3000", businessName: "Northwind Studio" };
let db: Db;
let businessId: string;
let otherBusinessId: string;

beforeEach(async () => {
  db = await resetDbForTests();
  const [u] = await db.insert(users).values({ email: "maya@example.com", name: "Maya", passwordHash: "x" }).returning();
  const [b] = await db.insert(businesses).values({ ownerId: u.id, name: "Northwind Studio" }).returning();
  businessId = b.id;
  await createDefaultAccounts(db, businessId);
  const [u2] = await db.insert(users).values({ email: "other@example.com", name: "Other", passwordHash: "x" }).returning();
  const [b2] = await db.insert(businesses).values({ ownerId: u2.id, name: "Other Co" }).returning();
  otherBusinessId = b2.id;
  await createDefaultAccounts(db, otherBusinessId);
});

const balanceOf = async (subtype: string) => {
  const acct = await accountBySubtype(db, businessId, subtype);
  return (await balancesAsOf(db, businessId, T)).find((b) => b.accountId === acct.id)?.balance ?? 0;
};

describe("updateCustomer", () => {
  it("updates contact details and clears empty fields", async () => {
    const c = await createCustomer(db, businessId, { name: "Atlas", email: "a@atlas.example", phone: "555" });
    const row = await updateCustomer(db, businessId, c.id, { name: "  Atlas Freight Co. ", email: "", phone: " 555-0100 ", address: "1 Dock St" });
    expect(row).toMatchObject({ name: "Atlas Freight Co.", email: null, phone: "555-0100", address: "1 Dock St" });
  });

  it("requires a name and stays inside the business", async () => {
    const c = await createCustomer(db, businessId, { name: "Atlas" });
    await expect(updateCustomer(db, businessId, c.id, { name: "  " })).rejects.toBeInstanceOf(OpError);
    await expect(updateCustomer(db, otherBusinessId, c.id, { name: "Hijacked" })).rejects.toThrow("Customer not found.");
    const [still] = await db.select().from(customers).where(eq(customers.id, c.id));
    expect(still.name).toBe("Atlas");
  });
});

describe("createAndSendInvoice", () => {
  it("bills an existing customer: sends, emails a pay link and posts the sale", async () => {
    const c = await createCustomer(db, businessId, { name: "Atlas", email: "ap@atlas.example" });
    const r = await createAndSendInvoice(
      db,
      businessId,
      { customerId: c.id, lines: [{ description: "Logo", quantity: 1, unitCents: 120000 }, { description: "Rush fee", quantity: 1, unitCents: 5000 }], issueDate: T, dueInDays: 14, allowBank: false, repeatMonthly: true },
      send,
    );
    expect(r.emailed).toBe(true);
    expect(r.createdCustomer).toBe(false);
    expect(r.invoice.dueDate).toBe("2026-10-18");
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, r.invoice.id));
    expect(inv).toMatchObject({ status: "sent", totalCents: 125000, allowCard: true, allowBank: false, repeatMonthly: true });
    const mail = await db.select().from(outboxEmails);
    expect(mail).toHaveLength(1);
    expect(mail[0].toEmail).toBe("ap@atlas.example");
    expect(mail[0].link).toBe(`http://localhost:3000/i/${inv.publicToken}`);
    expect(await balanceOf("ar")).toBe(125000);
  });

  it("creates a new customer inline; without an email nothing is emailed", async () => {
    const r = await createAndSendInvoice(db, businessId, { newCustomer: { name: "Rocco's Pizza" }, lines: [{ description: "Menu", quantity: 1, unitCents: 30000 }], issueDate: T, dueInDays: 7 }, send);
    expect(r.createdCustomer).toBe(true);
    expect(r.emailed).toBe(false);
    expect(r.customer.name).toBe("Rocco's Pizza");
    expect(await db.select().from(outboxEmails)).toHaveLength(0);
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, r.invoice.id));
    expect(inv.status).toBe("sent");
  });

  it("is all-or-nothing inside a transaction", async () => {
    await expect(
      db.transaction((tx) => createAndSendInvoice(tx, businessId, { newCustomer: { name: "Ghost Co" }, lines: [{ description: "", quantity: 1, unitCents: 0 }], issueDate: T, dueInDays: 7 }, send)),
    ).rejects.toBeInstanceOf(OpError);
    expect(await db.select().from(customers).where(eq(customers.name, "Ghost Co"))).toHaveLength(0);
    expect(await db.select().from(invoices)).toHaveLength(0);
  });

  it("won't bill another business's customer", async () => {
    const theirs = await createCustomer(db, otherBusinessId, { name: "Theirs" });
    await expect(createAndSendInvoice(db, businessId, { customerId: theirs.id, lines: [{ description: "X", quantity: 1, unitCents: 100 }], issueDate: T, dueInDays: 7 }, send)).rejects.toBeInstanceOf(OpError);
  });
});

describe("coming in overview and lists", () => {
  it("groups late, on the way, drafts and received", async () => {
    const c = await createCustomer(db, businessId, { name: "Lumen", email: "o@lumen.example" });
    const mk = async (desc: string, cents: number, issue: string, due: string, sendIt = true) => {
      const inv = await createInvoice(db, businessId, { customerId: c.id, issueDate: issue, dueDate: due, lines: [{ description: desc, quantity: 1, unitCents: cents }] });
      if (sendIt) await sendInvoice(db, businessId, inv.id, send);
      return inv;
    };
    const late = await mk("Photo shoot", 115000, "2026-08-29", "2026-09-28");
    const soon = await mk("Brochure", 320000, "2026-09-20", "2026-10-20");
    await mk("Signage", 99500, T, "2026-11-03", false);
    const paid = await mk("Menu", 72000, "2026-09-15", "2026-10-15");
    await recordPayment(db, businessId, paid.id, { amountCents: 72000, method: "card", receivedOn: "2026-10-02" });
    await sendReminder(db, businessId, late.id, { ...send, personalNote: "Hi!" });
    await markViewed(db, businessId, "Lumen", soon.number);
    await markViewed(db, businessId, "Lumen", soon.number); // only logged once

    const o = await comingInOverview(db, businessId, T);
    expect(o.late.map((r) => [r.invoice.number, r.daysLate, r.openCents])).toEqual([[late.number, 6, 115000]]);
    expect(o.onTheWay.map((r) => r.invoice.number)).toEqual([soon.number]);
    expect(o.onTheWay[0].viewedAt).toBeInstanceOf(Date);
    expect(o.drafts).toHaveLength(1);
    expect(o.received.map((r) => r.payment.amountCents)).toEqual([72000]);

    expect((await listInvoices(db, businessId, { status: "unpaid" })).map((r) => r.invoice.number)).toEqual([late.number, soon.number]);
    expect(await listInvoices(db, businessId, { status: "draft" })).toHaveLength(1);
    expect(await listInvoices(db, businessId, { status: "paid" })).toHaveLength(1);
    expect(await listInvoices(db, businessId, { status: "all", q: "brochure" })).toHaveLength(1);
    expect(await listInvoices(db, otherBusinessId, { status: "all" })).toHaveLength(0);

    const [row] = await listCustomers(db, businessId, { today: T });
    expect(row).toMatchObject({ name: "Lumen", openCents: 435000, lateCents: 115000 });

    const d = await invoiceDetail(db, businessId, late.id);
    expect(d?.timeline.map((e) => e.label)).toEqual(["Created", "Sent", "Reminder sent"]);
    expect(await invoiceDetail(db, otherBusinessId, late.id)).toBeNull();
  });

  it("describes status in words", () => {
    const base = { totalCents: 100, paidCents: 0 };
    expect(invoiceStatus({ ...base, status: "sent", dueDate: "2026-10-01" }, T).label).toBe("3 days late");
    expect(invoiceStatus({ ...base, status: "sent", dueDate: "2026-10-05" }, T).label).toBe("Due soon");
    expect(invoiceStatus({ ...base, status: "sent", dueDate: "2026-11-05" }, T).label).toBe("Waiting");
    expect(invoiceStatus({ ...base, status: "paid", dueDate: "2026-11-05" }, T).label).toBe("Paid");
  });
});

describe("voidInvoiceAndLog", () => {
  it("takes a sent invoice off the books and hides its pay page", async () => {
    const c = await createCustomer(db, businessId, { name: "Oak" });
    const inv = await createInvoice(db, businessId, { customerId: c.id, issueDate: T, dueDate: T, lines: [{ description: "X", quantity: 1, unitCents: 5000 }] });
    await sendInvoice(db, businessId, inv.id, send);
    expect(await invoiceByToken(db, inv.publicToken)).not.toBeNull();
    expect(await voidInvoiceAndLog(db, businessId, inv.id)).toBe(false);
    expect(await balanceOf("ar")).toBe(0);
    expect(await invoiceByToken(db, inv.publicToken)).toBeNull();
    await expect(voidInvoiceAndLog(db, businessId, inv.id)).rejects.toBeInstanceOf(OpError);
    const d = await invoiceDetail(db, businessId, inv.id);
    expect(d?.timeline.at(-1)?.label).toBe("Voided");
  });
});

describe("payInvoiceOnline", () => {
  const setup = async (opts: { allowBank?: boolean } = {}) => {
    const c = await createCustomer(db, businessId, { name: "Atlas", email: "ap@atlas.example" });
    const { invoice } = await createAndSendInvoice(db, businessId, { customerId: c.id, lines: [{ description: "Work", quantity: 1, unitCents: 100000 }], issueDate: T, dueInDays: 30, allowBank: opts.allowBank }, send);
    return invoice;
  };

  it("charges a card, records the payment with a reference, and books the fee", async () => {
    const inv = await setup();
    const { payment, feeCents } = await db.transaction((tx) => payInvoiceOnline(tx, inv.publicToken, { method: "card", cardNumber: "4242 4242 4242 4242", receivedOn: T }));
    expect(payment).toMatchObject({ amountCents: 100000, method: "card" });
    expect(payment.providerRef).toMatch(/^sbx_/);
    expect(feeCents).toBe(2930);
    const [after] = await db.select().from(invoices).where(eq(invoices.id, inv.id));
    expect(after.status).toBe("paid");
    expect(await balanceOf("ar")).toBe(0);
    expect(await balanceOf("fees")).toBe(2930);
    const tb = await trialBalance(db, businessId);
    expect(tb.debit).toBe(tb.credit);
    await expect(payInvoiceOnline(db, inv.publicToken, { method: "card", cardNumber: "4242424242424242", receivedOn: T })).rejects.toThrow("already paid");
  });

  it("declines 4000 0000 0000 0002 without recording anything", async () => {
    const inv = await setup();
    await expect(payInvoiceOnline(db, inv.publicToken, { method: "card", cardNumber: "4000 0000 0000 0002", receivedOn: T })).rejects.toThrow("declined");
    expect(await db.select().from(payments)).toHaveLength(0);
  });

  it("respects the invoice's payment methods and unknown tokens", async () => {
    const inv = await setup({ allowBank: false });
    await expect(payInvoiceOnline(db, inv.publicToken, { method: "bank", receivedOn: T })).rejects.toThrow("bank");
    await expect(payInvoiceOnline(db, "nope", { method: "card", cardNumber: "4242424242424242", receivedOn: T })).rejects.toBeInstanceOf(OpError);
  });

  it("pays by bank", async () => {
    const inv = await setup();
    const { payment } = await payInvoiceOnline(db, inv.publicToken, { method: "bank", receivedOn: T });
    expect(payment.method).toBe("bank");
    expect(await balanceOf("fees")).toBe(1000);
  });
});
