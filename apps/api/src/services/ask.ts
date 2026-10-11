import type { BetaContentBlockParam, BetaMessageParam, BetaTool, BetaToolResultBlockParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { formatDate, rulesFor, type CountryCode } from "@billingease/core";
import type { Exec } from "@billingease/db";
import type { BusinessRow } from "../lib/context";
import type { AskClient, AskResponse } from "./ask-client";
import { askTools, findTool, type Source } from "./ask-tools";

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
  const kind = { sole_trader: "sole trader", landlord: "landlord", both: "sole trader and landlord", sole_proprietor: "sole proprietor", partnership: "partnership" }[b.kind];
  const facts = [
    `Today is ${formatDate(today, { year: true })} (${today}).`,
    `Business: ${b.name}, a ${kind} in ${rules.name}. Currency ${b.currency}.`,
    `${b.country === "uk" ? "Tax year" : "Year of assessment"} ${year.label}: ${year.from} to ${year.to}.`,
    `VAT registered: ${b.vatRegistered ? "yes" : "no"}.${b.country === "lk" ? ` SSCL registered: ${b.ssclRegistered ? "yes" : "no"}.` : ` MTD quarters: ${b.quarterType}.`} Basis: ${b.basis}.`,
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

function textOf(r: AskResponse): string {
  return r.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n\n").trim();
}

export async function runAsk(opts: {
  client: AskClient;
  db: Exec;
  business: BusinessRow;
  today: string;
  history: { role: "user" | "assistant"; content: string }[];
  question: string;
}): Promise<AskResult> {
  const { client, business: b } = opts;
  const tools = askTools(b.country);
  const sources: Source[] = [];
  const cite = (s: Omit<Source, "n">) => {
    const same = sources.find((x) => x.title === s.title && x.url === s.url);
    if (same) return same.n;
    const n = sources.length + 1;
    sources.push({ ...s, n });
    return n;
  };
  const toolCtx = { db: opts.db, business: b, today: opts.today, cite };

  const turns = [...opts.history, { role: "user" as const, content: opts.question }];
  const messages: BetaMessageParam[] = turns.map((t, i) => ({ role: t.role, content: i === 0 ? `${contextNote(b, opts.today)}\n\n${t.content}` : t.content }));
  const toolParams: BetaTool[] = tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.schema as BetaTool["input_schema"] }));

  let model = client.model;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const res = await client.create({
      model: client.model,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [{ type: "text", text: systemPrompt(b.country), cache_control: { type: "ephemeral" } }],
      tools: toolParams,
      messages,
    });
    model = res.model || model;
    if (res.stop_reason === "refusal") return { answer: refusalAnswer(b.country), sources: [], model, refused: true };
    if (res.stop_reason !== "tool_use") {
      const tidy = tidySources(textOf(res) || "I couldn't put an answer together. Try asking another way.", sources);
      return { answer: tidy.text, sources: tidy.sources, model, refused: false };
    }
    messages.push({ role: "assistant", content: res.content as BetaContentBlockParam[] });
    const results: BetaToolResultBlockParam[] = [];
    for (const block of res.content) {
      if (block.type !== "tool_use") continue;
      const def = findTool(tools, block.name);
      if (!def) {
        results.push({ type: "tool_result", tool_use_id: block.id, is_error: true, content: `There is no tool called ${block.name}.` });
        continue;
      }
      const parsed = def.input.safeParse(block.input ?? {});
      if (!parsed.success) {
        results.push({ type: "tool_result", tool_use_id: block.id, is_error: true, content: `Invalid input: ${parsed.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ")}` });
        continue;
      }
      try {
        const out = await def.run(parsed.data as never, toolCtx);
        results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(out) });
      } catch (err) {
        results.push({ type: "tool_result", tool_use_id: block.id, is_error: true, content: `The tool failed: ${(err as Error).message}` });
      }
    }
    messages.push({ role: "user", content: results });
  }
  const tidy = tidySources(`That needed more looking up than I can do in one go. Try a narrower question, or ask your ${rulesFor(b.country).wording.practitionerNoun}.`, sources);
  return { answer: tidy.text, sources: tidy.sources, model, refused: false };
}
