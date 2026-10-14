import type { Metadata } from "next";
import { isCty } from "@/components/auth/country";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Start BillingEase for your business in the United Kingdom or Sri Lanka. Free to start; setup takes about three minutes.",
};

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const { country } = await searchParams;
  return <SignUpForm initialCountry={isCty(country) ? country : undefined} />;
}
