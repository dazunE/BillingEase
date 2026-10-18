import { z } from "zod";
import { endpoint, IsoDate } from "./endpoint";

/**
 * Agents propose; people approve. A proposal is the body of an existing endpoint (its `kind`)
 * that an agent filled in. Approving it calls that endpoint as the person approving.
 */
export const ProposalKind = z.enum(["expense.create", "bill.create"]);
export type ProposalKind = z.infer<typeof ProposalKind>;

export const ProposalStatus = z.enum(["pending", "applying", "applied", "rejected", "expired", "failed"]);
export type ProposalStatus = z.infer<typeof ProposalStatus>;

export const ProposalSource = z.object({
  kind: z.enum(["attachment", "statement_line", "invoice", "bill", "expense", "note"]),
  id: z.string().optional(),
  label: z.string(),
  page: z.number().int().optional(),
});

export const Proposal = z.object({
  id: z.string(),
  agent: z.string(),
  agentName: z.string(),
  kind: ProposalKind,
  payload: z.record(z.string(), z.unknown()),
  title: z.string(),
  summary: z.string(),
  confidence: z.number().int().nullable(),
  sources: z.array(ProposalSource),
  status: ProposalStatus,
  proposedBy: z.enum(["agent", "api_client", "practice"]),
  edits: z.record(z.string(), z.tuple([z.unknown(), z.unknown()])).nullable(),
  decidedBy: z.string().nullable(),
  decidedAt: z.string().nullable(),
  reason: z.string().nullable(),
  /** Where the approved proposal landed, e.g. /app/out/expenses/… */
  appliedHref: z.string().nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
});
export type Proposal = z.infer<typeof Proposal>;

export const AgentRunStatus = z.enum(["queued", "running", "done", "failed", "stopped"]);

export const AgentRun = z.object({
  id: z.string(),
  agent: z.string(),
  agentName: z.string(),
  version: z.string(),
  trigger: z.enum(["user", "schedule", "event", "api", "practice"]),
  status: AgentRunStatus,
  model: z.string().nullable(),
  tokensIn: z.number().int(),
  tokensOut: z.number().int(),
  /** Millionths of a US dollar: Vertex AI bills in dollars. */
  costMicros: z.number().int(),
  error: z.string().nullable(),
  proposals: z.number().int(),
  createdAt: z.string(),
  finishedAt: z.string().nullable(),
});
export type AgentRun = z.infer<typeof AgentRun>;

export const AgentStep = z.object({
  seq: z.number().int(),
  kind: z.enum(["model", "tool"]),
  name: z.string(),
  tokensIn: z.number().int(),
  tokensOut: z.number().int(),
  costMicros: z.number().int(),
  ms: z.number().int(),
  error: z.string().nullable(),
  at: z.string(),
});

export const AgentUsage = z.object({
  agent: z.string(),
  name: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  model: z.string(),
  runs: z.number().int(),
  costMicros: z.number().int(),
  /** Monthly cap in micro-dollars; null = the plan's default. */
  monthlyBudgetMicros: z.number().int().nullable(),
});

/** A photo or PDF sent to the capture agent, and how far it has got. */
export const Capture = z.object({
  id: z.string(),
  attachmentId: z.string(),
  filename: z.string(),
  mime: z.string(),
  status: z.enum(["queued", "reading", "done", "failed"]),
  error: z.string().nullable(),
  proposalId: z.string().nullable(),
  createdAt: z.string(),
});
export type Capture = z.infer<typeof Capture>;

export const agents = {
  proposals: endpoint({
    method: "GET", path: "/proposals",
    query: z.object({ status: z.enum(["pending", "decided", "all"]).default("pending") }),
    response: z.object({ proposals: z.array(Proposal), pending: z.number().int() }),
  }),
  proposal: endpoint({ method: "GET", path: "/proposals/:id", response: Proposal }),
  /** Approve, optionally with changes to the payload. Owners and admins; accountants too. */
  approve: endpoint({
    method: "POST", path: "/proposals/:id/approve",
    body: z.object({ payload: z.record(z.string(), z.unknown()).optional() }),
    response: Proposal,
  }),
  reject: endpoint({
    method: "POST", path: "/proposals/:id/reject",
    body: z.object({ reason: z.string().trim().max(500).optional().nullable() }),
    response: Proposal,
  }),
  /** Multipart: one photo or PDF in `file`. The capture agent reads it in the background. */
  upload: endpoint({ method: "POST", path: "/capture", response: Capture }),
  captures: endpoint({ method: "GET", path: "/capture", response: z.object({ captures: z.array(Capture) }) }),
  retryCapture: endpoint({ method: "POST", path: "/capture/:id/retry", response: Capture }),
  runs: endpoint({ method: "GET", path: "/agents/runs", response: z.object({ runs: z.array(AgentRun) }) }),
  run: endpoint({ method: "GET", path: "/agents/runs/:id", response: z.object({ run: AgentRun, steps: z.array(AgentStep) }) }),
  usage: endpoint({
    method: "GET", path: "/agents/usage",
    response: z.object({
      /** False when Vertex AI isn't configured: agents and Ask are off. */
      setUp: z.boolean(),
      month: IsoDate,
      costMicros: z.number().int(),
      budgetMicros: z.number().int(),
      agents: z.array(AgentUsage),
    }),
  }),
  setAgent: endpoint({
    method: "PUT", path: "/agents/:agent",
    body: z.object({
      enabled: z.boolean(),
      monthlyBudgetMicros: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
    }),
    response: AgentUsage,
    roles: ["owner"],
  }),
};
