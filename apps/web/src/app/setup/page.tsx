import type { Metadata } from "next";
import { isCty } from "@/components/auth/country";
import { requireMe } from "@/lib/session";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = {
  title: "Set up a business",
  description: "A few questions so BillingEase shows only what fits your business, in the United Kingdom or Sri Lanka.",
};

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  // Also where someone with a business already adds another (each has its own country and books).
  const me = await requireMe();
  const { country } = await searchParams;
  return <SetupForm initialCountry={isCty(country) ? country : null} ownerName={me.user.name} email={me.user.email} adding={me.businesses.length > 0} />;
}
