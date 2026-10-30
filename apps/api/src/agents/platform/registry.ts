import type { BaseAgent, BaseLlm } from "@google/adk";
import type { CountryCode } from "@billingease/core";
import type { Exec } from "@billingease/db";
import type { ModelTier } from "../../config";
import type { BusinessRow } from "../../lib/context";
import type { Services } from "../../services";

/** What an agent's tools can reach during one run: one business, nothing else. */
export type AgentCtx = {
  db: Exec;
  business: BusinessRow;
  user: { id: string; name: string } | null;
  runId: string;
  today: string;
  services: Services;
};

/**
 * One agent. The ADK agent tree is built per run, so its tools close over that run's
 * business. `proposes` lists the proposal kinds it may make; it can do nothing else.
 */
export type AgentDef = {
  id: string;
  name: string;
  description: string;
  version: string;
  tier: ModelTier;
  countries: CountryCode[];
  /** A cap on model calls in one run. */
  maxModelCalls: number;
  proposes: string[];
  build(ctx: AgentCtx, model: BaseLlm): BaseAgent;
};

const AGENTS = new Map<string, AgentDef>();

export function registerAgent(def: AgentDef) {
  AGENTS.set(def.id, def);
  return def;
}

export function agentDef(id: string): AgentDef | undefined {
  return AGENTS.get(id);
}

export function allAgents(): AgentDef[] {
  return [...AGENTS.values()];
}

export function agentName(id: string): string {
  return AGENTS.get(id)?.name ?? id;
}
