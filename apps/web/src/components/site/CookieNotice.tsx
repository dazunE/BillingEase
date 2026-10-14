"use client";

import Link from "next/link";
import { useState } from "react";
import { SITE_CONSENT_COOKIE } from "@/content/site/country";
import { ROUTES } from "@/content/site/routes";
import s from "./site.module.css";

export type ConsentChoice = "necessary" | "all";

/** Remember the choice for a year, and tell anything listening (e.g. the cookie settings on /legal/cookies). */
export function setConsent(v: ConsentChoice) {
  document.cookie = `${SITE_CONSENT_COOKIE}=${v}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  window.dispatchEvent(new CustomEvent("be:cookies", { detail: v }));
}

/**
 * The small cookie notice, bottom left (prototype SiteFooter.dc.html). Shown
 * until the visitor picks "Only necessary" or "Accept"; the choice is kept in
 * the `be_cookies` cookie. The layout passes the current choice so it never flashes.
 */
export function CookieNotice({ choice }: { choice: ConsentChoice | null }) {
  const [done, setDone] = useState(choice != null);
  if (done) return null;
  const pickChoice = (v: ConsentChoice) => {
    setConsent(v);
    setDone(true);
  };
  return (
    <>
      {/* room under the footer so the notice never covers the last links */}
      <div aria-hidden className="h-[120px] bg-ink max-[640px]:h-[150px]" />
      <div
        role="region"
        aria-label="Cookie notice"
        className={`${s.cookie} fixed bottom-4 left-4 right-4 z-[70] box-border flex max-w-[420px] flex-wrap items-center gap-x-3.5 gap-y-3 rounded-[20px] border border-line bg-white py-3 pl-3.5 pr-3 text-ink shadow-[0_16px_40px_rgba(24,22,31,0.18)] max-[640px]:bottom-3 max-[640px]:left-3 max-[640px]:right-3 max-[640px]:gap-x-2.5 max-[640px]:gap-y-2 max-[640px]:rounded-2xl max-[640px]:py-2.5 max-[640px]:pr-2.5`}
      >
        <span aria-hidden className="flex size-9 flex-none items-center justify-center rounded-full bg-going-tint max-[640px]:hidden">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 4 4 0 0 1-5-5zM8.5 11.5h.01M12 16h.01M15.5 13h.01M9 15.5h.01" />
          </svg>
        </span>
        <p className="min-w-0 flex-[1_1_260px] text-[13px] leading-normal text-ink2 max-[640px]:basis-full max-[640px]:text-[12.5px] max-[640px]:leading-[1.4]">
          We use a few cookies to keep you signed in and remember your country.
          <span className="max-[640px]:hidden"> With your OK, we also count visits to make the site better.</span>{" "}
          <Link href={ROUTES.cookies.href} className="font-semibold text-ink underline underline-offset-[3px]">
            Cookie policy
          </Link>
        </p>
        <span className="ml-auto flex gap-2">
          <button type="button" onClick={() => pickChoice("necessary")} className="min-h-11 whitespace-nowrap rounded-full border border-input bg-white px-3.5 text-sm font-semibold hover:bg-bg">
            Only necessary
          </button>
          <button type="button" onClick={() => pickChoice("all")} className="min-h-11 whitespace-nowrap rounded-full bg-ink px-[18px] text-sm font-bold text-white hover:bg-black">
            Accept
          </button>
        </span>
      </div>
    </>
  );
}
