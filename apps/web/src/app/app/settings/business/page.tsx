import { formatMoney, rulesFor } from "@billingease/core";
import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { ProfileForm, type CountryText } from "./ProfileForm";
import { AppCrumbs } from "@/components/app/AppCrumbs";

export const metadata: Metadata = { title: "Business profile" };

export default async function BusinessProfilePage() {
  const { business: b } = await requireBusiness();
  const rules = rulesFor(b.country);
  const uk = b.country === "uk";
  const text: CountryText = {
    name: rules.name,
    taxIdLabel: rules.wording.taxIdLabel,
    taxIdLong: uk ? "Unique Taxpayer Reference" : "Taxpayer Identification Number",
    taxIdHint: uk ? "10 digits, on letters from HMRC" : "From the Inland Revenue Department",
    vatIdLabel: rules.wording.vatIdLabel,
    vatInvoiceTitle: rules.wording.vatInvoiceTitle,
    vatHint: `You must register once your turnover passes ${formatMoney(rules.vatThreshold, rules.currency)} a year${uk ? "" : " (to confirm with IRD)"}.`,
    townLabel: uk ? "Town or city" : "City",
    regionLabel: uk ? "County" : "District",
    postcodeLabel: uk ? "Postcode" : "Postal code",
    facts: `${rules.currency === "GBP" ? "Pounds" : "Rupees"}, ${uk ? "tax year 6 April to 5 April" : "year of assessment 1 April to 31 March"}.`,
  };
  return (
    <>
    <AppCrumbs area={"biz"} trail={[{ label: "Your business" }, { label: "Business profile" }]} />
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-muted">Your business</span>
        <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold tracking-[-0.03em]">Business profile</h1>
        <p className="text-ink2">Who {b.name} is, how it&apos;s registered for tax, and what your customers see on invoices. Saving updates it everywhere; anything already sent stays as it was.</p>
      </div>
      <ProfileForm b={b} text={text} canEdit={b.role === "owner"} />
    </div>
    </>
  );
}
