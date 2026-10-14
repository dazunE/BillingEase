"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/ui";
import { COMPANY } from "@/content/site/company";
import { COUNTRY_META, signUpHref } from "@/content/site/country";
import { FOOTER, LEGAL_LINKS, ROUTES, routeText } from "@/content/site/routes";
import { CountrySwitch } from "./CountrySwitch";
import { useSiteCountry } from "./SiteCountry";
import s from "./site.module.css";

/** Pages that end with their own closing band, so the footer's band would repeat it. */
const NO_BAND = ["/"];

/**
 * The marketing site footer (prototype SiteFooter.dc.html): a closing band
 * (hidden on pages in NO_BAND), brand and country, the site map, contacts and
 * legal links. Rendered by the (site) layout.
 */
export function SiteFooter() {
  const path = usePathname() || "/";
  const { country } = useSiteCountry();
  const band = !NO_BAND.includes(path);
  const meta = COUNTRY_META[country];
  const mails = [
    { label: "Say hello", email: COMPANY.email.hello },
    { label: "Help", email: COMPANY.email.help },
    { label: country === "uk" ? "Practices" : "Practitioners", email: COMPANY.email.practices },
    { label: "Press", email: COMPANY.email.press },
  ];

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto box-border max-w-[1200px] px-[clamp(16px,4vw,40px)]">
        {band && (
          <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-6 border-b border-white/[0.12] py-[clamp(48px,6vw,72px)]">
            <div className="flex min-w-0 flex-[1_1_420px] items-center gap-5">
              <svg className={`${s.coin} flex-none`} aria-hidden width="56" height="56" viewBox="0 0 56 56">
                <ellipse cx="28" cy="34" rx="22" ry="9" fill="#D99A12" />
                <ellipse cx="28" cy="28" rx="22" ry="9" fill="#FFC53D" stroke="#18161F" strokeWidth="2" />
                <path d="M20 28h16" stroke="#18161F" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="flex min-w-0 flex-col gap-1.5">
                <p className="font-display text-[clamp(26px,3.2vw,40px)] font-bold leading-[1.1] tracking-[-0.03em]">
                  See your three numbers <span className="text-violet">by tonight.</span>
                </p>
                <p className="text-[15px] leading-normal text-input">Free to start, no card needed. Add a customer, send an invoice, and the numbers start moving.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link href={signUpHref(country)} className="inline-flex min-h-[52px] items-center gap-2.5 rounded-full bg-violet px-[26px] text-base font-bold text-ink transition-colors hover:bg-[#a98ffb]">
                Start free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link href={ROUTES.pricing.href} className="inline-flex min-h-[52px] items-center rounded-full border border-white/[0.28] px-[22px] text-base font-semibold hover:bg-white/[0.08]">
                See pricing
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-x-[clamp(32px,5vw,72px)] gap-y-12 pb-10 pt-[clamp(48px,6vw,64px)]">
          <div className="flex max-w-[360px] flex-[1_1_300px] flex-col gap-[22px]">
            <Link href="/" aria-label="BillingEase home" className="inline-flex items-center gap-2.5 self-start">
              <BrandMark size={32} tile="#2E2A38" />
              <span className="font-display text-[19px] font-bold tracking-[-0.02em]">BillingEase</span>
            </Link>
            <p className="text-[15px] leading-[1.55] text-input">
              {COMPANY.tagline} {COMPANY.blurb}
            </p>
            <div className="flex flex-col gap-3 rounded-[20px] border border-white/10 bg-white/[0.06] p-5">
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold">You’re on the {meta.name} site</span>
                <span className="text-[13px] leading-[1.45] text-input">
                  Prices in {meta.currency}, the {meta.yearWord} from {country === "uk" ? "6 April" : "1 April"}. You choose your country when you sign up.
                </span>
              </span>
              <CountrySwitch variant="segmented" tone="dark" short className="self-start" />
            </div>
          </div>

          <nav aria-label="Footer" className="grid min-w-0 flex-[999_1_560px] grid-cols-5 gap-x-6 gap-y-9 max-[1180px]:grid-cols-3 max-[560px]:grid-cols-2">
            {FOOTER.map((col) => (
              <div key={col.label} className="flex min-w-0 flex-col gap-3">
                <h2 className="mb-0.5 text-[13px] font-bold uppercase tracking-[0.06em] text-violet">{col.label}</h2>
                <ul className="flex flex-col">
                  {col.items.map((r) => (
                    <li key={r.href}>
                      <Link
                        href={r.href === ROUTES.signUp.href ? signUpHref(country) : r.href}
                        className="inline-flex min-h-9 items-center text-[15px] leading-[1.35] text-input underline-offset-[3px] transition-colors hover:text-white hover:underline"
                      >
                        {routeText(r, country).label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-4 border-t border-white/[0.12] py-6 text-sm leading-normal text-input">
          {mails.map((m) => (
            <span key={m.label} className="flex min-w-0 flex-col gap-0.5">
              <span className="font-bold text-white">{m.label}</span>
              <a href={`mailto:${m.email}`} className="break-all hover:text-white hover:underline">
                {m.email}
              </a>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/[0.12] pb-8 pt-5 text-sm text-input">
          <span>
            © {COMPANY.year} BillingEase. For the United Kingdom and Sri Lanka.
          </span>
          <span className="flex flex-wrap gap-x-5 gap-y-1.5">
            {LEGAL_LINKS.map((r) => (
              <Link key={r.href} href={r.href} className="inline-flex min-h-8 items-center underline-offset-[3px] hover:text-white hover:underline">
                {routeText(r, country).label}
              </Link>
            ))}
            <Link href={`${ROUTES.cookies.href}#settings`} className="inline-flex min-h-8 items-center underline-offset-[3px] hover:text-white hover:underline">
              Cookie settings
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
