"use client";

import Link from "next/link";
import { CashJar } from "@/components/CashJar";
import { COUNTRY_META, signUpHref } from "@/content/site/country";
import { CLOSING } from "@/content/site/home";
import { ROUTES } from "@/content/site/routes";
import { useSample } from "./SampleProvider";

/** The dark closing band on the home page; its number follows the sample business picked in the hero. */
export function ClosingBand() {
  const { b, n, roll, country } = useSample();
  const meta = COUNTRY_META[country];
  return (
    <div className="flex w-full flex-wrap items-center gap-x-12 gap-y-8">
      <div className="flex min-w-0 flex-[999_1_420px] flex-col items-start gap-6">
        <span className="flex items-center gap-2 text-sm font-semibold text-tint">
          <span className="size-2.5 rounded-full bg-violet" aria-hidden />
          {CLOSING.kicker(b.name, meta.yearWord)}
        </span>
        <h2 id="close-h" className="max-w-[900px] text-balance font-display text-[clamp(36px,5.6vw,76px)] font-bold leading-[1.02] tracking-[-0.04em] text-violet">
          {CLOSING.title(roll(n.keep))}
        </h2>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link href={signUpHref(country)} className="inline-flex min-h-14 items-center gap-2.5 rounded-full bg-violet px-[30px] text-[17px] font-bold text-ink hover:bg-[#a98ffb]">
            {CLOSING.cta}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link href={ROUTES.signIn.href} className="inline-flex min-h-11 items-center text-[15px] font-semibold text-white underline underline-offset-[3px]">
            {CLOSING.signIn}
          </Link>
        </div>
      </div>
      <div className="flex flex-[1_1_280px] justify-center">
        <CashJar size={400} amount={roll(n.keep)} line="#EEE8FF" sym={meta.sym} taxPct={`${Math.round((n.tax / n.profit) * 100)}%`} />
      </div>
    </div>
  );
}
