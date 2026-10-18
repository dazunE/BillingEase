import { agents } from "@billingease/contracts";
import { rulesFor } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { ago } from "@/components/home/format";
import { Badge, cx } from "@/components/ui";
import { ApiFailure, call, load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { CaptureBox } from "./CaptureBox";
import { ProposalCard } from "./ProposalCard";

export const metadata: Metadata = { title: "For you to check" };

const DONE: Record<string, { label: string; tone: "pos" | "neutral" | "late" }> = {
  applied: { label: "Approved", tone: "pos" },
  rejected: { label: "Turned down", tone: "neutral" },
  expired: { label: "Expired", tone: "neutral" },
  failed: { label: "Couldn't be added", tone: "late" },
  applying: { label: "Adding", tone: "neutral" },
};

/** Everything the agents want to add, waiting for a person. Nothing reaches the books until approved. */
export default async function CheckPage({ searchParams }: { searchParams: Promise<{ show?: string; done?: string }> }) {
  const { business } = await requireBusiness();
  const sp = await searchParams;
  const show = sp.show === "decided" ? "decided" : "pending";
  const [list, done, captures, usage] = await Promise.all([
    load(agents.proposals, { query: { status: show } }), justDecided(sp.done), load(agents.captures), load(agents.usage),
  ]);
  const rules = rulesFor(business.country);
  const categories = rules.categories.map((c) => ({ id: c.id, name: c.name }));
  return (
    <>
      <AppCrumbs trail={[{ label: "For you to check" }]} />
      <div className="mx-auto flex w-full max-w-[860px] flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold tracking-[-0.03em]">For you to check</h1>
            <p className="max-w-[640px] text-ink2">BillingEase&apos;s AI drafts entries from what you give it. Nothing goes into your books until you approve it, and you can change any detail first.</p>
          </div>
          <nav aria-label="Show" className="flex gap-1 rounded-[22px] bg-surface p-1">
            {([["pending", `Waiting${list.pending ? ` (${list.pending})` : ""}`], ["decided", "Decided"]] as const).map(([id, label]) => (
              <Link key={id} href={id === "pending" ? "/app/check" : "/app/check?show=decided"} aria-current={show === id ? "page" : undefined}
                className={cx("flex min-h-10 items-center rounded-full px-4 text-sm font-semibold", show === id ? "bg-ink text-white" : "text-ink")}>{label}</Link>
            ))}
          </nav>
        </div>

        {done && (
          <div role="status" className={cx("flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl px-5 py-4 text-[15px]", done.status === "applied" ? "bg-pos-bg" : "bg-surface")}>
            <strong>{done.status === "applied" ? "Approved and added to your books:" : "Turned down, nothing was added:"}</strong>
            <span>{done.title}</span>
            {done.appliedHref && <Link href={done.appliedHref} className="font-semibold underline underline-offset-4">See it</Link>}
          </div>
        )}

        {show === "pending" && <CaptureBox captures={captures.captures} setUp={usage.setUp} />}

        {list.proposals.length === 0 ? (
          <div className="flex flex-col items-start gap-2 rounded-3xl border border-dashed border-input p-6">
            <span className="font-display text-lg font-bold">{show === "pending" ? "Nothing to check" : "Nothing decided yet"}</span>
            <span className="text-sm text-ink2">{show === "pending" ? "Add a photo or PDF of a receipt or bill above, and the draft waits here for you." : "Approved and turned-down drafts show here."}</span>
          </div>
        ) : show === "pending" ? (
          <ul aria-label="Waiting for you" className="flex flex-col gap-3">
            {list.proposals.map((p) => <ProposalCard key={p.id} p={p} currency={business.currency} categories={categories} />)}
          </ul>
        ) : (
          <ul aria-label="Decided" className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-white">
            {list.proposals.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 border-b border-divider px-4 py-3.5 last:border-0">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-semibold">{p.appliedHref ? <Link href={p.appliedHref} className="hover:underline">{p.title}</Link> : p.title}</span>
                  <span className="text-xs text-muted">
                    {p.agentName} · {p.decidedBy ? `${p.decidedBy}, ` : ""}{ago(p.decidedAt ?? p.createdAt)}
                    {p.edits && Object.keys(p.edits).length > 0 && " · changed before approving"}
                    {p.reason && ` · “${p.reason}”`}
                    {p.error && ` · ${p.error}`}
                  </span>
                </div>
                <Badge tone={DONE[p.status]?.tone ?? "neutral"}>{DONE[p.status]?.label ?? p.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

async function justDecided(id?: string) {
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const p = await call(agents.proposal, { params: { id } });
    return p.status === "applied" || p.status === "rejected" ? p : null;
  } catch (err) {
    if (err instanceof ApiFailure) return null;
    throw err;
  }
}
