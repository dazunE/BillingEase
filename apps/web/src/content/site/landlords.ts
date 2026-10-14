/**
 * Copy for /for/landlords (prototype SiteShops' layout, reworked for UK
 * landlords). Landlord mode is UK only; the Sri Lanka setting gets a short,
 * honest note. Every person, property and figure is invented and illustrative.
 */
import { HOME_ICONS as IC } from "./home";
import { ROUTES } from "./routes";

export const LANDLORD_META = {
  title: "For landlords",
  description: "Rent and costs per property, your ownership share, letting agent fees and mortgage interest kept apart, and every Making Tax Digital quarter ready for your accountant.",
};

const I = {
  share: "M12 3a9 9 0 1 0 9 9h-9zM14 3.2V10h6.8A9 9 0 0 0 14 3.2",
  roll: "M4 5h16v14H4zM4 10h16M9 10v9",
  agent: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M17 8h5M19.5 5.5v5",
  allowance: "M20 12l-8 8-9-9V3h8zM7.5 7.5h.01",
};

export const LANDLORD_UK = {
  chip: "Landlords",
  hero: {
    title: "Your properties, in three numbers.",
    lead: "Rent and costs per property, your share of each, letting agent fees and mortgage interest kept apart. Every Making Tax Digital quarter is ready for your accountant, with the £1,000 property allowance checked for you.",
    link: { label: "How quarters work", href: ROUTES.yoursToKeep.href },
  },
  scene: { rent: "£800", share: "50%", envelope: "interest, kept apart", pill: "Flat 2 · October rent", pillAmount: "£800", hand: "rent in, interest apart" },
  meet: {
    title: "Meet Tom. He lets two flats, and keeps his evenings.",
    story:
      "Tom Pickering teaches full time and lets two flats near the station in York. A letting agent looks after Flat 1; he manages Flat 2 himself. He used to sort a shoebox of statements every January. Now each month’s rent and costs land against the right flat. This is his tax year so far.",
    byline: "Tom Pickering · Pickering Lets · York",
    first: "Tom",
    caption: "Pickering Lets · this tax year so far",
  },
  calc: {
    kicker: "Try it with your own numbers",
    title: "What does that flat really make you?",
    lead: "£800 a month isn’t £9,600 a year in your pocket. The agent’s fee, repairs and your share come off first, and mortgage interest works differently from other costs. Here’s the sum BillingEase does for every property.",
  },
  features: {
    title: "Built for bricks and mortar.",
    lead: "The same three numbers as everyone else, with the tools a landlord needs behind them.",
    items: [
      { icon: IC.house, tint: "orange" as const, title: "Properties and shares", tag: "Set up once", body: "Add each property with its address and your ownership share. Own a flat 50/50? Its rent and costs count at half, automatically.", link: { label: "How Coming in works", href: ROUTES.comingIn.href } },
      { icon: I.roll, tint: "violet" as const, title: "A rent roll", tag: "Coming in", body: "Each month’s rent per property: received, due or late. A polite email reminder goes to a tenant whose rent is late.", link: { label: "See getting paid", href: ROUTES.comingIn.href } },
      { icon: I.agent, tint: "orange" as const, title: "Letting agent statements", tag: "Going out", body: "Record the full rent and the agent’s fee as a cost, so your books match the statement and nothing is double counted.", link: { label: "How Going out works", href: ROUTES.goingOut.href } },
      { icon: IC.safe, tint: "dark" as const, title: "Mortgage interest, kept apart", tag: "Finance costs", body: "Interest isn’t taken off your rent. It’s kept separate and reduces your Income Tax by 20% of it, so it sits in its own line.", link: { label: "How Yours to keep works", href: ROUTES.yoursToKeep.href } },
      { icon: I.allowance, tint: "yellow" as const, title: "The £1,000 allowance", tag: "Checked for you", body: "If your costs are small, the property allowance can be better. BillingEase compares the two and shows which one helps.", link: { label: "See the tax estimate", href: ROUTES.yoursToKeep.href } },
      { icon: IC.calendar, tint: "green" as const, title: "MTD property income", tag: "Every quarter", body: "Rent and costs under HMRC’s property headings each quarter, checked before your accountant sends the update.", link: { label: "For accountants", href: ROUTES.accountants.href } },
    ],
  },
  roll: {
    title: "A rent roll that keeps itself up to date.",
    lead: "Every month, every property: what’s come in, what’s due, and who’s late. When rent is late, you hear about it while it’s still a polite reminder.",
    table: "Pickering Lets · rent roll, October",
    rows: [
      { name: "Flat 1, Station Road", who: "Through Ousebank Lettings", rent: 800, share: "100%", state: "Received 1 Oct", tone: "pos" as const },
      { name: "Flat 2, Station Road", who: "Self-managed", rent: 800, share: "100%", state: "3 days late", tone: "late" as const },
      { name: "Parking space", who: "Self-managed", rent: 60, share: "100%", state: "Received 1 Oct", tone: "pos" as const },
    ],
    banner: "Flat 2’s October rent is 3 days late. A polite email reminder goes to the tenant tomorrow unless you record it first.",
    agent: {
      kicker: "Letting agent statements",
      title: "The full rent in, the fee as a cost.",
      body: "Ousebank Lettings pays Tom £704. BillingEase records the £800 rent and the £96 fee, so the quarter shows what HMRC expects.",
      rows: [
        ["Rent collected by the agent", "£800.00"],
        ["Management fee (12%, incl. VAT)", "−£96.00"],
        ["Paid to Tom", "£704.00"],
      ] as [string, string][],
      foot: "The fee goes under Legal, management and other professional fees.",
    },
    mortgage: {
      kicker: "Mortgage payments",
      title: "Interest apart, capital out.",
      body: "Of Flat 1’s £620 mortgage payment, only the interest matters for tax, and it’s kept out of costs.",
      rows: [
        ["Mortgage payment", "£620.00"],
        ["Interest: finance costs, kept apart", "£410.00"],
        ["Capital: not a cost", "£210.00"],
      ] as [string, string][],
      foot: "20% of the interest comes off the Income Tax estimate.",
    },
  },
  quarters: {
    kicker: "Making Tax Digital",
    title: "Each quarter, under HMRC’s property headings.",
    lead: "Landlords with more than £50,000 of qualifying income started in April 2026; over £30,000 follows in April 2027 and over £20,000 in April 2028. BillingEase sorts rent and costs into the property headings as you go; your accountant sends the update.",
    pick: "Pick a quarter",
  },
  quotes: {
    title: "From people who let property",
    main: { text: "I used to guess what Flat 2 made. After the agent, the boiler and the mortgage interest, it was about half what I thought. Now I see it every month, per flat.", name: "Tom Pickering", role: "Pickering Lets, York" },
    side: [
      { text: "My sister and I own the house 50/50. It counts my half without me doing the maths.", name: "Ruth Adeyemi", role: "Landlord, Nottingham" },
      { text: "The agent’s statement and my books finally say the same thing.", name: "Graham Lowe", role: "Landlord, Bristol" },
    ],
  },
  plan: {
    title: "Landlords pick MTD ready.",
    why: "Free covers rent, costs and your three numbers. MTD ready adds landlord mode with properties and shares, quarters with readiness checks and the Income Tax estimate with the finance-cost reduction.",
    rows: [
      { name: "Your accountant", line: "They sign in free and never count as a person on your plan.", value: "Free" },
      { name: "A trade as well?", line: "Sole trader and landlord in one set of books, each kept apart in the quarter.", value: "Same plan" },
    ],
  },
  faqIntro: "What landlords ask before they move their books over.",
  faq: [
    { q: "Does BillingEase file my property income with HMRC?", a: "No. It keeps your rent and costs under HMRC’s property headings and checks each quarter. Your accountant sends the update from their own software." },
    { q: "Why is mortgage interest kept separate?", a: "For residential lets, mortgage interest isn’t deducted from rent. Instead you get a tax reduction of 20% of the interest. BillingEase keeps it in its own line so the estimate and your accountant both see it clearly." },
    { q: "When is the £1,000 property allowance better?", a: "When your costs for the year are under £1,000. You can take the allowance or your actual costs, not both, and taking it means no mortgage interest reduction. BillingEase compares the two; your accountant has the final say." },
    { q: "I own a property jointly. How does that work?", a: "Set your ownership share on the property. Its rent and costs count at your share in your books and your quarters." },
    { q: "Does it connect to my bank or my letting agent?", a: "No. You record rent and costs yourself, and enter the agent’s statement as rent in and the fee out. It takes a minute a month." },
    { q: "Do I need it if I only have one flat?", a: "If your income is under the MTD thresholds, Free may be all you need. Keeping records the MTD way now makes the switch easy when it reaches you." },
  ],
  close: { title: "Know what every property really makes." },
};

/** Property income by HMRC heading per quarter, for Tom (illustrative). */
export const LANDLORD_QUARTERS = [
  { q: "Q1", span: "6 Apr – 5 Jul", due: "7 Aug", state: "Sent by his accountant", rent: 4980, rows: [["Rent, rates, insurance and ground rents", 186], ["Property repairs and maintenance", 0], ["Legal, management and other professional fees", 288], ["Other allowable property expenses", 42]], interest: 1230 },
  { q: "Q2", span: "6 Jul – 5 Oct", due: "7 Nov", state: "Ready for his accountant", rent: 4980, rows: [["Rent, rates, insurance and ground rents", 186], ["Property repairs and maintenance", 340], ["Legal, management and other professional fees", 288], ["Other allowable property expenses", 36]], interest: 1230 },
  { q: "Q3", span: "6 Oct – 5 Jan", due: "7 Feb", state: "In progress", rent: 1660, rows: [["Rent, rates, insurance and ground rents", 62], ["Property repairs and maintenance", 0], ["Legal, management and other professional fees", 96], ["Other allowable property expenses", 12]], interest: 410 },
  { q: "Q4", span: "6 Jan – 5 Apr", due: "7 May", state: "Not started", rent: 0, rows: [["Rent, rates, insurance and ground rents", 0], ["Property repairs and maintenance", 0], ["Legal, management and other professional fees", 0], ["Other allowable property expenses", 0]], interest: 0 },
] as { q: string; span: string; due: string; state: string; rent: number; rows: [string, number][]; interest: number }[];

export const LANDLORD_LK = {
  chip: "Landlords",
  title: "Letting property in Sri Lanka?",
  lead: "Landlord mode (properties, ownership shares, letting agent fees and mortgage interest kept apart) is built for UK landlords and Making Tax Digital. In Sri Lanka, rent you receive is simply an income line in your books, and it’s handled in your TaxWise.lk return.",
  scene: { rent: "Rs 85k", share: "UK", envelope: "TaxWise.lk", pill: "Rent recorded as income", pillAmount: "Rs 85,000", hand: "rent is an income line" },
  note: {
    title: "What this means for you",
    points: [
      ["Record rent as income.", "Add each month’s rent as an income line, with the tenant as the customer if you like. It counts in Coming in."],
      ["Keep the costs that go with it.", "Repairs, rates and insurance go in as expenses with the paperwork attached."],
      ["Your return does the rest.", "Rent income is handled in your TaxWise.lk return, by you or your practitioner. BillingEase doesn’t file anything."],
    ] as [string, string][],
  },
  links: { title: "Pages for Sri Lanka", lead: "These are written for businesses in Sri Lanka." },
  close: { title: "Your whole business, in three numbers." },
};
