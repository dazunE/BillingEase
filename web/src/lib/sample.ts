import { payrollRuns } from "@/db/schema";
import { addDays, startOfMonth } from "./dates";
import { accountByCode, accountBySubtype, postEntry, type Exec } from "./ledger";
import { connectBank, createBill, createCustomer, createInvoice, recordPayment, sendInvoice } from "./ops";

/**
 * Fills a new business with a realistic month for a small design studio, so
 * the three numbers mean something on day one. Everything goes through the
 * same operations as real use, so the ledger is genuine.
 */
export async function seedSampleData(db: Exec, businessId: string, opts: { today: string; appUrl: string; businessName: string }) {
  const T = opts.today;
  const monthStart = startOfMonth(T);
  // dates "a few days ago" stay inside the current month
  const thisMonth = (daysAgo: number) => {
    const d = addDays(T, -daysAgo);
    return d < monthStart ? monthStart : d;
  };

  // Opening balance in the bank, before this period.
  const cash = await accountBySubtype(db, businessId, "cash");
  const opening = await accountBySubtype(db, businessId, "opening");
  await postEntry(db, {
    businessId,
    date: addDays(monthStart, -60),
    memo: "Opening balance",
    sourceType: "opening",
    lines: [
      { accountId: cash.id, debit: 3800000 },
      { accountId: opening.id, credit: 3800000 },
    ],
  });

  const c = async (name: string, email: string) => createCustomer(db, businessId, { name, email });
  const atlas = await c("Atlas Freight Co.", "billing@atlasfreight.example");
  const harbor = await c("Harbor & Pine Café", "daniel@harborandpine.example");
  const lumen = await c("Lumen Dental Group", "office@lumendental.example");
  const greenline = await c("Greenline Architects", "studio@greenline.example");
  const oak = await c("Oak Street Bakery", "hello@oakstreetbakery.example");
  const bluebird = await c("Bluebird Yoga", "frontdesk@bluebirdyoga.example");
  const ridge = await c("Ridge Outdoor Supply", "ap@ridgeoutdoor.example");

  const send = { appUrl: opts.appUrl, businessName: opts.businessName };
  const invoice = async (customerId: string, description: string, cents: number, issued: string, due: string) => {
    const inv = await createInvoice(db, businessId, { customerId, issueDate: issued, dueDate: due, lines: [{ description, quantity: 1, unitCents: cents }] });
    await sendInvoice(db, businessId, inv.id, send);
    return inv;
  };

  // Paid this month
  const a1 = await invoice(atlas.id, "Fleet rebrand, phase 1", 630000, addDays(T, -34), addDays(T, -4));
  await recordPayment(db, businessId, a1.id, { amountCents: 630000, method: "bank", receivedOn: thisMonth(2) });
  const r1 = await invoice(ridge.id, "Catalog layout, fall edition", 396000, addDays(T, -20), addDays(T, 10));
  await recordPayment(db, businessId, r1.id, { amountCents: 396000, method: "card", receivedOn: thisMonth(1) });
  const o1 = await invoice(oak.id, "Seasonal menu boards", 72000, addDays(T, -18), addDays(T, 12));
  await recordPayment(db, businessId, o1.id, { amountCents: 72000, method: "card", receivedOn: thisMonth(3) });

  // Late
  await invoice(harbor.id, "August menu design", 248000, addDays(T, -62), addDays(T, -32));
  await invoice(lumen.id, "Website photo shoot", 115000, addDays(T, -36), addDays(T, -6));

  // On the way
  await invoice(atlas.id, "Fleet rebrand, phase 2", 630000, addDays(T, -27), addDays(T, 3));
  await invoice(lumen.id, "Patient brochure set", 320000, addDays(T, -14), addDays(T, 16));
  await invoice(oak.id, "Holiday menu and signage", 141500, addDays(T, -6), addDays(T, 24));
  // Paid by the mobile deposit the bank feed will bring in
  await invoice(bluebird.id, "Monthly social posts", 54000, addDays(T, -12), addDays(T, 2));

  // A draft that hasn't gone out yet
  await createInvoice(db, businessId, { customerId: greenline.id, issueDate: T, dueDate: addDays(T, 30), lines: [{ description: "Office signage, balance", quantity: 1, unitCents: 99500 }] });

  // Bills still to pay
  const acct = async (code: string) => (await accountByCode(db, businessId, code)).id;
  await createBill(db, businessId, { vendorName: "Local Print Shop", description: "Brochure print run", categoryAccountId: await acct("6000"), amountCents: 64000, billDate: addDays(T, -5), dueDate: addDays(T, 8) });
  await createBill(db, businessId, { vendorName: "Comcast Business", description: "Fiber upgrade install", categoryAccountId: await acct("6080"), amountCents: 19000, billDate: addDays(T, -3), dueDate: addDays(T, 11) });
  await createBill(db, businessId, { vendorName: "Staples", description: "Paper, ink and mailers", categoryAccountId: await acct("6040"), amountCents: 21200, billDate: addDays(T, -2), dueDate: addDays(T, 18) });
  await createBill(db, businessId, { vendorName: "Elena Rossi", description: "Contract illustration", categoryAccountId: await acct("6020"), amountCents: 104500, billDate: addDays(T, -1), dueDate: addDays(T, 26) });

  // Bank and card feeds (sandbox)
  await connectBank(db, businessId, T);

  // Payroll waiting for approval, next Friday
  const day = new Date(T + "T12:00:00").getDay();
  const payDate = addDays(T, ((5 - day + 7) % 7) || 7);
  await db.insert(payrollRuns).values({
    businessId,
    payDate,
    totalCents: 723119,
    people: [
      { name: "Jordan Lee", netCents: 324018, grossCents: 425000 },
      { name: "Priya Nair", netCents: 208644, grossCents: 272000 },
      { name: "Sam Ortiz", netCents: 190457, grossCents: 249600 },
    ],
  });
}
