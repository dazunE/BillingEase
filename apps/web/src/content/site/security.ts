/**
 * Copy for /security (prototype SiteSecurity). Only what is true today;
 * anything not built yet is labelled "Planned" or "To be confirmed".
 * No certifications, uptime figures or customer counts.
 */
import type { ByCountry, Copy } from "./country";

export const SECURITY_META = {
  title: "Security",
  description: "How BillingEase keeps your books safe today: a double-entry, append-only ledger, filed periods locked, each business kept apart, hashed session tokens and rate-limited sign-in. What’s planned is marked as planned.",
};

export const SEC_HERO = {
  kicker: "Security",
  title: "Your books, locked up properly.",
  lead: {
    uk: "Your invoices, your costs and your payroll records are the most private things your business has. Here’s exactly how BillingEase keeps them safe today, in plain words, and what isn’t built yet.",
    lk: "Your invoices, your costs and your payroll are the most private things your business has. Here’s exactly how BillingEase keeps them safe today, in plain words, and what isn’t built yet.",
  } satisfies Copy,
  chips: ["Append-only ledger", "Filed periods locked", "Sign-in rate-limited"],
};

const I = {
  ledger: "M4 4h16v16H4zM4 9h16M4 14h16M10 4v16",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
  apart: "M3 7h7v13H3zM14 4h7v16h-7M6 11h1M17 8h1M17 12h1",
  key: "M15 7a4 4 0 1 1-3.4 6.1L4 20.7V17h3v-3h3l1.6-1.6A4 4 0 0 1 15 7zM16 9h.01",
  gauge: "M12 21a9 9 0 1 1 9-9M12 12l5-3M3 12h2M12 3v2",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3",
};

export const SEC_LOCKS = {
  title: "Six things we do today.",
  lead: "None of this needs setting up. It’s how BillingEase works for every business, on every plan.",
  items: [
    { icon: I.ledger, tint: "#EEE8FF", t: "A ledger that can’t be rewritten", d: "Every invoice, payment and expense posts balanced double-entry lines to an append-only ledger. Corrections post a reversal; nothing is edited or deleted in place.", tech: "Double-entry · append-only", status: "" },
    { icon: I.lock, tint: "#FDE6D6", t: { uk: "Filed quarters, locked", lk: "Filed periods, locked" }, d: { uk: "Once your accountant files a quarter, it’s locked. Nothing dated inside it can be added, changed or voided by accident.", lk: "Once a VAT and SSCL period is filed, it’s locked. Nothing dated inside it can be added, changed or voided by accident." }, tech: "Locks checked whenever the ledger is written", status: "" },
    { icon: I.apart, tint: "#E2F6D5", t: "Each business kept apart", d: "Every record belongs to one business, and every read and write is checked against the business you’re signed in to. One business can never see another’s books.", tech: "Business-scoped queries", status: "" },
    { icon: I.key, tint: "#FFF0B8", t: "Sessions with hashed tokens", d: "We keep only a hash of your session token, never the token itself. Signing out ends the session, and resetting your password signs out every device.", tech: "Hashed tokens · passwords hashed with bcrypt", status: "" },
    { icon: I.gauge, tint: "#E1EEF8", t: "Rate-limited sign-in", d: "Sign-in, sign-up and password reset are limited to a handful of attempts a minute, so nobody can guess their way in.", tech: "Per-route rate limits", status: "" },
    { icon: I.globe, tint: "#EFEDF3", t: "Hosted in one region", d: { uk: "Your books will be hosted in a UK or EU region. We’ll name the region here before launch.", lk: "Your books will be hosted in one region, chosen under Sri Lanka’s Personal Data Protection Act. We’ll name it here before launch." }, tech: "Region", status: "To be confirmed" },
  ] satisfies { icon: string; tint: string; t: Copy; d: Copy; tech: string; status: string }[],
};

export const SEC_ROLES = {
  title: "Everyone sees only their part.",
  lead: { uk: "Your books belong to your business. You and the accountant you invite can see them; nobody else can.", lk: "Your books belong to your business. You and the practitioner you invite can see them; nobody else can." } satisfies Copy,
  roles: {
    uk: [
      { id: "you", name: "You", init: "EH", who: "Ellie Harper, owner", line: "Harper Studio (sample business)", tint: "#B9A3FF", items: [["Everything in your books", true], ["Decide who sees your books", true], ["Send invoices and reminders", true], ["Change a filed quarter", false]] },
      { id: "acct", name: "Your accountant", init: "PS", who: "Priya Shah, Dale & Shaw", line: "Invited by Ellie (sample)", tint: "#FFF0B8", items: [["Sees every quarter, report and entry", true], ["Sends requests to your Home", true], ["Locks a quarter once filed", true], ["Sees any other business’s books", false]] },
      { id: "other", name: "Anyone else", init: "?", who: "Not invited", line: "Another BillingEase user", tint: "#EFEDF3", items: [["Sees your books", false], ["Sees that your business exists", false], ["Signs in as you without your password", false], ["Changes anything", false]] },
    ],
    lk: [
      { id: "you", name: "You", init: "AF", who: "Ayesha Fernando, owner", line: "Serendib Design Studio (sample business)", tint: "#B9A3FF", items: [["Everything in your books, payroll included", true], ["Decide who sees your books", true], ["Send Tax Invoices and reminders", true], ["Change a filed period", false]] },
      { id: "acct", name: "Your practitioner", init: "RJ", who: "Ruwan Jayasinghe, Jayasinghe & Co", line: "Invited by Ayesha (sample)", tint: "#FFF0B8", items: [["Sees every period, report and entry", true], ["Sends requests to your Home", true], ["Locks a period once filed", true], ["Sees any other business’s books", false]] },
      { id: "other", name: "Anyone else", init: "?", who: "Not invited", line: "Another BillingEase user", tint: "#EFEDF3", items: [["Sees your books", false], ["Sees that your business exists", false], ["Signs in as you without your password", false], ["Changes anything", false]] },
    ],
  } satisfies ByCountry<{ id: string; name: string; init: string; who: string; line: string; tint: string; items: [string, boolean][] }[]>,
};

export const SEC_LEDGER = {
  title: "Mistakes can’t rewrite history.",
  lead: "Typed the wrong amount? Fix it, and BillingEase posts a reversal and a new entry, so the books show what happened and when. Try it.",
};

export const SEC_PRIVACY = {
  title: "Your books are yours.",
  lead: "We use your books to run BillingEase for you: to show your numbers, answer your questions and share what you choose with your accountant. The privacy notice says exactly what we keep and why.",
  items: {
    uk: [
      { t: "Only who you invite", d: "You and your accountant. No one else at another business can see your books." },
      { t: "UK GDPR", d: "BillingEase follows UK data protection law. Registration with the ICO is planned before launch." },
      { t: "Ask, clearly marked", d: "Ask is marked as AI, cites its sources and never files anything. When it needs judgement, it says check with your accountant." },
    ],
    lk: [
      { t: "Only who you invite", d: "You and your practitioner. No one else at another business can see your books." },
      { t: "Sri Lanka PDPA", d: "BillingEase is preparing for the Personal Data Protection Act, whose core duties start on 1 January 2027." },
      { t: "Ask, clearly marked", d: "Ask is marked as AI, cites its sources and never files anything. When it needs judgement, it says check with your practitioner." },
    ],
  } satisfies ByCountry<{ t: string; d: string }[]>,
};

export const SEC_PLANNED = {
  title: "Planned, and labelled as planned.",
  lead: "These aren’t built yet. We list them so you know what to expect, not so you assume they’re there.",
  items: {
    uk: [
      { l1: "2FA", l2: "PLANNED", tint: "#EEE8FF", t: "Two-step sign-in", d: "A code from an authenticator app as well as your password.", how: "Not available yet" },
      { l1: "CE", l2: "PLANNED", tint: "#E2F6D5", t: "Cyber Essentials", d: "The UK government-backed baseline certification, before the UK launch.", how: "Not certified yet" },
      { l1: "CSV", l2: "PLANNED", tint: "#FDE6D6", t: "Export all your books", d: "Your whole ledger and every record in one download. Today invoices and quotes download as PDF.", how: "Not available yet" },
    ],
    lk: [
      { l1: "2FA", l2: "PLANNED", tint: "#EEE8FF", t: "Two-step sign-in", d: "A code from an authenticator app as well as your password.", how: "Not available yet" },
      { l1: "PDPA", l2: "PLANNED", tint: "#E2F6D5", t: "Documented controls", d: "Our security controls written up for practitioners, alongside PDPA duties from 1 January 2027.", how: "In preparation" },
      { l1: "CSV", l2: "PLANNED", tint: "#FDE6D6", t: "Export all your books", d: "Your whole ledger and every record in one download. Today Tax Invoices, quotes and payslips download as PDF.", how: "Not available yet" },
    ],
  } satisfies ByCountry<{ l1: string; l2: string; tint: string; t: string; d: string; how: string }[]>,
};

export const SEC_DISCLOSURE = [
  { t: "Write to us", d: "Tell us what you found and how to see it. Screenshots help." },
  { t: "Give us time to fix it", d: "Please don’t share it publicly until we’ve fixed it and told you so." },
  { t: "Leave other people’s data alone", d: "Use your own test account. Don’t access, change or keep anyone else’s books." },
  { t: "Hear back from a person", d: "We read every report, tell you what we’re doing about it, and thank you properly." },
];

export const SEC_FAQ: ByCountry<{ q: string; a: string }[]> = {
  uk: [
    { q: "Do you have two-step sign-in?", a: "Not yet. It’s planned. Today your password is hashed, sign-in attempts are rate-limited, and resetting your password signs out every device." },
    { q: "Do you connect to my bank?", a: "No. BillingEase has no bank or card feeds, so we never hold bank log-ins or connections. You record payments and costs yourself." },
    { q: "Where is my data stored?", a: "In one hosting region, UK or EU, to be confirmed before launch. We’ll name it on this page." },
    { q: "What happens if I delete an invoice?", a: "Invoices aren’t deleted once sent; they’re voided. The ledger gets a reversal, so your accountant can see what happened and when." },
    { q: "Can my accountant change a filed quarter?", a: "No one can change entries dated in a locked quarter. If something really must be fixed, your accountant reopens the quarter or posts a correction at a later date." },
    { q: "Can I take my books with me?", a: "Invoices and quotes download as PDF today. A full export of your books is planned." },
  ],
  lk: [
    { q: "Do you have two-step sign-in?", a: "Not yet. It’s planned. Today your password is hashed, sign-in attempts are rate-limited, and resetting your password signs out every device." },
    { q: "Do you connect to my bank?", a: "No. Sri Lanka has no bank feeds, and BillingEase never holds bank log-ins. You record payments and costs yourself." },
    { q: "Where is my data stored?", a: "In one hosting region, chosen under the PDPA and confirmed before launch. We’ll name it on this page." },
    { q: "Who can see payroll?", a: "You and the practitioner you invite. No one at another business can see your employees, salaries or payslips." },
    { q: "Can my practitioner change a filed period?", a: "No one can change entries dated in a locked period. If something really must be fixed, your practitioner reopens the period or posts a correction at a later date." },
    { q: "Can I take my books with me?", a: "Tax Invoices, quotes and payslips download as PDF today. A full export of your books is planned." },
  ],
};

export const SEC_CTA = {
  kicker: "Every plan, Free included",
  title: "Safe books. Calm owner.",
};
