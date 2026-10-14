"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { BIZ, dollars, sampleNumbers, type BizKey } from "./data";

type Ctx = { biz: BizKey; setBiz: (k: BizKey) => void; tw: number };
const SampleCtx = createContext<Ctx>({ biz: "studio", setBiz: () => {}, tw: 1 });

/**
 * Which sample business the landing page shows, plus a 0→1 tween so the
 * numbers roll up from zero when the page opens or the business changes.
 */
export function SampleProvider({ children }: { children: ReactNode }) {
  const [biz, setBizState] = useState<BizKey>("studio");
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

  useEffect(() => {
    countUp();
    return () => cancelAnimationFrame(raf.current);
  }, [countUp]);

  const setBiz = useCallback(
    (k: BizKey) => {
      if (k === biz) return;
      setBizState(k);
      countUp();
    },
    [biz, countUp],
  );

  return <SampleCtx.Provider value={{ biz, setBiz, tw }}>{children}</SampleCtx.Provider>;
}

export function useSample() {
  const { biz, setBiz, tw } = useContext(SampleCtx);
  const n = sampleNumbers(biz);
  const ease = 1 - Math.pow(1 - tw, 3);
  const roll = (v: number) => dollars(v * ease);
  return { biz, setBiz, b: BIZ[biz], n, roll, done: tw >= 1 };
}
