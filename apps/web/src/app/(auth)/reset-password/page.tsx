import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { AuthFrame, AuthTitle } from "@/components/auth/Frame";
import { BooksAreSafe } from "@/components/auth/panels";
import { pageCountry } from "@/components/auth/pageCountry";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Choose a new BillingEase password from the link we emailed you.",
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; country?: string }> }) {
  const { token, country: c } = await searchParams;
  const country = (await pageCountry(c)) ?? "uk";
  const card = token ? (
    <ResetForm token={token} />
  ) : (
    <div className="flex flex-col gap-5">
      <AuthTitle title="This link is missing its code." lead="Open the link from the email again, or ask for a new one. Each link works for one hour." />
      <ButtonLink href="/forgot-password" className="min-h-12">Ask for a new link</ButtonLink>
    </div>
  );
  return (
    <AuthFrame
      country={country}
      variant="reset"
      topLink={<>Remembered it? <Link href="/sign-in" className="font-semibold text-ink underline underline-offset-2">Sign in</Link></>}
      card={card}
      aside={<BooksAreSafe country={country} variant="reset" />}
    />
  );
}
