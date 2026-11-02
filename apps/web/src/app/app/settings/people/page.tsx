import { people } from "@billingease/contracts";
import { rulesFor } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { BizHeading, BizShell } from "@/components/app/BizShell";
import { Badge, ButtonLink, cx, Icon, ICONS } from "@/components/ui";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { cancelInvite, removeMember } from "./actions";
import { InviteForm } from "./InviteForm";

export const metadata: Metadata = { title: "People and access" };

const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

function when(iso: string | null, today = new Date()) {
  if (!iso) return "Not signed in yet";
  const d = new Date(iso);
  const mins = Math.round((today.getTime() - d.getTime()) / 60000);
  if (mins < 10) return "Active now";
  if (mins < 60 * 24) return `Active ${Math.round(mins / 60) || 1}h ago`;
  return `Active ${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`;
}

export default async function PeoplePage() {
  const { me, business: b } = await requireBusiness();
  const { members, invites } = await load(people.members);
  const lk = b.country === "lk";
  const owner = b.role === "owner";
  const practitioner = lk ? "Tax practitioner" : "Accountant";
  const ROLE = { owner: ["Owner", "Everything"], accountant: [practitioner, "Books, reports, Ask"], admin: ["Office admin", "Day-to-day records"] } as const;
  const rules = rulesFor(b.country);

  const can: { what: string; sub: string; owner: boolean; others: boolean }[] = [
    { what: lk ? "Send tax invoices and quotes" : "Send invoices and quotes", sub: "And record payments by hand", owner: true, others: true },
    { what: "Record expenses and bills", sub: "With their receipts and attachments", owner: true, others: true },
    { what: "Upload bank statements and check AI drafts", sub: "Approve what BillingEase read for you", owner: true, others: true },
    { what: "Ask about tax and the books", sub: `Answers from ${rules.name}'s official sources`, owner: true, others: true },
    { what: "Change the business profile and branding", sub: lk ? "Name, TIN, VAT, SSCL, logo" : "Name, tax numbers, VAT, logo", owner: true, others: false },
    { what: "Set AI spending caps", sub: "AI and agents", owner: true, others: false },
    { what: "Invite and remove people", sub: "This page", owner: true, others: false },
  ];
  const yes = <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-pos"><Icon d={ICONS.check} size={16} />Yes</span>;
  const no = <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted"><span aria-hidden>–</span>No</span>;

  return (
    <BizShell here="people">
      <BizHeading
        title="People and access"
        action={owner ? <ButtonLink href="#invite"><Icon d={ICONS.plus} size={18} strokeWidth={2.4} />Invite someone</ButtonLink> : undefined}
      >
        You and the people who help with {b.name}&apos;s books. They see your records to {lk ? "prepare your VAT, SSCL and income tax returns" : "send your updates and returns"}; only the owner changes settings.
      </BizHeading>

      <section aria-labelledby="who-h" className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]">
        <div className="flex flex-col gap-1">
          <h2 id="who-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">Who can open the books <span className="text-muted">{members.length}</span></h2>
          <span className="text-[13px] text-muted">{members.length === 1 ? "Only you, so far" : `${members.length} people have access`}</span>
        </div>
        <ul className="flex flex-col">
          {members.map((m) => (
            <li key={m.userId} className="grid items-center gap-x-4 gap-y-2 border-t border-divider py-4 sm:grid-cols-[minmax(0,1fr)_170px_auto]">
              <span className="flex min-w-0 items-center gap-3">
                <span aria-hidden className={cx("flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold", m.role === "owner" ? "bg-ink text-violet" : "bg-tint text-ink")}>{initials(m.name)}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="flex flex-wrap items-center gap-2 font-semibold">{m.name}{m.you && <Badge tone="violet">You</Badge>}</span>
                  <span className="truncate text-[13px] text-muted">{m.email} · {m.you ? "Signed in now" : when(m.lastSeenAt)}</span>
                </span>
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{ROLE[m.role][0]}</span>
                <span className="text-xs text-muted">{ROLE[m.role][1]}</span>
              </span>
              <span className="flex flex-wrap gap-2 sm:justify-end">
                {m.you && owner && <ButtonLink variant="secondary" href="/app/settings/business" className="min-h-10 px-4 text-sm">Edit your details</ButtonLink>}
                {owner && !m.you && m.role !== "owner" && (
                  <form action={removeMember}>
                    <input type="hidden" name="userId" value={m.userId} />
                    <button className="inline-flex min-h-10 items-center rounded-full bg-ink/[0.07] px-4 text-sm font-semibold hover:bg-ink/[0.11]" aria-label={`Remove ${m.name}`}>Remove</button>
                  </form>
                )}
              </span>
            </li>
          ))}
          {invites.map((i) => (
            <li key={i.id} className="grid items-center gap-x-4 gap-y-2 border-t border-divider py-4 sm:grid-cols-[minmax(0,1fr)_170px_auto]">
              <span className="flex min-w-0 items-center gap-3">
                <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full border border-dashed border-input text-muted"><Icon d={ICONS.mail} size={18} /></span>
                <span className="flex min-w-0 flex-col">
                  <span className="flex flex-wrap items-center gap-2 font-semibold"><span className="truncate">{i.email}</span><Badge tone="due">Invited</Badge></span>
                  <span className="text-[13px] text-muted">Link works until {new Date(i.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{i.invitedBy ? ` · from ${i.invitedBy}` : ""}</span>
                </span>
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{ROLE[i.role][0]}</span>
                <span className="text-xs text-muted">Once they accept</span>
              </span>
              <span className="flex sm:justify-end">
                {owner && (
                  <form action={cancelInvite}>
                    <input type="hidden" name="id" value={i.id} />
                    <button className="inline-flex min-h-10 items-center rounded-full bg-ink/[0.07] px-4 text-sm font-semibold hover:bg-ink/[0.11]" aria-label={`Cancel the invitation to ${i.email}`}>Cancel</button>
                  </form>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {owner && (
        <section id="invite" aria-labelledby="invite-h" className="flex scroll-mt-6 flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]">
          <div className="flex flex-col gap-1">
            <h2 id="invite-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">Invite someone</h2>
            <span className="text-[13px] text-muted">We email them a link. They sign in, or create an account, with that email to accept.</span>
          </div>
          <InviteForm practitioner={practitioner} />
        </section>
      )}

      <section aria-labelledby="can-h" className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]">
        <div className="flex flex-col gap-1">
          <h2 id="can-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">What each person can do</h2>
          <span className="text-[13px] text-muted">Access is set by who they are, so there&apos;s nothing to configure. Only the owner can change settings or invite people.</span>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead className="bg-bg">
              <tr>
                <th scope="col" className="px-4 py-3 text-[13px] font-semibold text-ink2">They can</th>
                <th scope="col" className="px-4 py-3"><span className="flex flex-col text-sm font-semibold">Owner<span className="text-xs font-normal text-muted">{owner ? "You" : "1 person"}</span></span></th>
                <th scope="col" className="px-4 py-3"><span className="flex flex-col text-sm font-semibold">{practitioner} or office admin<span className="text-xs font-normal text-muted">{members.length - 1 === 1 ? "1 person" : `${Math.max(0, members.length - 1)} people`}</span></span></th>
              </tr>
            </thead>
            <tbody>
              {can.map((c) => (
                <tr key={c.what} className="border-t border-line">
                  <th scope="row" className="px-4 py-3 align-top font-normal"><span className="flex flex-col"><span className="text-[14.5px] font-semibold">{c.what}</span><span className="text-xs text-muted">{c.sub}</span></span></th>
                  <td className="px-4 py-3 align-top">{c.owner ? yes : no}</td>
                  <td className="px-4 py-3 align-top">{c.others ? yes : no}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="biz-h" className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]">
        <div className="flex flex-col gap-1">
          <h2 id="biz-h" className="font-display text-[22px] font-bold tracking-[-0.02em]">Your businesses</h2>
          <span className="text-[13px] text-muted">Each business keeps its own books in one country. A business in another country is a separate business.</span>
        </div>
        <div className="flex flex-col gap-2">
          {me.businesses.map((x) => (
            <div key={x.id} className={cx("flex flex-wrap items-center gap-3 rounded-2xl p-3.5", x.id === b.id ? "border-2 border-ink" : "border border-line")}>
              <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-ink font-display font-bold text-violet">{x.name.trim()[0]?.toUpperCase()}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{x.name}</span>
                <span className="text-[13px] text-muted">{rulesFor(x.country).name} · {x.role === "owner" ? "Owner" : x.role === "accountant" ? "Accountant" : "Office admin"}{x.id === b.id ? " · Open now" : ""}</span>
              </span>
              {x.id === b.id && me.businesses.length === 1 ? (
                <Link href="/setup" className="text-sm font-semibold underline underline-offset-4">Add another business</Link>
              ) : null}
            </div>
          ))}
          {me.businesses.length > 1 && <Link href="/businesses" className="self-start text-sm font-semibold underline underline-offset-4">Switch, or add another</Link>}
        </div>
      </section>
    </BizShell>
  );
}
