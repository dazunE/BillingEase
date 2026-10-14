"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cx } from "@/components/ui";
import { money, type SiteCountry } from "@/content/site/country";
import type { HeroEvent } from "@/content/site/features";
import { CHIP } from "./cls";
import s from "./product.module.css";

type Play = { name: string; period: string; start: { in: number; out: number }; taxShare: number; taxWord: string; events: HeroEvent[] };

/**
 * /features hero: a sample business's three numbers easing as the week happens
 * (prototype SiteFeatures hero). Plays once; Pause / Play / Replay. Under
 * reduced motion it shows the end state.
 */
export function FeaturesPlayer({ country, play }: { country: SiteCountry; play: Play }) {
  const N = play.events.length;
  const [step, setStep] = useState(2);
  const [prev, setPrev] = useState(2);
  const [tw, setTw] = useState(1);
  const [playing, setPlaying] = useState(true);
  const tick = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef(0);

  const go = useCallback((from: number, to: number) => {
    setPrev(from);
    setStep(to);
    setTw(0);
    cancelAnimationFrame(raf.current);
    const t0 = performance.now();
    const f = (t: number) => {
      const p = Math.min(1, (t - t0) / 700);
      setTw(p);
      if (p < 1) raf.current = requestAnimationFrame(f);
    };
    raf.current = requestAnimationFrame(f);
  }, []);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off sync with a media query
      setStep(N);
      setPrev(N);
      setPlaying(false);
    }
  }, [N]);

  useEffect(() => {
    if (!playing) return;
    if (step >= N) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the player stops at the end
      setPlaying(false);
      return;
    }
    tick.current = setTimeout(() => go(step, step + 1), 2200);
    return () => {
      if (tick.current) clearTimeout(tick.current);
    };
  }, [playing, step, N, go]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const totals = (k: number) => {
    let i = play.start.in;
    let o = play.start.out;
    play.events.slice(0, k).forEach((e) => {
      if (e.k === "in") i += e.v;
      else o += e.v;
    });
    return { in: i, out: o };
  };
  const a = totals(prev);
  const b = totals(step);
  const end = totals(N);
  const k = 1 - Math.pow(1 - tw, 3);
  const vin = a.in + (b.in - a.in) * k;
  const vout = a.out + (b.out - a.out) * k;
  const profit = vin - vout;
  const tax = Math.max(0, Math.round(profit * play.taxShare));
  const keep = profit - tax;
  const max = end.in * 1.05;

  const rows = [
    { label: "Coming in", val: money(vin, country), pct: (vin / max) * 100, dot: "bg-coming", sub: "Paid and still to come from customers", dark: false },
    { label: "Going out", val: money(vout, country), pct: (vout / max) * 100, dot: "bg-going", sub: "Paid and still to pay, bills and payroll included", dark: false },
    { label: "Yours to keep", val: money(keep, country), pct: Math.max(0, (keep / max) * 100), dot: "bg-violet", sub: `After ${money(tax, country)} estimated ${play.taxWord}`, dark: true },
  ];
  const href = ["#coming-in", "#going-out", "#keep"];
  const done = play.events.slice(0, step);
  const fmt = (e: HeroEvent) => ({ t: e.t, a: (e.k === "in" ? "+" : "−") + money(e.v, country), bg: e.k === "in" ? "bg-tint" : "bg-going-tint" });
  const latest = done.length ? fmt(done[done.length - 1]) : { t: "Waiting for the first entry of the day", a: "", bg: "bg-bg" };
  const day = done.length ? done[done.length - 1].day : "1 Oct";

  const toggle = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (step >= N) {
      setStep(0);
      setPrev(0);
      setTw(1);
      setPlaying(true);
      return;
    }
    go(step, step + 1);
    setPlaying(true);
  };
  const label = playing ? "Pause" : step >= N ? "Replay the week" : "Play";
  const icon = playing ? "M8 5v14M16 5v14" : step >= N ? "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" : "M7 4v16l13-8z";

  return (
    <div
      role="group"
      aria-label={`${play.name}’s three numbers, updating as the month happens (sample business)`}
      className="box-border flex min-w-0 max-w-[560px] flex-[1_1_420px] flex-col gap-3.5 rounded-3xl border border-line bg-white p-[clamp(20px,2.4vw,28px)] shadow-[0_30px_60px_-30px_rgba(24,22,31,0.25)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-[15px] font-bold">{play.name}</span>
          <span className="text-[13px] text-muted">
            {play.period} · {day} · sample business
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-pos-bg px-2.5 py-1 text-xs font-semibold text-pos">
          <span aria-hidden className={cx("size-1.5 rounded-full bg-pos", s.pulse)} />
          Up to date
        </span>
      </div>
      {rows.map((r, i) => (
        <a key={r.label} href={href[i]} className={cx("flex flex-col gap-2 rounded-[18px] px-4 py-3.5", r.dark ? "bg-ink text-white" : "bg-bg")}>
          <span className="flex items-baseline justify-between gap-3">
            <span className={cx("flex items-center gap-2 text-sm font-bold", r.dark && "text-tint")}>
              <span aria-hidden className={cx("size-2.5 rounded-full", r.dot)} />
              {r.label}
            </span>
            <span className={cx("font-display text-[clamp(22px,3vw,36px)] font-bold tracking-[-0.03em] tabular-nums", r.dark && "text-violet")}>{r.val}</span>
          </span>
          <span aria-hidden className={cx("flex h-2 overflow-hidden rounded-full", r.dark ? "bg-tint/[0.16]" : "bg-[#E7E3EE]")}>
            <span className={cx("rounded-full", r.dot)} style={{ width: `${Math.min(100, Math.round(r.pct))}%` }} />
          </span>
          <span className={cx("text-xs", r.dark ? "text-tint" : "text-muted")}>{r.sub}</span>
        </a>
      ))}
      <div aria-live="polite" className="flex min-h-[104px] flex-col gap-2 border-t border-line pt-3">
        <span className="text-[13px] font-bold text-muted">What just happened</span>
        <div key={step} className={cx("flex items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-sm", latest.bg, s.rowin)}>
          <span className="min-w-0 flex-1 font-semibold">{latest.t}</span>
          <span className="whitespace-nowrap font-bold tabular-nums">{latest.a}</span>
        </div>
        {done
          .slice(-3, -1)
          .reverse()
          .map(fmt)
          .map((e) => (
            <span key={e.t} className="flex items-center gap-2.5 px-3 text-[13px] text-muted">
              <span className="min-w-0 flex-1">{e.t}</span>
              <span className="whitespace-nowrap tabular-nums">{e.a}</span>
            </span>
          ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span aria-hidden className="flex gap-1.5">
          {play.events.map((e, i) => (
            <span key={i} className={cx("h-1.5 rounded-full transition-all", i < step ? "w-4 bg-coming" : "w-1.5 bg-line")} />
          ))}
        </span>
        <button type="button" onClick={toggle} className={CHIP}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={icon} />
          </svg>
          {label}
        </button>
      </div>
    </div>
  );
}
