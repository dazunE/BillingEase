/**
 * Copy for /features (prototype SiteFeatures). Country copy is `{ uk, lk }`.
 * Sample businesses are invented and every figure is illustrative.
 */
import type { ByCountry, Copy } from "./country";
import { HOME_ICONS as IC } from "./home";
import { ROUTES } from "./routes";

export const FEATURES_META = {
  title: "Features",
  description: "Invoices, expenses, bills, payroll and tax for the UK and Sri Lanka, each one feeding Coming in, Going out or Yours to keep.",
};

export const FEATURES_HERO = {
  kicker: "Product overview",
  title: "Everything a small business needs, around three numbers.",
  lead: {
    uk: "Invoices, expenses, bills, mileage, payroll records and your MTD quarters. Each one feeds what’s coming in, what’s going out, or what’s yours to keep, so you never have to go looking.",
    lk: "Tax Invoices, expenses, bills, payroll with EPF, ETF and APIT, and your VAT and SSCL periods. Each one feeds what’s coming in, what’s going out, or what’s yours to keep, so you never have to go looking.",
  } satisfies Copy,
  small: "Free plan for as long as you like. Paid plans are still being priced.",
};

/** The hero's live card: a sample business, a starting point, and what happens next. */
export type HeroEvent = { t: string; k: "in" | "out"; v: number; day: string };
export const FEATURES_PLAY: ByCountry<{ name: string; period: string; start: { in: number; out: number }; taxShare: number; taxWord: string; events: HeroEvent[] }> = {
  uk: {
    name: "Harper Studio",
    period: "October so far",
    start: { in: 24000, out: 7600 },
    taxShare: 0.15,
    taxWord: "Income Tax and NI",
    events: [
      { t: "Moor & Dale Outdoor’s bank transfer recorded against INV-0039", k: "in", v: 2400, day: "2 Oct" },
      { t: "Studio rent for October added under Premises", k: "out", v: 450, day: "2 Oct" },
      { t: "INV-0042 sent to Kirkstall Brewing Co", k: "in", v: 1850, day: "3 Oct" },
      { t: "Train ticket to Harrogate, photo attached", k: "out", v: 23, day: "3 Oct" },
      { t: "Leeds Print Fest paid INV-0040 by bank transfer", k: "in", v: 620, day: "4 Oct" },
      { t: "Print shop bill entered, due in 14 days", k: "out", v: 320, day: "4 Oct" },
      { t: "Broadband set up as an every-month cost", k: "out", v: 28, day: "5 Oct" },
    ],
  },
  lk: {
    name: "Serendib Design Studio",
    period: "October so far",
    start: { in: 4200000, out: 2000000 },
    taxShare: 0.15,
    taxWord: "income tax",
    events: [
      { t: "Kandyan Spice Co’s cheque recorded against TI-0187", k: "in", v: 302375, day: "2 Oct" },
      { t: "Office rent added as an every-month cost", k: "out", v: 180000, day: "2 Oct" },
      { t: "Galle Fort Boutique Hotel paid by LankaQR", k: "in", v: 186000, day: "3 Oct" },
      { t: "Courier receipt photographed and attached", k: "out", v: 2450, day: "3 Oct" },
      { t: "Tax Invoice TI-0188 sent to Lanka Agri Exports", k: "in", v: 120950, day: "4 Oct" },
      { t: "October payroll for 5 people saved", k: "out", v: 640000, day: "4 Oct" },
      { t: "Internet set up as an every-month cost", k: "out", v: 12500, day: "5 Oct" },
    ],
  },
};

export type BandItem = { icon: string; title: Copy; tag: Copy; ex: Copy; only?: "uk" | "lk" };
export type FeatureBand = {
  key: "in" | "out" | "keep";
  kicker: string;
  title: Copy;
  lead: Copy;
  page: { label: string; href: string };
  items: BandItem[];
};

const IC2 = {
  quote: "M5 4h14v16H5zM8 9h8M8 13h8M8 17h4",
  back: "M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3",
  tag: "M20 12l-8 8-9-9V3h8zM7.5 7.5h.01",
  sort: "M4 6h16M4 12h10M4 18h6",
  supplier: "M3 7h13v10H3zM16 10h3l2 3v4h-5M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
  pct: "M19 5 5 19M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
};
export const FEATURE_ICONS = { ...IC, ...IC2 };

export const FEATURE_BANDS: FeatureBand[] = [
  {
    key: "in",
    kicker: "Coming in",
    title: "Get paid, and know who still owes you.",
    lead: {
      uk: "Everything between doing the work and the money landing: quotes, invoices, VAT invoices when you’re registered, the payments you record and the polite reminders nobody likes to write.",
      lk: "Everything between doing the work and the money landing: quotes, Tax Invoices with VAT and SSCL, the transfers, cheques and LankaQR payments you record, and the reminders nobody likes to write.",
    },
    page: { label: "Everything about Coming in", href: ROUTES.comingIn.href },
    items: [
      {
        icon: IC.doc,
        title: "Invoices in one sentence",
        tag: { uk: "Invoices and VAT invoices", lk: "Tax Invoices" },
        ex: {
          uk: "Type “Invoice Kirkstall Brewing Co £1,850 for the autumn labels” and it becomes a finished invoice, ready as a PDF.",
          lk: "Type “Invoice Kandyan Spice Co Rs 250,000 for packaging” and get a Tax Invoice with SSCL and VAT on their own lines.",
        },
      },
      {
        icon: IC2.quote,
        title: "Quotes that turn into invoices",
        tag: "Quotes",
        ex: { uk: "Mark the quote accepted when Moor & Dale say yes, and the £2,400 becomes an invoice without retyping.", lk: "Mark the quote accepted when Galle Fort Boutique Hotel says yes, and it becomes a Tax Invoice in one step." },
      },
      {
        icon: IC.coins,
        title: "Payments you record",
        tag: { uk: "Bank transfer, card machine, cash, cheque", lk: "Bank transfer, cheque, cash, LankaQR" },
        ex: { uk: "Moor & Dale paid by bank transfer. Record it and the invoice shows as paid.", lk: "Record the cheque number and bank, and the invoice shows as paid." },
      },
      {
        icon: IC.bell,
        title: "Reminders in one tap",
        tag: { uk: "By email", lk: "By email and WhatsApp" },
        ex: { uk: "A polite, ready-written email to Ochre Café about the £850. You press send.", lk: "A polite reminder to Lanka Agri Exports by email or WhatsApp, already written. You press send." },
      },
      {
        icon: IC.repeat,
        title: "Repeating invoices",
        tag: "Monthly retainers",
        ex: { uk: "Ochre Café’s £120 social media retainer is drafted on the 1st of every month.", lk: "A monthly design retainer for Kandyan Spice Co is drafted on the same day each month." },
      },
      {
        icon: IC2.back,
        title: "Money back to a customer",
        tag: "Credit notes",
        ex: { uk: "Take £60 off INV-0040 for the misprinted posters. It comes off Coming in straight away.", lk: "A credit note for Rs 18,000 takes the reprint off the Tax Invoice, VAT and SSCL included." },
      },
    ],
  },
  {
    key: "out",
    kicker: "Going out",
    title: { uk: "Every pound out, in the right HMRC category.", lk: "Every rupee out, in the right line for your return." },
    lead: {
      uk: "Expenses and bills you add by hand, with the photo or PDF attached, every-month costs set up once, mileage, and payroll records from your payroll software.",
      lk: "Expenses and bills you add by hand, with the photo or PDF attached, input VAT counted, every-month costs set up once, and full payroll with EPF, ETF and APIT.",
    },
    page: { label: "Everything about Going out", href: ROUTES.goingOut.href },
    items: [
      {
        icon: IC.clip,
        title: "Expenses with the paperwork",
        tag: "A photo or PDF attached",
        ex: { uk: "Add the £23.40 train ticket and attach the photo. It goes under Car, van and travel.", lk: "Add the Rs 2,450 courier receipt and attach the photo. It goes under Postage and courier." },
      },
      {
        icon: IC2.sort,
        title: { uk: "HMRC’s categories, in plain words", lk: "Categories for your return" },
        tag: { uk: "Self-employment and property boxes", lk: "Lines of the business income schedule" },
        ex: { uk: "“Office costs” on screen, the right MTD category underneath. Business-use share for the phone you also use at home.", lk: "Plain names on screen, the right schedule line underneath, and capital items kept for allowances." },
      },
      {
        icon: IC.bill,
        title: "Bills, in full or in parts",
        tag: "Bills and suppliers",
        ex: { uk: "Enter the print shop’s £320 bill once. Mark it paid in full, or £200 now and the rest next month.", lk: "Enter the printer’s Tax Invoice once. Input VAT is counted, and you mark it paid in full or in part." },
      },
      {
        icon: IC.repeat,
        title: "Every-month costs",
        tag: "Set up once",
        ex: { uk: "Studio rent, phone and software in one list, added to Going out each month.", lk: "Office rent, internet and the leased printer in one list, added to Going out each month." },
      },
      {
        icon: IC.people,
        title: { uk: "Payroll records", lk: "Payroll with EPF, ETF and APIT" },
        tag: { uk: "From your payroll software", lk: "Payslips and monthly schedules" },
        ex: {
          uk: "Enter each pay run from your payroll software and staff costs land in the books. Run payroll and report to HMRC there.",
          lk: "Five people paid on the 25th: EPF 8% and 12%, ETF 3% and APIT worked out, payslips ready to send.",
        },
      },
      {
        icon: IC.car,
        title: "Mileage",
        tag: "Simplified rates",
        ex: "Log the 38 miles to Harrogate and the allowance is added at the simplified rate.",
        only: "uk",
      },
      {
        icon: IC2.supplier,
        title: "Suppliers",
        tag: "Who you pay",
        ex: "Every supplier with what you owe them and what you’ve paid this year.",
        only: "lk",
      },
    ],
  },
  {
    key: "keep",
    kicker: "Yours to keep",
    title: "Know what’s actually yours.",
    lead: {
      uk: "What’s left after costs, with Income Tax and NI estimated as you go. Behind it, proper double-entry books your accountant will be happy to see.",
      lk: "What’s left after costs, with income tax estimated as you go and VAT and SSCL kept apart. Behind it, proper double-entry books your practitioner will be happy to see.",
    },
    page: { label: "Everything about Yours to keep", href: ROUTES.yoursToKeep.href },
    items: [
      {
        icon: IC.safe,
        title: "Tax, estimated as you go",
        tag: { uk: "Income Tax and Class 4 NI", lk: "Income tax on business profit" },
        ex: { uk: "£2,960 estimated so far, with the 31 January and 31 July payments on Home.", lk: "Rs 410,000 estimated so far, with the quarterly instalment dates on Home." },
      },
      {
        icon: IC.calendar,
        title: { uk: "MTD quarters", lk: "VAT and SSCL periods" },
        tag: { uk: "Checked before they go", lk: "In the order of the return" },
        ex: { uk: "Q2 is ready: income and expenses by HMRC category, with a readiness check for anything missing.", lk: "September’s VAT and SSCL summary, output and input tax, due 20 October." },
      },
      {
        icon: IC.house,
        title: "Landlord mode",
        tag: "Properties and mortgage interest",
        ex: "Rent and costs per property, your ownership share, and mortgage interest kept apart for the tax credit.",
        only: "uk",
      },
      {
        icon: IC.send,
        title: "Year-end to TaxWise.lk",
        tag: "Hand-off to the return",
        ex: "Profit, capital allowance items, VAT, SSCL and payroll totals sent into the income tax return.",
        only: "lk",
      },
      {
        icon: IC.chart,
        title: "Reports in plain questions",
        tag: "Profit and loss · balance sheet · who owes what",
        ex: "How much did I make? What do I own? Who still owes me? One tap each.",
      },
      {
        icon: IC.person,
        title: { uk: "Your accountant, same books", lk: "Your practitioner, same books" },
        tag: { uk: "They file, you don’t", lk: "They file, you don’t" },
        ex: { uk: "Priya at Dale & Shaw sees every quarter, sends requests and files the update.", lk: "Ruwan at Jayasinghe & Co sees every period and gets the year-end figures." },
      },
      {
        icon: IC2.lock,
        title: "Filed periods, locked",
        tag: { uk: "Quarter lock", lk: "Period lock" },
        ex: { uk: "Once the quarter is filed it’s locked, so nothing in it changes by accident.", lk: "Once the VAT return is filed the period is locked, so nothing in it changes by accident." },
      },
    ],
  },
];

/** The dark "you add it, the numbers follow" section (replaces the prototype's automation toggles). */
export const FEATURES_TAPS = {
  kicker: "Nothing behind your back",
  title: "You add what happened. The numbers follow.",
  lead: "BillingEase doesn’t connect to your bank or guess in the background. You record what happened in a tap, and everything that depends on it updates at once. Every change sits in a plain activity list.",
  cards: [
    {
      key: "paid",
      title: "Record a payment",
      text: { uk: "Moor & Dale’s £2,400 arrived. Record it and INV-0039 shows as paid, and Coming in moves.", lk: "Kandyan Spice Co’s cheque arrived. Record the number and bank, and TI-0187 shows as paid." },
    },
    {
      key: "sort",
      title: "Pick a category once",
      text: { uk: "Train ticket is Car, van and travel. The right HMRC box for the quarter, chosen in one tap.", lk: "The courier receipt is Postage and courier, the right line for the return, chosen in one tap." },
    },
    {
      key: "remind",
      title: "Send a reminder",
      text: { uk: "Ochre Café is 12 days late. A polite email is already written; you press send.", lk: "Galle Fort Boutique Hotel is late. A polite WhatsApp or email is already written; you press send." },
    },
    {
      key: "tax",
      title: "See the tax estimate move",
      text: { uk: "Profit changes, and the Income Tax and NI estimate changes with it. Yours to keep stays honest.", lk: "Profit changes, and the income tax estimate changes with it. Yours to keep stays honest." },
    },
  ] satisfies { key: "paid" | "sort" | "remind" | "tax"; title: string; text: Copy }[],
};

export const FEATURES_BUSINESS = {
  kicker: "Your business",
  title: "Set up for your country, then out of the way.",
  lead: "Choose the United Kingdom or Sri Lanka when you sign up. BillingEase uses that country’s currency, tax year, categories and invoice wording, and only shows what applies to you.",
  people: {
    title: { uk: "You and your accountant", lk: "You and your practitioner" },
    body: {
      uk: "Your accountant sees the same books, sends requests that clear when you’ve done them, and locks a quarter once it’s filed.",
      lk: "Your practitioner sees the same books, sends requests that clear when you’ve done them, and receives the year-end figures in TaxWise.lk.",
    },
    more: { uk: { label: "BillingEase for accountants", href: ROUTES.accountants.href }, lk: { label: "BillingEase for practitioners", href: ROUTES.accountants.href } },
    list: {
      uk: [
        ["EH", "Ellie Harper", "Owner", "#B9A3FF"],
        ["PS", "Priya Shah, Dale & Shaw", "Accountant", "#FFF0B8"],
      ],
      lk: [
        ["AF", "Ayesha Fernando", "Owner", "#B9A3FF"],
        ["RJ", "Ruwan Jayasinghe, Jayasinghe & Co", "Practitioner", "#FFF0B8"],
      ],
    } satisfies ByCountry<[string, string, string, string][]>,
  },
  country: {
    title: "Two countries, one product",
    body: "Pounds and the tax year from 6 April, or rupees and the year of assessment from 1 April. Your business’s country is fixed at sign-up.",
    more: { label: "What changes by country", href: ROUTES.countries.href },
  },
  safe: {
    title: "Safe by default",
    body: "An append-only ledger, filed periods locked, and each business’s books kept apart from every other.",
    more: { label: "How we keep your books safe", href: ROUTES.security.href },
    list: ["Double-entry, append-only ledger", "Filed periods locked", "Rate-limited sign-in"],
  },
};

/** "Works with" (replaces the prototype's bank and app integrations; we have none). */
export const FEATURES_WORKS = {
  title: "Works with how you already do things.",
  lead: "No bank feeds and no payment processing: you record what happened. What BillingEase does connect to is the person who files your tax.",
  tabs: {
    uk: [
      {
        id: "acct",
        label: "Your accountant",
        note: "Your accountant files the MTD update from their own software. BillingEase gets the quarter ready and locks it once filed.",
        items: [
          ["TW", "TaxWise practice workbench", "Every client’s quarter in one place", "#EEE8FF"],
          ["Q", "Quarter summary", "Totals by HMRC category", "#FDE6D6"],
          ["R", "Requests", "“Please add records for 12–25 Sept”", "#E2F6D5"],
          ["L", "Quarter lock", "Once the update is filed", "#FFF0B8"],
        ],
      },
      {
        id: "paid",
        label: "Getting paid",
        note: "You record each payment by hand. There are no card payments or payouts through BillingEase, so there are no fees on your money.",
        items: [
          ["BT", "Bank transfer", "Recorded against the invoice", "#EEE8FF"],
          ["CM", "Card machine", "Your own, recorded as card", "#FDE6D6"],
          ["£", "Cash", "Recorded with the date", "#E2F6D5"],
          ["CH", "Cheque", "Recorded when it clears", "#FFF0B8"],
        ],
      },
      {
        id: "files",
        label: "Paperwork",
        note: "Snap a receipt or a supplier’s bill and BillingEase reads it, then drafts the entry for you to check. Nothing goes in until you approve it.",
        items: [
          ["PDF", "Invoices and quotes", "Download or email as PDF", "#EEE8FF"],
          ["IMG", "Receipt photos", "Read for you to check, then kept with the expense", "#FDE6D6"],
          ["PDF", "Supplier bills", "Attached as a PDF", "#E2F6D5"],
          ["P", "Payroll software", "Pay runs entered from it", "#FFF0B8"],
        ],
      },
    ],
    lk: [
      {
        id: "acct",
        label: "Your practitioner",
        note: "You or your practitioner file through the IRD, EPF and ETF channels. BillingEase prepares the figures and hands the year to TaxWise.lk.",
        items: [
          ["TW", "TaxWise.lk", "Year-end figures into the return", "#EEE8FF"],
          ["V", "VAT and SSCL summary", "In the order of the return", "#FDE6D6"],
          ["R", "Requests", "“Please add September’s bills”", "#E2F6D5"],
          ["L", "Period lock", "Once the return is filed", "#FFF0B8"],
        ],
      },
      {
        id: "paid",
        label: "Getting paid",
        note: "You record each payment by hand. There are no card payments or payouts through BillingEase, so there are no fees on your money.",
        items: [
          ["BT", "Bank transfer", "Recorded against the invoice", "#EEE8FF"],
          ["CH", "Cheque", "With its number and bank", "#FDE6D6"],
          ["Rs", "Cash", "Recorded with the date", "#E2F6D5"],
          ["QR", "LankaQR", "Recorded as LankaQR", "#FFF0B8"],
        ],
      },
      {
        id: "files",
        label: "Paperwork",
        note: "Snap a receipt or a supplier’s bill and BillingEase reads it, then drafts the entry for you to check. Nothing goes in until you approve it.",
        items: [
          ["PDF", "Tax Invoices and quotes", "Download or email as PDF", "#EEE8FF"],
          ["IMG", "Receipt photos", "Read for you to check, then kept with the expense", "#FDE6D6"],
          ["PDF", "Payslips", "Emailed or downloaded", "#E2F6D5"],
          ["S", "EPF, ETF and APIT schedules", "Ready to pay and file", "#FFF0B8"],
        ],
      },
    ],
  } satisfies ByCountry<{ id: string; label: string; note: string; items: [string, string, string, string][] }[]>,
};

export const FEATURES_QUOTES: ByCountry<{ quote: string; name: string; role: string; tint?: "violet" | "orange" | "dark" }[]> = {
  uk: [
    { quote: "I add a receipt when I get back to the car. By the end of the quarter there’s nothing left for my accountant to chase.", name: "Ellie Harper", role: "Harper Studio, Leeds (sample business)", tint: "violet" },
    { quote: "Both flats in one place, mortgage interest kept apart. I finally know what the rent actually leaves me.", name: "Tom Pickering", role: "Pickering Lets, York (sample business)", tint: "orange" },
    { quote: "The number in the jar is the one I look at. Everything else is there when my accountant needs it.", name: "Dan Brook", role: "Aire Valley Electrical, Bradford (sample business)", tint: "dark" },
  ],
  lk: [
    { quote: "The Tax Invoice comes out right first time, SSCL on its own line. My practitioner stopped sending them back.", name: "Ayesha Fernando", role: "Serendib Design Studio, Colombo 03 (sample business)", tint: "violet" },
    { quote: "Payroll for four bakers used to take an evening with a calculator. Now EPF and ETF are worked out when I save.", name: "Chaminda Perera", role: "Kandy Hill Bakery, Kandy (sample business)", tint: "orange" },
    { quote: "Cheques, transfers and LankaQR all in one list. I know who has paid before the bank statement arrives.", name: "Nadeesha Silva", role: "Ahangama Surf Lodge (sample business)", tint: "dark" },
  ],
};

export const FEATURES_CTA = {
  kicker: "Free to start, no card needed",
  title: "See your own three numbers.",
  text: "Add a customer and send one invoice. Your numbers start moving, and the rest of the features show up as you need them.",
};
