import type { CountryCode } from "@billingease/core";

/** The official pages Ask may cite, per country. A fixed list: the model can't invent a link. */
export type OfficialSource = { id: string; topic: OfficialTopic; title: string; url: string; about: string };

export const OFFICIAL_TOPICS = [
  "mtd", "expenses", "vat", "property", "mileage", "working_from_home", "self_assessment", "income_tax", "national_insurance", "records",
  "sscl", "epf", "etf", "apit",
  "llc", "self_employment_tax",
] as const;
export type OfficialTopic = (typeof OFFICIAL_TOPICS)[number];

const UK: OfficialSource[] = [
  { id: "uk-mtd", topic: "mtd", title: "gov.uk · Use Making Tax Digital for Income Tax", url: "https://www.gov.uk/guidance/use-making-tax-digital-for-income-tax", about: "Who must use MTD for Income Tax, from when, quarterly updates and their deadlines" },
  { id: "uk-mtd-sign-up", topic: "mtd", title: "gov.uk · Sign up for Making Tax Digital for Income Tax", url: "https://www.gov.uk/guidance/sign-up-your-business-for-making-tax-digital-for-income-tax", about: "Qualifying income thresholds and signing up" },
  { id: "uk-expenses", topic: "expenses", title: "gov.uk · Expenses if you're self-employed", url: "https://www.gov.uk/expenses-if-youre-self-employed", about: "Allowable expenses for sole traders, by category; costs you can't claim" },
  { id: "uk-simplified", topic: "expenses", title: "gov.uk · Simplified expenses if you're self-employed", url: "https://www.gov.uk/simpler-income-tax-simplified-expenses", about: "Flat rates instead of actual costs for vehicles, working from home and living at your business premises" },
  { id: "uk-capital", topic: "expenses", title: "gov.uk · Capital allowances when you buy assets", url: "https://www.gov.uk/capital-allowances", about: "Equipment and other capital items: Annual Investment Allowance" },
  { id: "uk-vat-register", topic: "vat", title: "gov.uk · Register for VAT", url: "https://www.gov.uk/register-for-vat", about: "When you must register (the VAT threshold) and how" },
  { id: "uk-vat-rates", topic: "vat", title: "gov.uk · VAT rates", url: "https://www.gov.uk/vat-rates", about: "Standard, reduced and zero rates" },
  { id: "uk-vat-invoices", topic: "vat", title: "gov.uk · VAT invoices: what they must include", url: "https://www.gov.uk/guidance/vat-guide-notice-700", about: "HMRC VAT guide (Notice 700), including VAT invoice requirements" },
  { id: "uk-property", topic: "property", title: "gov.uk · Renting out a property: paying tax", url: "https://www.gov.uk/renting-out-a-property/paying-tax", about: "Tax on rental income, allowable costs, the property allowance" },
  { id: "uk-property-income", topic: "property", title: "gov.uk · Work out your rental income when you let property", url: "https://www.gov.uk/guidance/income-tax-when-you-rent-out-a-property-working-out-your-rental-income", about: "Allowable expenses for landlords; mortgage interest as a 20% tax reduction" },
  { id: "uk-mileage", topic: "mileage", title: "gov.uk · Simplified expenses: vehicles", url: "https://www.gov.uk/simpler-income-tax-simplified-expenses/vehicles-", about: "Flat mileage rates for cars, vans and motorcycles" },
  { id: "uk-mileage-rates", topic: "mileage", title: "gov.uk · Travel: mileage and fuel rates and allowances", url: "https://www.gov.uk/government/publications/rates-and-allowances-travel-mileage-and-fuel-allowances", about: "Approved mileage rates" },
  { id: "uk-home", topic: "working_from_home", title: "gov.uk · Simplified expenses: working from home", url: "https://www.gov.uk/simpler-income-tax-simplified-expenses/working-from-home", about: "Flat monthly rates by hours worked at home" },
  { id: "uk-sa-deadlines", topic: "self_assessment", title: "gov.uk · Self Assessment tax returns: deadlines", url: "https://www.gov.uk/self-assessment-tax-returns/deadlines", about: "Return and payment deadlines" },
  { id: "uk-poa", topic: "self_assessment", title: "gov.uk · Payments on account", url: "https://www.gov.uk/understand-self-assessment-bill/payments-on-account", about: "When payments on account apply and when they're due" },
  { id: "uk-income-tax", topic: "income_tax", title: "gov.uk · Income Tax rates and Personal Allowances", url: "https://www.gov.uk/income-tax-rates", about: "Bands and the Personal Allowance" },
  { id: "uk-ni", topic: "national_insurance", title: "gov.uk · Self-employed National Insurance rates", url: "https://www.gov.uk/self-employed-national-insurance-rates", about: "Class 2 and Class 4 National Insurance" },
  { id: "uk-records", topic: "records", title: "gov.uk · Business records if you're self-employed", url: "https://www.gov.uk/self-employed-records", about: "What records to keep and for how long" },
];

// IRD pages move often; these point at the department's own site, to be checked with a practitioner.
const LK: OfficialSource[] = [
  { id: "lk-vat", topic: "vat", title: "Inland Revenue Department · Value Added Tax", url: "https://www.ird.gov.lk/en/Type%20of%20Taxes/SitePages/Value%20Added%20Tax.aspx", about: "VAT registration, rates, Tax Invoices and monthly returns" },
  { id: "lk-sscl", topic: "sscl", title: "Inland Revenue Department · Social Security Contribution Levy", url: "https://www.ird.gov.lk/en/Type%20of%20Taxes/SitePages/Social%20Security%20Contribution%20Levy.aspx", about: "SSCL on turnover, registration and returns" },
  { id: "lk-income-tax", topic: "income_tax", title: "Inland Revenue Department · Income Tax", url: "https://www.ird.gov.lk/en/Type%20of%20Taxes/SitePages/Income%20Tax.aspx", about: "Personal income tax rates, relief, quarterly instalments and the annual return" },
  { id: "lk-apit", topic: "apit", title: "Inland Revenue Department · Advance Personal Income Tax (APIT)", url: "https://www.ird.gov.lk/en/Type%20of%20Taxes/SitePages/APIT.aspx", about: "Tax deducted from employees' pay" },
  { id: "lk-ird", topic: "records", title: "Inland Revenue Department", url: "https://www.ird.gov.lk/en/", about: "Notices, gazettes, guides and e-services" },
  { id: "lk-epf", topic: "epf", title: "Employees' Provident Fund (Central Bank of Sri Lanka)", url: "https://epf.lk/", about: "EPF contributions: 8% from the employee, 12% from the employer; paying and returns" },
  { id: "lk-etf", topic: "etf", title: "Employees' Trust Fund Board", url: "https://www.etfb.lk/", about: "ETF contributions: 3% from the employer" },
];

const US: OfficialSource[] = [
  { id: "us-smllc", topic: "llc", title: "IRS · Single member limited liability companies", url: "https://www.irs.gov/businesses/small-businesses-self-employed/single-member-limited-liability-companies", about: "How a single-member LLC is taxed by default (a disregarded entity) and the choice to be taxed as a corporation" },
  { id: "us-llc", topic: "llc", title: "IRS · Limited liability company (LLC)", url: "https://www.irs.gov/businesses/small-businesses-self-employed/limited-liability-company-llc", about: "Default tax treatment of single- and multi-member LLCs, and entity classification elections" },
  { id: "us-de-llc-tax", topic: "llc", title: "Delaware Division of Corporations · Annual franchise taxes", url: "https://corp.delaware.gov/paytaxes/", about: "The annual LLC tax paid to Delaware and its due date" },
  { id: "us-ein", topic: "records", title: "IRS · Employer identification number", url: "https://www.irs.gov/businesses/small-businesses-self-employed/employer-id-numbers", about: "Who needs an EIN and how to get one" },
  { id: "us-schedule-c", topic: "expenses", title: "IRS · About Schedule C (Form 1040)", url: "https://www.irs.gov/forms-pubs/about-schedule-c-form-1040", about: "Profit or loss from a business: the expense lines a single-member LLC reports" },
  { id: "us-estimated", topic: "self_assessment", title: "IRS · Estimated taxes", url: "https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes", about: "Who pays estimated tax, the quarterly deadlines, and penalties" },
  { id: "us-se-tax", topic: "self_employment_tax", title: "IRS · Self-employment tax (Social Security and Medicare)", url: "https://www.irs.gov/businesses/small-businesses-self-employed/self-employment-tax-social-security-and-medicare-taxes", about: "The self-employment tax rate and who pays it" },
  { id: "us-records", topic: "records", title: "IRS · Recordkeeping", url: "https://www.irs.gov/businesses/small-businesses-self-employed/recordkeeping", about: "What business records to keep and for how long" },
];

export const OFFICIAL_SOURCES: Record<CountryCode, OfficialSource[]> = { uk: UK, lk: LK, us: US };

export function topicsFor(country: CountryCode): OfficialTopic[] {
  return [...new Set(OFFICIAL_SOURCES[country].map((s) => s.topic))];
}
