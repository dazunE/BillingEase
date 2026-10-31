import { apiAccess, SCOPES } from "@billingease/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { ago } from "@/components/home/format";
import { Badge, Button } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { disconnectApp, revokeToken } from "./actions";
import { CopyField } from "./CopyField";
import { TokenForm } from "./TokenForm";

export const metadata: Metadata = { title: "Apps and API" };

const H2 = "font-display text-[22px] font-bold tracking-[-0.02em]";
const BOX = "flex flex-col gap-4 rounded-[20px] border border-line bg-white p-5";

export default async function AppsPage() {
  const { business } = await requireBusiness();
  const a = await load(apiAccess.list);
  const owner = business.role === "owner";
  const scopeText = (s: (keyof typeof SCOPES)[]) => s.map((x) => SCOPES[x].label).join(" · ");
  return (
    <>
      <AppCrumbs area="biz" trail={[{ label: "Your business" }, { label: "Apps and API" }]} />
      <div className="mx-auto flex w-full max-w-[860px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-muted">Your business</span>
          <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold tracking-[-0.03em]">Apps and API</h1>
          <p className="text-ink2">
            Let an AI assistant or your own software read {business.name}&apos;s books and suggest entries. Nothing they send changes your books until someone approves it in <Link href="/app/check" className="underline underline-offset-4">For you to check</Link>.
          </p>
        </div>

        <section aria-labelledby="connect-h" className={BOX}>
          <h2 id="connect-h" className={H2}>Connect an AI assistant</h2>
          <p className="text-sm text-ink2">In Claude, ChatGPT, Cursor or another assistant that takes MCP servers, add a custom connector with this address. It will ask you to sign in here and say what it may do.</p>
          <CopyField label="MCP server" value={a.urls.mcp} />
          <CopyField label="REST API" value={a.urls.rest} />
          <p className="text-sm"><Link href="/developers" className="font-semibold underline underline-offset-4">How it works, for developers</Link></p>
        </section>

        <section aria-labelledby="apps-h" className="flex flex-col gap-3">
          <h2 id="apps-h" className={H2}>Connected apps</h2>
          {a.apps.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-input p-6 text-sm text-ink2">No apps connected. When you connect one, it shows here, and you can disconnect it any time.</p>
          ) : (
            <ul className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-white">
              {a.apps.map((x) => (
                <li key={x.grantId} className="flex flex-wrap items-center gap-3 border-b border-divider px-4 py-3 last:border-0">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">{x.name}{x.host && <span className="font-normal text-ink2"> · {x.host}</span>}</span>
                    <span className="text-xs text-muted">{scopeText(x.scopes)} · connected {ago(x.connectedAt)}{x.lastUsedAt ? ` · last used ${ago(x.lastUsedAt)}` : ""}{owner && !x.mine ? ` · by ${x.owner}` : ""}</span>
                  </div>
                  <form action={disconnectApp}>
                    <input type="hidden" name="id" value={x.grantId} />
                    <Button type="submit" variant="secondary" aria-label={`Disconnect ${x.name}`}>Disconnect</Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="tokens-h" className="flex flex-col gap-3">
          <h2 id="tokens-h" className={H2}>Personal access tokens</h2>
          <p className="text-sm text-ink2">For your own scripts. A token acts as you, with your role, in {business.name} only.</p>
          {a.tokens.length > 0 && (
            <ul className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-white">
              {a.tokens.map((x) => (
                <li key={x.id} className="flex flex-wrap items-center gap-3 border-b border-divider px-4 py-3 last:border-0">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">{x.name} <code className="ml-1 rounded bg-surface px-1.5 py-0.5 text-xs font-normal">{x.prefix}…</code></span>
                    <span className="text-xs text-muted">
                      {scopeText(x.scopes)} · {x.lastUsedAt ? `last used ${ago(x.lastUsedAt)}` : "not used yet"} · {x.expiresAt ? `stops ${new Date(x.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : "no end date"}{owner && !x.mine ? ` · ${x.owner}'s` : ""}
                    </span>
                  </div>
                  <form action={revokeToken}>
                    <input type="hidden" name="id" value={x.id} />
                    <Button type="submit" variant="secondary" aria-label={`Revoke ${x.name}`}>Revoke</Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <div className={BOX}><TokenForm /></div>
        </section>

        <section aria-labelledby="calls-h" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="calls-h" className={H2}>Recent calls</h2>
            <span className="text-sm text-muted">{a.usage.today.toLocaleString("en-GB")} of {a.usage.dailyQuota.toLocaleString("en-GB")} today</span>
          </div>
          {a.calls.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-input p-6 text-sm text-ink2">No calls yet. Every call an app makes shows here for 90 days.</p>
          ) : (
            <ul className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-white">
              {a.calls.map((c, i) => (
                <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-divider px-4 py-2.5 last:border-0">
                  <code className="min-w-0 flex-1 truncate text-[13px]">{c.operation}</code>
                  <span className="text-xs text-muted">{c.by} · {c.surface === "mcp" ? "MCP" : "REST"} · {ago(c.at)} · {c.ms} ms</span>
                  <Badge tone={c.status < 300 ? "pos" : c.status === 429 || c.status === 403 ? "due" : "late"}>{c.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
