import { auth } from "@billingease/contracts";
import type { Metadata } from "next";
import { BizShell } from "@/components/app/BizShell";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Button } from "@/components/ui";
import { load } from "@/lib/api";
import { GOOGLE_ERRORS } from "@/lib/google";
import { disconnectGoogle } from "./actions";
import { PasswordForm } from "./PasswordForm";

export const metadata: Metadata = { title: "Sign-in methods" };

const H2 = "font-display text-[22px] font-bold tracking-[-0.02em]";
const BOX = "flex flex-col gap-4 rounded-[20px] border border-line bg-white p-5";

const NOTES: Record<string, string> = {
  connected: "Google is connected. You can sign in with it from now on.",
  disconnected: "Google is disconnected. Sign in with your email and password.",
  last_method: "Google is the only way you sign in. Set a password first, then you can disconnect Google.",
};

/** How you sign in to BillingEase: Google, a password, or both. Covers every business you're in. */
export default async function SignInMethodsPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const m = await load(auth.signInMethods);
  const { google: code } = await searchParams;
  const good = code === "connected" || code === "disconnected";
  const note = code ? NOTES[code] ?? GOOGLE_ERRORS[code] ?? GOOGLE_ERRORS.google_failed : null;
  return (
    <BizShell here="security" sub="Sign-in methods">
      <div className="flex w-full max-w-[860px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-muted">Your account · {m.email}</span>
          <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold tracking-[-0.03em]">Sign-in methods</h1>
          <p className="text-ink2">These are yours, not a business&apos;s: they open every business you&apos;re in. You always keep at least one.</p>
        </div>
        {note && <p role={good ? "status" : "alert"} className={good ? "rounded-2xl bg-pos-bg px-4 py-3 text-sm font-semibold text-pos" : "rounded-2xl bg-late-bg px-4 py-3 text-sm font-semibold text-late"}>{note}</p>}

        <section aria-labelledby="google-h" className={BOX}>
          <h2 id="google-h" className={H2}>Google</h2>
          {m.google ? (
            <>
              <p className="text-sm text-ink2">Connected to <strong className="text-ink">{m.google.email}</strong>. Use <em>Continue with Google</em> on the sign-in page.</p>
              <form action={disconnectGoogle}>
                <Button type="submit" variant="secondary" disabled={!m.hasPassword}>Disconnect Google</Button>
              </form>
              {!m.hasPassword && <p className="text-[13px] text-muted">Set a password below before you disconnect Google, so you can still sign in.</p>}
            </>
          ) : m.googleAvailable ? (
            <>
              <p className="text-sm text-ink2">Sign in with your Google account instead of typing a password. It can be a different email from {m.email}.</p>
              <div className="self-start"><GoogleButton href="/auth/google?intent=link" label="Connect Google" /></div>
            </>
          ) : (
            <p className="text-sm text-ink2">Signing in with Google isn&apos;t set up on this BillingEase.</p>
          )}
        </section>

        <section aria-labelledby="pw-h" className={BOX}>
          <h2 id="pw-h" className={H2}>Password</h2>
          <p className="text-sm text-ink2">{m.hasPassword ? "Change the password you sign in with." : "You sign in with Google only. Set a password to also sign in with your email."}</p>
          <PasswordForm hasPassword={m.hasPassword} />
        </section>
      </div>
    </BizShell>
  );
}
