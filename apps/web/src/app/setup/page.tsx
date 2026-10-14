import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isCty } from "@/components/auth/country";
import { requireMe } from "@/lib/session";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = {
  title: "Set up your business",
  description: "A few questions so BillingEase shows only what fits your business, in the United Kingdom or Sri Lanka.",
};

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const me = await requireMe();
  if (me.businesses.length > 0) redirect("/app");
  const { country } = await searchParams;
  return <SetupForm initialCountry={isCty(country) ? country : null} ownerName={me.user.name} email={me.user.email} />;
}
