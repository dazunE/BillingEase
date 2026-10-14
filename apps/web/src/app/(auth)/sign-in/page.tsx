import type { Metadata } from "next";
import Link from "next/link";
import { AuthFrame } from "@/components/auth/Frame";
import { JustAsYouLeft } from "@/components/auth/panels";
import { isCty } from "@/components/auth/country";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to BillingEase to see where your three numbers stand today.",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; country?: string }> }) {
  const { next, country: c } = await searchParams;
  const country = isCty(c) ? c : "uk";
  return (
    <AuthFrame
      country={country}
      variant="signin"
      topLink={<>New here? <Link href="/sign-up" className="font-semibold text-ink underline underline-offset-2">Create an account</Link></>}
      card={<SignInForm next={next} />}
      aside={<JustAsYouLeft country={country} />}
    />
  );
}
