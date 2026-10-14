import { cookies } from "next/headers";
import { Suspense } from "react";
import { CookieNotice, CountryFromUrl, SiteCountryProvider, SiteFooter, SiteNav, type ConsentChoice } from "@/components/site";
import { SITE_CONSENT_COOKIE } from "@/content/site/country";
import { SESSION_COOKIE } from "@/lib/cookies";
import { getSiteCountry } from "@/lib/site-country";

/**
 * The marketing site: nav, footer and cookie notice around every page in
 * (site). The app (/app, /setup) and the auth pages ((auth)) have their own layouts.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const country = await getSiteCountry();
  const consent = jar.get(SITE_CONSENT_COOKIE)?.value;
  const choice: ConsentChoice | null = consent === "all" || consent === "necessary" ? consent : null;

  return (
    <SiteCountryProvider initial={country}>
      <Suspense fallback={null}>
        <CountryFromUrl />
      </Suspense>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:font-semibold focus:text-white">
        Skip to content
      </a>
      <div className="min-h-screen overflow-x-clip bg-bg text-ink">
        <SiteNav signedIn={jar.has(SESSION_COOKIE)} />
        <main id="main">{children}</main>
        <SiteFooter />
        <CookieNotice choice={choice} />
      </div>
    </SiteCountryProvider>
  );
}
