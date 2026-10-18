import { BasePlugin, isLlmCallsLimitExceededError, Runner, type BaseTool, type Context, type Event, type LlmRequest, type LlmResponse } from "@google/adk";
import type { Content } from "@google/genai";
import { today as todayIso } from "@billingease/core";
import type { Db } from "@billingease/db";
import { agentRuns, agentSettings, agentSteps, usageMonthly, type AgentTrigger } from "@billingease/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { Config, ModelTier } from "../../config";
import type { BusinessRow } from "../../lib/context";
import { AppError } from "../../lib/errors";
import type { Services } from "../../services";
import type { Models } from "./models";
import type { AgentDef } from "./registry";
import { DbSessionService } from "./session-service";

export const APP_NAME = "billingease";

/** Stops a run when the business's monthly agent budget is used up. */
export class BudgetReachedError extends AppError {
  constructor() {
    super(429, "agent_budget_reached", "This month's AI budget for your business is used up. It resets on the 1st, or the owner can raise it in Settings.");
  }
}

export const monthOf = (iso: string) => `${iso.slice(0, 7)}-01`;

/** The cap for this business and agent: its own setting, else the default. */
export async function budgetFor(db: Db, config: Config, businessId: string, agent: string) {
  const [s] = await db.select().from(agentSettings).where(and(eq(agentSettings.businessId, businessId), eq(agentSettings.agent, agent)));
  return { enabled: s?.enabled ?? true, budgetMicros: s?.monthlyBudgetMicros ?? config.ai.monthlyBudgetMicros };
}

/** What the business has spent on all agents this month. */
export async function spentThisMonth(db: Db, businessId: string, month: string) {
  const [r] = await db.select({ cost: sql<string>`coalesce(sum(${usageMonthly.costMicros}), 0)` }).from(usageMonthly)
    .where(and(eq(usageMonthly.businessId, businessId), eq(usageMonthly.month, month)));
  return Number(r.cost);
}

const clip = (v: unknown, max = 4000): unknown => {
  const s = JSON.stringify(v ?? null);
  return s.length <= max ? JSON.parse(s) : { truncated: true, preview: s.slice(0, max) };
};

/**
 * Writes every model call and tool call of the run to agent_steps, keeps the run's token
 * and cost totals, and stops the run before a model call that the budget can't cover.
 */
class Meter extends BasePlugin {
  seq = 0;
  tokensIn = 0;
  tokensOut = 0;
  costMicros = 0;
  model: string | null = null;
  finishReason: string | null = null;
  budgetHit = false;
  private modelStart = 0;
  private toolStarts = new Map<string, number>();

  constructor(private o: { db: Db; models: Models; tier: ModelTier; runId: string; businessId: string; budgetLeft: number }) {
    super("billingease-meter");
  }

  private async step(row: Omit<typeof agentSteps.$inferInsert, "runId" | "businessId" | "seq">) {
    await this.o.db.insert(agentSteps).values({ ...row, runId: this.o.runId, businessId: this.o.businessId, seq: ++this.seq });
  }

  override async beforeModelCallback({ llmRequest }: { callbackContext: Context; llmRequest: LlmRequest }): Promise<LlmResponse | undefined> {
    if (this.costMicros >= this.o.budgetLeft) {
      this.budgetHit = true;
      throw new BudgetReachedError();
    }
    this.model = llmRequest.model ?? this.model;
    this.modelStart = Date.now();
    return undefined;
  }

  override async afterModelCallback({ llmResponse }: { callbackContext: Context; llmResponse: LlmResponse }): Promise<LlmResponse | undefined> {
    if (llmResponse.partial) return undefined;
    const u = llmResponse.usageMetadata;
    const tin = u?.promptTokenCount ?? 0;
    const tout = (u?.candidatesTokenCount ?? 0) + (u?.thoughtsTokenCount ?? 0);
    const cost = this.o.models.cost(this.o.tier, tin, tout);
    this.tokensIn += tin;
    this.tokensOut += tout;
    this.costMicros += cost;
    this.model = llmResponse.modelVersion ?? this.model;
    this.finishReason = llmResponse.finishReason ?? null;
    const parts = llmResponse.content?.parts ?? [];
    await this.step({
      kind: "model", name: this.model ?? "model", tokensIn: tin, tokensOut: tout, costMicros: cost, ms: Date.now() - this.modelStart,
      output: clip({ finishReason: llmResponse.finishReason, calls: parts.filter((p) => p.functionCall).map((p) => p.functionCall!.name), text: parts.some((p) => p.text) }),
      error: llmResponse.errorCode ? `${llmResponse.errorCode}: ${llmResponse.errorMessage ?? ""}` : null,
    });
    return undefined;
  }

  override async beforeToolCallback({ tool, toolContext }: { tool: BaseTool; toolArgs: Record<string, unknown>; toolContext: Context }): Promise<Record<string, unknown> | undefined> {
    this.toolStarts.set(toolContext.functionCallId ?? tool.name, Date.now());
    return undefined;
  }

  override async afterToolCallback({ tool, toolArgs, toolContext, result }: { tool: BaseTool; toolArgs: Record<string, unknown>; toolContext: Context; result: Record<string, unknown> }): Promise<Record<string, unknown> | undefined> {
    const started = this.toolStarts.get(toolContext.functionCallId ?? tool.name) ?? Date.now();
    const error = result && typeof result === "object" && "error" in result ? String(result.error) : null;
    await this.step({ kind: "tool", name: tool.name, input: clip(toolArgs), output: clip(result), ms: Date.now() - started, error });
    return undefined;
  }
}

export type RunResult = {
  runId: string;
  sessionId: string;
  /** The agent's last words, if any. */
  text: string;
  events: Event[];
  model: string | null;
  /** The model stopped for safety or policy reasons. */
  blocked: boolean;
};

const BLOCKED = new Set(["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII", "RECITATION", "IMAGE_SAFETY", "IMAGE_PROHIBITED_CONTENT"]);

/**
 * Runs one agent for one business: records the run, keeps its ADK session in our database,
 * meters it, and enforces the monthly budget. Agents can only read and propose; anything that
 * changes the books waits in proposals for a person.
 */
export async function runAgent(o: {
  db: Db;
  config: Config;
  services: Services;
  def: AgentDef;
  business: BusinessRow;
  user: { id: string; name: string } | null;
  trigger: AgentTrigger;
  input?: Record<string, unknown>;
  /** The user turn; a function gets whether the session is new. */
  message: string | Content | ((fresh: boolean) => string | Content);
  /** Continue an earlier session of this business and user (Ask's threads). */
  sessionId?: string;
  practiceId?: string | null;
  apiClientId?: string | null;
}): Promise<RunResult> {
  const models = o.services.models;
  if (!models) throw new AppError(503, "ai_not_set_up", "AI isn't set up on this BillingEase yet: it needs Vertex AI. Your books are fine.");
  if (!o.def.countries.includes(o.business.country)) throw new AppError(400, "agent_country", `${o.def.name} isn't available for this country yet.`);
  const today = todayIso();
  const month = monthOf(today);
  const { enabled, budgetMicros } = await budgetFor(o.db, o.config, o.business.id, o.def.id);
  if (!enabled) throw new AppError(409, "agent_off", `${o.def.name} is turned off for this business. The owner can turn it on in Settings.`);
  const spent = await spentThisMonth(o.db, o.business.id, month);
  if (spent >= budgetMicros) throw new BudgetReachedError();

  const llm = models.forTier(o.def.tier);
  const [run] = await o.db.insert(agentRuns).values({
    businessId: o.business.id, agent: o.def.id, version: o.def.version, trigger: o.trigger,
    startedByUserId: o.user?.id ?? null, practiceId: o.practiceId ?? null, apiClientId: o.apiClientId ?? null,
    status: "running", input: o.input ?? {}, model: llm.model, startedAt: new Date(),
  }).returning();

  const meter = new Meter({ db: o.db, models, tier: o.def.tier, runId: run.id, businessId: o.business.id, budgetLeft: budgetMicros - spent });
  const sessions = new DbSessionService(o.db, { businessId: o.business.id, runId: run.id });
  const userId = o.user?.id ?? `system:${o.business.id}`;
  const agent = o.def.build({ db: o.db, business: o.business, user: o.user, runId: run.id, today, services: o.services }, llm);
  const runner = new Runner({ appName: APP_NAME, agent, sessionService: sessions, plugins: [meter] });

  let sessionId = o.sessionId;
  let fresh = false;
  if (!sessionId || !(await sessions.getSession({ appName: APP_NAME, userId, sessionId }))) {
    sessionId = (await sessions.createSession({ appName: APP_NAME, userId, sessionId, state: { business_id: o.business.id } })).id;
    fresh = true;
  }

  const events: Event[] = [];
  const msg = typeof o.message === "function" ? o.message(fresh) : o.message;
  const newMessage: Content = typeof msg === "string" ? { role: "user", parts: [{ text: msg }] } : msg;
  const finish = async (status: "done" | "failed" | "stopped", output: Record<string, unknown> | null, error: string | null) => {
    await o.db.update(agentRuns).set({ status, output, error, model: meter.model ?? llm.model, tokensIn: meter.tokensIn, tokensOut: meter.tokensOut, costMicros: meter.costMicros, finishedAt: new Date() }).where(eq(agentRuns.id, run.id));
    await o.db.insert(usageMonthly).values({ businessId: o.business.id, month, agent: o.def.id, runs: 1, tokensIn: meter.tokensIn, tokensOut: meter.tokensOut, costMicros: meter.costMicros })
      .onConflictDoUpdate({
        target: [usageMonthly.businessId, usageMonthly.month, usageMonthly.agent],
        set: {
          runs: sql`${usageMonthly.runs} + 1`,
          tokensIn: sql`${usageMonthly.tokensIn} + ${meter.tokensIn}`,
          tokensOut: sql`${usageMonthly.tokensOut} + ${meter.tokensOut}`,
          costMicros: sql`${usageMonthly.costMicros} + ${meter.costMicros}`,
        },
      });
  };

  // ADK reports its call limit and errors raised in callbacks as error events, not throws.
  let limitHit = false;
  try {
    for await (const ev of runner.runAsync({ userId, sessionId, newMessage, runConfig: { maxLlmCalls: o.def.maxModelCalls } })) {
      events.push(ev);
      if (meter.budgetHit) throw new BudgetReachedError();
      if (ev.errorCode && /max number of llm calls/i.test(ev.errorMessage ?? "")) {
        limitHit = true;
        break;
      }
      if (ev.errorCode && !BLOCKED.has(ev.errorCode)) throw new Error(`${ev.errorCode}: ${ev.errorMessage ?? "model error"}`);
    }
  } catch (err) {
    const stopped = err instanceof BudgetReachedError || meter.budgetHit || isLlmCallsLimitExceededError(err);
    await finish(stopped ? "stopped" : "failed", null, (err as Error).message);
    if (meter.budgetHit && !(err instanceof BudgetReachedError)) throw new BudgetReachedError();
    if (isLlmCallsLimitExceededError(err)) return { runId: run.id, sessionId, text: "", events, model: meter.model ?? llm.model, blocked: false };
    throw err;
  }
  if (limitHit) {
    await finish("stopped", null, `Stopped after ${o.def.maxModelCalls} model calls`);
    return { runId: run.id, sessionId, text: "", events, model: meter.model ?? llm.model, blocked: false };
  }

  const last = [...events].reverse().find((e) => e.content?.parts?.some((p) => p.text && !p.thought));
  const text = (last?.content?.parts ?? []).filter((p) => p.text && !p.thought).map((p) => p.text).join("\n\n").trim();
  const blocked = BLOCKED.has(meter.finishReason ?? "") || events.some((e) => e.errorCode && BLOCKED.has(e.errorCode));
  await finish("done", { text: text.slice(0, 4000), blocked }, null);
  return { runId: run.id, sessionId, text, events, model: meter.model ?? llm.model, blocked };
}
