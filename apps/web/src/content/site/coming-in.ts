/**
 * Copy for /coming-in (prototype SiteComingIn). Country copy is `{ uk, lk }`.
 * Every business and customer is invented; figures are illustrative.
 */
import type { ByCountry, Copy } from "./country";

export const COMING_IN_META = {
  title: "Coming in",
  description: "Invoices in a sentence, quotes that become invoices, payments you record and polite reminders. Pounds and VAT invoices in the UK; rupees and Tax Invoices with VAT and SSCL in Sri Lanka.",
};

export const CI_HERO = {
  kicker: "Coming in",
  title: "Get paid, and know who still owes you.",
  lead: {
    uk: "Write an invoice the way you’d say it out loud. Record the payment when the money arrives, by bank transfer, card machine, cash or cheque, and send a polite reminder when it doesn’t.",
    lk: "Write a Tax Invoice the way you’d say it out loud. Record the payment when it arrives, by bank transfer, cheque, cash or LankaQR, and send a polite reminder by email or WhatsApp when it doesn’t.",
  } satisfies Copy,
  small: "Unlimited invoices and quotes on the free plan.",
};

export type Customer = { id: string; name: string; email: string; what: string; amt: number };

export const CI_COMPOSER: ByCountry<{ biz: string; place: string; inv: string; start: number; customers: Customer[] }> = {
  uk: {
    biz: "Harper Studio",
    place: "Leeds",
    inv: "INV-0043",
    start: 28400,
    customers: [
      { id: "kirkstall", name: "Kirkstall Brewing Co", email: "accounts@kirkstallbrewing.example", what: "Autumn label designs", amt: 1850 },
      { id: "ochre", name: "Ochre Café", email: "sam@ochrecafe.example", what: "Menu and window design", amt: 850 },
      { id: "moor", name: "Moor & Dale Outdoor", email: "hello@moordale.example", what: "Spring catalogue layout", amt: 2400 },
      { id: "print", name: "Leeds Print Fest", email: "team@leedsprintfest.example", what: "Festival poster series", amt: 620 },
    ],
  },
  lk: {
    biz: "Serendib Design Studio",
    place: "Colombo 03",
    inv: "TI-0189",
    start: 5280000,
    customers: [
      { id: "kandyan", name: "Kandyan Spice Co", email: "accounts@kandyanspice.example", what: "Packaging design", amt: 250000 },
      { id: "galle", name: "Galle Fort Boutique Hotel", email: "dinesh@gallefortboutique.example", what: "Brochure and room cards", amt: 186000 },
      { id: "lanka", name: "Lanka Agri Exports", email: "finance@lankaagri.example", what: "Export catalogue", amt: 120000 },
      { id: "ahangama", name: "Ahangama Surf Lodge", email: "nadeesha@ahangamasurf.example", what: "Website illustrations", amt: 95000 },
    ],
  },
};

export const CI_QUOTE = {
  kicker: "Quotes",
  title: "Quotes that become invoices without retyping.",
  lead: "Send a price before the work starts. When the customer says yes, mark it accepted and turn it into an invoice in one step, lines and all.",
  bullets: [
    "Send it as a PDF by email, or download it",
    "Mark it accepted when they say yes, with the date on record",
    "Accepted quotes become invoices in one tap",
  ],
  small: "Customers say yes by replying to you. There’s no online accept button, so nothing changes without you.",
  sample: {
    uk: { no: "Q-0031", from: "Harper Studio", title: "Shop window and signage", who: "Moor & Dale Outdoor", valid: "valid until 30 October 2026", lines: [["Window graphics design", 1600], ["Hanging signs, 4 designs", 800]] as [string, number][], inv: "INV-0044" },
    lk: { no: "Q-0024", from: "Serendib Design Studio", title: "Hotel signage and room cards", who: "Galle Fort Boutique Hotel", valid: "valid until 30 October 2026", lines: [["Signage design, 12 signs", 140000], ["Room cards, 2 designs", 46000]] as [string, number][], inv: "TI-0190" },
  },
};

export const CI_PAY = {
  kicker: "Getting paid",
  title: { uk: "However they pay, you record it in a tap.", lk: "Transfer, cheque, cash or LankaQR, recorded in a tap." } satisfies Copy,
  lead: {
    uk: "Customers pay you the way they always have. When the money arrives, record it against the invoice: in full, or part now and the rest later. BillingEase takes no fees, because the money never passes through us.",
    lk: "Customers pay you the way they always have. When the money arrives, record it against the invoice, with the cheque number and bank when it’s a cheque. BillingEase takes no fees, because the money never passes through us.",
  } satisfies Copy,
  methods: {
    uk: [
      { id: "bank", label: "Bank transfer", note: "Shows on your statement in a day or two. Record the date it arrived." },
      { id: "card", label: "Card machine", note: "Taken on your own card machine. Record it as a card payment; any machine fee is an expense." },
      { id: "cash", label: "Cash", note: "Record the amount and the date. Keep the receipt book as you always have." },
      { id: "cheque", label: "Cheque", note: "Record it when it clears, so Coming in matches the bank." },
    ],
    lk: [
      { id: "bank", label: "Bank transfer", note: "Record the date it reached your account and the reference." },
      { id: "cheque", label: "Cheque", note: "Record the cheque number, bank and date. Mark it cleared when it does." },
      { id: "cash", label: "Cash", note: "Record the amount and the date. Keep the receipt book as you always have." },
      { id: "lankaqr", label: "LankaQR", note: "Paid to your LankaQR code. Record it with the reference from your app." },
    ],
  } satisfies ByCountry<{ id: string; label: string; note: string }[]>,
};

export const CI_REPEAT = {
  kicker: "On repeat",
  title: "Set it once. It drafts or sends on the day.",
  lead: {
    uk: "Retainers go out on the same day every month: drafted for you to check, or emailed straight away. Reminders are written for you; you choose when to send them.",
    lk: "Retainers go out on the same day every month: drafted for you to check, or emailed straight away. Reminders are written for you; send them by email or WhatsApp when you choose.",
  } satisfies Copy,
  reps: {
    uk: [
      { id: "ochre", who: "Ochre Café", what: "Social media retainer · on the 1st", amt: 120, next: ["1 Nov", "1 Dec", "1 Jan"], count: "9 sent so far" },
      { id: "moor", who: "Moor & Dale Outdoor", what: "Monthly newsletter design · on the 15th", amt: 280, next: ["15 Oct", "15 Nov", "15 Dec"], count: "4 sent so far" },
    ],
    lk: [
      { id: "kandyan", who: "Kandyan Spice Co", what: "Social media retainer · on the 1st", amt: 60000, next: ["1 Nov", "1 Dec", "1 Jan"], count: "11 sent so far" },
      { id: "ahangama", who: "Ahangama Surf Lodge", what: "Monthly listing photos · on the 15th", amt: 35000, next: ["15 Oct", "15 Nov", "15 Dec"], count: "5 sent so far" },
    ],
  },
};

export const CI_REMIND = {
  uk: { who: "Ochre Café", contact: "Sam", inv: "INV-0038", amt: 850, what: "the menu design", due: "20 October", biz: "Harper Studio", sender: "Ellie" },
  lk: { who: "Lanka Agri Exports", contact: "Mr Perera", inv: "TI-0182", amt: 302375, what: "the export catalogue", due: "20 October", biz: "Serendib Design Studio", sender: "Ayesha" },
};

export const CI_MORE = {
  title: { uk: "For refunds, price lists and VAT.", lk: "For refunds, price lists and Tax Invoices." } satisfies Copy,
  aside: "These show up when they apply to you. Tell BillingEase whether you’re VAT registered when you set up.",
};

export const CI_FACTS = {
  uk: [
    ["4", "ways to record a payment: transfer, card machine, cash, cheque"],
    ["0", "fees on your payments: the money never passes through us"],
    ["PDF", "for every invoice, quote and credit note"],
    ["1 tap", "to send a reminder that’s already written"],
  ],
  lk: [
    ["4", "ways to record a payment: transfer, cheque, cash, LankaQR"],
    ["0", "fees on your payments: the money never passes through us"],
    ["2", "lines for tax on every Tax Invoice: SSCL and VAT"],
    ["2", "ways to remind: email and WhatsApp"],
  ],
} satisfies ByCountry<[string, string][]>;

export const CI_QUOTE_PROOF = {
  uk: { quote: "I used to keep a list of who owed me on a sticky note. Now I record the transfer when it lands, and the late ones are on Home with a reminder already written.", name: "Ellie Harper", role: "Harper Studio, Leeds (sample business)" },
  lk: { quote: "Most of my clients pay by cheque. I record the number and bank when it arrives, and the Tax Invoice shows as paid. My practitioner sees the same list.", name: "Ayesha Fernando", role: "Serendib Design Studio, Colombo 03 (sample business)" },
};

export const CI_FAQ: ByCountry<{ q: string; a: string }[]> = {
  uk: [
    { q: "Can customers pay online from the invoice?", a: "Not yet. Customers pay you the way they do today, by bank transfer, on your card machine, in cash or by cheque, and you record the payment against the invoice. Payment links may come later; they aren’t in BillingEase today." },
    { q: "Do you take a fee when I get paid?", a: "No. The money goes straight from your customer to you, so there’s nothing for us to take a cut of." },
    { q: "Can I make VAT invoices?", a: "Yes, when you tell BillingEase you’re VAT registered. Invoices show your VAT number and the VAT on each line at 20%, 5%, 0% or exempt, and the VAT adds up for each VAT quarter. Your accountant files the VAT return." },
    { q: "Do reminders go out on their own?", a: "No. BillingEase writes a polite reminder for each late invoice and puts it on Home. You read it, change it if you like, and send it by email." },
    { q: "Can I bill in euros or dollars?", a: "Yes. Pick the currency on the quote or invoice, or set it as the customer's usual currency. The day's exchange rate is filled in and you can change it. Your books stay in pounds: the invoice counts at its rate, and when the money lands you enter what reached your bank, so any difference is kept as an exchange rate gain or loss. A VAT invoice also shows the VAT in pounds." },
    { q: "What happens to Coming in when I send a credit note?", a: "The credit note comes off Coming in straight away and off the invoice it relates to, and your books get a correcting entry. Nothing is deleted." },
  ],
  lk: [
    { q: "Can customers pay online from the invoice?", a: "Not yet. Customers pay you by bank transfer, cheque, cash or LankaQR, and you record the payment against the invoice. Payment links through a local provider may come later; they aren’t in BillingEase today." },
    { q: "Do you take a fee when I get paid?", a: "No. The money goes straight from your customer to you, so there’s nothing for us to take a cut of." },
    { q: "Do invoices follow the IRD Tax Invoice format?", a: "When you’re VAT registered, invoices are titled Tax Invoice with your TIN and VAT registration number, SSCL at 2.5% on its own line and VAT at 18%. Zero-rated and exempt lines are available. Rates and fields are checked against ird.gov.lk before launch." },
    { q: "How do WhatsApp reminders work?", a: "BillingEase writes a polite reminder for each late invoice. Choose email and we send it, or choose WhatsApp and it opens with the message ready for you to send from your own number." },
    { q: "Can I bill in dollars for an export customer?", a: "Yes. Pick US dollars (or another currency) on the invoice, or make it the customer's usual currency. The day's rate is filled in and you can change it to your bank's. Your books stay in rupees, and the Tax Invoice also shows its totals in rupees. When the payment lands, enter the rupees that reached your bank: any difference is an exchange rate gain or loss." },
    { q: "Can I record a cheque before it clears?", a: "Record it when you receive it with its number and bank, or wait until it clears. Either way the invoice shows what’s been paid and what’s left." },
  ],
};

export const CI_CTA = {
  kicker: "Coming in",
  title: { uk: "Send your first invoice tonight.", lk: "Send your first Tax Invoice tonight." } satisfies Copy,
  text: "Add your first customer, type one sentence, and watch Coming in fill up as they pay.",
};
