import { agents } from "@billingease/contracts";
import type { Metadata } from "next";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { ago } from "@/components/home/format";
import { Badge } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { AgentRow } from "./AgentRow";
import { usd } from "./money";

export const metadata: Metadata = { title: "AI and agents" };

const STATUS = { done: ["Done", "pos"], failed: ["Failed", "late"], stopped: ["Stopped", "due"], running: ["Running", "info"], queued: ["Waiting", "neutral"] } as const;

export default async function AiSettingsPage() {
  const { business } = await requireBusiness();
  const [usage, runs] = await Promise.all([load(agents.usage), load(agents.runs)]);
  const used = usage.budgetMicros ? Math.min(100, Math.round((usage.costMicros / usage.budgetMicros) * 100)) : 0;
  return (
    <>
      <AppCrumbs area="biz" trail={[{ label: "Your business" }, { label: "AI and agents" }]} />
      <div className="mx-auto flex w-full max-w-[860px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-muted">Your business</span>
          <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold tracking-[-0.03em]">AI and agents</h1>
          <p className="text-ink2">BillingEase uses Google&apos;s Gemini models on Vertex AI. Agents read your books and draft entries; nothing is added until someone approves it in <a href="/app/check" className="underline underline-offset-4">For you to check</a>. Every step is recorded below.</p>
        </div>

        {!usage.setUp && (
          <div role="status" className="flex flex-col gap-1 rounded-2xl bg-due-bg px-5 py-4 text-due">
            <strong>AI isn&apos;t set up yet</strong>
            <span className="text-sm">It needs Vertex AI on the BillingEase server. Your books are fine.</span>
          </div>
        )}

        <section aria-labelledby="spend-h" className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-5">
          <h2 id="spend-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">This month</h2>
          <p className="text-[15px]"><strong>{usd(usage.costMicros)}</strong> of the {usd(usage.budgetMicros)} default cap for {business.name}.</p>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={100} aria-label="Share of this month's AI budget used">
            <div className="h-full rounded-full bg-coming" style={{ width: `${used}%` }} />
          </div>
          <p className="text-xs text-muted">Costs are estimates from the token counts and the configured price list. When a cap is reached, agents stop until the 1st.</p>
        </section>

        <section aria-labelledby="agents-h" className="flex flex-col gap-3">
          <h2 id="agents-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">Agents</h2>
          <ul className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-white">
            {usage.agents.map((a) => <AgentRow key={a.agent} a={a} defaultBudget={usage.budgetMicros} canEdit={business.role === "owner"} />)}
          </ul>
        </section>

        <section aria-labelledby="runs-h" className="flex flex-col gap-3">
          <h2 id="runs-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">Recent runs</h2>
          {runs.runs.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-input p-6 text-sm text-ink2">No runs yet. Each question to Ask, and each agent run, shows here with its cost.</p>
          ) : (
            <ul className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-white">
              {runs.runs.map((r) => {
                const [label, tone] = STATUS[r.status];
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 border-b border-divider px-4 py-3 last:border-0">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[15px] font-semibold">{r.agentName}{r.proposals > 0 && <span className="font-normal text-ink2"> · {r.proposals} to check</span>}</span>
                      <span className="text-xs text-muted">{ago(r.createdAt)} · {r.model ?? "model"} · {(r.tokensIn + r.tokensOut).toLocaleString("en-GB")} tokens · {usd(r.costMicros)}{r.error && ` · ${r.error}`}</span>
                    </div>
                    <Badge tone={tone}>{label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
