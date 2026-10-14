"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { money, type SiteCountry } from "@/content/site/country";
import { SAMPLES, sampleNumbers } from "@/content/site/samples";

type Ctx = { country: SiteCountry; key: string; setKey: (k: string) => void; tw: number };
const SampleCtx = createContext<Ctx>({ country: "uk", key: "", setKey: () => {}, tw: 1 });

/**
 * Which sample business the home page shows (from the country's list in
 * content/site/samples.ts), plus a 0→1 tween so the numbers roll up from zero
 * when the page opens or the business changes.
 */
export function SampleProvider({ country, children }: { country: SiteCountry; children: ReactNode }) {
  const first = SAMPLES[country][0].key;
  const [key, setKeyState] = useState(first);
  const [forCountry, setForCountry] = useState(country);
  const [tw, setTw] = useState(1);
  const raf = useRef(0);

  const countUp = useCallback(() => {
    // Under reduced motion the numbers simply stay at their final value (tw = 1).
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cancelAnimationFrame(raf.current);
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 1100);
      setTw(k);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, []);

  // Country switched: start again with that country's first business.
  if (forCountry !== country) {
    setForCountry(country);
    setKeyState(first);
  }

  useEffect(() => {
    countUp();
    return () => cancelAnimationFrame(raf.current);
  }, [countUp, country]);

  const setKey = useCallback(
    (k: string) => {
      if (k === key) return;
      setKeyState(k);
      countUp();
    },
    [key, countUp],
  );

  return <SampleCtx.Provider value={{ country, key, setKey, tw }}>{children}</SampleCtx.Provider>;
}

export function useSample() {
  const { country, key, setKey, tw } = useContext(SampleCtx);
  const list = SAMPLES[country];
  const b = list.find((x) => x.key === key) ?? list[0];
  const n = sampleNumbers(b);
  const ease = 1 - Math.pow(1 - tw, 3);
  const fmt = (v: number) => money(v, country);
  const roll = (v: number) => money(v * ease, country);
  return { country, list, key: b.key, setKey, b, n, fmt, roll, done: tw >= 1 };
}
