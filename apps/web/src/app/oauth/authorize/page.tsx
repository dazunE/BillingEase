import { apiAccess, AuthorizeParams, SCOPES } from "@billingease/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Button, Field, Logo, Select } from "@/components/ui";
import { ApiFailure, call } from "@/lib/api";
import { currentMe } from "@/lib/session";
import { decide } from "./actions";

export const metadata: Metadata = { title: "Connect an app", robots: { index: false } };

/**
 * The OAuth consent screen: an app (an AI assistant, other software) asks to work with a
 * business's books. The person sees who is asking and what it may do, picks the business,
 * and says yes or no.
 */
export default async function AuthorizePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const flat = Object.fromEntries(Object.entries(raw).filter((e): e is [string, string] => typeof e[1] === "string"));
  const params = AuthorizeParams.safeParse(flat);
  const here = `/oauth/authorize?${new URLSearchParams(flat).toString()}`;
  const me = await currentMe();
  if (!me) redirect(`/sign-in?next=${encodeURIComponent(here)}`);
  if (!params.success) return <Problem message="This sign-in link isn't complete. Try connecting again from the app." />;

  let check;
  try {
    check = await call(apiAccess.authorizeCheck, { body: params.data });
  } catch (err) {
    if (err instanceof ApiFailure && err.code === "no_business") redirect("/setup");
    if (err instanceof ApiFailure && err.status === 401) redirect(`/sign-in?next=${encodeURIComponent(here)}`);
    if (err instanceof ApiFailure) return <Problem message={err.message} />;
    throw err;
  }
  if (check.errorRedirect) redirect(check.errorRedirect);
  const { client, scopes, businesses } = check;

  return (
    <Frame>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-muted">Connect an app</span>
        <h1 className="font-display text-[clamp(26px,4vw,32px)] font-bold leading-tight tracking-[-0.02em]">{client.name} wants to work with your books</h1>
        <p className="flex flex-wrap items-center gap-2 text-sm text-ink2">
          {client.host && <span>{client.host}</span>}
          {client.verified ? <Badge tone="pos">Its website vouches for it</Badge> : <Badge tone="due">Not confirmed</Badge>}
        </p>
        {!client.verified && <p className="text-sm text-ink2">BillingEase can&apos;t confirm who made this app. Only go on if you started this from an app you trust.</p>}
      </div>

      <section aria-labelledby="may-h" className="flex flex-col gap-2">
        <h2 id="may-h" className="text-[15px] font-bold">It will be able to</h2>
        <ul className="flex flex-col gap-2">
          {scopes.map((s) => (
            <li key={s} className="flex flex-col rounded-2xl bg-surface px-4 py-3">
              <span className="text-[15px] font-semibold">{SCOPES[s].label}</span>
              <span className="text-sm text-ink2">{SCOPES[s].detail}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-ink2">It can&apos;t change your books itself, and it acts as you, {me.user.name}, with your role. You can disconnect it any time in Settings → Apps and API.</p>
      </section>

      <form action={decide} className="flex flex-col gap-4">
        {Object.entries(params.data).map(([k, v]) => v !== undefined && <input key={k} type="hidden" name={k} value={v} />)}
        {businesses.length > 1 ? (
          <Field label="Which business?">
            <Select name="businessId" defaultValue={businesses[0].id}>
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Field>
        ) : (
          <>
            <input type="hidden" name="businessId" value={businesses[0].id} />
            <p className="text-sm">For <strong>{businesses[0].name}</strong></p>
          </>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" name="allow" value="yes" variant="dark">Allow</Button>
          <Button type="submit" name="allow" value="no" variant="secondary">Don&apos;t allow</Button>
        </div>
        <p className="text-xs text-muted">Afterwards you&apos;ll go back to {check.redirectHost}.</p>
      </form>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-bg px-4 py-8">
      <Link href="/" aria-label="BillingEase home"><Logo /></Link>
      <main className="box-border flex w-full max-w-[480px] flex-col gap-6 rounded-3xl border border-line bg-white p-[clamp(22px,5vw,36px)]">{children}</main>
    </div>
  );
}

function Problem({ message }: { message: string }) {
  return (
    <Frame>
      <h1 className="font-display text-[28px] font-bold tracking-[-0.02em]">This app can&apos;t connect</h1>
      <p className="text-ink2">{message}</p>
      <Link href="/app" className="font-semibold underline underline-offset-4">Go to BillingEase</Link>
    </Frame>
  );
}
