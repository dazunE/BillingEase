import type { Metadata } from "next";
import { AuthFrame } from "@/components/auth/Frame";
import { BooksAreSafe } from "@/components/auth/panels";
import { pageCountry } from "@/components/auth/pageCountry";
import { ForgotForm, SignInLink } from "./ForgotForm";

export const metadata: Metadata = {
  title: "Forgot your password?",
  description: "Get a link by email to choose a new BillingEase password. Your books stay just as they are.",
};

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const { country: c } = await searchParams;
  const country = (await pageCountry(c)) ?? "uk";
  return <AuthFrame country={country} variant="forgot" topLink={<SignInLink />} card={<ForgotForm />} aside={<BooksAreSafe country={country} variant="forgot" />} />;
}
