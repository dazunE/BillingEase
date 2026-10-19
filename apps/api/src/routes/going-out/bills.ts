import { goingOut } from "@billingease/contracts";
import { addDays, formatDate, posting, today } from "@billingease/core";
import { postEntry, reverseEntry, type Exec } from "@billingease/db";
import { attachments, billLines, billPayments, bills, suppliers } from "@billingease/db/schema";
import { and, asc, desc, eq, gte, inArray, isNull, lt, lte, ne, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { logActivity } from "../../lib/activity";
import type { BusinessRow } from "../../lib/context";
import { badRequest, conflict, notFound } from "../../lib/errors";
import { route } from "../../lib/route";
import { attachmentCounts, billOut, categoryFor, checkMethod, chequeFields, isCheque, money, supplierByName, supplierOf, type BillRow } from "./shared";

async function billRow(db: Exec, businessId: string, id: string) {
  const [b] = await db.select().from(bills).where(and(eq(bills.id, id), eq(bills.businessId, businessId)));
  if (!b) throw notFound("That bill");
  return b;
}

/** Bills with their supplier names, attachment counts and last payment date. */
async function billsOut(db: Exec, b: BusinessRow, rows: BillRow[]) {
  const ids = rows.map((r) => r.id);
  const supIds = [...new Set(rows.map((r) => r.supplierId))];
  const sups = supIds.length ? await db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers).where(and(eq(suppliers.businessId, b.id), inArray(suppliers.id, supIds))) : [];
  const names = new Map(sups.map((s) => [s.id, s.name]));
  const counts = await attachmentCounts(db, b.id, "bill", ids);
  const pays = ids.length ? await db.select({ billId: billPayments.billId, paidOn: billPayments.paidOn }).from(billPayments)
    .where(and(eq(billPayments.businessId, b.id), inArray(billPayments.billId, ids), isNull(billPayments.voidedAt))) : [];
  const last = new Map<string, string>();
  for (const p of pays) if (!last.has(p.billId) || last.get(p.billId)! < p.paidOn) last.set(p.billId, p.paidOn);
  return rows.map((r) => billOut(r, { supplierName: names.get(r.supplierId) ?? "Supplier", attachmentCount: counts.get(r.id) ?? 0, lastPaidOn: last.get(r.id) ?? null }));
}

async function billDetail(db: Exec, b: BusinessRow, row: BillRow) {
  const [bill] = await billsOut(db, b, [row]);
  const lines = await db.select().from(billLines).where(and(eq(billLines.businessId, b.id), eq(billLines.billId, row.id))).orderBy(asc(billLines.position));
  const pays = await db.select().from(billPayments).where(and(eq(billPayments.businessId, b.id), eq(billPayments.billId, row.id), isNull(billPayments.voidedAt))).orderBy(asc(billPayments.paidOn), asc(billPayments.createdAt));
  const files = await db.select().from(attachments).where(and(eq(attachments.businessId, b.id), eq(attachments.ownerType, "bill"), eq(attachments.ownerId, row.id))).orderBy(asc(attachments.createdAt));
  const history = [
    { date: row.createdAt.toISOString().slice(0, 10), text: row.createdVia === "agent" ? "Read by Capture and approved" : "Entered" },
    ...pays.map((p) => ({ date: p.paidOn, text: `${money(b, p.amount)} paid by ${p.chequeNumber ? `cheque ${p.chequeNumber}` : p.method.toLowerCase()}` })),
    ...(row.voidedAt ? [{ date: row.voidedAt.toISOString().slice(0, 10), text: "Voided" }] : []),
  ];
  return {
    bill,
    lines: lines.map((l) => {
      const c = categoryFor(b, l.categoryId);
      return { id: l.id, description: l.description, categoryId: l.categoryId, categoryName: c.name, categoryOfficial: c.official, net: l.net, vat: l.vat };
    }),
    payments: pays.map((p) => ({ id: p.id, amount: p.amount, paidOn: p.paidOn, method: p.method, chequeNumber: p.chequeNumber, chequeDate: p.chequeDate, chequeBank: p.chequeBank, reference: p.reference })),
    attachments: files.map((f) => ({ ...f, ownerType: "bill" as const, createdAt: f.createdAt.toISOString() })),
    history,
  };
}

export async function billRoutes(app: FastifyInstance) {
  route(app, goingOut.bills, async ({ query, ctx }) => {
    const b = ctx.business;
    const now = today();
    const open = ne(bills.status, "void");
    const where: (SQL | undefined)[] = [eq(bills.businessId, b.id)];
    const st = query.status ?? "all";
    if (st === "open") where.push(inArray(bills.status, ["unpaid", "part_paid"]));
    else if (st !== "all") where.push(eq(bills.status, st));
    if (query.due) where.push(inArray(bills.status, ["unpaid", "part_paid"]));
    if (query.due === "overdue") where.push(lt(bills.dueDate, now));
    if (query.due === "soon") where.push(gte(bills.dueDate, now), lte(bills.dueDate, addDays(now, 7)));
    if (query.supplierId) where.push(eq(bills.supplierId, query.supplierId));
    const rows = await ctx.db.select().from(bills).where(and(...where)).orderBy(desc(bills.billDate), desc(bills.createdAt));
    const list = await billsOut(ctx.db, b, rows);
    // Open bills first, soonest due first; then the rest, newest first.
    const live = (x: (typeof list)[number]) => x.status === "unpaid" || x.status === "part_paid";
    list.sort((x, y) => Number(live(y)) - Number(live(x)) || (live(x) ? x.dueDate.localeCompare(y.dueDate) : y.billDate.localeCompare(x.billDate)));
    const all = await ctx.db.select().from(bills).where(and(eq(bills.businessId, b.id), open, ne(bills.status, "paid")));
    const left = (r: BillRow) => r.total - r.paid;
    const overdue = all.filter((r) => r.dueDate < now);
    const soon = all.filter((r) => r.dueDate <= addDays(now, 7));
    return {
      bills: list,
      totals: {
        open: all.reduce((a, r) => a + left(r), 0), openCount: all.length,
        overdue: overdue.reduce((a, r) => a + left(r), 0), overdueCount: overdue.length,
        dueSoon: soon.reduce((a, r) => a + left(r), 0), dueSoonCount: soon.length,
      },
    };
  });

  route(app, goingOut.bill, async ({ params, ctx }) => billDetail(ctx.db, ctx.business, await billRow(ctx.db, ctx.business.id, params.id)));

  route(app, goingOut.createBill, async ({ body, ctx }) => {
    const b = ctx.business;
    const cats = body.lines.map((l, i) => categoryFor(b, l.categoryId, `lines.${i}.categoryId`));
    body.lines.forEach((l, i) => {
      if (l.vat > 0 && !b.vatRegistered) throw badRequest("Only VAT-registered businesses record VAT separately. Put the full amount in the line.", { [`lines.${i}.vat`]: "Leave VAT at 0: you're not VAT registered" });
    });
    const net = body.lines.reduce((a, l) => a + l.net, 0);
    const vat = body.lines.reduce((a, l) => a + l.vat, 0);
    const description = body.description ?? (body.lines.length > 1 ? `${body.lines[0].description} and ${body.lines.length - 1} more` : body.lines[0].description);
    const row = await ctx.db.transaction(async (tx) => {
      let supplier = body.supplierId ? await supplierOf(tx, b.id, body.supplierId) : await supplierByName(tx, b.id, body.supplierName!);
      if (!supplier) {
        [supplier] = await tx.insert(suppliers).values({ businessId: b.id, name: body.supplierName!, defaultCategoryId: cats[0].id }).returning();
        await logActivity(tx, b.id, `Supplier ${supplier.name} added`, { actorId: ctx.user.id, link: `/app/out/suppliers/${supplier.id}` });
      }
      const [bill] = await tx.insert(bills).values({
        businessId: b.id, supplierId: supplier.id, reference: body.reference, billDate: body.billDate, dueDate: body.dueDate,
        description: description.slice(0, 300), net, vat, total: net + vat,
      }).returning();
      await tx.insert(billLines).values(body.lines.map((l, i) => ({ businessId: b.id, billId: bill.id, position: i, description: l.description, categoryId: l.categoryId, net: l.net, vat: l.vat })));
      const entryId = await postEntry(tx, {
        businessId: b.id, date: bill.billDate, memo: `Bill from ${supplier.name}${bill.reference ? ` ${bill.reference}` : ""}`, sourceType: "bill", sourceId: bill.id, createdBy: ctx.user.id,
        lines: posting.bill(body.lines.map((l, i) => ({ categoryCode: cats[i].accountCode, net: l.net, vat: l.vat })), b.vatRegistered),
      });
      const [done] = await tx.update(bills).set({ journalEntryId: entryId }).where(eq(bills.id, bill.id)).returning();
      await logActivity(tx, b.id, `Bill from ${supplier.name} for ${money(b, done.total)} entered, due ${formatDate(done.dueDate)}`, { actorId: ctx.user.id, link: `/app/out/bills/${done.id}` });
      return done;
    });
    return (await billsOut(ctx.db, b, [row]))[0];
  });

  route(app, goingOut.payBill, async ({ params, body, ctx }) => {
    const b = ctx.business;
    const bill = await billRow(ctx.db, b.id, params.id);
    if (bill.status === "void") throw conflict("This bill was voided, so there's nothing to pay.");
    if (bill.status === "paid") throw conflict("This bill is already paid.");
    const left = bill.total - bill.paid;
    if (body.amount > left) throw badRequest(`That's more than the ${money(b, left)} left to pay.`, { amount: `No more than ${money(b, left)}` });
    const method = checkMethod(b, body.method);
    const cheque = chequeFields(method, body, body.paidOn);
    const row = await ctx.db.transaction(async (tx) => {
      const [p] = await tx.insert(billPayments).values({ businessId: b.id, billId: bill.id, amount: body.amount, paidOn: body.paidOn, method, ...cheque, reference: body.reference }).returning();
      const [sup] = await tx.select({ name: suppliers.name }).from(suppliers).where(and(eq(suppliers.id, bill.supplierId), eq(suppliers.businessId, b.id)));
      const entryId = await postEntry(tx, {
        businessId: b.id, date: body.paidOn, memo: `Paid ${sup?.name ?? "supplier"}${bill.reference ? ` ${bill.reference}` : ""}${isCheque(method) ? ` by cheque ${cheque.chequeNumber}` : ""}`,
        sourceType: "bill_payment", sourceId: p.id, createdBy: ctx.user.id, lines: posting.billPayment(body.amount, method),
      });
      await tx.update(billPayments).set({ journalEntryId: entryId }).where(eq(billPayments.id, p.id));
      const paid = bill.paid + body.amount;
      const [done] = await tx.update(bills).set({ paid, status: paid >= bill.total ? "paid" : "part_paid", updatedAt: new Date() })
        .where(and(eq(bills.id, bill.id), eq(bills.businessId, b.id))).returning();
      await logActivity(tx, b.id, `${money(b, body.amount)} paid to ${sup?.name ?? "supplier"}${done.status === "paid" ? ": bill paid in full" : ""}`, { actorId: ctx.user.id, link: `/app/out/bills/${bill.id}` });
      return done;
    });
    return (await billsOut(ctx.db, b, [row]))[0];
  });

  route(app, goingOut.voidBill, async ({ params, ctx }) => {
    const b = ctx.business;
    const bill = await billRow(ctx.db, b.id, params.id);
    if (bill.status !== "unpaid" || bill.paid > 0) throw conflict(bill.status === "void" ? "This bill is already voided." : "Only a bill with nothing paid can be voided.");
    const row = await ctx.db.transaction(async (tx) => {
      if (bill.journalEntryId) await reverseEntry(tx, b.id, bill.journalEntryId, { createdBy: ctx.user.id });
      const [done] = await tx.update(bills).set({ status: "void", voidedAt: new Date(), updatedAt: new Date() }).where(and(eq(bills.id, bill.id), eq(bills.businessId, b.id))).returning();
      await logActivity(tx, b.id, `Bill ${bill.reference ?? ""} for ${money(b, bill.total)} voided`.replace("  ", " "), { actorId: ctx.user.id, link: `/app/out/bills/${bill.id}` });
      return done;
    });
    return (await billsOut(ctx.db, b, [row]))[0];
  });
}
