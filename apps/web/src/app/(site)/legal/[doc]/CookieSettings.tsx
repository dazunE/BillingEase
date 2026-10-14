"use client";

import { useState, useSyncExternalStore } from "react";
import { setConsent, type ConsentChoice } from "@/components/site";
import { SITE_CONSENT_COOKIE } from "@/content/site/country";

function readChoice(): ConsentChoice | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${SITE_CONSENT_COOKIE}=([^;]*)`));
  return m?.[1] === "all" || m?.[1] === "necessary" ? m[1] : null;
}

function subscribe(cb: () => void) {
  window.addEventListener("be:cookies", cb);
  return () => window.removeEventListener("be:cookies", cb);
}

/**
 * Cookie settings for this browser (anchor #settings on /legal/cookies).
 * Necessary cookies are always on; measurement is off unless turned on.
 * Saving calls setConsent(), which also tells the cookie notice.
 */
export function CookieSettings() {
  const saved = useSyncExternalStore(subscribe, readChoice, () => null);
  const [draft, setDraft] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const on = draft ?? saved === "all";

  const save = (v: ConsentChoice) => {
    setConsent(v);
    setDraft(null);
    setMsg(v === "all" ? "Saved. Measurement is allowed in this browser." : "Saved. Only necessary cookies are used in this browser.");
  };

  const status = saved === "all" ? { t: "Measurement allowed", bg: "bg-tint", ink: "text-[#4B2FC9]", dot: "bg-coming" } : saved === "necessary" ? { t: "Only necessary", bg: "bg-pos-bg", ink: "text-pos", dot: "bg-pos" } : { t: "Not chosen yet", bg: "bg-due-bg", ink: "text-due", dot: "bg-due" };

  return (
    <div className="my-2 mb-6 flex flex-col gap-[18px] rounded-[22px] border-2 border-ink bg-white p-[clamp(18px,3vw,26px)]">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span className="font-display text-[19px] font-bold tracking-[-0.01em] text-ink">Cookie settings for this browser</span>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-bold ${status.bg} ${status.ink}`}>
          <span aria-hidden className={`size-2 rounded-full ${status.dot}`} />
          {status.t}
        </span>
      </div>
      <div className="flex items-start gap-4 rounded-2xl bg-bg p-4">
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-base font-bold text-ink">Necessary</span>
          <span className="text-[14.5px] leading-normal text-ink2">Keep you signed in, remember your country and remember this choice. The site can’t work without them, so they’re always on.</span>
        </span>
        <span className="inline-flex flex-none items-center gap-1.5 rounded-full bg-line px-3 py-1.5 text-[13px] font-bold text-ink2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
          </svg>
          Always on
        </span>
      </div>
      <div className="flex items-start gap-4 rounded-2xl bg-bg p-4">
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span id="ck-measure" className="text-base font-bold text-ink">
            Measurement
          </span>
          <span id="ck-measure-d" className="text-[14.5px] leading-normal text-ink2">
            Count visits and which pages help, without names or emails. Off unless you turn it on. (No measurement tool runs yet.)
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="ck-measure"
          aria-describedby="ck-measure-d"
          onClick={() => {
            setDraft(!on);
            setMsg(null);
          }}
          className={`relative h-8 w-14 flex-none rounded-full transition-colors ${on ? "bg-coming" : "bg-input"}`}
        >
          <span aria-hidden className={`absolute top-1 size-6 rounded-full bg-white shadow-[0_1px_3px_rgba(24,22,31,0.3)] transition-[left] ${on ? "left-7" : "left-1"}`} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <button type="button" onClick={() => save(on ? "all" : "necessary")} className="min-h-[46px] rounded-full bg-violet px-[22px] text-[15px] font-bold text-ink hover:bg-[#a98ffb]">
          Save my choice
        </button>
        <button type="button" onClick={() => save("all")} className="min-h-[46px] rounded-full border border-input bg-white px-[18px] text-[15px] font-semibold hover:bg-bg">
          Accept all
        </button>
        <button type="button" onClick={() => save("necessary")} className="min-h-[46px] rounded-full border border-input bg-white px-[18px] text-[15px] font-semibold hover:bg-bg">
          Only necessary
        </button>
      </div>
      <p role="status" className={msg ? "flex items-start gap-2.5 rounded-[14px] bg-pos-bg px-3.5 py-3 text-[15px] font-semibold leading-normal text-pos" : "sr-only"}>
        {msg}
      </p>
    </div>
  );
}
