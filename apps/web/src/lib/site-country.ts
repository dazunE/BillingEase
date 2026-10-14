import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_SITE_COUNTRY, isSiteCountry, SITE_COUNTRY_COOKIE, type SiteCountry } from "@/content/site/country";

export type { SiteCountry } from "@/content/site/country";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * The marketing-site country for this request, for server components.
 *
 * Order: `?country=uk|lk` in the page's searchParams (when you pass them),
 * then the `be_site_country` cookie set by <CountrySwitch/>, then "uk".
 *
 *   export default async function Page({ searchParams }: PageProps<"/pricing">) {
 *     const country = await getSiteCountry(searchParams);
 *   }
 *
 * Layouts don't receive searchParams; call it with no argument there.
 */
export async function getSiteCountry(searchParams?: SearchParams | Promise<SearchParams>): Promise<SiteCountry> {
  if (searchParams) {
    const sp = await searchParams;
    const q = Array.isArray(sp.country) ? sp.country[0] : sp.country;
    if (isSiteCountry(q)) return q;
  }
  const c = (await cookies()).get(SITE_COUNTRY_COOKIE)?.value;
  return isSiteCountry(c) ? c : DEFAULT_SITE_COUNTRY;
}
