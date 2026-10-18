/**
 * Contact (/contact). Every address comes from COMPANY (content/site/company.ts).
 * No office, phone number or reply-time promise until they're real: the form
 * writes an email in the visitor's own email app and says so.
 */
import { COMPANY } from "./company";
import type { Copy } from "./country";

export const CONTACT = {
  kicker: "Contact",
  title: "Write to a person, not a queue.",
  lead: {
    uk: "Thinking about BillingEase for your practice or your clients? Stuck on something? Writing a story? Pick the right address and a person reads it and replies by email.",
    lk: "Thinking about BillingEase for your clients as a tax practitioner? Stuck on something? Writing a story? Pick the right address and a person reads it and replies by email.",
  } as Copy,
  doors: [
    {
      key: "practices",
      title: { uk: "Accountants and practices", lk: "Tax practitioners" } as Copy,
      body: {
        uk: "For practices getting clients ready for Making Tax Digital, and anyone who wants a walkthrough before deciding.",
        lk: "For practitioners looking after clients’ books, VAT, SSCL and payroll, and the year-end hand-off to TaxWise.lk.",
      } as Copy,
      email: COMPANY.email.practices,
      icon: "M3 7h18v12H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18",
      tint: "violet" as const,
      cta: { label: "For accountants", route: "accountants" as const },
    },
    {
      key: "help",
      title: "Get help" as Copy,
      body: "Already using BillingEase? Most answers are in the help centre. If yours isn’t, a person picks up your question." as Copy,
      email: COMPANY.email.help,
      icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01",
      tint: "green" as const,
      cta: { label: "Visit the help centre", route: "help" as const },
    },
    {
      key: "press",
      title: "Press" as Copy,
      body: "Writing about small business money in the UK or Sri Lanka? The press kit has the logo, colours and facts." as Copy,
      email: COMPANY.email.press,
      icon: "M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5M8 16h3",
      tint: "orange" as const,
      cta: { label: "Open the press kit", route: "press" as const },
    },
  ],
  addresses: [
    { label: "Say hello", email: COMPANY.email.hello, use: "Anything else, including working with us" },
    { label: "Help", email: COMPANY.email.help, use: "Using BillingEase" },
    { label: "Practices", email: COMPANY.email.practices, use: "Accountants and tax practitioners" },
    { label: "Press", email: COMPANY.email.press, use: "Journalists and writers" },
    { label: "Privacy", email: COMPANY.email.privacy, use: "Your data and your rights" },
    { label: "Security", email: COMPANY.email.security, use: "Reporting a security problem" },
  ],
};
