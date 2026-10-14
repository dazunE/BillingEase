"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui";
import { AuthFrame, AuthTitle, FormError } from "@/components/auth/Frame";
import { AuthField, CountryCards, FieldError, PasswordField } from "@/components/auth/fields";
import { HowItWorks } from "@/components/auth/panels";
import type { Cty } from "@/components/auth/country";
import { signUp } from "../actions";

const COUNTRIES = {
  uk: { name: "United Kingdom", line: "Pounds · HMRC · MTD" },
  lk: { name: "Sri Lanka", line: "Rupees · IRD · EPF and ETF" },
};

const LEGAL = {
  terms: { title: "Terms, in short", body: "Your books are yours. BillingEase keeps them for you; your accountant prepares and files your returns from them." },
  privacy: { title: "Privacy, in short", body: "We use your details to run your account and never sell them. Your accountant sees your books only once you link them, and you can remove them any time." },
};

export function SignUpForm({ initialCountry }: { initialCountry?: Cty }) {
  const [state, action, pending] = useActionState(signUp, undefined);
  const v = state?.values ?? {};
  const e = state?.errors ?? {};
  const [country, setCountry] = useState<Cty | "">((v.country as Cty) || initialCountry || "");
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [legal, setLegal] = useState<keyof typeof LEGAL | null>(null);
  const side: Cty = country || "uk";

  const card = (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <AuthTitle title="Create your account." lead="Free to start. Setup takes about three minutes, and you can send an invoice today." />
      <CountryCards
        legend="Where is your business?"
        value={country}
        onChange={setCountry}
        names={COUNTRIES}
        error={e.country}
        hint="It sets your currency, tax year and tax rules, and can’t change later."
      />
      <AuthField label="Your name" name="name" autoComplete="name" defaultValue={v.name} error={e.name} required />
      <AuthField label="Work email" name="email" type="email" autoComplete="email" defaultValue={v.email} error={e.email} required
        hint="Customers see this address on your invoices. You can change it later." />
      <PasswordField label="Password" name="password" autoComplete="new-password" meter value={password} onValue={setPassword} shown={shown} onShown={setShown} error={e.password} />

      <div className="flex flex-col gap-1.5">
        <span className="flex items-start gap-2.5 text-sm leading-[1.45] text-ink2">
          <input id="su-terms" type="checkbox" name="terms" defaultChecked={v.terms === "on"} aria-invalid={e.terms ? true : undefined}
            className="mt-px size-[18px] flex-none cursor-pointer accent-ink" />
          <span>
            <label htmlFor="su-terms" className="cursor-pointer">I agree to the</label>{" "}
            <button type="button" aria-expanded={legal === "terms"} onClick={() => setLegal(legal === "terms" ? null : "terms")} className="font-semibold text-ink underline underline-offset-[3px]">Terms</button>{" "}
            and{" "}
            <button type="button" aria-expanded={legal === "privacy"} onClick={() => setLegal(legal === "privacy" ? null : "privacy")} className="font-semibold text-ink underline underline-offset-[3px]">Privacy notice</button>.
          </span>
        </span>
        {e.terms && <FieldError>{e.terms}</FieldError>}
        {legal && (
          <div className="flex flex-col gap-1.5 rounded-[14px] bg-bg px-3.5 py-3 text-[13px] leading-normal text-ink2">
            <strong className="text-ink">{LEGAL[legal].title}</strong>
            <span>{LEGAL[legal].body}</span>
            <button type="button" onClick={() => setLegal(null)} className="min-h-7 self-start font-semibold text-ink underline underline-offset-[3px]">Close</button>
          </div>
        )}
      </div>

      <FormError message={state?.message} />
      <Button disabled={pending} className="min-h-12">{pending ? "Creating your account…" : "Create account"}</Button>
      <Link href="/sign-in" className="self-center text-sm font-semibold underline underline-offset-2">I already have an account</Link>
    </form>
  );

  return (
    <AuthFrame
      country={side}
      variant="signup"
      topLink={<>Have an account? <Link href="/sign-in" className="font-semibold text-ink underline underline-offset-2">Sign in</Link></>}
      card={card}
      aside={<HowItWorks country={side} picked={!!country} />}
    />
  );
}
