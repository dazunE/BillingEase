import Link from "next/link";
import { Logo } from "@/components/ui";

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <Logo />
      <h1 className="font-display text-5xl font-bold tracking-[-0.035em]">Your whole business in three numbers.</h1>
      <div className="flex gap-3">
        <Link href="/signup" className="inline-flex min-h-12 items-center rounded-full bg-violet px-6 font-semibold">See your three numbers</Link>
        <Link href="/login" className="inline-flex min-h-12 items-center rounded-full bg-ink/[0.07] px-6 font-semibold">Sign in</Link>
      </div>
    </main>
  );
}
