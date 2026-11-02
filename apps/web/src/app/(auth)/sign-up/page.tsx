import type { Metadata } from "next";
import { pageCountry } from "@/components/auth/pageCountry";
import { googleEnabled } from "@/lib/google";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Start BillingEase for your business in the United Kingdom, Sri Lanka or the United States. Free to start; setup takes about three minutes.",
};

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ country?: string; next?: string }> }) {
  const { country, next } = await searchParams;
  const join = next && next.startsWith("/invite/") ? next : undefined;
  return <SignUpForm initialCountry={await pageCountry(country)} google={googleEnabled()} next={join} />;
}
