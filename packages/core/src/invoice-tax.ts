import { rulesFor, type CountryCode } from "./countries";
import { applyBps } from "./money";

export type TaxLineInput = {
  /** Quantity in thousandths (1.5 hours = 1500). */
  quantityMilli: number;
  /** Price for one, in minor units, before tax. */
  unitPrice: number;
  /** Discount on this line, in minor units. */
  discount?: number;
  /** One of the country's VAT rate ids. Ignored when the business isn't VAT registered. */
  vatRateId?: string | null;
  /** Whether SSCL applies to this line (Sri Lanka). Defaults to true when the business is SSCL registered. */
  sscl?: boolean;
};

export type TaxContext = { country: CountryCode; vatRegistered: boolean; ssclRegistered?: boolean };

export type TaxLine = { net: number; sscl: number; vatBase: number; vatRateId: string | null; vatBps: number; vat: number; total: number };

export type InvoiceTotals = {
  lines: TaxLine[];
  net: number;
  sscl: number;
  vat: number;
  total: number;
  /** VAT by rate, for the VAT summary on the invoice. */
  vatByRate: { vatRateId: string; label: string; bps: number; base: number; vat: number }[];
};

export class TaxError extends Error {}

/**
 * Works out an invoice's tax line by line, rounding each line to the minor unit.
 * UK: VAT on the net amount. Sri Lanka: SSCL on the net amount, then VAT on net plus SSCL
 * when the country says SSCL is in the VAT base (to confirm with IRD).
 */
export function computeInvoice(inputs: TaxLineInput[], ctx: TaxContext): InvoiceTotals {
  const rules = rulesFor(ctx.country);
  const ssclOn = rules.features.sscl && !!ctx.ssclRegistered && rules.ssclBps > 0;
  const lines: TaxLine[] = inputs.map((l, i) => {
    if (!Number.isInteger(l.quantityMilli) || l.quantityMilli <= 0) throw new TaxError(`Line ${i + 1}: quantity must be more than 0.`);
    if (!Number.isInteger(l.unitPrice) || l.unitPrice < 0) throw new TaxError(`Line ${i + 1}: price can't be negative.`);
    const gross = Math.round((l.quantityMilli * l.unitPrice) / 1000);
    const discount = Math.max(0, Math.round(l.discount ?? 0));
    if (discount > gross) throw new TaxError(`Line ${i + 1}: the discount is more than the line.`);
    const net = gross - discount;
    const sscl = ssclOn && l.sscl !== false ? applyBps(net, rules.ssclBps) : 0;
    let vatRateId: string | null = null;
    let vatBps = 0;
    if (ctx.vatRegistered) {
      const id = l.vatRateId ?? rules.defaultVatRateId;
      const rate = rules.vatRates.find((r) => r.id === id);
      if (!rate) throw new TaxError(`Line ${i + 1}: unknown VAT rate "${id}".`);
      vatRateId = rate.id;
      vatBps = rate.bps;
    }
    const vatBase = net + (rules.ssclInVatBase ? sscl : 0);
    const vat = vatBps ? applyBps(vatBase, vatBps) : 0;
    return { net, sscl, vatBase, vatRateId, vatBps, vat, total: net + sscl + vat };
  });
  const byRate = new Map<string, { vatRateId: string; label: string; bps: number; base: number; vat: number }>();
  for (const l of lines) {
    if (!l.vatRateId) continue;
    const rate = rules.vatRates.find((r) => r.id === l.vatRateId)!;
    const row = byRate.get(rate.id) ?? { vatRateId: rate.id, label: rate.label, bps: rate.bps, base: 0, vat: 0 };
    row.base += l.vatBase;
    row.vat += l.vat;
    byRate.set(rate.id, row);
  }
  const total = (k: keyof TaxLine) => lines.reduce((a, l) => a + (l[k] as number), 0);
  return { lines, net: total("net"), sscl: total("sscl"), vat: total("vat"), total: total("total"), vatByRate: [...byRate.values()] };
}

/** The document title: "Invoice", "VAT invoice" (UK) or "Tax Invoice" (Sri Lanka). */
export function invoiceTitle(country: CountryCode, vatRegistered: boolean): string {
  const w = rulesFor(country).wording;
  return vatRegistered ? w.vatInvoiceTitle : w.invoiceTitle;
}
