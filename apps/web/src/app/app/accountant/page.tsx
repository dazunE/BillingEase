import { practice } from "@billingease/contracts";
import { formatDate, rulesFor } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { setRequest } from "@/app/app/accountant/actions";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { Panel } from "@/components/keep/parts";
import { MessageForm, RequestForm } from "@/components/practice/Forms";
import { ButtonLink, cx, Icon, ICONS } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Your accountant" };

const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
const CHECK = "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11";

/** Your accountant (prototype Accountant): who they are, what they ask for, and messages. */
export default async function AccountantPage() {
  const { business: b } = await requireBusiness();
  const o = await load(practice.overview);
  const rules = rulesFor(b.country);
  const noun = rules.wording.practitionerNoun;
  const Noun = noun[0].toUpperCase() + noun.slice(1);
  const lk = b.country === "lk";
  const isAccountant = b.role === "accountant";
  const open = o.requests.filter((r) => r.status === "open");
  const done = o.requests.filter((r) => r.status === "done");
  const first = o.accountants[0];

  return (
    <>
      <AppCrumbs area="biz" trail={[{ label: "Your business", href: "/app/settings/business" }, { label: `Your ${noun}` }]} />
      <div className="flex max-w-[760px] flex-col gap-2">
        <h1 className="font-display text-[clamp(32px,4.5vw,48px)] font-bold leading-[1.05] tracking-[-0.03em]">Your {noun}</h1>
        <p className="text-ink2">{lk ? "The practitioner who prepares your VAT, SSCL and income tax returns. They work from your books, send you requests here, and mark each period filed." : b.country === "us" ? "The accountant who prepares your return. They work from your books and send you requests here." : "The practice that sends your quarterly updates to HMRC. They work from your books, send you requests here, and mark each quarter sent once it's filed."}</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]">
            {o.accountants.length ? o.accountants.map((a) => (
              <div key={a.userId} className="flex flex-wrap items-start gap-4">
                <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-ink font-display text-lg font-bold text-violet">{initials(a.name)}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2 font-display text-xl font-bold">{a.name}<span className="rounded-full bg-pos-bg px-2.5 py-0.5 font-sans text-xs font-bold text-pos">Linked</span></span>
                  <span className="text-sm text-ink2">{a.email}</span>
                  <span className="text-[13px] text-muted">Can open your books since {formatDate(a.since.slice(0, 10), { year: true })}{a.lastSeenAt ? ` · last active ${formatDate(a.lastSeenAt.slice(0, 10))}` : ""}</span>
                </span>
                <a href={`mailto:${a.email}`} className="inline-flex min-h-10 items-center rounded-full bg-ink/[0.07] px-4 text-sm font-semibold hover:bg-ink/[0.11]">Email them</a>
              </div>
            )) : (
              <div className="flex flex-col items-start gap-3">
                <span className="font-display text-xl font-bold">No {noun} linked yet</span>
                <p className="text-sm text-ink2">{o.invited.length ? `Invitation sent to ${o.invited.map((i) => i.email).join(", ")}. It works until ${formatDate(o.invited[0].expiresAt.slice(0, 10), { year: true })}.` : `Invite your ${noun} by email. They see your books, send you requests and mark periods filed; they can't change your settings.`}</p>
                <ButtonLink href="/app/settings/people#invite"><Icon d={ICONS.plus} size={18} strokeWidth={2.4} />Invite your {noun}</ButtonLink>
              </div>
            )}
            {o.accountants.length > 0 && b.role === "owner" && <Link href="/app/settings/people" className="self-start text-sm font-semibold underline underline-offset-4">Change who has access</Link>}
          </section>

          <Panel id="req-h" title="Requests" aside={<span className="text-[13px] text-muted">{open.length} open</span>}>
            {open.length === 0 && <p className="text-sm text-muted">Nothing asked for right now.</p>}
            <ul className="flex flex-col gap-2.5">
              {open.map((r) => (
                <li key={r.id} className="flex flex-wrap items-start gap-3 rounded-2xl bg-due-bg/60 p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-due-bg text-due"><Icon d={CHECK} size={18} /></span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-semibold">{r.title}</span>
                    {r.body && <span className="text-sm text-ink2">{r.body}</span>}
                    <span className="text-xs text-muted">From {r.from ?? "your " + noun} · {formatDate(r.createdAt.slice(0, 10))}</span>
                  </span>
                  <span className="flex flex-wrap gap-2">
                    {r.link && <Link href={r.link} className="inline-flex min-h-10 items-center rounded-full bg-white px-4 text-sm font-semibold">Open</Link>}
                    <form action={setRequest}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="done" /><button className="inline-flex min-h-10 items-center rounded-full bg-violet px-4 text-sm font-semibold">Done</button></form>
                  </span>
                </li>
              ))}
            </ul>
            {done.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-divider pt-3">
                <span className="text-xs font-semibold text-muted">Done</span>
                {done.slice(0, 8).map((r) => <span key={r.id} className="flex items-center gap-2 text-sm"><Icon d={ICONS.check} size={14} className="text-pos" /><s className="text-ink2">{r.title}</s><span className="text-xs text-muted">{r.doneAt ? `done ${formatDate(r.doneAt.slice(0, 10))}` : ""}</span></span>)}
              </div>
            )}
            {isAccountant && <div className="border-t border-divider pt-4"><RequestForm /></div>}
          </Panel>

          <Panel id="msg-h" title="Messages">
            {o.messages.length === 0 && <p className="text-sm text-muted">No messages yet.</p>}
            <ol className="flex flex-col gap-3">
              {o.messages.map((m) => (
                <li key={m.id} className={cx("flex max-w-[85%] flex-col gap-1 rounded-2xl px-4 py-3", m.mine ? "self-end bg-ink text-white" : "self-start bg-surface")}>
                  <span className={cx("text-xs", m.mine ? "text-white/70" : "text-muted")}>{m.from ?? "Someone"} · {formatDate(m.createdAt.slice(0, 10))}</span>
                  <span className="whitespace-pre-line text-[15px]">{m.body}</span>
                </li>
              ))}
            </ol>
            {(o.accountants.length > 0 || isAccountant) && <MessageForm to={isAccountant ? b.ownerName.split(" ")[0] : first?.name.split(" ")[0] ?? `your ${noun}`} />}
          </Panel>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <Panel id="see-h" title="What they can see">
            <ul className="flex flex-col gap-3 text-sm">
              {[["Your books and every entry", `Needed to prepare your ${lk ? "returns" : "updates"}`], [lk ? "VAT, SSCL and payroll" : "Quarter totals and readiness checks", "What they file from"], ["Reports and the year end", "Profit and loss, balance sheet"]].map(([t, s]) => (
                <li key={t} className="flex items-start justify-between gap-2"><span className="flex flex-col"><span className="font-semibold">{t}</span><span className="text-xs text-muted">{s}</span></span><span className="rounded-full bg-pos-bg px-2.5 py-0.5 text-xs font-bold text-pos">Always</span></li>
              ))}
            </ul>
            <div className="flex flex-col gap-1.5 border-t border-divider pt-3 text-sm">
              <span className="text-xs font-semibold text-muted">They can&apos;t</span>
              {["Change your business profile or branding", "Invite or remove people", "Change your password or how you sign in"].map((x) => <span key={x} className="flex items-start gap-2 text-ink2"><span aria-hidden className="text-late">×</span>{x}</span>)}
            </div>
          </Panel>
          <section className="flex flex-col gap-3 rounded-3xl bg-tint p-6">
            <h2 className="font-display text-lg font-bold">See it from their side</h2>
            <p className="text-sm text-ink2">A preview of what your {noun} works from: {lk ? "this month's VAT and SSCL" : b.country === "us" ? "the year so far" : "your quarter's status"}, totals by category and the requests they send.</p>
            <ButtonLink href="/app/accountant/view" variant="dark" className="self-start">Open the preview</ButtonLink>
          </section>
          <p className="text-xs text-muted">{Noun}s use their own login. Each person&apos;s access is checked on every request.</p>
        </aside>
      </div>
    </>
  );
}
