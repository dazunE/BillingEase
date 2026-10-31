import type { Business, Customer, InvoiceDetail, QuoteDetail } from "@billingease/contracts";
import { formatDate, rulesFor } from "@billingease/core";
import type { EditorBusiness, EditorCustomer } from "./DocEditor";
import type { PreviewData } from "./DocPreview";

/** Shapes the business and customers for the editor and previews. */

export function addressOf(b: Business) {
  return [b.addressLine1, b.addressLine2, b.town, b.region, b.postcode].filter(Boolean).join(", ");
}

export function editorBusiness(b: Business): EditorBusiness {
  return {
    country: b.country, currency: b.currency, name: b.name, vatRegistered: b.vatRegistered, ssclRegistered: b.ssclRegistered, termsDays: b.termsDays,
    address: addressOf(b), email: b.email, phone: b.phone, taxId: b.taxId, vatNumber: b.vatNumber, paymentDetails: b.paymentDetails, invoiceNote: b.invoiceNote,
  };
}

export function editorCustomers(list: Customer[]): EditorCustomer[] {
  return list.map((c) => ({ id: c.id, name: c.name, email: c.email, address: c.address, taxId: c.taxId, vatNumber: c.vatNumber, currency: c.currency }));
}

const day = (d: string) => formatDate(d, { year: true });

/** The on-screen document for an invoice or credit note: the frozen snapshot once issued. */
export function invoicePreview(inv: InvoiceDetail, b: Business): PreviewData {
  const lk = b.country === "lk";
  const s = inv.snapshot;
  const live = receiptsMode(inv);
  return {
    kind: inv.kind, country: b.country, currency: inv.currency, title: inv.title,
    home: inv.currency === b.currency ? null : { currency: b.currency, rate: inv.fxRate, net: inv.homeNet, vat: inv.homeVat, sscl: inv.homeSscl, total: inv.homeTotal }, number: inv.number, status: inv.status,
    seller: s?.seller ?? { name: b.name, address: addressOf(b), email: b.email, phone: b.phone, taxId: lk ? b.taxId : null, vatNumber: inv.vatRegistered ? b.vatNumber : null },
    buyer: s?.buyer ?? { name: inv.customer.name, address: inv.customer.address, email: inv.customer.email, taxId: lk ? inv.customer.taxId : null, vatNumber: inv.customer.vatNumber },
    dates: inv.kind === "credit_note"
      ? [["Date", day(inv.issueDate)], ...(inv.creditFor?.number ? [["Against invoice", inv.creditFor.number] as [string, string]] : [])]
      : [
          ["Invoice date", day(inv.issueDate)],
          ...(lk ? [["Date of delivery", day(inv.supplyDate ?? inv.issueDate)] as [string, string]] : inv.supplyDate && inv.supplyDate !== inv.issueDate ? [["Date of supply", day(inv.supplyDate)] as [string, string]] : []),
          ["Due date", day(inv.dueDate)],
          ...(inv.reference ? [["Your reference", inv.reference] as [string, string]] : []),
        ],
    vatRegistered: inv.vatRegistered,
    lines: inv.lines.map((l) => ({ description: l.description, quantityMilli: l.quantityMilli, unitPrice: l.unitPrice, discount: l.discount, vatRateId: l.vatRateId, net: l.net, vat: l.vat, sscl: l.ssclAmount })),
    net: inv.net, vat: inv.vat, sscl: inv.sscl, total: inv.total, paid: inv.paid, credited: inv.credited,
    paymentDetails: s ? s.paymentDetails : b.paymentDetails, note: inv.kind === "credit_note" ? null : (s ? s.note : b.invoiceNote), notes: inv.notes,
    modeOfPayment: live,
  };
}

function receiptsMode(inv: InvoiceDetail) {
  const live = inv.receipts.filter((r) => !r.voided);
  return live.length
    ? [...new Set(live.map((r) => (r.method === "Cheque" && r.chequeNumber ? `Cheque no. ${r.chequeNumber}` : r.method)))].join(", ")
    : null;
}

export function quotePreview(q: QuoteDetail, b: Business): PreviewData {
  const lk = b.country === "lk";
  return {
    kind: "quote", country: b.country, currency: q.currency, title: "Quote",
    home: q.currency === b.currency ? null : { currency: b.currency, rate: q.fxRate, net: 0, vat: 0, sscl: 0, total: q.homeTotal, indicative: true }, number: q.number, status: q.status,
    seller: { name: b.name, address: addressOf(b), email: b.email, phone: b.phone, taxId: lk ? b.taxId : null, vatNumber: q.vatRegistered ? b.vatNumber : null },
    buyer: { name: q.customer.name, address: q.customer.address, email: q.customer.email, taxId: lk ? q.customer.taxId : null, vatNumber: q.customer.vatNumber },
    dates: [["Quote date", day(q.issueDate)], ["Valid until", day(q.expiryDate)]],
    vatRegistered: q.vatRegistered,
    lines: q.lines.map((l) => ({ description: l.description, quantityMilli: l.quantityMilli, unitPrice: l.unitPrice, discount: l.discount, vatRateId: l.vatRateId, net: l.net, vat: l.vat, sscl: l.ssclAmount })),
    net: q.net, vat: q.vat, sscl: q.sscl, total: q.total, paid: 0, credited: 0, notes: q.notes,
  };
}

export const DONE: Record<string, string> = {
  sent: "Sent. It's emailed with the PDF attached.",
  issued: "Marked as sent. It now counts in Coming in.",
  saved: "Saved.",
  emailed: "Emailed again with the PDF.",
  voided: "Voided. It no longer counts in Coming in.",
  paid: "Payment recorded.",
  unpaid: "Payment removed.",
  credited: "Credit note issued.",
  marked: "Marked as sent.",
  accepted: "Marked accepted.",
  declined: "Marked declined.",
  made: "Invoice made from your repeating invoice.",
  paused: "Paused.",
  resumed: "Resumed.",
  added: "Customer added.",
  archived: "Customer archived.",
};

export function countryWords(b: Business) {
  const rules = rulesFor(b.country);
  return { rules, lk: b.country === "lk", taxId: rules.wording.taxIdLabel, vatId: rules.wording.vatIdLabel };
}
