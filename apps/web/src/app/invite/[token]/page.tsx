import { people, type InvitePreview } from "@billingease/contracts";
import { rulesFor } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { ButtonLink, Logo } from "@/components/ui";
import { ApiFailure, call } from "@/lib/api";
import { currentMe } from "@/lib/session";
import { AcceptButton } from "./AcceptButton";

export const metadata: Metadata = { title: "Your invitation", robots: { index: false } };

const ROLE = { accountant: "accountant", admin: "office admin" } as const;
const STATE = {
  expired: "This invitation has expired. Ask whoever sent it for a new one.",
  used: "This invitation was already accepted.",
  revoked: "This invitation was cancelled.",
} as const;

/** Where an invitation email's link lands: who invited you to what, then sign in and accept. */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let invite: InvitePreview | null = null;
  try {
    invite = await call(people.invitePreview, { params: { token }, token: null });
  } catch (err) {
    if (!(err instanceof ApiFailure)) throw err;
  }
  const me = await currentMe();
  const here = `/invite/${encodeURIComponent(token)}`;
  const role = invite ? (invite.country === "lk" && invite.role === "accountant" ? "tax practitioner" : ROLE[invite.role]) : "";
  const already = !!invite && !!me && me.businesses.some((b) => b.name === invite.businessName);
  const wrongPerson = !!invite && !!me && me.user.email.toLowerCase() !== invite.email;

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto flex max-w-[640px] items-center justify-between gap-4 px-[clamp(16px,4vw,40px)] pt-5">
        <Link href="/" aria-label="BillingEase home" className="no-underline"><Logo /></Link>
      </div>
      <main className="mx-auto flex max-w-[640px] flex-col gap-6 px-[clamp(16px,4vw,40px)] pb-16 pt-10">
        {!invite ? (
          <section className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-7">
            <h1 className="font-display text-[clamp(26px,4vw,34px)] font-bold tracking-[-0.03em]">That link isn&apos;t right</h1>
            <p className="text-ink2">Check you copied the whole link from the email, or ask for a new invitation.</p>
            <ButtonLink href="/sign-in" variant="secondary" className="self-start">Sign in</ButtonLink>
          </section>
        ) : (
          <section className="flex flex-col gap-5 rounded-3xl border border-line bg-white p-7">
            <span className="flex size-12 items-center justify-center rounded-[14px] bg-ink font-display text-xl font-bold text-violet" aria-hidden>{invite.businessName.trim()[0]?.toUpperCase()}</span>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-muted">{rulesFor(invite.country).name} business</span>
              <h1 className="font-display text-[clamp(26px,4vw,36px)] font-bold leading-[1.1] tracking-[-0.03em]">
                {invite.invitedBy ?? "The owner"} invited you to {invite.businessName}&apos;s books
              </h1>
              <p className="text-ink2">As their {role}: you&apos;ll see and help with the records, reports and tax. Only the owner changes the business&apos;s settings.</p>
            </div>
            {invite.state !== "ok" ? (
              <p role="status" className="rounded-2xl bg-due-bg p-4 text-sm font-semibold text-due">{STATE[invite.state]}</p>
            ) : !me ? (
              <div className="flex flex-col gap-3">
                <p className="text-[15px]">The invitation is for <strong>{invite.email}</strong>. Sign in, or create an account, with that email.</p>
                <div className="flex flex-wrap gap-2.5">
                  <ButtonLink href={`/sign-in?next=${encodeURIComponent(here)}`}>Sign in to accept</ButtonLink>
                  <ButtonLink href={`/sign-up?next=${encodeURIComponent(here)}`} variant="secondary">Create an account</ButtonLink>
                </div>
              </div>
            ) : wrongPerson ? (
              <div className="flex flex-col gap-3">
                <p className="text-[15px]">You&apos;re signed in as <strong>{me.user.email}</strong>, but this invitation is for <strong>{invite.email}</strong>.</p>
                <form action={signOut}><button className="inline-flex min-h-11 items-center rounded-full bg-ink/[0.07] px-5 text-[15px] font-semibold hover:bg-ink/[0.11]">Sign out and use {invite.email}</button></form>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-[15px]">Signed in as <strong>{me.user.email}</strong>.</p>
                <AcceptButton token={token} label={already ? `Open ${invite.businessName}` : `Accept and open ${invite.businessName}`} />
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
