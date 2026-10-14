import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../AuthShell";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Choose a new password">
      {token ? <ResetForm token={token} /> : <p className="text-ink2">This link is missing its code. <Link href="/forgot-password" className="font-semibold underline">Ask for a new link.</Link></p>}
    </AuthShell>
  );
}
