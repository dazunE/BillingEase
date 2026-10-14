"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { isSiteCountry, SITE_COUNTRY_COOKIE, type SiteCountry } from "@/content/site/country";

type Ctx = {
  country: SiteCountry;
  /** Remember a new country (cookie), drop any ?country= that would override it, and refresh the server parts. */
  setCountry: (c: SiteCountry) => void;
};
const CountryCtx = createContext<Ctx>({ country: "uk", setCountry: () => {} });
const AdoptCtx = createContext<(c: SiteCountry) => void>(() => {});

function writeCookie(c: SiteCountry) {
  document.cookie = `${SITE_COUNTRY_COOKIE}=${c}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/**
 * Holds the marketing-site country for client components (nav, footer,
 * switch). The (site) layout seeds it from the cookie; <CountryFromUrl/>
 * adopts a `?country=` from the URL. Read it with `useSiteCountry()`.
 */
export function SiteCountryProvider({ initial, children }: { initial: SiteCountry; children: ReactNode }) {
  const [country, setState] = useState<SiteCountry>(initial);
  const [seen, setSeen] = useState(initial);
  const router = useRouter();

  // A refresh after the cookie changed elsewhere brings a new `initial`.
  if (initial !== seen) {
    setSeen(initial);
    setState(initial);
  }

  const setCountry = useCallback(
    (c: SiteCountry) => {
      writeCookie(c);
      setState(c);
      const url = new URL(window.location.href);
      if (url.searchParams.has("country")) {
        url.searchParams.delete("country");
        router.replace(url.pathname + url.search + url.hash, { scroll: false });
      } else {
        router.refresh();
      }
    },
    [router],
  );

  // Adopt a country from the URL: remember it, no navigation (the page already rendered for it).
  const adopt = useCallback((c: SiteCountry) => {
    writeCookie(c);
    setState(c);
  }, []);

  return (
    <AdoptCtx.Provider value={adopt}>
      <CountryCtx.Provider value={{ country, setCountry }}>{children}</CountryCtx.Provider>
    </AdoptCtx.Provider>
  );
}

/** Follows `?country=uk|lk` in the URL. The (site) layout renders it inside <Suspense>. */
export function CountryFromUrl() {
  const q = useSearchParams().get("country");
  const adopt = useContext(AdoptCtx);
  // Only react when the URL's value changes, so a switch made on the page isn't undone.
  useEffect(() => {
    if (isSiteCountry(q)) adopt(q);
  }, [q, adopt]);
  return null;
}

/** The visitor's country, and `setCountry` to change it. For client components inside the (site) layout. */
export function useSiteCountry(): Ctx {
  return useContext(CountryCtx);
}
