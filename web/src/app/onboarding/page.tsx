import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { businesses } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { AuthShell } from "../(auth)/AuthShell";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = { title: "Set up your business" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const db = await getDb();
  const [biz] = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.ownerId, user.id));
  if (biz) redirect("/app");
  return (
    <AuthShell title={`Hi ${user.name.split(" ")[0]}, tell us about your business`} subtitle="Two questions, then you're in. You can change these later.">
      <SetupForm />
    </AuthShell>
  );
}
