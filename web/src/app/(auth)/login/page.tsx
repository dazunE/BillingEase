import type { Metadata } from "next";
import { AuthShell } from "../AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see your three numbers.">
      <LoginForm next={next} />
    </AuthShell>
  );
}
