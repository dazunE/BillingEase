"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { endSession, hashPassword, startSession, verifyPassword } from "@/lib/auth";

export type AuthState = { errors?: Record<string, string>; values?: Record<string, string> } | undefined;

const signupSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(12, "Use at least 12 characters."),
  terms: z.literal("on", { message: "Please agree to the terms to continue." }),
});

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = signupSchema.safeParse(raw);
  const values = { name: raw.name ?? "", email: raw.email ?? "" };
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const db = await getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email));
  if (existing) return { errors: { email: "There's already an account with this email. Sign in instead." }, values };

  const [user] = await db
    .insert(users)
    .values({ name: parsed.data.name, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password) })
    .returning({ id: users.id });
  await startSession(user.id);
  redirect("/onboarding");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = loginSchema.safeParse(raw);
  const values = { email: raw.email ?? "" };
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email));
  // Same message either way, so the form doesn't reveal which emails have accounts.
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { errors: { form: "That email and password don't match." }, values };
  }
  await startSession(user.id);
  const next = raw.next && raw.next.startsWith("/app") ? raw.next : "/app";
  redirect(next);
}

export async function logout() {
  await endSession();
  redirect("/login");
}
