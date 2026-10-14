import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui";
import { requireMe } from "@/lib/session";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = { title: "Set up your business" };

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
  const me = await requireMe();
  if (me.businesses.length > 0) redirect("/app");
  const { country } = await searchParams;
  const c = country === "lk" ? "lk" : country === "uk" ? "uk" : null;
  return (
    <div className="min-h-screen bg-bg px-[clamp(16px,5vw,64px)] py-8">
      <Logo />
      <main className="mx-auto flex max-w-[720px] flex-col gap-6 py-10">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-muted">{c === "lk" ? "Sri Lanka" : c === "uk" ? "United Kingdom" : "One more step"}</span>
          <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold leading-[1.05] tracking-[-0.03em]">Tell us about your business</h1>
          <p className="text-ink2">This sets up your categories, tax and invoices. You can change the details later in Business profile.</p>
        </div>
        {c ? (
          <div className="rounded-3xl border border-line bg-white p-[clamp(20px,4vw,36px)]"><SetupForm country={c} ownerName={me.user.name} /></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/setup?country=uk" className="rounded-3xl border border-line bg-white p-6 hover:border-ink"><div className="font-display text-xl font-bold">United Kingdom</div><p className="text-sm text-muted">Pounds, MTD quarters, VAT</p></Link>
            <Link href="/setup?country=lk" className="rounded-3xl border border-line bg-white p-6 hover:border-ink"><div className="font-display text-xl font-bold">Sri Lanka</div><p className="text-sm text-muted">Rupees, VAT and SSCL, payroll</p></Link>
          </div>
        )}
      </main>
    </div>
  );
}
