/**
 * Press (/press): the press kit. Logo, colours, a boilerplate paragraph and
 * plain facts. No coverage, quotes, funding, headcount or customer numbers
 * are listed because there are none to state yet.
 */
export const PRESS = {
  kicker: "Press",
  title: "Facts and the brand kit.",
  lead: "Writing about BillingEase? The logo, colours and a paragraph about us are on this page, ready to copy. For anything else, write to us and a person replies by email.",
  news: {
    title: "News",
    body: "We haven’t made any announcements yet. When we do, they’ll be listed here. Product changes are on What’s new as they happen.",
  },
  kit: {
    title: "Press kit",
    lead: "Copy what you need. Please don’t redraw or recolour the logo.",
    logoNote: "Leave clear space around the logo at least as wide as the mark’s top bar. On photos, use the mark on its own. Minimum size: 24 pixels tall. The wordmark is set in Sora Bold.",
  },
  colours: [
    { name: "Violet", use: "Logo top bar, buttons", hex: "#B9A3FF" },
    { name: "Deep violet", use: "Coming in", hex: "#7A5AF8" },
    { name: "Orange", use: "Going out, logo middle bar", hex: "#E0752D" },
    { name: "Ink", use: "Logo tile, text, dark panels", hex: "#18161F" },
    { name: "Lavender", use: "Soft backgrounds", hex: "#EEE8FF" },
    { name: "Ground", use: "Page background", hex: "#F7F6F9" },
  ],
  boilerplate:
    "BillingEase is bookkeeping, invoicing and payroll that small businesses enter by hand, for two countries. In the United Kingdom it serves sole traders and landlords getting ready for Making Tax Digital for Income Tax, working alongside their accountants; in Sri Lanka, small businesses and sole proprietors, with Tax Invoices showing VAT and SSCL, and payroll with EPF, ETF and APIT. It shows a business as three numbers (Coming in − Going out = Yours to keep) and gives the accountant the same books.",
  facts: [
    { k: "What it is", v: "Bookkeeping, invoicing and payroll you enter by hand" },
    { k: "Countries", v: "United Kingdom and Sri Lanka, chosen at sign-up" },
    { k: "In the UK", v: "Sole traders and landlords, mainly through accountants" },
    { k: "In Sri Lanka", v: "Small businesses, through tax practitioners and direct" },
    { k: "What it doesn’t do", v: "Bank feeds, online card payments, or filing to HMRC or the IRD" },
    { k: "Pricing", v: "A free plan; paid prices are still being set" },
  ],
};

/** The mark as standalone SVG, for "Copy SVG". */
export const MARK_SVG = (tile = "#18161F") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" rx="13" fill="${tile}"/><rect x="9" y="11" width="30" height="7" rx="3.5" fill="#B9A3FF"/><rect x="22" y="20.5" width="17" height="7" rx="3.5" fill="#E0752D"/><rect x="9" y="30" width="13" height="7" rx="3.5" fill="#FFFFFF"/></svg>`;
