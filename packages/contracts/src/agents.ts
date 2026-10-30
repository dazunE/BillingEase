import { z } from "zod";
import { endpoint, IsoDate } from "./endpoint";

/**
 * Agents propose; people approve. A proposal is the body of an existing endpoint (its `kind`)
 * that an agent filled in. Approving it calls that endpoint as the person approving.
 */
export const ProposalKind = z.enum(["expense.create", "bill.create", "receipt.create", "bill_payment.create", "invoice.remind"]);
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
  /** The invoice or bill it acts on (payments, reminders). */
  targetId: z.string().nullable(),
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
  /** What applying it gave back, when worth showing: a reminder's WhatsApp link. */
  result: z.object({ whatsappUrl: z.string().nullable().optional(), emailed: z.boolean().optional() }).passthrough().nullable(),
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

export const StatementLine = z.object({
  id: z.string(),
  seq: z.number().int(),
  date: IsoDate,
  description: z.string(),
  /** Minor units: money in positive, money out negative. */
  amount: z.number().int(),
  balance: z.number().int().nullable(),
  reference: z.string().nullable(),
  status: z.enum(["unmatched", "matched", "proposed", "ignored"]),
  /** Where it was matched or what it became: e.g. /app/out/expenses/… */
  href: z.string().nullable(),
  proposalId: z.string().nullable(),
  proposalStatus: ProposalStatus.nullable(),
  proposalConfidence: z.number().int().nullable(),
  note: z.string().nullable(),
});

export const Statement = z.object({
  id: z.string(),
  attachmentId: z.string(),
  filename: z.string(),
  format: z.enum(["csv", "pdf"]),
  status: z.enum(["queued", "reading", "matching", "done", "failed"]),
  readBy: z.enum(["header", "model"]).nullable(),
  accountLabel: z.string().nullable(),
  periodFrom: IsoDate.nullable(),
  periodTo: IsoDate.nullable(),
  openingBalance: z.number().int().nullable(),
  closingBalance: z.number().int().nullable(),
  lineCount: z.number().int(),
  balanceProblems: z.number().int(),
  counts: z.object({ matched: z.number().int(), proposed: z.number().int(), waiting: z.number().int(), unmatched: z.number().int(), ignored: z.number().int() }),
  error: z.string().nullable(),
  createdAt: z.string(),
});
export type Statement = z.infer<typeof Statement>;

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
  /** Multipart: one CSV or PDF statement in `file`. Read and matched in the background. */
  uploadStatement: endpoint({ method: "POST", path: "/statements", response: Statement }),
  statements: endpoint({ method: "GET", path: "/statements", response: z.object({ statements: z.array(Statement) }) }),
  statement: endpoint({ method: "GET", path: "/statements/:id", response: z.object({ statement: Statement, lines: z.array(StatementLine) }) }),
  retryStatement: endpoint({ method: "POST", path: "/statements/:id/retry", response: Statement }),
  /** Approve several as they stand (no edits), e.g. the sure ones from a statement. */
  approveMany: endpoint({
    method: "POST", path: "/proposals/approve-many",
    body: z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }),
    response: z.object({ approved: z.number().int(), failed: z.array(z.object({ id: z.string(), title: z.string(), message: z.string() })) }),
  }),
  /** Drafts reminders for late invoices now, instead of waiting for the daily check. */
  runChaser: endpoint({ method: "POST", path: "/agents/chaser/run", body: z.object({}), response: z.object({ queued: z.boolean() }) }),
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
