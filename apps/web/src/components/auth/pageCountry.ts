import "server-only";
import { cookies } from "next/headers";
import { SITE_COUNTRY_COOKIE } from "@/content/site/country";
import { isCty, type Cty } from "./country";

/** The country a signed-out page is for: `?country=`, else the one picked on the marketing site, else none. */
export async function pageCountry(param: string | undefined): Promise<Cty | undefined> {
  if (isCty(param)) return param;
  const fromSite = (await cookies()).get(SITE_COUNTRY_COOKIE)?.value;
  return isCty(fromSite) ? fromSite : undefined;
}
