/**
 * Copy for /for/sole-traders (prototype SiteFreelancers, reworked for UK sole
 * traders getting ready for Making Tax Digital and Sri Lankan sole
 * proprietors). Every person, business and figure is invented and illustrative.
 */
import type { ByCountry } from "./country";
import { HOME_ICONS as IC } from "./home";
import { ROUTES } from "./routes";

export const SOLE_META = {
  title: "For sole traders",
  description:
    "Invoices, expenses in HMRC’s categories and Making Tax Digital quarters ready for your accountant. In Sri Lanka: invoices, payments and an income tax estimate, with the year handed to TaxWise.lk.",
};

export type WeekStep = {
  when: string;
  title: string;
  tag: "in" | "out" | "keep";
  body: string;
  effect: string;
  card: { head: string; badge?: string; title: string; rows: [string, string][]; foot: string };
  /** Step 5 shows the cash jar and this split instead of the card rows. */
  split?: [string, string, boolean?][];
  jar?: string;
};

type Feature = { icon: string; tint: "violet" | "orange" | "dark" | "green" | "yellow" | "grey"; title: string; tag: string; body: string; link?: { label: string; href: string } };

export type SolePage = {
  chip: string;
  hero: { title: string; lead: string; link: { label: string; href: string } };
  scene: { ring: string; ringSub: string; invTitle: string; invNo: string; customer: string; lines: [string, string][]; total: string; stamp: string; pill: string; hand: string };
  meet: { title: string; story: string; byline: string; first: string; caption: string };
  week: { kicker: string; title: string; lead: string; steps: WeekStep[] };
  features: { title: string; lead: string; items: Feature[] };
  owed: {
    title: string;
    lead: string;
    list: { title: string; sub: string; rows: { who: string; what: string; amount: number; state: string; late?: boolean }[] };
    repeat: { title: string; body: string; months: string[] };
    back: { title: string; body: string; rows: [string, string][] };
  };
  quotes: { title: string; main: { text: string; name: string; role: string }; side: { text: string; name: string; role: string }[] };
  plan: { title: string; why: string; rows: { name: string; line: string; value: string }[] };
  faqIntro: string;
  faq: { q: string; a: string }[];
  close: { title: string };
};

const UK: SolePage = {
  chip: "Sole traders",
  hero: {
    title: "Do the work. Your quarters will be ready.",
    lead: "Invoices, expenses in HMRC’s categories and a Making Tax Digital quarter that’s checked before your accountant asks for it. For designers, trades, tutors and anyone who works for themselves.",
    link: { label: "How quarters work", href: ROUTES.yoursToKeep.href },
  },
  scene: {
    ring: "Q2",
    ringSub: "6 Jul – 5 Oct",
    invTitle: "INVOICE",
    invNo: "INV-0042",
    customer: "Kirkstall Brewing Co",
    lines: [
      ["Autumn labels", "£1,450"],
      ["Tap badges", "£280"],
      ["Print set-up", "£120"],
    ],
    total: "£1,850",
    stamp: "PAID",
    pill: "Bank transfer recorded · £1,850",
    hand: "Q2 ready for Priya",
  },
  meet: {
    title: "Meet Ellie. She designs labels, not spreadsheets.",
    story:
      "Ellie Harper runs Harper Studio from a shared studio in Leeds: brand identities, packaging and the odd beer label. Her income is heading past £30,000, so Making Tax Digital reaches her from April 2027. Her accountant, Priya at Dale & Shaw, sees the same books. This is her tax year so far.",
    byline: "Ellie Harper · Harper Studio · Leeds",
    first: "Ellie",
    caption: "Harper Studio · this tax year so far",
  },
  week: {
    kicker: "A quarter in the life",
    title: "One job, from quote to the quarter.",
    lead: "Follow Ellie’s autumn labels for Kirkstall Brewing Co. Tap a step to see what she did, and which number it moved.",
    steps: [
      {
        when: "Mon 22 Sep",
        title: "Quote accepted",
        tag: "in",
        body: "Kirkstall Brewing Co said yes to the autumn labels by email. Ellie marks quote Q-0018 accepted and turns it into an invoice without typing it again.",
        effect: "Invoice INV-0042 drafted from the quote",
        card: { head: "QUOTE · Q-0018", badge: "Accepted", title: "Autumn labels · Kirkstall Brewing Co", rows: [["Label design, three beers", "£1,450"], ["Tap badges", "£280"], ["Print set-up", "£120"]], foot: "Marked accepted by Ellie on 22 September" },
      },
      {
        when: "Mon 22 Sep",
        title: "Invoice sent",
        tag: "in",
        body: "INV-0042 goes by email as a PDF, due in 14 days. A polite reminder is set for two days before it’s due, so Ellie doesn’t have to remember.",
        effect: "£1,850 on the way, in Coming in",
        card: { head: "INVOICE · INV-0042", badge: "Sent", title: "Kirkstall Brewing Co", rows: [["Autumn labels", "£1,450.00"], ["Tap badges", "£280.00"], ["Print set-up", "£120.00"]], foot: "Due 6 Oct · reminder by email on 4 Oct" },
      },
      {
        when: "Wed 24 Sep",
        title: "Train ticket attached",
        tag: "out",
        body: "A day in Harrogate with another client. Ellie adds the £23.40 train fare and attaches a photo of the ticket. It goes under Car, van and travel, the HMRC heading it belongs to.",
        effect: "£23.40 in Going out, in the right HMRC category",
        card: { head: "EXPENSE", badge: "Photo attached", title: "Train fare · Leeds to Harrogate", rows: [["Amount", "£23.40"], ["Category", "Car, van and travel"], ["Business use", "100%"]], foot: "Counts in Q2 (6 July to 5 October)" },
      },
      {
        when: "Fri 3 Oct",
        title: "Paid by bank transfer",
        tag: "in",
        body: "The brewery pays early. Ellie sees it in her banking app and records it against the invoice: bank transfer, £1,850, 3 October. The reminder is cancelled.",
        effect: "£1,850 moved from on the way to received",
        card: { head: "PAYMENT RECORDED", badge: "Paid", title: "INV-0042 · Kirkstall Brewing Co", rows: [["Method", "Bank transfer"], ["Date", "3 Oct 2026"], ["Amount", "£1,850.00"]], foot: "Reminder for 4 Oct cancelled" },
      },
      {
        when: "Mon 6 Oct",
        title: "Quarter ready",
        tag: "keep",
        body: "Q2 has ended. Every entry has a category, so the readiness check is clear and Priya sees the quarter ready. She sends the update to HMRC from her practice software before 7 November.",
        effect: "Q2 ready for Priya, tax set aside as it came in",
        card: { head: "", title: "", rows: [], foot: "" },
        jar: "£1,565",
        split: [
          ["Paid by Kirkstall Brewing Co", "£1,850"],
          ["Set aside for Income Tax and NI (estimate)", "−£285"],
          ["Yours to keep", "£1,565", true],
        ],
      },
    ],
  },
  features: {
    title: "Everything a one-person business needs. Nothing it doesn’t.",
    lead: "Three numbers stay simple, and the tools behind them are the ones you use every week.",
    items: [
      { icon: IC.doc, tint: "violet", title: "Invoices in a sentence", tag: "Coming in", body: "Type “Invoice Ochre Café £850 for the menu design” and get a ready invoice. Quotes, credit notes and VAT invoices when you’re VAT registered.", link: { label: "How Coming in works", href: ROUTES.comingIn.href } },
      { icon: IC.coins, tint: "violet", title: "Payments you record", tag: "Bank transfer, card machine, cash", body: "When a customer pays, you record it in a tap and the invoice shows as paid. No bank connection to set up or break.", link: { label: "See getting paid", href: ROUTES.comingIn.href } },
      { icon: IC.bell, tint: "violet", title: "Reminders you don’t write", tag: "By email", body: "A polite note before the due date and a firmer one after. You can read them first, or let them go.", link: { label: "See reminders", href: ROUTES.comingIn.href } },
      { icon: IC.clip, tint: "orange", title: "Expenses in HMRC’s words", tag: "Going out", body: "Plain names on screen, the HMRC heading underneath. Attach a photo or PDF, set a business-use share and log mileage at the simplified rate.", link: { label: "How Going out works", href: ROUTES.goingOut.href } },
      { icon: IC.calendar, tint: "dark", title: "MTD quarters, checked", tag: "Yours to keep", body: "Each quarter shows income and expenses by HMRC category, with a readiness check for gaps before it goes to your accountant.", link: { label: "How Yours to keep works", href: ROUTES.yoursToKeep.href } },
      { icon: IC.person, tint: "green", title: "Your accountant, invited", tag: "Free on every plan", body: "They see the same books, send you requests and file your quarterly updates from their own software. You stop emailing spreadsheets.", link: { label: "For accountants", href: ROUTES.accountants.href } },
    ],
  },
  owed: {
    title: "Paid on time, without the awkward emails.",
    lead: "The money a sole trader loses is rarely one big invoice. It’s the one you forgot to chase, the retainer you invoiced late and the refund you never wrote down.",
    list: {
      title: "Who owes you",
      sub: "Harper Studio · invented customers",
      rows: [
        { who: "Ochre Café", what: "Menu design · INV-0039", amount: 850, state: "12 days late", late: true },
        { who: "Moor & Dale Outdoor", what: "October retainer · INV-0043", amount: 600, state: "Due 31 Oct" },
        { who: "Headingley Tennis Club", what: "Club kit badges · INV-0040", amount: 320, state: "3 days late", late: true },
        { who: "Kirkstall Brewing Co", what: "Winter labels · INV-0044", amount: 1240, state: "Due 14 Nov" },
      ],
    },
    repeat: { title: "Repeating invoices", body: "Moor & Dale Outdoor pays £600 a month. A draft is ready on the 1st; Ellie checks it and sends it.", months: ["A", "M", "J", "J", "A", "S", "O"] },
    back: { title: "Money back, done properly", body: "A misprint? A credit note takes it off the invoice and out of Coming in, so the quarter stays right.", rows: [["Invoice INV-0040", "£320"], ["Credit note CN-0003", "−£40"], ["Still to pay", "£280"]] },
  },
  quotes: {
    title: "From people who work for themselves",
    main: { text: "I used to dread the week before my accountant’s deadline. Now the quarter is just there, sorted into the right boxes, and Priya tells me it’s ready before I ask.", name: "Ellie Harper", role: "Harper Studio, Leeds" },
    side: [
      { text: "The reminders do the chasing. I just record the payment when it lands.", name: "Sam Okafor", role: "Joiner, Sheffield" },
      { text: "I tutor in the evenings and design by day. It keeps both in one set of books for MTD.", name: "Rhian Price", role: "Tutor and designer, Cardiff" },
    ],
  },
  plan: {
    title: "Most sole traders pick MTD ready.",
    why: "Free covers invoices, expenses and your three numbers for as long as you like. MTD ready adds what Making Tax Digital asks of you: quarters with readiness checks, mileage, repeating invoices and the tax estimate.",
    rows: [
      { name: "Your accountant", line: "They sign in free and never count as a person on your plan.", value: "Free" },
      { name: "Through your practice", line: "If your accountant uses the TaxWise practice workbench, they may give you BillingEase as part of their service.", value: "Ask them" },
    ],
  },
  faqIntro: "The things sole traders ask us before they move their books over.",
  faq: [
    { q: "Does BillingEase send my MTD updates to HMRC?", a: "No. BillingEase keeps your records in HMRC’s categories and checks each quarter. Your accountant sends the update from their software. HMRC has paused new software for Making Tax Digital for Income Tax until at least early 2027, so filing from the app may come later." },
    { q: "When does Making Tax Digital start for me?", a: "It depends on your qualifying income (self-employment and property income before costs). Over £50,000 it started in April 2026, over £30,000 it starts in April 2027 and over £20,000 in April 2028. Your accountant can confirm which applies to you." },
    { q: "Is Free enough for me?", a: "If you send a handful of invoices and want your three numbers, yes, for as long as you like. Move to MTD ready when you need quarters with readiness checks, mileage and the tax estimate." },
    { q: "Does it connect to my bank?", a: "No. You record payments and expenses yourself. It takes a few seconds each and nothing breaks when a bank changes its login." },
    { q: "Can customers pay by card through BillingEase?", a: "No. Customers pay you the way they already do (bank transfer, your card machine, cash) and you record the payment against the invoice." },
    { q: "I’m a sole trader and I let a flat. Can I do both?", a: "Yes. At sign-up choose sole trader, landlord or both. Your property gets its own income and costs, kept apart from your trade, in the same quarter." },
  ],
  close: { title: "Do the work. Let the quarter look after itself." },
};

const LK: SolePage = {
  chip: "Sole proprietors",
  hero: {
    title: "Do the work. We’ll keep the books.",
    lead: "Invoices, payments by bank transfer, cheque, cash or LankaQR, and expenses with the paperwork attached. Income tax is estimated as you go, and the year goes straight to TaxWise.lk. For freelancers, shops and one-person businesses in Sri Lanka.",
    link: { label: "How Yours to keep works", href: ROUTES.yoursToKeep.href },
  },
  scene: {
    ring: "Rs",
    ringSub: "this year",
    invTitle: "INVOICE",
    invNo: "INV-0213",
    customer: "Hill Country Tea Estates",
    lines: [
      ["Tea-time order", "Rs 36,000"],
      ["Short eats", "Rs 9,000"],
      ["Delivery", "Rs 3,000"],
    ],
    total: "Rs 48,000",
    stamp: "PAID",
    pill: "LankaQR recorded · Rs 48,000",
    hand: "year ready for TaxWise.lk",
  },
  meet: {
    title: "Meet Chaminda. He bakes bread, not balance sheets.",
    story:
      "Chaminda Perera runs Kandy Hill Bakery as a sole proprietor: bread for the shop, tea-time orders for estates and guest houses, and four bakers on the payroll. He used to keep it all in a notebook. This is his year of assessment so far.",
    byline: "Chaminda Perera · Kandy Hill Bakery · Kandy",
    first: "Chaminda",
    caption: "Kandy Hill Bakery · this year of assessment so far",
  },
  week: {
    kicker: "A week in the life",
    title: "One order, from quote to paid.",
    lead: "Follow a tea-time order for Hill Country Tea Estates. Tap a step to see what Chaminda did, and which number it moved.",
    steps: [
      {
        when: "Mon 6 Oct",
        title: "Quote accepted",
        tag: "in",
        body: "The estate manager rings to say yes. Chaminda marks quote Q-0061 accepted and turns it into an invoice without typing it again.",
        effect: "Invoice INV-0213 drafted from the quote",
        card: { head: "QUOTE · Q-0061", badge: "Accepted", title: "Staff tea-time order · Hill Country Tea Estates", rows: [["Tea-time order, 120 people", "Rs 36,000"], ["Short eats", "Rs 9,000"], ["Delivery", "Rs 3,000"]], foot: "Marked accepted by Chaminda on 6 October" },
      },
      {
        when: "Mon 6 Oct",
        title: "Invoice sent",
        tag: "in",
        body: "INV-0213 goes by email as a PDF, and a polite reminder is set to go by WhatsApp two days before it’s due.",
        effect: "Rs 48,000 on the way, in Coming in",
        card: { head: "INVOICE · INV-0213", badge: "Sent", title: "Hill Country Tea Estates", rows: [["Tea-time order", "Rs 36,000.00"], ["Short eats", "Rs 9,000.00"], ["Delivery", "Rs 3,000.00"]], foot: "Due 20 Oct · reminder by WhatsApp on 18 Oct" },
      },
      {
        when: "Wed 8 Oct",
        title: "Flour bill entered",
        tag: "out",
        body: "The flour mill’s bill arrives with 30 days to pay. Chaminda enters it, attaches a photo and plans to pay half now and half next month.",
        effect: "Rs 186,000 in Going out, still to pay",
        card: { head: "BILL", badge: "Photo attached", title: "Upcountry Flour Co", rows: [["Amount", "Rs 186,000"], ["Paid now", "Rs 93,000"], ["Still to pay", "Rs 93,000"]], foot: "Due 7 Nov" },
      },
      {
        when: "Fri 10 Oct",
        title: "Paid by LankaQR",
        tag: "in",
        body: "The estate pays by LankaQR. Chaminda records it against the invoice in a tap, and the WhatsApp reminder is cancelled.",
        effect: "Rs 48,000 moved from on the way to received",
        card: { head: "PAYMENT RECORDED", badge: "Paid", title: "INV-0213 · Hill Country Tea Estates", rows: [["Method", "LankaQR"], ["Date", "10 Oct 2026"], ["Amount", "Rs 48,000.00"]], foot: "Reminder for 18 Oct cancelled" },
      },
      {
        when: "Fri 10 Oct",
        title: "Tax set aside",
        tag: "keep",
        body: "Part of every payment is set aside for income tax, so the quarterly instalment is never a surprise. At year end, the figures go to his TaxWise.lk return.",
        effect: "Income tax set aside as it came in",
        card: { head: "", title: "", rows: [], foot: "" },
        jar: "Rs 42,150",
        split: [
          ["Paid by Hill Country Tea Estates", "Rs 48,000"],
          ["Set aside for income tax (estimate)", "−Rs 5,850"],
          ["Yours to keep", "Rs 42,150", true],
        ],
      },
    ],
  },
  features: {
    title: "Everything a one-person business needs. Nothing it doesn’t.",
    lead: "Three numbers stay simple, and the tools behind them are the ones you use every week.",
    items: [
      { icon: IC.doc, tint: "violet", title: "Invoices in a sentence", tag: "Coming in", body: "Type “Invoice Udawatta Inn Rs 36,500 for the weekend order” and get a ready invoice. Tax Invoices with VAT and SSCL once you’re registered.", link: { label: "How Coming in works", href: ROUTES.comingIn.href } },
      { icon: IC.coins, tint: "violet", title: "Payments you record", tag: "Bank transfer, cheque, cash, LankaQR", body: "Record each payment in a tap, with the cheque number and date when it’s a cheque. The invoice shows as paid.", link: { label: "See getting paid", href: ROUTES.comingIn.href } },
      { icon: IC.bell, tint: "violet", title: "Reminders you don’t write", tag: "By email and WhatsApp", body: "A polite note before the due date and a firmer one after, by email or WhatsApp. You can read them first, or let them go.", link: { label: "See reminders", href: ROUTES.comingIn.href } },
      { icon: IC.clip, tint: "orange", title: "Expenses with the paperwork", tag: "Going out", body: "Enter what you spent and attach a photo or PDF. Categories follow the lines of your income tax return.", link: { label: "How Going out works", href: ROUTES.goingOut.href } },
      { icon: IC.safe, tint: "dark", title: "Income tax, estimated", tag: "Yours to keep", body: "Profit after an income tax estimate, with the quarterly instalment dates on Home. A guide for you, not a filing.", link: { label: "How Yours to keep works", href: ROUTES.yoursToKeep.href } },
      { icon: IC.person, tint: "green", title: "Your practitioner, invited", tag: "Free on every plan", body: "They see the same books, send you requests and get the year-end figures straight into TaxWise.lk.", link: { label: "For tax practitioners", href: ROUTES.accountants.href } },
    ],
  },
  owed: {
    title: "Paid on time, without the awkward calls.",
    lead: "The money a small business loses is rarely one big invoice. It’s the order you forgot to chase, the cheque you never wrote down and the refund nobody recorded.",
    list: {
      title: "Who owes you",
      sub: "Kandy Hill Bakery · invented customers",
      rows: [
        { who: "Udawatta Inn", what: "Weekend order · INV-0208", amount: 36500, state: "9 days late", late: true },
        { who: "Peradeniya Guest House", what: "Breakfast bread, October · INV-0211", amount: 54000, state: "Due 31 Oct" },
        { who: "Lake View Café", what: "Cake order · INV-0205", amount: 12800, state: "4 days late", late: true },
        { who: "Hill Country Tea Estates", what: "Diwali order · INV-0215", amount: 72000, state: "Due 14 Nov" },
      ],
    },
    repeat: { title: "Repeating invoices", body: "Peradeniya Guest House takes bread every morning. A monthly draft is ready on the 1st; Chaminda checks it and sends it.", months: ["A", "M", "J", "J", "A", "S", "O"] },
    back: { title: "Money back, done properly", body: "A short delivery? A credit note takes it off the invoice and out of Coming in, so the year stays right.", rows: [["Invoice INV-0205", "Rs 12,800"], ["Credit note CN-0011", "−Rs 1,600"], ["Still to pay", "Rs 11,200"]] },
  },
  quotes: {
    title: "From people who work for themselves",
    main: { text: "I used to add up the notebook every March. Now I know what I’ve made each week, and my practitioner gets the year without me carrying a bag of receipts to Colombo.", name: "Chaminda Perera", role: "Kandy Hill Bakery, Kandy" },
    side: [
      { text: "Cheques used to go missing in my head. Now each one is recorded with its number and date.", name: "Nirmala Silva", role: "Tailor, Galle" },
      { text: "WhatsApp reminders are polite and they work. I don’t have to make the call.", name: "Farhan Ismail", role: "Photographer, Colombo 05" },
    ],
  },
  plan: {
    title: "Growing? Most move to Business.",
    why: "Free covers invoices, expenses and your three numbers for as long as you like. Business adds Tax Invoices with VAT and SSCL, payroll, WhatsApp reminders and the year-end hand-off to TaxWise.lk.",
    rows: [
      { name: "Your practitioner", line: "They sign in free and never count as a person on your plan.", value: "Free" },
      { name: "Your TaxWise.lk return", line: "Bought in TaxWise.lk, or done by your practitioner. BillingEase sends it the year’s figures.", value: "Separate" },
    ],
  },
  faqIntro: "The things sole proprietors ask us before they move their books over.",
  faq: [
    { q: "Does BillingEase file my return with the IRD?", a: "No. BillingEase keeps your books and estimates your income tax. At year end it sends the figures to your TaxWise.lk return, where you or your practitioner file." },
    { q: "I’m not VAT registered. Can I still use it?", a: "Yes. You send ordinary invoices. If you register later, turn on Tax Invoices and VAT and SSCL appear on their own lines. BillingEase warns you as turnover gets close to the threshold." },
    { q: "Is Free enough for me?", a: "If you send a handful of invoices and want your three numbers, yes, for as long as you like. Move to Business for payroll, WhatsApp reminders and the TaxWise.lk hand-off." },
    { q: "How do customers pay me?", a: "The way they already do: bank transfer, cheque, cash or LankaQR. You record the payment against the invoice. BillingEase doesn’t take payments online." },
    { q: "Does it connect to my bank?", a: "No. You record payments and expenses yourself; it takes a few seconds each." },
    { q: "Can my practitioner get in?", a: "Yes, free. Invite them from Your accountant and they see the same books, send requests and get the year-end figures in TaxWise.lk." },
  ],
  close: { title: "Do the work. We’ll keep the books." },
};

export const SOLE: ByCountry<SolePage> = { uk: UK, lk: LK };

/** UK: when Making Tax Digital for Income Tax starts, by qualifying income. Illustrative until checked against gov.uk. */
export const MTD_WAVES = [
  { from: 50000, start: "6 April 2026", label: "Over £50,000" },
  { from: 30000, start: "6 April 2027", label: "Over £30,000" },
  { from: 20000, start: "6 April 2028", label: "Over £20,000" },
];

/** UK quarterly update dates (standard quarters). */
export const MTD_QUARTERS = [
  { q: "Q1", span: "6 Apr – 5 Jul", due: "7 Aug" },
  { q: "Q2", span: "6 Jul – 5 Oct", due: "7 Nov" },
  { q: "Q3", span: "6 Oct – 5 Jan", due: "7 Feb" },
  { q: "Q4", span: "6 Jan – 5 Apr", due: "7 May" },
];

/** Sri Lanka quarterly income tax instalments (illustrative until checked against ird.gov.lk). */
export const LK_INSTALMENTS = [
  { q: "1st", span: "Apr – Jun", due: "15 Aug" },
  { q: "2nd", span: "Jul – Sep", due: "15 Nov" },
  { q: "3rd", span: "Oct – Dec", due: "15 Feb" },
  { q: "4th", span: "Jan – Mar", due: "15 May" },
];

export const TAX_SECTION = {
  uk: {
    kicker: "Making Tax Digital for Income Tax",
    title: "Four updates a year, explained simply.",
    lead: "From April 2027, sole traders and landlords with more than £30,000 of income send HMRC a short update every quarter, then a final declaration after the year ends. Keeping records as you go is the whole trick.",
    points: [
      ["Records in HMRC’s categories, as you go.", "Every expense has a plain name and the HMRC heading underneath."],
      ["Each quarter is checked before it goes.", "Gaps and uncategorised entries show up while there’s time to fix them."],
      ["Your accountant sends the update.", "From their own software. BillingEase never files for you."],
    ] as [string, string][],
    small: "A guide, not tax advice. Your accountant decides what applies to you.",
  },
  lk: {
    kicker: "Income tax, as you go",
    title: "Tax four times a year, explained simply.",
    lead: "When you work for yourself, nobody takes tax out of your pay. Income tax on business profit is paid in quarterly instalments, then settled in your return after the year of assessment ends on 31 March.",
    points: [
      ["Every payment is split as it lands.", "A share goes to your tax set-aside, so you never spend it by accident."],
      ["Instalment dates sit on Home.", "With the amount BillingEase estimates for each one."],
      ["At year end, the figures go to TaxWise.lk.", "Your return, or your practitioner’s file for you. BillingEase never files."],
    ] as [string, string][],
    small: "A guide, not tax advice. Your practitioner decides what applies to you.",
  },
};
