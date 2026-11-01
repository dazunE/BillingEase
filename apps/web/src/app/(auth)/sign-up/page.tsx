import type { Metadata } from "next";
import { pageCountry } from "@/components/auth/pageCountry";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Start BillingEase for your business in the United Kingdom, Sri Lanka or the United States. Free to start; setup takes about three minutes.",
};

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const { country } = await searchParams;
  return <SignUpForm initialCountry={await pageCountry(country)} />;
}
