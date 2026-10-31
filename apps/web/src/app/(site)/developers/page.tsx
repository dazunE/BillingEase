import { PROPOSE_TOOLS, SCOPES, V1, type ApiScope } from "@billingease/contracts";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { PageHero, Section, SectionHeading } from "@/components/site";

export const metadata: Metadata = {
  title: "Developers",
  description: "Connect an AI assistant to BillingEase over MCP, or call the REST API. Apps read the books and suggest entries; a person approves every change.",
};

const PRE = "overflow-x-auto rounded-2xl bg-ink p-4 font-mono text-[13px] leading-relaxed text-white";
const CODE = "rounded bg-surface px-1.5 py-0.5 font-mono text-[0.9em]";

/** This site's own address, so the examples work when copied. */
async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function DevelopersPage() {
  const base = await origin();
  const reads = V1.filter((op) => op.endpoint.method === "GET" && op.scope);
  return (
    <>
      <PageHero
        kicker="Developers"
        title="Your books, for your software."
        lead="AI assistants connect over MCP; your own code calls the REST API. Both read the books and suggest entries. Nothing they send changes the books until a person approves it."
      />

      <Section tone="white" labelledBy="mcp-h">
        <SectionHeading id="mcp-h" title="Connect an AI assistant" lead="Claude, ChatGPT, Cursor and other assistants that take remote MCP servers can add BillingEase as a custom connector." />
        <div className="flex max-w-[760px] flex-col gap-4 text-[17px] leading-relaxed text-ink2">
          <pre className={PRE}>{`${base}/mcp`}</pre>
          <p>Add that address as a connector. The assistant opens BillingEase in your browser: sign in, pick the business, and choose what it may do. It works with OAuth 2.1 and PKCE, finds everything it needs from the server itself, and needs no client secret. You can disconnect it any time in Settings → Apps and API.</p>
          <p>It gets {reads.length} tools for reading (invoices, customers, spending, bills, suppliers, the home page totals) and {PROPOSE_TOOLS.length} for suggesting: {PROPOSE_TOOLS.map((t) => <code key={t.name} className={`${CODE} mr-1`}>{t.name}</code>)}. Suggestions wait in For you to check.</p>
        </div>
      </Section>

      <Section labelledBy="rest-h">
        <SectionHeading id="rest-h" title="Call the REST API" lead="Make a personal access token in Settings → Apps and API, then send it as a Bearer token." />
        <div className="flex max-w-[760px] flex-col gap-4 text-[17px] leading-relaxed text-ink2">
          <pre className={PRE}>{`curl ${base}/v1/invoices?status=late \\
  -H "Authorization: Bearer be_pat_…"`}</pre>
          <pre className={PRE}>{`curl ${base}/v1/proposals \\
  -H "Authorization: Bearer be_pat_…" \\
  -H "Content-Type: application/json" \\
  -d '{"kind": "expense.create",
       "title": "Ochre Café, £12.40",
       "summary": "Card receipt from the team lunch",
       "payload": {"spentOn": "2026-10-09", "payee": "Ochre Café",
                   "categoryId": "travel", "gross": 1240, "vat": 0, "method": "Card"}}'`}</pre>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>Money is always whole minor units: <code className={CODE}>1240</code> is £12.40 (or 12.40 in rupees or dollars). Dates are <code className={CODE}>YYYY-MM-DD</code>.</li>
            <li>A token works for one business, as the person who made it, with their role.</li>
            <li>Errors come back as <code className={CODE}>{`{"error": {"code", "message", "fields"}}`}</code>, with a reason a person can read.</li>
            <li>Limits: a number of calls per minute per token, and per day per business. Over them you get 429 and a <code className={CODE}>Retry-After</code>.</li>
          </ul>
          <p>
            The full description is OpenAPI 3.1: <Link href="/v1/openapi.json" className="font-semibold underline underline-offset-4">/v1/openapi.json</Link>.
          </p>
        </div>
      </Section>

      <Section tone="white" labelledBy="scopes-h">
        <SectionHeading id="scopes-h" title="What an app may do" />
        <dl className="grid max-w-[760px] gap-4">
          {(Object.keys(SCOPES) as ApiScope[]).map((s) => (
            <div key={s} className="flex flex-col gap-1 rounded-3xl bg-bg p-5">
              <dt className="font-semibold text-ink"><code className={CODE}>{s}</code> · {SCOPES[s].label}</dt>
              <dd className="text-ink2">{SCOPES[s].detail}</dd>
            </div>
          ))}
        </dl>
        <p className="max-w-[760px] text-[17px] text-ink2">There is no scope that changes the books directly. Writing straight to the books, and webhooks, are planned.</p>
      </Section>
    </>
  );
}
