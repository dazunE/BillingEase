"use client";

import { CashJar } from "@/components/CashJar";
import s from "./landing.module.css";
import { useSample } from "./SampleProvider";

/** Money flowing in from customers, out to bills and team, and settling in the jar. Decorative. */
export function HeroScene() {
  const { b, n, roll } = useSample();
  const ins = b.scene.ins;
  const outs = b.scene.outs;
  return (
    <div className={`${s.anim} mx-auto flex w-full max-w-[1080px] items-center`} aria-hidden>
      <div className="flex flex-[0_0_180px] flex-col gap-2.5 max-[760px]:hidden">
        {ins.map(([i, name]) => (
          <span key={name} className="flex h-11 items-center gap-2.5 overflow-hidden whitespace-nowrap rounded-full border border-line bg-white pl-1.5 pr-3.5 text-[13px] font-semibold">
            <span className="flex size-8 flex-none items-center justify-center rounded-full bg-tint text-[11px] font-bold">{i}</span>
            {name}
          </span>
        ))}
      </div>
      <div className="flex min-w-[70px] flex-[1_1_120px] flex-col gap-2.5 overflow-hidden px-1.5">
        <span className="text-center text-[11px] font-bold tracking-[0.02em] text-muted">FROM CUSTOMERS</span>
        {ins.map(([, name, amt], i) => (
          <span key={name} className="relative block h-[34px]">
            <span className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-coming-light" />
            <span
              className={`${s.slideIn} absolute left-[40%] top-1 -ml-[34px] inline-flex h-[26px] items-center whitespace-nowrap rounded-full bg-coming px-2.5 text-xs font-bold text-white`}
              style={{ animationDelay: `${-i * 1.2}s` }}
            >
              {amt}
            </span>
          </span>
        ))}
      </div>
      <div className="flex min-w-[150px] flex-[0_1_380px] flex-col items-center">
        <CashJar size={380} amount={roll(n.keep)} />
      </div>
      <div className="flex min-w-[70px] flex-[1_1_120px] flex-col gap-2.5 overflow-hidden px-1.5">
        <span className="text-center text-[11px] font-bold tracking-[0.02em] text-muted">TO BILLS &amp; TEAM</span>
        {outs.map(([name, amt], i) => (
          <span key={name} className="relative block h-[34px]">
            <span className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-going-light" />
            <span
              className={`${s.slideOut} absolute left-[40%] top-1 -ml-[34px] box-border inline-flex h-[26px] items-center whitespace-nowrap rounded-full border border-going bg-going-tint px-2.5 text-xs font-bold`}
              style={{ animationDelay: `${-i * 1.4 - 0.6}s` }}
            >
              {amt}
            </span>
          </span>
        ))}
      </div>
      <div className="flex flex-[0_0_150px] flex-col gap-2.5 max-[760px]:hidden">
        {outs.map(([name]) => (
          <span key={name} className="flex h-11 items-center gap-2.5 overflow-hidden whitespace-nowrap rounded-full border border-line bg-white px-3.5 text-[13px] font-semibold">
            <span className="size-2 flex-none rounded-full bg-going" />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
