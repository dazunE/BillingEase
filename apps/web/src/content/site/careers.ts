/**
 * Careers (/careers). No open roles are listed because none are open: the
 * page says how to get in touch instead. No benefits, salaries, headcount or
 * staff quotes until they're real.
 */
export const CAREERS = {
  kicker: "Careers at BillingEase",
  title: "Work on the calm side of money.",
  lead: "We’re building bookkeeping that small businesses in the UK and Sri Lanka can actually read. There are no open roles right now, but we’d still like to hear from you.",
  how: {
    title: "How we work",
    lead: "What working on BillingEase looks like, from what we’ve built so far.",
    items: [
      { title: "Design first", body: "Every screen starts as a clickable prototype that people can try before a line of the app is written.", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 16.5h7M16.5 13v7", tint: "violet" },
      { title: "Two countries, one app", body: "UK and Sri Lankan rules live in country packs with dated rates, so a Budget change is a data update, not a rewrite.", icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3", tint: "orange" },
      { title: "Careful with money", body: "A double-entry ledger that only ever adds entries, tested end to end in both countries.", icon: "M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6zM9 12l2 2 4-4", tint: "violet" },
      { title: "Plain words", body: "If a screen needs an accounting word, the word goes in small print under one you already use.", icon: "M4 6h16M4 12h10M4 18h7", tint: "orange" },
    ] as { title: string; body: string; icon: string; tint: "violet" | "orange" }[],
  },
  roles: {
    title: "Open roles",
    none: "No roles are open right now.",
    body: "When we open one, it will be listed on this page. Until then, if you’d like to work on BillingEase, write to us.",
  },
  steps: {
    title: "Getting in touch",
    lead: "No forms, no portal. An email to a person.",
    items: [
      { title: "Write to us", body: "Use the subject “Working at BillingEase”, and say where you’re based." },
      { title: "Tell us what you’d work on", body: "Engineering, design, support or accounting: what would you change about BillingEase first?" },
      { title: "Show us something", body: "A link to something you’ve made or written is worth more than a CV. Send both if you like." },
      { title: "We reply by email", body: "A person reads every note and writes back, even when there’s nothing open." },
    ],
  },
};
