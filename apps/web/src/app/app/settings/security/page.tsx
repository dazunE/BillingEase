import { auth, people } from "@billingease/contracts";
import { today } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { BizHeading, BizShell } from "@/components/app/BizShell";
import { Badge, ButtonLink, cx, Icon, ICONS } from "@/components/ui";
import { load } from "@/lib/api";
import { exportName, type ExportKind } from "@/lib/export";
import { requireBusiness } from "@/lib/session";
import { endOtherSessions, endSession } from "./actions";
import { ImportForm } from "./ImportForm";

export const metadata: Metadata = { title: "Security and data" };

const LAPTOP = "M4 6h16v10H4zM2 19h20";
const PHONE = "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2";

/** "Chrome on Mac" from a browser's user agent; good enough to recognise your own devices. */
function device(ua: string | null): { name: string; phone: boolean } {
  if (!ua) return { name: "Unknown device", phone: false };
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Mac OS X|Macintosh/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : null;
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\/|CriOS/.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /node|undici|curl/i.test(ua) ? "A script" : "A browser";
  return { name: os ? `${browser} on ${os}` : browser, phone: os === "iPhone" || os === "Android" };
}

function ago(iso: string | null, fallback: string) {
  const d = new Date(iso ?? fallback);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 10) return "Active now";
  if (mins < 60) return `Active ${mins} minutes ago`;
  if (mins < 60 * 24) return `Active ${Math.round(mins / 60)} ${Math.round(mins / 60) === 1 ? "hour" : "hours"} ago`;
  return `Active ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" })}`;
}

function Card({ id, title, sub, aside, children }: { id: string; title: string; sub?: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,28px)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={id} className="font-display text-[22px] font-bold tracking-[-0.02em]">{title}</h2>
          {sub && <span className="text-[13px] text-muted">{sub}</span>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

const LAW = {
  uk: {
    chip: "UK GDPR",
    sub: "UK GDPR applies to your customers' details and any payroll records you keep here.",
    law: "UK GDPR and the Data Protection Act 2018. You decide what's kept about your customers; BillingEase processes it for you.",
    keep: "HMRC asks you to keep business records for at least 5 years after the 31 January filing deadline for the tax year.",
  },
  lk: {
    chip: "PDPA",
    sub: "Sri Lanka's Personal Data Protection Act applies to your customers' and employees' details.",
    law: "The Personal Data Protection Act, No. 9 of 2022. You decide what's kept about your customers; BillingEase processes it for you.",
    keep: "The Inland Revenue Department asks you to keep records for at least 5 years from the end of the year of assessment.",
  },
  us: {
    chip: "Your records",
    sub: "State privacy laws may apply to your customers' details.",
    law: "Customers' details are covered by the privacy laws of the states you work in. You decide what's kept; BillingEase processes it for you.",
    keep: "The IRS generally asks you to keep records for 3 years from filing, longer in some cases.",
  },
} as const;

export default async function SecurityPage() {
  const { business: b } = await requireBusiness();
  const [methods, { sessions }] = await Promise.all([load(auth.signInMethods), load(people.sessions)]);
  const others = sessions.filter((s) => !s.current);
  const law = LAW[b.country];
  const owner = b.role === "owner";
  const day = today();
  const files: { kind: ExportKind; label: string; hint: string; dot: string }[] = [
    { kind: "invoices", label: b.country === "lk" && b.vatRegistered ? "Tax invoices and credit notes" : "Invoices and credit notes", hint: "Every one, with its status, amounts and what's paid", dot: "bg-coming" },
    { kind: "expenses", label: "Expenses", hint: "Each cost with its category, VAT and business share", dot: "bg-going" },
    { kind: "bills", label: "Bills", hint: "What you owe and what you've paid", dot: "bg-going" },
    { kind: "customers", label: "Customers", hint: "Names, emails and tax numbers", dot: "bg-ink" },
  ];

  return (
    <BizShell here="security">
      <BizHeading title="Security and data">
        How you sign in, where you&apos;re signed in, and what happens to {b.name}&apos;s data: bring it in, or take it out.
      </BizHeading>

      <Card id="signin-h" title="Signing in" sub={methods.email} aside={<ButtonLink variant="secondary" href="/app/settings/sign-in" className="min-h-10 px-4 text-sm">Sign-in methods</ButtonLink>}>
        <ul className="flex flex-col">
          <li className="flex flex-wrap items-center justify-between gap-3 border-t border-divider py-3.5">
            <span className="flex flex-col"><span className="font-semibold">Password</span><span className="text-[13px] text-muted">{methods.hasPassword ? "Set. Change it any time from Sign-in methods." : "Not set: you sign in with Google only."}</span></span>
            {methods.hasPassword ? <Badge tone="pos">On</Badge> : <Badge tone="neutral">Not set</Badge>}
          </li>
          <li className="flex flex-wrap items-center justify-between gap-3 border-t border-divider py-3.5">
            <span className="flex flex-col"><span className="font-semibold">Google</span><span className="text-[13px] text-muted">{methods.google ? `Connected as ${methods.google.email}` : methods.googleAvailable ? "Not connected" : "Not available on this BillingEase"}</span></span>
            {methods.google ? <Badge tone="pos">Connected</Badge> : <Badge tone="neutral">Off</Badge>}
          </li>
        </ul>
      </Card>

      <Card
        id="where-h"
        title="Where you're signed in"
        sub="Don't recognise one? Sign it out, then change your password."
        aside={others.length > 0 ? (
          <form action={endOtherSessions}><button className="inline-flex min-h-10 items-center rounded-full bg-ink/[0.07] px-4 text-sm font-semibold hover:bg-ink/[0.11]">Sign out everywhere else</button></form>
        ) : undefined}
      >
        <ul className="flex flex-col">
          {sessions.map((s) => {
            const d = device(s.userAgent);
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-3 border-t border-divider py-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface"><Icon d={d.phone ? PHONE : LAPTOP} size={20} /></span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{d.name}</span>
                  <span className="text-[13px] text-muted">{s.current ? "Active now" : ago(s.lastSeenAt, s.createdAt)} · Signed in {new Date(s.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                </span>
                {s.current ? (
                  <Badge tone="pos">This device</Badge>
                ) : (
                  <form action={endSession}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="inline-flex min-h-10 items-center rounded-full bg-ink/[0.07] px-4 text-sm font-semibold hover:bg-ink/[0.11]" aria-label={`Sign out ${d.name}`}>Sign out</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card id="law-h" title="Where your data lives" sub={law.sub} aside={<Badge tone="violet">{law.chip}</Badge>}>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["The law", law.law],
            ["Who can open it", "Only the people on People and access. Each one's access is checked again on every request, and taking it away works at once."],
            ["How long to keep it", `${law.keep} Export it any time below.`],
          ].map(([h, t]) => (
            <div key={h} className="flex flex-col gap-1.5 rounded-2xl border border-line p-4">
              <span className="text-sm font-semibold">{h}</span>
              <span className="text-[13.5px] leading-relaxed text-ink2">{t}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card id="import-h" title="Bring your customers in" sub="Moving from another app or a spreadsheet? Add a CSV with a name and an email column, one customer per row.">
        <ImportForm />
      </Card>

      <Card id="export-h" title="Take your data out" sub={<>It&apos;s yours. Each file is built from {b.name}&apos;s books right now and opens in any spreadsheet.</>}>
        <ul className="flex flex-col">
          {files.map((f) => (
            <li key={f.kind} className="flex flex-wrap items-center gap-3 border-t border-divider py-3.5">
              <span aria-hidden className={cx("size-2.5 shrink-0 rounded-full", f.dot)} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">{f.label}</span>
                <span className="truncate text-[13px] text-muted">{f.hint} · {exportName(b.name, f.kind, day)}</span>
              </span>
              <a href={`/app/settings/security/export/${f.kind}`} download className="inline-flex min-h-10 items-center gap-2 rounded-full bg-violet px-4 text-sm font-semibold hover:bg-[#a98ffb]">
                <Icon d={ICONS.download} size={16} />Download CSV
              </a>
            </li>
          ))}
        </ul>
      </Card>

      {!owner && (
        <p className="text-[13px] text-muted">Only the owner can change {b.name}&apos;s profile or who has access. <Link href="/app/settings/people" className="font-semibold underline underline-offset-4">People and access</Link></p>
      )}
    </BizShell>
  );
}
