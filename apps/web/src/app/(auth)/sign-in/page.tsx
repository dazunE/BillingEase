import type { Metadata } from "next";
import { AuthShell } from "../AuthShell";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell title="Welcome back" lead="Sign in to your books.">
      <SignInForm next={next} />
    </AuthShell>
  );
}
