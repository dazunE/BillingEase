import type { Metadata } from "next";
import { formatDate, invoiceTitle, rulesFor, today } from "@billingease/core";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { addressOf } from "@/components/in/data";
import type { PreviewData } from "@/components/in/DocPreview";
import { requireBusiness } from "@/lib/session";
import { BrandingForm } from "./BrandingForm";

export const metadata: Metadata = { title: "Invoice branding" };

export default async function BrandingPage() {
  const { business: b } = await requireBusiness();
  const lk = b.country === "lk";
  const rules = rulesFor(b.country);
  const now = today();
  // A sample invoice from this business, to see each choice on.
  const unit = { uk: 45000, lk: 4500000, us: 60000 }[b.country];
  const vat = b.vatRegistered ? rules.vatRates.find((r) => r.id === rules.defaultVatRateId)! : null;
  const net1 = unit * 2, net2 = Math.round(unit / 2);
  const vat1 = vat ? Math.round((net1 * vat.bps) / 10000) : 0, vat2 = vat ? Math.round((net2 * vat.bps) / 10000) : 0;
  const sample: PreviewData = {
    kind: "invoice", country: b.country, currency: b.currency, title: invoiceTitle(b.country, b.vatRegistered), number: `${b.invoicePrefix}0042`, status: "sent",
    seller: { name: b.name, address: addressOf(b), email: b.email, phone: b.phone, taxId: lk ? b.taxId : null, vatNumber: b.vatRegistered ? b.vatNumber : null },
    buyer: { name: lk ? "Kandyan Spice Co" : b.country === "us" ? "Harbor Labs Inc" : "Kirkstall Brewing Co", address: lk ? "45 Peradeniya Rd, Kandy" : b.country === "us" ? "200 Main St, Boston, MA" : "Broad Lane, Leeds LS5 3RU" },
    dates: [["Invoice date", formatDate(now, { year: true })], ["Due date", formatDate(now, { year: true })]],
    vatRegistered: b.vatRegistered,
    lines: [
      { description: "Brand refresh: logo, colours and type", quantityMilli: 2000, unitPrice: unit, discount: 0, vatRateId: vat?.id ?? null, net: net1, vat: vat1, sscl: 0 },
      { description: "Print-ready files", quantityMilli: 1000, unitPrice: net2, discount: 0, vatRateId: vat?.id ?? null, net: net2, vat: vat2, sscl: 0 },
    ],
    net: net1 + net2, vat: vat1 + vat2, sscl: 0, total: net1 + net2 + vat1 + vat2, paid: 0, credited: 0,
    paymentDetails: b.paymentDetails ?? "Your bank details from your business profile go here.", note: b.invoiceNote, notes: null,
  };
  return (
    <>
      <AppCrumbs area="biz" trail={[{ label: "Your business" }, { label: "Invoice branding" }]} />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-muted">Your business</span>
        <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold tracking-[-0.03em]">Invoice branding</h1>
        <p className="max-w-[680px] text-ink2">Your logo, colour, layout and typeface on every invoice, quote and credit note: the PDF, the preview and the email your customer gets. The tax details each document must show stay the same whichever you pick.</p>
      </div>
      <BrandingForm b={b} sample={sample} canEdit={b.role === "owner"} />
    </>
  );
}
