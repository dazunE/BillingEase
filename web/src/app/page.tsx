import type { Metadata } from "next";
import Link from "next/link";
import { ClosingBand } from "@/components/landing/ClosingBand";
import { Faq } from "@/components/landing/Faq";
import { HeroEquation } from "@/components/landing/HeroEquation";
import { HeroScene } from "@/components/landing/HeroScene";
import { BankScene, BillScene, KeepScene, MayaAtDesk, PriceTag, ThinkingPerson } from "@/components/landing/Illustrations";
import { NeedsYouDemo } from "@/components/landing/NeedsYouDemo";
import { SampleProvider } from "@/components/landing/SampleProvider";
import { Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: { absolute: "BillingEase · Your whole business in three numbers" },
};

const wrap = "mx-auto box-border max-w-[1200px] px-[clamp(16px,4vw,40px)]";
const h2 = "font-display text-[clamp(32px,4.2vw,56px)] font-bold leading-[1.05] tracking-[-0.035em]";

const FREE = ["Your three numbers, always up to date", "Unlimited invoices and customers", "Unlimited receipt scanning", "Unlimited bookkeeping and reports"];
const PRO = ["Automatic bank and card sync", "Automatic payment reminders", "Payroll add-on available"];

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Tick() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 flex-none">
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

export default async function Landing() {
  const user = await currentUser();

  return (
    <div className="min-h-screen overflow-x-clip bg-bg text-ink [scroll-behavior:smooth]">
      <header className="bg-bg">
        <nav aria-label="Main" className={`${wrap} flex items-center gap-x-[clamp(8px,2vw,28px)] gap-y-3 py-4`}>
          <Link href="/" className="flex-none" aria-label="BillingEase home">
            <Logo />
          </Link>
          <div className="flex items-center gap-6 text-[15px] font-semibold max-[640px]:hidden">
            <a href="#how" className="text-ink2 hover:text-ink">
              How it works
            </a>
            <a href="#pricing" className="text-ink2 hover:text-ink">
              Pricing
            </a>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {user ? (
              <Link href="/app" className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-ink px-[clamp(14px,1.6vw,20px)] text-[15px] font-semibold text-white hover:bg-black">
                Open BillingEase
              </Link>
            ) : (
              <>
                <Link href="/login" className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-[clamp(8px,1vw,14px)] text-[15px] font-semibold hover:bg-ink/[0.05]">
                  Sign in
                </Link>
                <Link href="/signup" className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-ink px-[clamp(14px,1.6vw,20px)] text-[15px] font-semibold text-white hover:bg-black">
                  Try it free
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <SampleProvider>
        <main>
          {/* Hero: the concept itself */}
          <section aria-labelledby="hero-h" className={`${wrap} flex flex-col gap-9 pb-[clamp(64px,9vw,120px)] pt-[clamp(40px,7vw,96px)]`}>
            <div className="flex flex-col items-center gap-[18px] text-center">
              <h1 id="hero-h" className="max-w-[980px] font-display text-[clamp(40px,6.6vw,88px)] font-bold leading-[1.02] tracking-[-0.035em]">
                Your whole business in three numbers.
              </h1>
              <p className="max-w-[640px] text-balance text-[clamp(17px,1.6vw,20px)] leading-normal text-ink2">
                BillingEase does the bookkeeping quietly in the background. You just see what’s coming in, what’s going out, and what’s yours to keep.
              </p>
            </div>
            <HeroScene />
            <div className="flex flex-col gap-[18px]">
              <HeroEquation />
              <div className="flex flex-wrap items-center justify-center gap-x-[18px] gap-y-2.5 pt-2.5">
                <Link href="/signup" className="inline-flex min-h-14 items-center gap-2.5 rounded-full bg-violet px-[30px] text-[17px] font-bold hover:bg-[#a98ffb]">
                  See your three numbers
                  <Arrow />
                </Link>
                <span className="text-sm text-muted">Free to start. No card needed.</span>
              </div>
            </div>
          </section>

          {/* We only ask when we need you */}
          <section aria-labelledby="ask-h" className="border-y border-line bg-white">
            <div className={`${wrap} flex flex-col gap-10 py-[clamp(64px,9vw,120px)]`}>
              <div className="flex flex-wrap items-center justify-between gap-x-12 gap-y-6">
                <div className="flex max-w-[680px] flex-[1_1_420px] flex-col gap-3">
                  <h2 id="ask-h" className={`${h2} text-balance`}>
                    We only ask when we need you.
                  </h2>
                  <p className="text-lg leading-normal text-ink2">
                    Most days BillingEase sorts things out on its own. When it can’t, you get a short list. Try it: this is Maya’s Sunday morning at Northwind Studio.
                  </p>
                </div>
                <MayaAtDesk />
              </div>
              <NeedsYouDemo />
            </div>
          </section>

          {/* How it works */}
          <section id="how" aria-labelledby="how-h" className={`${wrap} flex scroll-mt-4 flex-col gap-10 py-[clamp(64px,9vw,120px)]`}>
            <h2 id="how-h" className={h2}>
              How it works
            </h2>
            <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-4">
              <Step n={1} title="Connect your bank" body="Transactions flow in and sort themselves every morning.">
                <BankScene />
              </Step>
              <Step n={2} title="Bill and get paid" body="Write a sentence; customers pay online and get reminded for you.">
                <BillScene />
              </Step>
              <Step n={3} title="Keep what’s yours" body="Tax is set aside as you earn, so the rest is truly yours.">
                <KeepScene />
              </Step>
            </ol>
          </section>

          {/* Pricing */}
          <section id="pricing" aria-labelledby="price-h" className="scroll-mt-4 border-y border-line bg-white">
            <div className={`${wrap} flex flex-col gap-10 py-[clamp(64px,9vw,120px)]`}>
              <div className="flex max-w-[720px] flex-col gap-3">
                <h2 id="price-h" className={h2}>
                  Pricing
                </h2>
                <p className="text-lg leading-normal text-ink2">Two plans. No trial clock.</p>
              </div>
              <div className="grid max-w-[900px] grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4">
                <div className="relative flex flex-col gap-[22px] rounded-3xl border border-line p-8">
                  <PriceTag fill="#FFF6E0" text="free" size={22} />
                  <span className="flex flex-col gap-1.5">
                    <span className="text-base font-bold">Free</span>
                    <span className="font-display text-[56px] font-bold leading-none tracking-[-0.04em]">$0</span>
                    <span className="text-sm text-muted">For as long as you like</span>
                  </span>
                  <ul className="flex flex-col gap-2.5 text-[15px]">
                    {FREE.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Tick />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="mt-auto inline-flex min-h-12 items-center justify-center rounded-full bg-ink/[0.07] px-[22px] text-[15px] font-semibold hover:bg-ink/[0.11]">
                    Start free
                  </Link>
                </div>
                <div className="relative flex flex-col gap-[22px] rounded-3xl border-2 border-ink p-[31px]">
                  <PriceTag fill="#B9A3FF" text="$19" size={24} delay="-1.6s" />
                  <span className="flex flex-col gap-1.5">
                    <span className="text-base font-bold">Pro</span>
                    <span className="flex items-baseline gap-1.5">
                      <span className="font-display text-[56px] font-bold leading-none tracking-[-0.04em]">$19</span>
                      <span className="text-base text-ink2">/ month</span>
                    </span>
                    <span className="text-sm text-muted">Everything in Free, plus</span>
                  </span>
                  <ul className="flex flex-col gap-2.5 text-[15px]">
                    {PRO.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Tick />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="mt-auto inline-flex min-h-12 items-center justify-center rounded-full bg-violet px-[22px] text-[15px] font-semibold hover:bg-[#a98ffb]">
                    Start with Pro
                  </Link>
                </div>
              </div>
              <p className="max-w-[720px] text-[15px] leading-relaxed text-ink2">
                When customers pay you online, there’s a fee per payment on either plan: 2.9% + 30¢ for cards and 1% for bank transfers. Nothing if they pay you another way.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section aria-labelledby="faq-h" className={`${wrap} flex flex-wrap gap-x-16 gap-y-8 py-[clamp(64px,9vw,120px)]`}>
            <div className="flex flex-[1_1_280px] flex-col gap-6">
              <h2 id="faq-h" className={h2}>
                Fair questions
              </h2>
              <ThinkingPerson />
            </div>
            <Faq />
          </section>

          {/* Closing band */}
          <section aria-labelledby="close-h" className="px-[clamp(16px,4vw,40px)] pb-[clamp(48px,6vw,80px)]">
            <div className="mx-auto box-border flex max-w-[1200px] flex-col items-start gap-6 rounded-[32px] bg-ink px-[clamp(24px,6vw,80px)] py-[clamp(40px,7vw,96px)]">
              <ClosingBand />
            </div>
          </section>
        </main>
      </SampleProvider>

      <footer className={`${wrap} flex flex-wrap items-center justify-between gap-x-6 gap-y-4 pb-10 pt-2 text-sm text-ink2`}>
        <span className="flex items-center gap-2.5">
          <span className="flex size-6 items-center justify-center rounded-lg bg-violet">
            <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
              <path d="M5 19 11 5h8l-6 14z" fill="#18161F" />
            </svg>
          </span>
          <span>© 2026 BillingEase</span>
        </span>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <a href="#how" className="inline-flex min-h-9 items-center px-2 font-semibold hover:text-ink">
            How it works
          </a>
          <a href="#pricing" className="inline-flex min-h-9 items-center px-2 font-semibold hover:text-ink">
            Pricing
          </a>
          {user ? (
            <Link href="/app" className="inline-flex min-h-9 items-center px-2 font-semibold hover:text-ink">
              Open BillingEase
            </Link>
          ) : (
            <>
              <Link href="/login" className="inline-flex min-h-9 items-center px-2 font-semibold hover:text-ink">
                Sign in
              </Link>
              <Link href="/signup" className="inline-flex min-h-9 items-center px-2 font-semibold hover:text-ink">
                Create an account
              </Link>
            </>
          )}
        </nav>
      </footer>
    </div>
  );
}

function Step({ n, title, body, children }: { n: number; title: string; body: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-[22px] rounded-3xl border border-line bg-white p-7">
      <span className="font-display text-[56px] font-bold leading-none tracking-[-0.04em]" aria-hidden>
        {n}
      </span>
      <span className="flex flex-col gap-1.5">
        <span className="font-display text-[22px] font-bold tracking-[-0.02em]">{title}</span>
        <span className="text-[15px] leading-normal text-ink2">{body}</span>
      </span>
      {children}
    </li>
  );
}
