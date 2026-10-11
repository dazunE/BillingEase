"use client";

import Link from "next/link";
import { CashJar } from "@/components/CashJar";
import { useSample } from "./SampleProvider";

/** The dark closing band; its number follows the sample business picked in the hero. */
export function ClosingBand() {
  const { b, n, roll } = useSample();
  return (
    <div className="flex w-full flex-wrap items-center gap-x-12 gap-y-8">
      <div className="flex min-w-0 flex-[999_1_420px] flex-col items-start gap-6">
        <span className="flex items-center gap-2 text-sm font-semibold text-tint">
          <span className="size-2.5 rounded-full bg-violet" aria-hidden />
          {b.caption.split(",")[0]} this October
        </span>
        <h2 id="close-h" className="max-w-[900px] font-display text-[clamp(36px,5.6vw,76px)] font-bold leading-[1.02] tracking-[-0.04em] text-violet">
          {roll(n.keep)} is yours to keep. What’s yours?
        </h2>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link href="/signup" className="inline-flex min-h-14 items-center gap-2.5 rounded-full bg-violet px-[30px] text-[17px] font-bold text-ink hover:bg-[#a98ffb]">
            See your three numbers
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link href="/login" className="text-[15px] font-semibold text-white underline underline-offset-[3px]">
            I already have an account
          </Link>
        </div>
      </div>
      <div className="flex flex-[1_1_280px] justify-center">
        <CashJar size={400} amount={roll(n.keep)} line="#EEE8FF" />
      </div>
    </div>
  );
}
