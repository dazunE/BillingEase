/**
 * Legal documents (/legal/[doc]): terms, privacy, cookies and data processing,
 * written for a service used in the United Kingdom (UK GDPR, Data Protection
 * Act 2018) and Sri Lanka (Personal Data Protection Act, No. 9 of 2022).
 *
 * DRAFT: every document is marked as a draft to be reviewed by a lawyer before
 * launch. Gaps that only a decision can fill (legal entity, address, hosting
 * region, retention periods, governing law) are stated as open, not invented.
 */
import { COMPANY } from "./company";
import { ROUTES, type LegalDoc } from "./routes";

export type LegalBlock =
  | { p: string }
  | { list: { b?: string; t: string }[] }
  | { contacts: true }
  | { cookieTable: true }
  | { settings: true }
  | { link: { label: string; href: string } };

export type LegalSection = { id: string; h: string; blocks: LegalBlock[] };

export type LegalDocument = {
  key: LegalDoc;
  tab: string;
  title: string;
  /** Short description for metadata. */
  description: string;
  intro: string;
  short: string[];
  sections: LegalSection[];
};

export const LEGAL_UPDATED = "2026-10-14";
export const LEGAL_DRAFT = "Draft, to be reviewed by a lawyer. This document isn’t in force yet and will change before BillingEase launches.";

const p = (x: string): LegalBlock => ({ p: x });
const list = (...items: ([string, string] | string)[]): LegalBlock => ({ list: items.map((i) => (typeof i === "string" ? { t: i } : { b: i[0], t: i[1] })) });

export const COOKIE_ROWS = [
  { name: "be_session", what: "Keeps you signed in to the app. Set when you sign in, removed when you sign out.", kind: "Necessary", keep: "Up to 30 days" },
  { name: "be_business", what: "Remembers which business you’re working in.", kind: "Necessary", keep: "Until you close the browser" },
  { name: "be_site_country", what: "Remembers whether you chose the UK or Sri Lanka site.", kind: "Necessary", keep: "1 year" },
  { name: "be_cookies", what: "Remembers your cookie choice, so we don’t ask again.", kind: "Necessary", keep: "1 year" },
];

export const LEGAL: Record<LegalDoc, LegalDocument> = {
  terms: {
    key: "terms",
    tab: "Terms",
    title: "Terms of service",
    description: "Draft terms of service for BillingEase in the UK and Sri Lanka: what we do, what you do, and what we don’t do (we don’t file your returns or give tax advice).",
    intro: "These terms are the agreement between you and BillingEase when you use the BillingEase website and app. They’re written to be read, not skimmed past.",
    short: [
      "BillingEase keeps your books. It doesn’t file returns to HMRC or the IRD, and it isn’t tax advice.",
      "Tax figures, including Yours to keep and Ask’s answers, are estimates. Check them with your accountant or tax practitioner.",
      "Your books are yours. You’re responsible for what you enter; we’re responsible for keeping it safe.",
      "The free plan stays free. Paid plans can be cancelled at any time.",
    ],
    sections: [
      {
        id: "who",
        h: "Who we are and who these terms are for",
        blocks: [
          p("BillingEase (“we”, “us”) provides bookkeeping, invoicing and payroll software for businesses in the United Kingdom and Sri Lanka. The name of the legal entity, its registered address and its company number will be added here before launch."),
          p("You can use BillingEase if you’re 18 or over and use it for a business: as a sole trader, landlord, partnership, company or similar, in the UK or Sri Lanka. If you sign up on behalf of a business, you confirm you’re allowed to."),
        ],
      },
      {
        id: "account",
        h: "Your account",
        blocks: [
          list(
            ["One business per account.", "You choose its country (the United Kingdom or Sri Lanka) when you sign up, and it stays fixed."],
            ["Keep your password safe.", "You’re responsible for what happens under your account, and should tell us straight away if you think someone else has used it."],
            ["Tell us the truth.", "Your details and your business’s details must be accurate and kept up to date."],
          ),
        ],
      },
      {
        id: "service",
        h: "What BillingEase does, and doesn’t",
        blocks: [
          p("BillingEase records the sales, costs, payments and payroll you enter, works out totals and estimates, and produces invoices, quotes, payslips and summaries. It reads receipts and bills only when you send them to be read, and adds nothing to your books until you approve it. It doesn’t connect to your bank, take card payments, or file anything with HMRC, the Inland Revenue Department, the EPF or the ETF."),
          list(
            ["Not tax or legal advice.", "Guides, estimates and Ask’s answers are general information. Yours to keep is an estimate. Rates are kept up to date as best we can, but you or your accountant must check figures before relying on them."],
            ["Ask and Capture use AI.", "Ask’s answers can be wrong; it lists its sources so you can check them. What Capture reads from a receipt or bill is a draft for you to check. Neither files or sends anything, and nothing goes into your books until you approve it."],
            ["Payroll.", "In the UK, BillingEase keeps payroll records you enter from your payroll software; it doesn’t run payroll or report to HMRC. In Sri Lanka it calculates pay, EPF, ETF and APIT; you pay and file them yourself."],
          ),
        ],
      },
      {
        id: "your-data",
        h: "Your books and your responsibilities",
        blocks: [
          p("What you put into BillingEase belongs to you (or your business). You give us permission to store and process it only to provide the service to you, as described in the privacy policy and the data processing terms."),
          p("You’re responsible for the accuracy of what you enter, for keeping the records the law requires you to keep, and for the invoices and other documents you send from BillingEase. Entries are never silently changed: corrections are recorded as new entries that reverse earlier ones, and periods your accountant has filed are locked."),
        ],
      },
      {
        id: "accountant",
        h: "Your accountant or tax practitioner",
        blocks: [
          p("If you give an accountant, practice or tax practitioner access to your books, they see the same books you do and may make the changes you allow. They work for you, not for us, and their own terms apply to the service they give you."),
        ],
      },
      {
        id: "plans",
        h: "Plans and payment",
        blocks: [
          p("There is a free plan, and it stays free. Prices for paid plans are still being set; when they are, they will be shown on the pricing page before you choose one, with any tax that applies. Paid plans renew until you cancel, and you can cancel at any time; the plan then runs to the end of the period you’ve paid for."),
          { link: { label: "See pricing", href: ROUTES.pricing.href } },
        ],
      },
      {
        id: "use",
        h: "Fair use",
        blocks: [
          list(
            "Don’t use BillingEase for anything unlawful, including issuing false invoices or hiding income.",
            "Don’t try to get into other people’s accounts or data, or to break or overload the service.",
            "Don’t copy or resell the app, or use it to build a competing product.",
          ),
          p("We may suspend an account that breaks these rules, telling you why unless the law stops us."),
        ],
      },
      {
        id: "availability",
        h: "Availability and changes",
        blocks: [
          p("We work to keep BillingEase available and your data safe, but we can’t promise it will never be interrupted. We may improve or change the service; if a change takes away something important you rely on, we’ll tell you in advance."),
        ],
      },
      {
        id: "liability",
        h: "Our responsibility to you",
        blocks: [
          p("Nothing in these terms limits liability that can’t be limited by law. Beyond that, the extent of our liability (for example for lost profits, or for penalties caused by figures nobody checked) is to be settled with our lawyers and will be set out here before launch."),
        ],
      },
      {
        id: "ending",
        h: "Ending",
        blocks: [
          p("You can stop using BillingEase and ask us to close your account at any time. Before you do, download the invoices and quotes you need. What we keep afterwards, and for how long, is in the privacy policy."),
        ],
      },
      {
        id: "law",
        h: "The law that applies",
        blocks: [
          p("Draft position, to be confirmed by a lawyer: for businesses in the United Kingdom, the laws of England and Wales; for businesses in Sri Lanka, the laws of Sri Lanka. Nothing in these terms takes away rights you have under the law where you live."),
        ],
      },
      {
        id: "contact",
        h: "Contact",
        blocks: [{ contacts: true }],
      },
    ],
  },

  privacy: {
    key: "privacy",
    tab: "Privacy",
    title: "Privacy policy",
    description: "Draft privacy policy for BillingEase under UK GDPR and Sri Lanka’s Personal Data Protection Act: what we collect, why, who sees it, how long we keep it and your rights.",
    intro: "This policy explains what BillingEase collects when you use the website and the app, why, who else sees it, how long it’s kept, and what you can ask us to do with it. It’s written for the UK GDPR and the Data Protection Act 2018, and for Sri Lanka’s Personal Data Protection Act, No. 9 of 2022.",
    short: [
      "We use your information to run your books and your account, and nothing else. We never sell it and don’t show ads.",
      "We don’t connect to your bank and never see your bank login.",
      "Each business’s data is kept apart from every other business’s.",
      `Questions and requests go to ${COMPANY.email.privacy}. They’re free, and a person answers.`,
    ],
    sections: [
      {
        id: "who-we-are",
        h: "Who we are",
        blocks: [
          p("BillingEase (“we”) makes the BillingEase website and app. The name of the legal entity, its registered address and, in the UK, its registration number with the Information Commissioner’s Office will be added here before launch."),
          p("For your account and our website, we decide how your information is used: we’re the controller. For the books you keep in BillingEase, which may include your customers’, suppliers’ and employees’ details, your business decides what goes in and we process it for you: we’re the processor, under the data processing terms."),
          { link: { label: "Read the data processing terms", href: "/legal/data-processing" } },
        ],
      },
      {
        id: "collect",
        h: "What we collect",
        blocks: [
          list(
            ["Your account.", "Your name, email address, password (stored scrambled, never readable) and your country."],
            ["Your business.", "Its name, address, type, tax references (UTR, VAT number, TIN), invoice settings and logo."],
            ["Your books.", "Invoices, quotes, customers, suppliers, expenses, bills, payments, payroll entries, and photos or PDFs you attach."],
            ["Questions to Ask.", "What you ask, and the answers, so you can see them again."],
            ["Messages.", "Anything you write to us."],
            ["Technical information.", "Basic logs (time, page, browser, IP address) kept to run the service securely and fix errors."],
          ),
          p("We don’t receive bank or card data: BillingEase has no bank feeds and takes no card payments."),
        ],
      },
      {
        id: "why",
        h: "Why we use it, and our lawful basis",
        blocks: [
          list(
            ["To provide BillingEase to you", "(our contract with you): keeping your books, sending the invoices and reminders you ask us to, producing summaries and estimates."],
            ["To keep it secure and working", "(our legitimate interests): preventing misuse, fixing problems, keeping logs."],
            ["To answer you", "(our contract with you, or legitimate interests): replying to messages."],
            ["To meet legal duties", "(legal obligation): for example keeping records a regulator requires."],
            ["With your consent", "only for optional cookies (see the cookie policy). You can withdraw consent at any time."],
          ),
          p("Under Sri Lanka’s PDPA, we rely on the matching grounds: performance of a contract, legal obligations, legitimate interests and, where needed, consent."),
        ],
      },
      {
        id: "who-sees",
        h: "Who sees it",
        blocks: [
          list(
            ["You,", "and anyone you give access to, such as your accountant or tax practitioner."],
            ["Your customers,", "who see the invoices, quotes and reminders you send them."],
            ["Our service providers,", "who host the service, deliver email and, when you use Ask or send a receipt or bill to be read, run the AI model (Google’s Gemini, on Vertex AI). They act on our instructions under written contracts. The current list is in the data processing terms."],
            ["Apps you connect,", "such as an AI assistant or your own software, see what you allowed when you connected them (reading your books, suggesting changes). They are yours to choose, not our providers: their own terms apply to what they do with it. You can disconnect any of them in Settings → Apps and API."],
            ["Authorities,", "only when the law requires it."],
          ),
          p("Nobody at BillingEase looks at your books unless you ask us to help with something specific, or the law requires it."),
        ],
      },
      {
        id: "keep",
        h: "How long we keep it",
        blocks: [
          p("We keep your books while your account is open. Tax law asks businesses to keep records for years: in the UK, at least five years after the 31 January deadline for the tax year; in Sri Lanka, the period the Inland Revenue Act sets. When you close your account, we’ll tell you how to take what you need first. The exact periods we keep closed accounts’ data for are still to be set and will be stated here before launch."),
        ],
      },
      {
        id: "rights",
        h: "Your rights",
        blocks: [
          p("Under the UK GDPR you can ask us to: give you a copy of your personal data; correct it; delete it; restrict or object to how we use it; and give it to you in a format another service can use. Under Sri Lanka’s PDPA you can ask for access, correction, completion or erasure, withdraw consent, object to processing, and ask for a review of a decision made only by automated means."),
          p(`Write to ${COMPANY.email.privacy}. It’s free, and we answer within the time the law sets (one month in the UK). If you’re unhappy with our answer, you can complain to the Information Commissioner’s Office in the UK, or to the Data Protection Authority of Sri Lanka.`),
        ],
      },
      {
        id: "protect",
        h: "How we protect it",
        blocks: [
          p("Passwords are stored scrambled. Each business’s data is kept apart from every other business’s. The books are an append-only ledger: entries are never silently changed or deleted, so changes can be traced. Connections to BillingEase are encrypted."),
          { link: { label: "How we keep your books safe", href: ROUTES.security.href } },
        ],
      },
      {
        id: "where",
        h: "Where your data lives",
        blocks: [
          p("Hosting is being decided before launch: a UK or EU region for UK businesses, and a region chosen under the PDPA’s cross-border rules for Sri Lankan businesses. Where data is transferred out of the UK, we’ll use the safeguards UK law requires (such as the UK International Data Transfer Agreement). This section will name the regions once they’re fixed."),
        ],
      },
      {
        id: "changes",
        h: "Changes to this policy",
        blocks: [p("If we change this policy in a way that matters, we’ll tell you by email or in the app before the change takes effect.")],
      },
      { id: "contact", h: "Contact", blocks: [{ contacts: true }] },
    ],
  },

  cookies: {
    key: "cookies",
    tab: "Cookies",
    title: "Cookie policy",
    description: "Draft cookie policy for BillingEase: the few cookies we use, why, how long they last, and your cookie settings.",
    intro: "Cookies are small files a website keeps in your browser. BillingEase uses only a few, and only the ones it needs to work, unless you say yes to more.",
    short: [
      "Necessary cookies keep you signed in and remember your country and your cookie choice.",
      "No advertising cookies, ever.",
      "You can change your choice below at any time.",
    ],
    sections: [
      {
        id: "list",
        h: "The cookies we use",
        blocks: [{ cookieTable: true }],
      },
      {
        id: "measurement",
        h: "Measurement",
        blocks: [
          p("With your OK, we may count visits and see which pages help, without names or email addresses. No measurement tool is running yet. Before we add one, it will be named in the table above, and it will stay off unless you turn it on."),
        ],
      },
      {
        id: "settings",
        h: "Your cookie settings",
        blocks: [p("Your choice is saved in this browser only. If you use another browser or device, you’ll be asked there too."), { settings: true }],
      },
      {
        id: "control",
        h: "Other ways to control cookies",
        blocks: [p("Every browser lets you see and delete cookies in its settings. If you block necessary cookies, you won’t be able to sign in to BillingEase.")],
      },
      { id: "contact", h: "Contact", blocks: [{ contacts: true }] },
    ],
  },

  "data-processing": {
    key: "data-processing",
    tab: "Data processing",
    title: "Data processing terms",
    description: "Draft data processing terms for businesses, accountants and tax practitioners using BillingEase, under UK GDPR Article 28 and Sri Lanka’s PDPA.",
    intro: "When your business, practice or clients keep books in BillingEase, those books contain personal data about other people: customers, suppliers and employees. These terms set out how we process that data on your behalf, as UK GDPR Article 28 and Sri Lanka’s PDPA require.",
    short: [
      "You (the business, or the practice for its clients) decide what personal data goes in; we process it only on your instructions.",
      "Everyone at BillingEase who can reach it is bound to confidentiality.",
      "We tell you without undue delay if a breach affects your data.",
      "At the end, the data is returned or deleted, apart from what the law makes us keep.",
    ],
    sections: [
      {
        id: "roles",
        h: "Roles",
        blocks: [
          p("The business using BillingEase is the controller of the personal data in its books. BillingEase is the processor. When an accountant, practice or tax practitioner works in a client’s books, they act for that client, under their own engagement with the client."),
        ],
      },
      {
        id: "scope",
        h: "What we process",
        blocks: [
          list(
            ["People:", "your customers, suppliers, employees and contacts, and your own staff who use BillingEase."],
            ["Data:", "names, contact details, addresses, tax references, amounts owed and paid, bank details printed on invoices, and, for payroll, salary, NIC or National Insurance number, EPF numbers and deductions."],
            ["Purpose:", "keeping the books, issuing documents, calculating payroll and producing summaries, for as long as the account is open."],
          ),
        ],
      },
      {
        id: "our-duties",
        h: "What we commit to",
        blocks: [
          list(
            "Process personal data only on your documented instructions, which are these terms and the way you use the app.",
            "Make sure everyone with access is bound to confidentiality.",
            "Keep appropriate security measures in place, including separating each business’s data and an append-only ledger.",
            "Help you answer requests from people exercising their rights, and with security, breach notifications and impact assessments.",
            "Tell you without undue delay after becoming aware of a personal data breach affecting your data.",
            "Return or delete your data when the service ends, unless the law requires us to keep it.",
            "Make available the information you need to show compliance, and allow reasonable audits.",
          ),
        ],
      },
      {
        id: "subprocessors",
        h: "Sub-processors",
        blocks: [
          p("We use other providers for parts of the service, under written contracts with the same protections. The list is still being finalised before launch; currently it covers:"),
          list(
            ["Hosting and storage:", "to be decided (a UK or EU region for UK businesses; a PDPA-compliant choice for Sri Lankan businesses)."],
            ["Email delivery:", "a transactional email provider that sends the invoices and reminders you ask us to send."],
            ["AI (Ask and Capture):", "Google Cloud (Gemini on Vertex AI), which receives the question and the relevant parts of your books when you use Ask, and the photo or PDF when you send a receipt or bill to be read. It doesn’t use them to train its models."],
          ),
          p("We’ll give notice before adding or replacing a sub-processor, so you can object."),
        ],
      },
      {
        id: "transfers",
        h: "International transfers",
        blocks: [
          p("Where personal data leaves the UK, we’ll use a safeguard UK law recognises, such as the International Data Transfer Agreement or the UK Addendum, with a transfer risk assessment. Transfers from Sri Lanka will follow the PDPA’s cross-border rules. The hosting decision will be reflected here."),
        ],
      },
      { id: "contact", h: "Contact", blocks: [{ contacts: true }] },
    ],
  },
};

export const LEGAL_PAGE = {
  kicker: "Privacy, terms and cookies",
  title: "The fine print, in plain words.",
  lead: "You trust us with your books. Here is exactly what we keep, why, who can see it, and what you can ask us to do with it.",
  promises: [
    { t: "We never sell your data", d: "No ads, no data brokers. Each business’s data is kept apart.", icon: "M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6zM9 12l2 2 4-4", tint: "violet" as const },
    { t: "Corrections leave a trail", d: "Entries are never silently changed: a correction reverses the old entry, and filed periods lock.", icon: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5", tint: "orange" as const },
    { t: "No bank access at all", d: "There are no bank feeds, so we never see your bank login or move money.", icon: "M3 10 12 4l9 6M5 10v8M19 10v8M9.5 10v8M14.5 10v8M3 20h18", tint: "green" as const },
  ],
};
