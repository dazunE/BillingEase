import { formatDate, rulesFor, type CountryCode } from "@billingease/core";
import type { Db } from "@billingease/db";
import type { BusinessRow } from "../lib/context";
import { LlmAgent, type BaseLlm } from "@google/adk";
import { JsonTool } from "../agents/platform/tools";
import { agentDef, registerAgent, type AgentDef } from "../agents/platform/registry";
import { runAgent } from "../agents/platform/runner";
import type { Config } from "../config";
import type { Services } from ".";
import { askTools, type Source } from "./ask-tools";

export const MAX_ROUNDS = 6;
export const refusalAnswer = (country: CountryCode) => `I can't help with that one. Ask your ${rulesFor(country).wording.practitionerNoun}, who can look at it with you.`;

const SHARED = `You answer questions from the owner of one small business in BillingEase, an app for bookkeeping and invoicing.

What you answer:
- Questions about this business's own books: invoices, money received, expenses, bills, the three numbers (Coming in − Going out = Yours to keep) and the tax estimate.
- Questions about COUNTRY_RULES for sole traders and landlords or sole proprietors.
Politely decline anything else in one sentence.

How you answer:
- Use the tools for every figure about this business. Never invent, guess or work out a number the tools didn't give you. If a tool has nothing, say so.
- Every tool result has a "source" number (official pages have one each). Cite the facts you use as [1], [2] with those numbers, right after the sentence they support. Only cite official pages returned by get_official_sources; never write a URL yourself.
- The country rules and tax estimate in BillingEase are marked not yet verified. Say an estimate is an estimate.
- When something depends on judgement, their full circumstances or a choice with tax consequences, say plainly that it needs their PRACTITIONER.
- Plain words first; put the official term in brackets after it when it helps. Short: two to four short paragraphs at most, no headings, no tables. Use the currency as the tools format it.
- You explain. You never file anything, change the books or promise an outcome.`;

const COUNTRY: Record<CountryCode, { rules: string; practitioner: string }> = {
  uk: {
    rules: "UK tax (HMRC and gov.uk guidance): Making Tax Digital for Income Tax, allowable expenses, VAT, property income, mileage, Self Assessment, Income Tax and National Insurance",
    practitioner: "accountant",
  },
  lk: {
    rules: "Sri Lanka tax (Inland Revenue Department guidance): VAT, the Social Security Contribution Levy (SSCL), personal income tax and instalments, APIT, and EPF and ETF contributions",
    practitioner: "tax practitioner",
  },
  us: {
    rules: "US tax (IRS and state guidance): how an LLC is taxed, Schedule C expenses, estimated tax, self-employment tax, EINs and record keeping",
    practitioner: "accountant",
  },
};

/** The system prompt: fixed per country (no dates or names), so it caches. */
export function systemPrompt(country: CountryCode): string {
  const c = COUNTRY[country];
  return SHARED.replace("COUNTRY_RULES", c.rules).replace("PRACTITIONER", c.practitioner) + `\n\nThe business is in ${rulesFor(country).name}.`;
}

/** Today's date and the business facts go in the first user message, not the system prompt. */
export function contextNote(b: BusinessRow, today: string): string {
  const rules = rulesFor(b.country);
  const year = rules.taxYearOf(today);
  const kind = { sole_trader: "sole trader", landlord: "landlord", both: "sole trader and landlord", sole_proprietor: b.country === "us" ? "single-member LLC" : "sole proprietor", partnership: b.country === "us" ? "multi-member LLC" : "partnership" }[b.kind];
  const facts = [
    `Today is ${formatDate(today, { year: true })} (${today}).`,
    `Business: ${b.name}, a ${kind} in ${rules.name}. Currency ${b.currency}.`,
    `${b.country === "lk" ? "Year of assessment" : "Tax year"} ${year.label}: ${year.from} to ${year.to}.`,
    b.country === "us"
      ? `No sales tax is charged on invoices. Basis: ${b.basis}.`
      : `VAT registered: ${b.vatRegistered ? "yes" : "no"}.${b.country === "lk" ? ` SSCL registered: ${b.ssclRegistered ? "yes" : "no"}.` : ` MTD quarters: ${b.quarterType}.`} Basis: ${b.basis}.`,
  ];
  return `<context>\n${facts.join("\n")}\n</context>`;
}

export type AskResult = { answer: string; sources: Source[]; model: string; refused: boolean };

/**
 * Renumbers the sources in the order the answer cites them, drops official pages it didn't
 * cite, and keeps the looks at the books it didn't cite at the end (they still shaped it).
 */
export function tidySources(text: string, sources: Source[]): { text: string; sources: Source[] } {
  const byN = new Map(sources.map((s) => [s.n, s]));
  const order: number[] = [];
  for (const m of text.matchAll(/\[(\d+)\]/g)) {
    const k = Number(m[1]);
    if (byN.has(k) && !order.includes(k)) order.push(k);
  }
  const map = new Map(order.map((k, i) => [k, i + 1]));
  const rest = sources.filter((s) => !map.has(s.n) && s.kind === "books");
  rest.forEach((s, i) => map.set(s.n, order.length + i + 1));
  const out = [...order.map((k) => byN.get(k)!), ...rest].map((s) => ({ ...s, n: map.get(s.n)! }));
  // Drop citations to numbers that don't exist rather than show a broken [n].
  const fixed = text.replace(/\[(\d+)\]/g, (all, k: string) => (map.has(Number(k)) && order.includes(Number(k)) ? `[${map.get(Number(k))}]` : ""));
  return { text: fixed.replace(/ +([.,;])/g, "$1").trim(), sources: out };
}

/** Ask, as an agent on the platform: Gemini (deep tier) with read-only tools on the books. */
export const ASK_AGENT: AgentDef = registerAgent({
  id: "ask",
  name: "Ask",
  description: "Answers questions about your books and tax, with sources.",
  version: "2",
  tier: "deep",
  countries: ["uk", "lk"],
  maxModelCalls: MAX_ROUNDS,
  proposes: [],
  build: () => {
    throw new Error("Ask is built per question by runAsk");
  },
});

function askAgent(b: BusinessRow, db: Db, today: string, cite: (s: Omit<Source, "n">) => number): AgentDef {
  return {
    ...agentDef("ask")!,
    build: (_ctx, model: BaseLlm) => new LlmAgent({
      name: "ask",
      description: ASK_AGENT.description,
      model,
      // A function, so ADK doesn't treat braces in the text as state placeholders.
      instruction: () => systemPrompt(b.country),
      tools: askTools(b.country).map((t) => new JsonTool({ name: t.name, description: t.description, input: t.input, schema: t.schema, run: (input) => t.run(input as never, { db, business: b, today, cite }) })),
      disallowTransferToParent: true,
      disallowTransferToPeers: true,
    }),
  };
}

export async function runAsk(opts: {
  db: Db;
  config: Config;
  services: Services;
  business: BusinessRow;
  user: { id: string; name: string };
  today: string;
  threadId: string;
  /** Earlier turns, when the thread started before Ask kept its own sessions. */
  history: { role: "user" | "assistant"; content: string }[];
  question: string;
}): Promise<AskResult & { runId: string }> {
  const b = opts.business;
  const sources: Source[] = [];
  const cite = (s: Omit<Source, "n">) => {
    const same = sources.find((x) => x.title === s.title && x.url === s.url);
    if (same) return same.n;
    const n = sources.length + 1;
    sources.push({ ...s, n });
    return n;
  };
  const def = askAgent(b, opts.db, opts.today, cite);
  const earlier = opts.history.length
    ? `Earlier in this conversation:\n${opts.history.map((t) => `${t.role === "user" ? "Owner" : "You"}: ${t.content}`).join("\n")}\n\n`
    : "";
  const first = `${contextNote(b, opts.today)}\n\n${earlier}${opts.question}`;
  const r = await runAgent({
    db: opts.db, config: opts.config, services: opts.services, def, business: b, user: opts.user, trigger: "user",
    input: { question: opts.question.slice(0, 500) }, sessionId: opts.threadId,
    // A new thread gets the business facts; a follow-up only today's date.
    message: (fresh) => (fresh ? first : `<context>\nToday is ${formatDate(opts.today, { year: true })} (${opts.today}).\n</context>\n\n${opts.question}`),
  });
  const model = r.model ?? def.id;
  if (r.blocked) return { answer: refusalAnswer(b.country), sources: [], model, refused: true, runId: r.runId };
  if (!r.text) {
    const tidy = tidySources(`That needed more looking up than I can do in one go. Try a narrower question, or ask your ${rulesFor(b.country).wording.practitionerNoun}.`, sources);
    return { answer: tidy.text, sources: tidy.sources, model, refused: false, runId: r.runId };
  }
  const tidy = tidySources(r.text, sources);
  return { answer: tidy.text, sources: tidy.sources, model, refused: false, runId: r.runId };
}
