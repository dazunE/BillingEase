import type { Metadata } from "next";
import { AuthShell } from "../AuthShell";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const { country } = await searchParams;
  return (
    <AuthShell title="Create your account" lead="Free to start. You can invite your accountant once you're in.">
      <SignUpForm initialCountry={country === "uk" || country === "lk" ? country : undefined} />
    </AuthShell>
  );
}
