# Bank and card data connections (bank feeds) for BillingEase

Research date: 2026-10-10. Method note: WebFetch could not resolve most domains in this environment (consumerfinancemonitor.com, bennettjones.com, openbankingtracker.com, dev.to all failed with DNS errors), so findings below come from search-result snippets of the cited pages, not full-page reads. Treat specific numbers as "reported by the cited page" and re-verify on the vendor's live page before contracting. Items marked "[background, unverified]" are from prior knowledge and could not be confirmed with a source in this session. The report writer should not present them as sourced facts.

## Per-market aggregators/APIs, business-account and card coverage, and pricing

### Takeaway
Every launch market except Sri Lanka has at least one commercial aggregator. India and Singapore have narrow or consumer-centric rails, and Sri Lanka has no open-banking rail. Published per-unit pricing is rare. Basiq (AU) is the clearest public price at about AUD 0.50 per user per month plus a platform fee. US (Plaid) pricing is quote-based, with a reported median contract of about USD 9k/yr. EU/UK vendors (TrueLayer, Tink, Yapily) are sales-led, and the cheap GoCardless/Nordigen option appears closed to new signups.

### Cited Findings
**US**
- Plaid uses usage-based pricing: per-account connection fees, per-call charges, and monthly per-connected-account subscription fees for some products. Product types are "one-time fee", "subscription" (recurring monthly per connected account) and "per-request". — [Sacra](https://sacra.com/research/plaid); [fintegrationfs](https://www.fintegrationfs.com/post/how-much-does-plaid-integration-cost-in-the-us)
- Plaid plan tiers (reported July 2026): Trial, Pay-as-you-go (no minimum), Growth (annual commitment), Custom/Scale. — [costbench](https://www.costbench.com/software/api-management/plaid/)
- Unofficial per-link estimates conflict. One guide gives USD 0.50–2.00 per successful link, falling from about 1.50–2.00 at low volume to about 0.30–0.60 at 50k+ links. Another gives USD 0.10–0.60 per call. These are not official figures. — [fintegrationfs](https://www.fintegrationfs.com/post/how-much-does-plaid-integration-cost-in-the-us); [getmonetizely](https://www.getmonetizely.com/articles/plaid-vs-yodlee-how-much-will-financial-data-apis-cost-your-fintech-in-2025)
- Vendr reports a median Plaid buyer spend of USD 9,000/yr (n=34 purchases), with a range of USD 3,250–220,364. Enterprise deals often carry monthly or annual minimums. — [Vendr](https://www.vendr.com/marketplace/plaid)
- Bank data-access fees are now a cost layer under aggregators. Plaid agreed in Sept 2025 to pay JPMorgan for data access (amount undisclosed). By Nov 2025 JPMorgan said it had updated contracts with aggregators covering more than 95% of data pulls on its systems, naming Yodlee, Morningstar and Akoya. JPMorgan reportedly accepted lower prices than it first proposed in July 2025. A widely cited Forbes estimate of about USD 300M/yr in new fees for Plaid predates the deal and is unverified. — [Bloomberg Law](https://news.bloomberglaw.com/banking-law/jpmorgan-plaid-data-fee-deal-shifts-open-banking-battlefield); [PaymentExpert, 2025-11-17](https://paymentexpert.com/2025/11/17/jpmorgan-chase-to-charge-fintechs-for-customer-data-access/); [Fiskl](https://fiskl.com/blog/open-finance/jpmorgan-chase-data-fees-plaid/)

**UK / EU**
- GoCardless Bank Account Data (formerly Nordigen, relaunched under GoCardless in April 2023) was historically free for commercial use, with paid premium tiers. — [Firefly III docs](https://docs.firefly-iii.org/how-to/data-importer/import/gocardless/); [Finance Director Europe](https://www.financedirectoreurope.com/news/gocardless-nordigen-open-banking-data-provider-acquisition/)
- New signups to GoCardless Bank Account Data are reported as disabled (a page at bankaccountdata.gocardless.com/new-signups-disabled). Existing users can continue. This rests on one developer blog and is not confirmed on GoCardless's own site. — [dev.to (J. Frandsen)](https://dev.to/johnfrandsen/gocardless-bank-account-data-alternatives-what-to-use-when-signups-are-disabled-326d)
- Another tracker still calls GoCardless BAD the cheapest UK/EEA AIS option with the most generous free tier. This may be stale given the signup closure. It warns about minimum monthly commits, refresh-frequency tiers (real-time vs cached) and paid support SLAs. — [Open Banking Tracker: cheapest UK API](https://openbankingtracker.com/answers/cheapest-open-banking-api-uk)
- TrueLayer: free sandbox, pay-as-you-go production, no public per-unit rate. Yapily: volume tiers, with pricing driven by successful bank connections, payment volume and AIS request counts; enterprise tier is custom. Tink (Visa): custom pricing via sales. — [rfp.wiki Yapily vs TrueLayer](https://www.rfp.wiki/vendors/yapily/truelayer); [Finexer: Yapily pricing](https://blog.finexer.com/yapily-pricing/); [Finexer UK providers 2025](https://blog.finexer.com/7-best-banking-api-providers-in-the-uk-2025-guide/)

**Australia**
- Basiq's current pricing page lists Customer Data at AUD 0.50 per user per month plus a platform access fee. Billing is per user created, regardless of how many connections that user makes. Enrichment is AUD 0.25 per user per month and affordability reports start at AUD 3.00. Plans run a minimum of 12 months. An alternate Basiq page lists AUD 0.50 per user per month with a minimum spend of AUD 500/month, enrichment at AUD 0.10, and reports at AUD 5.50. An older page used per-connection pricing with the first 100 connections free. The pages conflict. — [Basiq pricing](https://basiq.io/pricing); [new.basiq.io pricing](https://new.basiq.io/pricing.html); [Basiq old pricing](https://basiq.io/pricing.html)

**Canada**
- No Flinks pricing or coverage data was retrieved (see Gaps). Xero Canada markets bank connections and PDF statement import. — [Xero CA bank connections](https://www.xero.com/ca/features-and-tools/accounting-software/bank-connections/)

**India**
- Account Aggregator (AA) vendors do not publish per-consent prices. Setu's enterprise deals are negotiated, and one directory reports typical Indian deployments of about INR 3 lakh to 2 crore per year (unverified, scope unclear). AAs may charge fees for the service. — [productgrowth.in: Setu](https://productgrowth.in/tools/banking-api/setu/); [Federal Bank AA page](https://federal.bank.in/account-aggregator); [Setu AA API](https://setu.co/credit-infrastructure/credit-intelligence/account-aggregator-api)
- Sahamati held a session in Sept 2025 on strategies to boost AA success rates, which signals that consent and fetch success rates are an operational issue. — [Sahamati Pragati session PDF, Sept 2025](https://sahamati.org.in/wp-content/uploads/2025/10/Pragati-Session-__-Strategies-to-boost-AA-success-rates-__-10th-Sept-2025-__-Website-Update-1.pdf)
- A HyperVerge guide covers choosing among AAs as an FIU. — [HyperVerge AA selection guide](https://hyperverge.co/blog/best-account-aggregators/)

**Singapore**
- SGFinDex is a government/ABS individual-centric data exchange with 7 participating banks (Citi, DBS, HSBC, Maybank, OCBC, Standard Chartered, UOB). No evidence was found that it covers business/corporate accounts or is open to third-party apps like BillingEase. — [CPF: SGFinDex data](https://cpf.gov.sg/member/tnc/data-you-can-retrieve-with-sgfindex); [ABS SGFinDex](https://www.abs.org.sg/consumer-banking/sgfindex); [GovTech dev portal](https://developer.tech.gov.sg/products/categories/digital-identity/sgfindex/overview)
- Finverse (now associated with Provenir) covers more than 40 banks and wallets across 6 countries (HK, ID, MY, PH, SG, VN), including business financial account data. It does not cover Sri Lanka. — [Provenir / Finverse](https://www.provenir.com/finverse/)
- Xero in Singapore relies on direct bank partnerships, e.g. DBS IDEAL business customers can opt in to daily automatic feeds. Banks without feeds, such as Anext Bank and Bank of Singapore, require manual statement import. — [Finovate](https://finovate.com/?p=62256); [Xero ideas: Anext](https://productideas.xero.com/forums/967136-banking-chart-of-accounts/suggestions/48483275-bank-feed-anext-bank-sng); [Xero ideas: Bank of Singapore](https://productideas.xero.com/forums/967136-banking-chart-of-accounts/suggestions/51426520-bank-feeds-establish-direct-bank-feed-connection)

**Sri Lanka**
- No aggregator coverage was found. Finverse's 6-country list excludes Sri Lanka, and searches for Brankas, Salt Edge or Xero feeds in Sri Lanka returned nothing. — [Provenir / Finverse](https://www.provenir.com/finverse/)

### Inferences
- In the US, aggregator unit costs will likely rise or become stickier as banks such as JPMorgan pass through data-access fees. Budget for price increases at renewal.
- Basiq's public price allows a rough AU model: 1k businesses ≈ AUD 500/mo (also the minimum), 10k ≈ AUD 5k/mo, 100k ≈ AUD 50k/mo, plus the platform fee and enrichment (+AUD 0.10–0.25/user). This uses Basiq's list price; volume discounts are not known.
- For US Plaid, if a blended subscription cost of about USD 0.30–1.00 per connected item per month is assumed, 1k businesses with roughly 2 items each ≈ USD 0.6–2k/mo, 10k ≈ 6–20k/mo, and 100k ≈ 60–200k/mo before negotiation. This is an assumption range built from the unofficial estimates above, not a quote.
- Background, unverified (vendor docs not fetched): MX, Finicity (Mastercard Open Finance) and Akoya are the other US options. Akoya is a bank-owned API-only network. Salt Edge and Yapily list broad EU coverage. Flinks is the main Canadian aggregator. Setu, Finvu, OneMoney, Anumati and others are RBI-licensed AAs. Brankas focuses on SEA (ID, PH).
- India's AA framework is built around individual consent. Coverage of current accounts for sole proprietors and businesses via GST/PAN-linked entities should be checked with each AA. [background, unverified]

### Gaps
- Official per-unit prices for Plaid Transactions, MX, Finicity, Akoya, TrueLayer, Tink, Yapily, Salt Edge, Flinks and Finverse were not found. All are quote-based.
- No source this session documented coverage of business accounts or business credit cards per aggregator (e.g. Plaid's coverage of Amex business cards or Chase Ink, or UK business-account coverage, since UK CMA9 business accounts are in open-banking scope). Vendor coverage pages need to be checked directly.
- Whether GoCardless BAD closed signups permanently, and when, needs confirmation on gocardless.com.
- Brankas's current country coverage and Salt Edge's Sri Lanka coverage are unconfirmed.

## Regulation and licensing per market

### Takeaway
As of Oct 2026, US Section 1033 is enjoined and being rewritten (an NPRM went to OIRA in Aug 2026), so screen-scraping and bilateral aggregator-bank contracts with fees remain the reality. The UK and EU require AISP authorisation or agent status. The UK moved 90-day reauth to AISP-led reconfirmation and the EU extended it to 180 days. Canada has proposed regulations (June 2026) but no live regime. India requires FIU onboarding via an RBI-licensed AA. Singapore and Sri Lanka have no third-party open-banking rail usable by a bookkeeping app.

### Cited Findings
**US: CFPB Section 1033**
- A federal court issued a preliminary injunction barring CFPB enforcement while the rule is reconsidered. The original April 1, 2026 compliance date passed without enforcement. — [Cozen O'Connor, 2026](https://www.cozen.com/news-resources/publications/2026/section-1033-compliance-date-open-banking-rule-enjoined-and-under-reconsideration)
- The CFPB opened reconsideration through an ANPR in August 2025. Issues include whether banks may charge third parties fees for consumer-authorized data. — [Morrison Foerster, 2025-08-26](https://www.mofo.com/resources/insights/250826-on-reconsideration-cfpb-issues-another-anpr); [CRS IF13117, 2025-09-30](https://www.everycrsreport.com/files/2025-09-30_IF13117_8e96300a1f76c4b660b2d68bf1007e70279afc13.html)
- In early Aug 2026 the CFPB sent an NPRM titled "Personal Financial Data Rights Reconsideration" to OIRA for EO 12866 review. Its content had not been made public at that time. — [Consumer Finance Monitor (Ballard Spahr), 2026-08-06](https://www.consumerfinancemonitor.com/2026/08/06/cfpb-sends-new-section-1033-open-banking-proposal-to-oira-for-review/)
- The Biden-era rule barred bank data-access fees. Banks sued, and fee deals such as JPMorgan–Plaid followed. — [Bloomberg Law](https://news.bloomberglaw.com/banking-law/jpmorgan-plaid-data-fee-deal-shifts-open-banking-battlefield)

**UK / EU (PSD2 AIS)**
- UK: the FCA's SCA guidance update (1 Mar 2022, effective 26 Mar 2022) introduced an RTS Art. 10A exemption. Banks no longer force 90-day SCA on AIS access, but AISPs must reconfirm consent with the customer every 90 days, without credential re-entry. — [Open Banking Ltd](https://www.openbanking.org.uk/news/fca-update-guidance-on-90-day-strong-customer-authentication/); [Vixio](https://www.vixio.com/insights/pc-aisps-win-fca-changes-sca-rules); [PYMNTS](https://www.pymnts.com/news/banking/2021/fca-scraps-90-day-reauthentication-open-banking-rule/)
- EU: the EBA amended the RTS to extend the AIS SCA exemption period from 90 to 180 days, with ASPSPs required to conform by 25 July 2023 (date per a Plaid page). — [Vixio](https://www.vixio.com/insights/pc-90-becomes-180-eba-makes-key-sca-change); [Plaid blog](https://plaid.com/blog/eu-reauth-update/); [EBA](https://www.eba.europa.eu/eba-response/29247)
- Yapily publishes guidance on communicating reauth changes to end customers, which shows that reconfirmation UX is the app's responsibility. — [Yapily](https://yapily.com/blog/how-to-communicate-90-day-reauthentication-changes-to-your-customers)

**Canada**
- Department of Finance released proposed Consumer-Driven Banking Regulations on June 27, 2026, with consultation closing Aug 26, 2026. The framework is to be overseen by the Bank of Canada. — [Bennett Jones, July 2026](https://www.bennettjones.com/Insights/Blogs/2026/07/Canada-Advances-Consumer-Driven-Banking-Framework-with-Proposed-Regulations)
- Read access was expected to launch in 2026, with write access in a later phase (one less-established source says mid-2027). — [Deloitte](https://www.deloitte.com/ca/en/Industries/financial-services/perspectives/consumer-driven-banking-canada.html); [FacePhi](https://facephi.com/observatory/en/open-banking-canada-real-time-payments-2026/)
- FacePhi says Bill C-15 received Royal Assent on 26 Mar 2026 (single source). Earlier, the FCAC was named lead agency, and the regulator role has shifted to the Bank of Canada. — [FacePhi](https://facephi.com/observatory/en/open-banking-canada-real-time-payments-2026/); [fintech.ca, 2024-12](https://www.fintech.ca/2024/12/18/canada-commits-launching-consumer-driven-banking/)

**Australia (CDR)**
- CDR has a "sponsored" accreditation level. Applicants must address fit-and-proper, information security, insurance, and internal and external dispute resolution criteria (ACCC sample form, Oct 2022, dated). — [CDR sponsored accreditation sample form](https://www.cdr.gov.au/sites/default/files/2022-10/CDR-accreditation-sample-application-form-sponsored-published-October%202022.pdf)

**India**
- FIUs consume data via RBI-licensed AAs. AAs may charge fees. — [Federal Bank AA](https://federal.bank.in/account-aggregator); [Setu docs](https://docs.setu.co/data/account-aggregator/v1/overview)

**Singapore**
- SGFinDex is an individual-consented, government-backed (MAS, Smart Nation, ABS) data exchange for the 7 banks, not a third-party AIS regime. — [ABS](https://www.abs.org.sg/consumer-banking/sgfindex); [Pinsent Masons](https://www.pinsentmasons.com/zh-cn/out-law/news/financial-data-exchange-launches-in-singapore)

**Sri Lanka**
- CBSL issued a consultation paper "Developing an Open Banking Framework for Sri Lanka" in March 2020. Trackers describe the framework as in early development with no effective date. A 2023 item has CBSL evaluating frameworks. No 2025/2026 API standard was found. — [CBSL consultation (2020)](https://www.cbsl.gov.lk/sites/default/files/cbslweb_documents/press/notices/notice_20200302_PSD_developing_an_open_banking_framework_for_sri_lanka_e-merged.pdf); [Open Banking Tracker: Sri Lanka](https://openbankingtracker.com/regulation/sri-lanka-open-banking); [Fiskil tracker](https://www.fiskil.com/open-finance-tracker/sri-lanka)

### Inferences
- US: BillingEase needs no licence to consume data via Plaid, MX or Finicity, but it bears the business risk of fee pass-through and possible 1033 changes. The 1033 rule as finalized covered consumer accounts. Small-business account coverage depends on bank and aggregator contracts, not regulation. [background, unverified: 1033 final rule scoped to consumer accounts]
- UK/EU: using a licensed aggregator as the regulated party (e.g. as its agent or under its licence, "licence-as-a-service") avoids an FCA AISP registration. Own registration needs FCA approval, PII insurance and ongoing compliance. [background, unverified: AISPs need PII instead of initial capital under PSRs 2017; FCA application fee in the low thousands GBP; 3-month statutory decision period for a complete application]
- Australia: CDR representative or sponsored models let an app sit under an accredited provider such as Basiq. Most accounting apps rely on direct bank feeds or aggregators rather than their own accreditation. [background, unverified]
- Canada: until the CDB regime goes live, screen-scraping and credential-based aggregators (Flinks and others) remain the practical path. Plan to migrate to accredited API access in 2027+.

### Gaps
- Exact text of the Aug 2026 1033 NPRM (whether it permits fees or changes scope) was not public in the sources found.
- FCA AISP application fee, PII amounts and timeline; CDR accreditation fees and CDR-representative obligations: no primary source retrieved.
- Whether Canada's CDB regulations are now final (post-Aug 2026 consultation) was not confirmed.
- MAS position on third-party account-information access for SMEs was not found.

## Hard engineering problems

### Takeaway
The recurring cost centers are consent renewal (UK 90-day AISP reconfirmation, EU 180-day SCA), aggregator connection-success and breakage, and data quality: pending vs posted dedupe, normalization and merchant cleaning. India's AA also has documented success-rate problems. Few public numbers on breakage rates were found.

### Cited Findings
- UK requires AISP-led consent reconfirmation every 90 days, and the EU requires SCA every 180 days. Expect user-driven re-link flows. — [Open Banking Ltd](https://www.openbanking.org.uk/news/fca-update-guidance-on-90-day-strong-customer-authentication/); [Vixio 90→180](https://www.vixio.com/insights/pc-90-becomes-180-eba-makes-key-sca-change)
- Yapily advises proactive customer comms around reauth, which treats it as a churn and drop-off risk. — [Yapily](https://yapily.com/blog/how-to-communicate-90-day-reauthentication-changes-to-your-customers)
- India AA success rates are a known industry problem (Sahamati Sept 2025 session dedicated to boosting them). — [Sahamati PDF](https://sahamati.org.in/wp-content/uploads/2025/10/Pragati-Session-__-Strategies-to-boost-AA-success-rates-__-10th-Sept-2025-__-Website-Update-1.pdf)
- Aggregator tiers differ on refresh frequency (real-time vs cached), which affects data freshness. — [Open Banking Tracker](https://openbankingtracker.com/answers/cheapest-open-banking-api-uk)
- Enrichment/categorization is sold as a paid add-on, e.g. Basiq enrichment at AUD 0.10–0.25 per user per month. — [Basiq pricing](https://basiq.io/pricing)

### Inferences
- [background, unverified] Typical issues: pending transactions change amount or ID when they post. Plaid emits removed/modified transactions via a sync cursor and webhooks, so the ledger must reconcile on stable IDs and a fuzzy match on date, amount and description. Historical backfill is commonly 24 months on Plaid (configurable), 90 days to 24 months on PSD2 banks (often 90 days after the first SCA), and per-FIP limits on India AA. Merchant cleaning and categorization usually combines aggregator enrichment with the app's own rules engine and user-correction learning.
- Bank-connection breakage, from MFA changes, bank API outages or expired consents, is the dominant support-ticket driver. Treat "connection health" as a first-class UI with re-auth prompts and fallbacks to file import.

### Gaps
- No credible published 2024–2026 figure for connection success or breakage rates per aggregator was found.
- Plaid/MX/TrueLayer docs on historical-depth limits and pending-transaction semantics were not fetched.

## Fallbacks for markets without feeds (OFX/QFX/CSV/PDF, email statements)

### Takeaway
Incumbents rely on file import where feeds don't exist. Xero accepts CSV, OFX, QIF and QBO and has added PDF statement import (documented for US/CA). India and many Singapore banks use statement import. Sri Lanka will need CSV/PDF import, ideally with PDF/OCR parsing and email-forwarding.

### Cited Findings
- Xero states that if automated feeds aren't an option, users can import PDF bank statements from supported banks (US/CA docs). — [Xero US connect your bank](https://xero.com:443/us/accounting-software/connect-your-bank); [Xero PDF Statement Import US and CA](https://brandfolder.xero.com/8HSCTPAX/at/wns3crfcc83cp8fsxfqm4g58/PDF_Statement_Import_US_and_CA.pdf)
- In India, most Xero users have no live feed and import statements (CSV, OFX, QIF, QBO) via Accounting → Bank Accounts → Import a Statement. This comes from an accounting-firm blog, not Xero. — [Patron Accounting](https://www.patronaccounting.com/blog/xero-bank-feeds-reconciliation)
- Xero Singapore users at non-partner banks (Anext, Bank of Singapore) import statement files manually. — [Xero ideas: Anext](https://productideas.xero.com/forums/967136-banking-chart-of-accounts/suggestions/48483275-bank-feed-anext-bank-sng)
- Sleek (SG corporate services) documents bank feed setup with Xero for SG clients. — [Sleek help](https://help.sleek.com/article/x2hd9n1r7l-set-up-bank-feeds-with-xero)

### Inferences
- For Sri Lanka, BillingEase's MVP should ship CSV import with column mapping per bank template, plus PDF parsing (LLM/OCR-assisted) for the major banks (BOC, People's Bank, Commercial Bank, HNB, Sampath; names are background knowledge). An email-in address for statements and a possible direct bank partnership would follow later.
- Wave and QuickBooks fallback specifics were not retrieved. [background, unverified] QuickBooks Online supports CSV/QFX/QBO upload, and Wave supports CSV/OFX/QFX upload and has restricted bank connections to certain countries (US/CA).

### Gaps
- QuickBooks and Wave help-center pages on supported file formats and countries without feeds were not fetched.
- No data was found on Xero/QBO feed coverage in Sri Lanka.

## Build vs buy (own licence or direct integrations vs aggregator) at 1k / 10k / 100k businesses

### Takeaway
Buy for all markets at launch. Aggregator spend at 1k to 10k businesses is in the low thousands to tens of thousands of USD per month, which is far below the cost of an AISP licence, compliance staff and bank-by-bank integrations. Direct bank partnerships (Xero's model: DBS in SG, bank feeds in AU/UK) only make sense at scale or where no aggregator exists.

### Cited Findings
- Reported median Plaid contract is USD 9k/yr, with a range of USD 3.25k–220k/yr. — [Vendr](https://www.vendr.com/marketplace/plaid)
- Basiq: AUD 0.50 per user per month, minimum AUD 500/mo, 12-month minimum term, plus platform fee. — [Basiq](https://basiq.io/pricing); [new.basiq.io](https://new.basiq.io/pricing.html)
- US bank access is becoming paid at the source (JPMorgan fees with aggregators covering more than 95% of its data pulls). A direct US build would mean negotiating these contracts yourself. — [PaymentExpert](https://paymentexpert.com/2025/11/17/jpmorgan-chase-to-charge-fintechs-for-customer-data-access/)
- Xero builds direct bank partnerships where aggregators are weak, e.g. DBS SG. — [Finovate](https://finovate.com/?p=62256)
- Indian AA deployments are reported at about INR 3 lakh to 2 crore per year (unverified). — [productgrowth.in](https://productgrowth.in/tools/banking-api/setu/)

### Inferences
Illustrative estimates, not quotes:
- Aggregator monthly cost at roughly 1.5 connected accounts per business and USD 0.50–1.50 per account per month all-in: 1k businesses ≈ USD 750–2.3k; 10k ≈ USD 7.5k–23k; 100k ≈ USD 75k–225k before volume discounts (AU per Basiq list ≈ AUD 0.5–0.75k / 5–7.5k / 50–75k).
- Own UK AISP plus EU passporting [background, unverified]: FCA registration, PII cover, a compliance officer/MLRO and info-sec (SOC2/ISO 27001), so roughly 2–4 FTE of compliance and security (USD 300k–700k/yr), plus 6–12 months to authorise. You still need to integrate many bank APIs that have uneven quality. Break-even against an aggregator is only plausible at about 100k+ connected businesses in a single market.
- A direct US build is impractical: thousands of FIs, credential and MFA handling, and bank fee contracts.

### Gaps
- No sourced FCA, CDR or AA-FIU licensing cost figures were found. The aggregator volume discount curves at 10k and 100k are not public.

## Realistic effort and timeline

### Takeaway
No source gave timelines. Estimates below are engineering judgment.

### Cited Findings
- Vendors offer free sandboxes (TrueLayer, Yapily), which allows fast prototyping. — [rfp.wiki](https://www.rfp.wiki/vendors/yapily/truelayer)

### Inferences
- [background, unverified] MVP with one aggregator in one market (link flow, transaction sync via webhooks/cursor, dedupe, basic rules categorization, CSV import): 2 engineers × 6–10 weeks. Production hardening (re-auth UX, connection health, pending→posted reconciliation, multi-aggregator abstraction, enrichment, monitoring, support tooling, per-market vendor onboarding and security reviews): another 3–6 months. Each additional market/aggregator: 3–6 weeks. Vendor security questionnaires and contracts can take 1–3 months in parallel.

### Gaps
- No published case studies with integration timelines for accounting apps were found.
