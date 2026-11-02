import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthFrame } from "@/components/auth/Frame";
import { JustAsYouLeft } from "@/components/auth/panels";
import { pageCountry } from "@/components/auth/pageCountry";
import { readTwoStep } from "@/lib/session";
import { CodeForm } from "./CodeForm";

export const metadata: Metadata = { title: "Enter your code", robots: { index: false } };

export default async function SignInCodePage() {
  if (!(await readTwoStep())) redirect("/sign-in");
  const country = (await pageCountry(undefined)) ?? "uk";
  return (
    <AuthFrame
      country={country}
      variant="signin"
      topLink={<>Not you? <Link href="/sign-in" className="font-semibold text-ink underline underline-offset-2">Sign in again</Link></>}
      card={<CodeForm />}
      aside={<JustAsYouLeft country={country} />}
    />
  );
}
