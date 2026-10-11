import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui";

/** Two halves: the form, and a dark panel with the equation. Stacks on phones. */
export function AuthShell({ title, lead, children, aside }: { title: string; lead?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(420px,0.9fr)]">
      <div className="flex flex-col px-[clamp(16px,5vw,64px)] py-8">
        <Link href="/" aria-label="BillingEase home" className="self-start">
          <Logo />
        </Link>
        <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center gap-6 py-10">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold leading-[1.05] tracking-[-0.03em]">{title}</h1>
            {lead && <p className="text-[16px] leading-relaxed text-ink2">{lead}</p>}
          </div>
          {children}
        </main>
      </div>
      <aside className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        {aside ?? <Equation />}
        <p className="max-w-[380px] text-sm leading-relaxed text-white/70">
          Bookkeeping, invoicing and payroll for sole traders and landlords in the UK, and for businesses in Sri Lanka. Your accountant sees the same books.
        </p>
      </aside>
    </div>
  );
}

function Equation() {
  const row = "flex items-baseline justify-between gap-6 border-b border-white/15 py-5";
  return (
    <div className="mt-16 flex flex-col">
      <div className={row}><span className="text-lg text-white/80">Coming in</span><span className="h-3 w-40 rounded-full bg-violet" /></div>
      <div className={row}><span className="text-lg text-white/80">− Going out</span><span className="h-3 w-24 rounded-full bg-going" /></div>
      <div className="flex items-baseline justify-between gap-6 py-5"><span className="font-display text-2xl font-bold">= Yours to keep</span><span className="h-3 w-16 rounded-full bg-white" /></div>
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="rounded-xl bg-late-bg px-4 py-3 text-sm font-semibold text-late">{message}</p>;
}

export function FormNote({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="status" className="rounded-xl bg-pos-bg px-4 py-3 text-sm font-semibold text-pos">{message}</p>;
}
