# Payroll inside a small-business bookkeeping app (BillingEase): embedded API vs partner vs build, by launch market

Research date: 2026-10-10. Method note: direct page fetches were blocked by the sandbox network policy (irs.gov, waveapps.com and others returned connect-rejected or DNS failure), so all findings come from search-result extracts. Several citations are aggregator or vendor-marketing pages, and they are flagged where that matters. Statements marked "UNVERIFIED (background knowledge)" come from the researcher's prior knowledge and were not confirmed by any 2026 source in this session. The report writer should treat them as leads, not facts.

## US: complexity, embedded providers and pricing, incumbents, PSP registration and agent authorizations

### Takeaway
US payroll is the deepest market for embedded APIs: Gusto Embedded, Check, Zeal, Salsa, Rollfi and others cover all 50 states and handle tax filing. None of them publishes a partner rate card. Third-party benchmarks put embedded payroll at about $35–70 per company per month plus $6–10 per employee per month, with the platform keeping roughly two-thirds. The employer stays legally liable for late deposits under a standard reporting-agent (Form 8655) setup, so the provider's deposit reliability is the main risk BillingEase takes on for its customers.

### Cited Findings
**Penalties and liability**
- IRS failure-to-deposit penalty tiers: 1–5 calendar days late, 2%. 6–15 days, 5%. More than 15 days, 10%. The tiers don't stack, so a deposit more than 15 days late costs 10%, not 17%. The penalty rises to 15% if the tax is still unpaid more than 10 days after the first IRS notice (e.g., CP220) or on the day an immediate-payment notice (e.g., CP504J) arrives. — [IRS: Failure to Deposit Penalty](https://www.irs.gov/payments/failure-to-deposit-penalty)
- The Trust Fund Recovery Penalty can reach 100% of unpaid trust-fund taxes and is assessed personally on "responsible persons". Relief routes include reasonable cause and First Time Abate. — [Paylocity: payroll tax penalties](https://www.paylocity.com/resources/tax-compliance/payroll-tax-penalties/); [Yeo & Yeo](https://www.yeoandyeo.com/resource/employers-beware-of-payroll-tax-errors)
- A reporting agent authorized on Form 8655 can sign and e-file Forms 940 and 941 and make deposits through EFTPS. The agent takes on no liability for the employer's withholding, filing or payment duties. — [IRS newsroom: picking a payroll service provider](https://www.irs.gov/ru/newsroom/picking-the-right-third-party-payroll-service-provider-helps-protect-businesses); [Wolters Kluwer](https://www.wolterskluwer.com/ja-jp/expert-insights/protect-yourself-when-outsourcing-payroll)
- Rev. Proc. 2012-32 requires reporting agents to tell clients in writing, at least quarterly, that the employer remains liable, and to recommend that clients check deposits in EFTPS. — [ADP legislative update](https://adp.com/tools-and-resources/~/media/Eye%20on%20Washington/EOW%20LU%20IRS%20Disclosures%20082112.ashx); [Paychex federal updates](https://www.paychex.com/sites/default/files/2020-06/Fed%20Updates%20061520.pdf)
- Two alternatives shift liability:
  - A Section 3504 agent (Form 2678) assumes liability jointly with the employer.
  - A CPEO is solely liable and files under its own EIN.

  — [IRS newsroom](https://irs.gov/zh-hant/newsroom/picking-the-right-third-party-payroll-service-provider-helps-protect-businesses)

**Money transmission (moving employer funds)**
- California Financial Code §2010(j) exempts anyone who delivers wages on employers' behalf or pays payroll taxes. That exemption does not cover money transmission or stored-value cards offered directly to consumers. A 2019 opinion from the California DFPI (Department of Financial Protection and Innovation) extended the exemption to 1099 contractor payments that are the functional equivalent of wages. Opinions are fact-specific: another DFPI letter found a provider that pooled client funds in its own account and paid partners out was subject to licensing. — [CA DFPI: MTA payroll processing](https://dfpi.ca.gov/rules-enforcement/laws-and-regulations/opinion-letters-by-law-subject/mta-payroll-processing/); [CA DFPI MTA exemptions](https://dfpi.ca.gov/rules-enforcement/laws-and-regulations/opinion-letters-by-law-subject/mta-exemptions-2/)
- Minnesota's money transmitter statute exempts "a payroll processing services provider". — [Minn. Stat. 53B.29](https://www.revisor.mn.gov/statutes/cite/53B.29/pdf)
- PayrollOrg actively lobbies to exclude payroll providers from money-transmitter laws and has written on bank failures and payroll risk. This means state treatment is not uniform. — [PayrollOrg issue directory](https://www.payroll.org/compliance/government-relations/issue-directory/issues20)

**Embedded payroll providers**
- **Gusto Embedded:**
  - Partner pricing isn't public and is negotiated with Gusto's platform team.
  - Gusto's own direct product starts at $40/mo + $6/person.

  — [hr.software Gusto Embedded review 2026](https://www.hr.software/reviews/gusto-embedded); [SourceForge embedded payroll 2026](https://sourceforge.net/software/embedded-payroll/)
- Gusto Embedded's pre-built UI flows can get partners "live in as little as four weeks" (single third-party directory, unverified). Gusto publishes an accounting-software solutions page. — [Open Banking Tracker: Gusto Embedded](https://openbankingtracker.com/embedded-finance/gusto-embedded); [Gusto Embedded for accounting](https://embedded.gusto.com/solutions/accountech)
- Gusto Embedded customers include U.S. Bank Payroll, which is built on Gusto's infrastructure. JPMorgan is also listed as a partner. — [Open Banking Tracker](https://openbankingtracker.com/embedded-finance/gusto-embedded)
- **FreshBooks (accounting-app precedent):** announced in Oct 2023 that it would use Gusto to power embedded US payroll, launching Jan 2024 for US customers only. — [FreshBooks press release](https://freshbooks.com/press/releases/freshbooks-to-leverage-gusto-to-power-upcoming-embedded-payroll-service)
- **Check:**
  - API-first, 65+ platform partners, all 50 states, Stripe-backed.
  - Per-employee pricing is not public; it is negotiated in a partner agreement.

  — [Open Banking Tracker: embedded payroll providers](https://www.openbankingtracker.com/embedded-finance/category/payroll); [paystubs.net Check guide 2026](https://www.paystubs.net/blog/check-payroll-api)
- **Market benchmark (third-party estimate, not a vendor quote):** base fee of $35–70/month per customer plus $6–10/employee/month. The platform keeps about two-thirds and the infrastructure provider about one-third. Pricing takes two forms:
  - A flat per-employee fee that the platform marks up, which lets it set its own margin.
  - A revenue share, which caps the platform's upside as it scales.

  — [Open Banking Tracker / FintechSpecs comparison](https://fintechspecs.com/blog/best-embedded-payroll-api-vertical-saas/)
- **Zeal:** sources conflict.
  - One says the public pricing page lists per-run and per-employee fees.
  - Another says pricing is quote-only, on a revenue share.
  - A third simply says per employee per month.

  Last verified June 2026. — [hr.software Zeal review 2026](https://www.hr.software/reviews/zeal); [Open Banking Tracker Zeal alternatives](https://www.openbankingtracker.com/embedded-finance/zeal/alternatives)
- **Salsa:**
  - Covers the US and Canada in one integration.
  - Two products: Salsa Express (pre-built embeddable UI) and Salsa Advanced (the Paystream API).
  - Claims go-live "in weeks" (vendor claim).
  - Raised $30M in total, including a $20M Series A in April 2025, and grew 10x in 2024 (tracker figure).

  — [Salsa](https://www.salsa.dev/); [Salsa product](https://www.salsa.dev/product); [Open Banking Tracker Salsa](https://www.openbankingtracker.com/embedded-finance/salsa)
- **Rollfi:**
  - A division of Priority Technology (Nasdaq: PRTH).
  - W-2 and 1099 payroll in all 50 states, with federal, state and local tax compliance plus group benefits.
  - Offered as white-label, embedded ("Walk") or fully custom API ("Run").

  — [Open Banking Tracker Salsa alternatives](https://www.openbankingtracker.com/embedded-finance/salsa/alternatives)

**Incumbents**
- **Wave Payroll:**
  - Full-service ("Tax Service States"): $40/mo + $6 per active employee or paid contractor.
  - Self-service: $20/mo + $6 per person. The business files and pays its own taxes.
  - Older sources list 14 tax-service states: AZ, CA, FL, GA, IL, IN, MN, NY, NC, TN, TX, VA, WA, WI. The other 36 states are self-serve.
  - One aggregator says customers who signed up after Apr 2, 2025 get tax service in every state. This conflicts with the older sources; verify on Wave's site.

  — [Wave payroll page](https://www.WaveApps.com/payroll); [FitSmallBusiness Wave Payroll review](https://fitsmallbusiness.com/wave-payroll-review/); [TechRepublic (pricing dated 2/15/2024)](https://www.techrepublic.com/article/wave-payroll-review/); [Software Finder](https://explore.softwarefinder.com/hr/wave-payroll)
- **QuickBooks Payroll Core:** most commonly cited at about $50/mo + $6.50/employee. Other figures:
  - $44/mo as an introductory promo.
  - $50 + $6.
  - Reports of a May 2026 price rise of about 20% and per-employee increases from July 1, 2026 on higher tiers.

  All of these come from low-quality third-party pages. — [Dancing Numbers 2026](https://www.dancingnumbers.com/quickbooks-payroll-subscription); [Firm of the Future: price changes](https://www.firmofthefuture.com/product-update/quickbooks-payroll-price-changes/); [beancount.io 2026](https://beancount.io/blog/2026/09/05/quickbooks-desktop-enterprise-per-employee-pricing-payroll-fee-renewal-cost-guide)
- **Xero:**
  - Has partnered with Gusto for US payroll since July 2018.
  - Native payroll exists only in AU, NZ and UK. US payroll is "Xero Payroll powered by Gusto", a partner product.

  — [Wikipedia: Xero](https://en.wikipedia.org/wiki/Xero_(company)); [hr.software Xero Payroll review 2026](https://www.hr.software/reviews/xero-payroll)
- **Xero and Melio:**
  - Xero completed its acquisition of Melio on Oct 15, 2025: $2.5B up front ($2.15B cash + $360M in shares), plus up to $500M contingent.
  - Melio processed more than $30B in payments and earned $153M revenue in the year to March 2025.
  - Xero's "3×3" strategy covers accounting, payments and payroll across ANZ, UK and North America.

  — [CPA Practice Advisor](https://www.cpapracticeadvisor.com/2025/10/15/xero-acquires-payments-platform-melio-for-2-5b/170967/); [PR Newswire](https://www.prnewswire.com/news-releases/xero-to-acquire-melio-a-leading-us-smb-bill-pay-solution-to-accelerate-global-growth-302490268.html); [Payments Dive](https://www.paymentsdive.com/news/melio-xero-acquisition-payments-deal/751600/)
- An Aug 2026 article reports a new Xero US payroll launch, announced by Melio's CEO Matan Bar. It estimates partner-platform payroll powered by Gusto Embedded at $5–6/employee/month on top of the accounting subscription, and says Xero's own price was not confirmed. Low-confidence source. — [TechTimes, Aug 14 2026](https://www.techtimes.com/articles/324485/20260814/xero-payroll-launches-quickbooks-desktop-leaves-34m-workers-unpaid.htm)

### Inferences
- The closest precedents (FreshBooks, Xero and Wave) suggest BillingEase should embed Gusto Embedded, Check, Salsa or Rollfi in the US rather than build. Wave's own split between tax-service and self-service states shows how hard full 50-state filing is.
- With a $6–10/employee wholesale benchmark and a $5–6/employee retail price at incumbents like Wave and QuickBooks, unit margins are thin. Revenue will depend on the base fee ($20–50/mo) more than the per-employee fee.
- Under a Form 8655 reporting-agent model, the employer keeps penalty liability, but customer harm and churn land on BillingEase. Contract terms should say who pays penalties caused by provider error; most embedded providers advertise a tax-penalty guarantee (UNVERIFIED).

### Gaps
- No published partner price for Check, Gusto Embedded or Zeal. Quotes are needed.
- No sources found on:
  - ACH funding risk (the provider debits the employer and pays employees before the debit settles, so an NSF return becomes a loss), or on underwriting and credit limits.
  - SOC 1 Type II and SOC 2 requirements.
  - State-level PSP (payroll service provider) registration or bonding. UNVERIFIED (background knowledge): some states require PSP registration or bonds, e.g., Nevada; some, like New York, tie certain requirements to payroll service providers.
- Not researched this session, for lack of tool budget: local taxes (e.g., PA, OH and NY city/school-district taxes), new-hire reporting, garnishments, workers' comp, and W-2/1099 filing mechanics. UNVERIFIED (background knowledge):
  - W-2/W-3 and 1099-NEC are due Jan 31.
  - New hires must be reported to the state directory within 20 days in most states.
  - Federal deposits are monthly or semiweekly, under the lookback rule.
- No independent build-cost estimate found. See the final section.

## UK: RTI, PAYE, NI, auto-enrolment, HMRC recognition, providers and APIs

### Takeaway
UK payroll is centralized: HMRC's RTI submissions (FPS on or before each payday, EPS monthly) plus pension auto-enrolment, with no regional taxes. That makes it the most feasible non-US market. HMRC-recognised payroll APIs such as Staffology, PayRun.io and Moonworkers let BillingEase embed rather than build.

### Cited Findings
- Employer Class 1 NI has been 15% since April 2025 (up from 13.8%). The secondary threshold fell from £9,100 to £5,000 a year, with no upper limit. The Employment Allowance rose from £5,000 to £10,500, and the £100k eligibility cap was removed. — [Moneysoft](https://moneysoft.co.uk/support/employer-national-insurance-contribution-nic-changes-from-april-2025/); [PwC tax summaries](https://taxsummaries.pwc.com/united-kingdom/individual/other-taxes)
- Sources conflict on how long the £5,000 threshold stays frozen: until April 2028 in one, until at least 2030/31 in another. — [PwC](https://taxsummaries.pwc.com/united-kingdom/individual/other-taxes); [employerscalculator.co.uk 2026/27](https://employerscalculator.co.uk/guides/employer-ni-rates-2026-27)
- Staffology is an HMRC-recognised cloud payroll product with a full API. The API covers creating and reviewing FPS submissions, including inspecting the XML before it goes to HMRC. — [Staffology API docs: FPS](https://app.staffology.co.uk/api/docs/guides/payrun/fps)
- PayRun.io is an API-driven cloud payroll platform with real-time RTI submission (listicle source). — [WifiTalents](https://wifitalents.com/best/hmrc-approved-payroll-software/)
- Moonworkers is an HMRC-recognised payroll REST API priced per payslip. It notes that RTI-filing software must be recognised by HMRC and that recognised products are listed publicly (vendor blog). — [Moonworkers: payroll REST API](https://www.moonworkers.co.uk/blog/payroll-rest-api); [Moonworkers API](https://www.moonworkers.co.uk/blog/moonworkers-api)
- Xero runs native UK payroll. — [hr.software Xero Payroll](https://www.hr.software/reviews/xero-payroll)

### Inferences
- Building a UK engine is far smaller than the US one: one tax authority, plus Scottish and Welsh rate variants. Even so, HMRC recognition testing, annual rate and threshold changes, statutory payments (SSP, SMP and so on) and pension provider integrations make an API like Staffology or PayRun.io the faster route.
- Money movement is lighter than in the US: UK SMB payroll products typically produce a BACS file or payment instruction, and the employer pays HMRC itself. This lowers fund-handling risk (UNVERIFIED as a general rule).

### Gaps
- No pricing found for Staffology or PayRun.io.
- No primary source found for HMRC's recognised-software list URL or RTI penalty amounts. UNVERIFIED (background knowledge):
  - Late-FPS penalties run £100–£400 a month depending on employee count (1–9 employees: £100).
  - Auto-enrolment: 8% minimum total contribution, at least 3% from the employer, on qualifying earnings. The earnings trigger is £10,000.
  - Pensions Regulator fixed penalty: £400.
- Bulk FPS/EPS rules need confirming on gov.uk.

## EU: country-by-country variation; options, and why many apps skip it

### Takeaway
There is no single EU payroll: each country has its own tax, social-security filings and payslip rules. Accounting incumbents generally don't offer native EU payroll. Even PayFit covers only a few countries natively, and Deel and Remote work through EOR or partner networks of uneven quality.

### Cited Findings
- Xero's native payroll covers only AU, NZ and UK. Other countries need third-party integrations, and Xero is not an employer of record (EOR). — [hr.software Xero Payroll](https://www.hr.software/reviews/xero-payroll)
- PayFit's native local payroll is limited to France, Spain and the UK. — [hr.software PayFit review 2026](https://www.hr.software/reviews/payfit)
- Deel's claims conflict:
  - "Global payroll" in 130+ countries.
  - 150+ countries for contractors, per a third party.
  - The payroll engine is "localized for 50+ countries".

  Aggregators reach wide coverage through local partners of varying quality. — [Deel glossary](https://www.deel.com/glossary/global-payroll/); [Deel blog](https://www.deel.com/blog/where-you-can-run-payroll-for-international-employees/); [Illizeo comparison](https://illizeo.com/en/blog-articles/multi-country-payroll-comparison/)
- Deel has a Xero App Store integration, which shows the partner/integration route accounting apps use. — [Xero App Store: Deel](https://apps.xero.com/us/app/deel)
- One comparison suggests an HRIS plus a payroll engine (PayFit or Silae) for France and about five major EU countries, with local firms for harder markets. — [Illizeo](https://illizeo.com/en/blog-articles/multi-country-payroll-comparison/)

### Inferences
- For a small-business bookkeeping app, the practical EU option is integrate-and-sync rather than run payroll. That means importing payroll journals from local providers (DATEV in Germany, Silae or PayFit in France, and so on), possibly through a partner marketplace. Offering "payroll taxes filed for you" across the EU would be a multi-year, per-country program.

### Gaps
- Remote's API and local-payroll coverage were not found.
- No pricing for Deel or PayFit partner APIs.
- No unified EU embedded-payroll API was identified.

## Canada: CRA source deductions, ROE, T4, provincial; providers and embedded options

### Takeaway
Canada has one federal remittance system, but Quebec runs a separate one (RL-1, Revenu Québec) and provincial rules vary. Late-remittance penalties are steep and apply even when payment was initiated on time. Embedded options exist: Nmbr and Salsa (US + Canada).

### Cited Findings
- CRA late-remittance penalty for source deductions: 1–3 days late, 3%. 4–5 days, 5%. 6–7 days, 7%. More than 7 days, or nothing remitted, 10%. Repeat or gross-negligence failures can reach 20%. The penalty applies even if the employer can show payment was initiated on time. — [TaxTips.ca](https://taxtips.ca/smallbusiness/latepayrollremittance.htm); [Barrett Tax Law](https://www.barretttaxlaw.com/glossary/cra-penalties); [Knowledge Bureau, Oct 2025](https://www.knowledgebureau.com/site/KBR/dont-be-late-cras-electronic-remittances)
- The CRA prescribed interest rate on overdue remittances was 7% for Q4 2025 (dated). — [Mercans](https://mercans.com/resources/statutory-alerts/canada-cra-q4-2025-payroll-remittance-interest-rates)
- Regular remitters pay by the 15th of the month after payroll; quarterly remitters by the 15th of the month after the quarter. — [accounts-os.com](https://accounts-os.com/ca/deadlines/payroll-remittance-ca)
- **Nmbr:**
  - A Canadian payroll API for vertical SaaS, HR software and financial institutions, with prebuilt components or a custom API.
  - Raised CAD $7.6M (Sept 2024).
  - Collage uses it to embed payroll in its Canadian HR platform.

  — [Nmbr](https://nmbr.co/); [BusinessWire](https://www.businesswire.com/news/home/20240924021989/en/Nmbr-Secures-CAD-$7.6-Million-to-Bring-Embedded-Payroll-to-Canada); [CFOtech](https://cfotech.ca/story/collage-adds-embedded-payroll-to-canadian-hr-platform)
- Salsa covers the US and Canada in one integration. — [Open Banking Tracker Salsa](https://www.openbankingtracker.com/embedded-finance/salsa)
- Wagepoint automates CRA remittances, files T4, T4A and ROE, includes Quebec's RL-1, and syncs with Xero, QBO and FreshBooks. No embedded API was identified. — [LedgerLogic](https://www.ledgerlogic.ca/tools/payroll); [Wagepoint](https://www.wagepoint.com/resources/blog/best-payroll-companies-canada/)
- Wave's Canadian payroll does not support Quebec and integrates only with Wave accounting. — [LedgerLogic](https://www.ledgerlogic.ca/tools/payroll)
- Rise People is a Canadian payroll/HR vendor. — [Rise blog](https://risepeople.com/blog/what-is-the-best-payroll-software-in-canada/)

### Inferences
- Using Salsa for both the US and Canada, or Nmbr for Canada only, would let BillingEase launch Canada with one partner. Excluding Quebec at launch, as Wave does, is an established shortcut.

### Gaps
- ROE and T4 deadlines were not confirmed. UNVERIFIED (background knowledge): T4 slips and summary are due the last day of February. An ROE is due within 5 calendar days after the end of the pay period with the interruption, if filed electronically. CPP2 and EI rates also not researched.
- Nmbr and Salsa pricing not found.

## Australia: STP Phase 2, super and Payday Super, awards; Employment Hero (KeyPay)

### Takeaway
Australia is fully digital: every pay event goes to the ATO through STP. From 1 July 2026, Payday Super requires super contributions per pay run instead of quarterly. Modern awards make pay calculation the hardest part. Employment Hero's payroll (formerly KeyPay) is the established white-label engine behind accountants and platforms.

### Cited Findings
- STP Phase 2 has been mandatory since 1 Jan 2022, with deferrals to 31 Dec 2022. Annual STP finalisation is due 14 July. — [AccountsOS](https://accounts-os.com/blog/single-touch-payroll-phase-2-small-business); [Sleek AU](https://sleek.com/au/resources/single-touch-payroll-guide/)
- **Payday Super, from 1 July 2026:**
  - Super must reach the fund within 7 days of each payment of qualifying earnings. Sources conflict on calendar vs business days.
  - Employers keep reporting through STP-enabled software every pay day.
  - Until 30 June 2027 the ATO still accepts super liability and OTE in pay events. Once an employer reports qualifying earnings, it stops accepting OTE.

  — [ATO: STP reporting under Payday Super](https://www.ato.gov.au/businesses-and-organisations/super-for-employers/paying-super-on-payday/single-touch-payroll-reporting-under-payday-super); [Fuse Recruitment](https://www.fuserecruitment.com/blogs/payday-super-starts-1-july-2026-what-every-employer-needs-to-know/)
- **Employment Hero (KeyPay):**
  - KeyPay rebranded to Employment Hero for its partner network and SME payroll customers (about March 2023).
  - Over 750 partners process payroll for more than 200k businesses (third-party figure).
  - Legacy KeyPay pricing: Standard $4 and Plus $6 per active employee per month (may be outdated).
  - Partner terms come through a contact form.

  — [Employment Hero blog](https://employmenthero.com/blog/keypay-becomes-employment-hero/); [KeyPay integration page](https://www.keypay.com.au/feature/integration); [GetApp](https://www.getapp.com/hr-personnel-software/a/keypay/reviews/)
- Xero runs native AU payroll. — [hr.software Xero Payroll](https://www.hr.software/reviews/xero-payroll)

### Inferences
- Building an AU engine means STP Phase 2 certification, award interpretation (overtime, penalty rates, allowances under 100+ modern awards) and, from July 2026, per-pay-run super clearing. White-labelling Employment Hero is the obvious route. Building is unrealistic for a new entrant.

### Gaps
- No white-label API rate card found.
- The "100+ modern awards" count is UNVERIFIED (background knowledge: about 120+ awards).
- The SG rate of 12% from 1 July 2025 is UNVERIFIED (background knowledge).

## India: PF, ESI, PT, TDS, Form 16, LWF; providers

### Takeaway
Indian payroll stacks central schemes (EPF, ESI, TDS) with state ones (professional tax and LWF). The rules are changing in 2026: PF wage-ceiling reports, and the new Income Tax Act 2025 forms. Local SaaS payroll is cheap, from about ₹100–150 per employee per month. No public embedded payroll API was found.

### Cited Findings
- **Contribution rates and thresholds:**
  - EPF: 12% employee + 12% employer.
  - ESI: 0.75% employee + 3.25% employer, for wages up to ₹21,000/month.
  - Professional tax is set by each state, capped at ₹2,500 a year. Delhi, UP, Haryana and Rajasthan don't levy it.

  — [Wisemonk 2026](https://www.wisemonk.io/blogs/payroll-compliance-in-india); [IncorpX](https://www.incorpx.io/blog/payroll-compliance-india-pf-esi-tds-guide)
- **Conflicts to verify:**
  - One source says the PF wage ceiling rose to ₹25,000 from 17 Sep 2026; others still cite ₹15,000.
  - One says the Income Tax Act 2025 replaced Form 24Q with Form 138 from 1 Apr 2026.
  - The ESI payment due date is the 15th in most sources.

  — [FutureX 2026](https://futurexsolutions.com/payroll-compliance-india-2026/); [Hivepayroll calendar](https://www.hivepayroll.co.in/payroll-compliance-calendar/); [AccountX](https://accountx.in/payroll-compliance-checklist-india-2026/)
- **RazorpayX Payroll:**
  - The official pricing page lists Prime (up to 20 employees) and Elite (up to 100). Extra employees cost ₹150/employee/month, plus 18% GST. Enterprise is quote-only.
  - A third party says Prime is ₹2,499/mo billed annually and Elite ₹5,499/mo.

  — [Razorpay Payroll pricing](https://razorpay.com/payroll//pricing); [positioniseverything](https://www.positioniseverything.net/razorpayx-payroll-pricing-reviews-2026/)
- greytHR and Keka are major local alternatives. No pricing or API information was found. — [greytHR list](https://www.greythr.com/list/best-payroll-software/)

### Inferences
- With local SaaS at about ₹100–150/employee and RazorpayX bundling payouts, a foreign bookkeeping app has little room on price. The integrate-and-sync route (import payroll journals) is more realistic than a filed-for-you payroll.

### Gaps
- LWF rates, Form 16 mechanics and the 2026 TDS form changes are unconfirmed.
- No partner/embedded API found for RazorpayX, Keka or greytHR.
- UNVERIFIED (background knowledge): Form 16 is due to employees by 15 June.

## Sri Lanka: EPF/ETF, APIT, filing practicalities, software

### Takeaway
The statutory structure is simple: EPF at 8% employee + 12% employer, ETF at 3% employer, and APIT withholding with 2025 relief changes. No embedded payroll API exists. Most market software is local desktop or cloud HR, so a built-in calculator is feasible but e-filing integration is not.

### Cited Findings
- EPF is 8% employee + 12% employer, and ETF 3% from the employer only. These are statutory minimums; approved private provident funds may differ. Total employer on-cost is about 15–18% including other levies. — [Playroll](https://www.playroll.com/payroll/sri-lanka); [sl-salary-cal](https://sl-salary-cal.vercel.app/report.html)
- The contribution base varies by interpretation. One calculator uses "EPF-liable" earnings (basic pay plus fixed allowances, excluding reimbursements). — [Gethumanised calculator](https://www.gethumanised.com/tools/salary-calculator-sri-lanka/)
- APIT: personal relief rose from LKR 1.2M to 1.8M a year, and the 12% band was removed, under Inland Revenue (Amendment) Act No. 2 of 2025, effective 1 Apr 2025 (secondary source). — [sl-salary-cal](https://sl-salary-cal.vercel.app/report.html); [Dulan Dias APIT tables](https://www.dulandias.com/calculators/apit-tax-tables)

### Inferences
- For Sri Lanka, BillingEase could build a payroll calculator with payslips, EPF/ETF schedules and APIT tables (small scope). Filing would stay manual, or go through bank/CBSL channels, until official APIs exist.

### Gaps
- No official EPF, ETF or IRD documents retrieved.
- No information on e-filing APIs (EPF e-return, IRD e-services), payroll software vendors, or filing deadlines.

## Singapore: CPF, IR8A/AIS, SDL; providers

### Takeaway
Singapore is a compact, rules-driven market. CPF has age-banded rates and wage ceilings (ordinary wage ceiling S$8,000 from 2026), SDL is 0.25%, and IRAS's Auto-Inclusion Scheme (AIS) is used for annual IR8A submission. Building in-house is plausible, but CPF and IRAS submission integration needs research.

### Cited Findings
- **CPF from 1 Jan 2026:**
  - Employees aged 55 and under: 37% total (17% employer + 20% employee).
  - Ordinary wage ceiling: S$8,000/month, up from S$7,400 in 2025, S$6,800 in 2024 and S$6,300 in Sept–Dec 2023.
  - Annual salary ceiling: S$102,000. Annual contribution limit: S$37,740.
  - Maximum employer contribution: S$1,360/month.
  - Ages over 55 to 60: 34% (16% employer, 18% employee). Over 60 to 65: 25% (12.5% each).
  - CPF applies only to citizens and PRs, not to EP, S Pass or Work Permit holders.

  — [Harvest Accounting](https://www.harvestaccounting.com.sg/post/cpf-contribution-rates-singapore-employer-guide); [Aspire](https://aspireapp.com/blog/employee-cpf-contribution-singapore); [Synergy Accounting](https://synergyaccounting.sg/resources/cpf-contribution-rates-singapore)
- SDL is 0.25% of wages, capped at S$11.25 a month. The statutory employer cost for an employee aged 55 or under is 17.25% on wages from S$800 to S$4,500 (single secondary source). — [Slasify](https://slasify.com/en/blog/employer-contribution-in-singapore)

### Gaps
- IR8A/AIS details were not found. UNVERIFIED (background knowledge): AIS is mandatory for employers with 5+ employees, and submission is due 1 March.
- No Singapore payroll API providers identified. Local SMB vendors such as Swingvy, QuickHR and Talenox appear only as blog sources.

## Liability, licences, bonding, SOC: cross-market risk

### Takeaway
The biggest risks are missed or late tax deposits (US 2–15% plus 100% TFRP; CRA 3–20%) and holding employer funds, which raises money-transmission and ACH credit-loss issues. Embedding a provider that acts as reporting agent and moves the funds keeps most of this off BillingEase's balance sheet. It does not remove reputational exposure.

### Cited Findings
- US penalty tiers, TFRP and reporting-agent liability: see the US section. — [IRS](https://www.irs.gov/payments/failure-to-deposit-penalty)
- Canada penalty tiers: see the Canada section. — [TaxTips.ca](https://taxtips.ca/smallbusiness/latepayrollremittance.htm)
- US money-transmitter exemptions for payroll are state-specific and fact-dependent (CA §2010(j); MN). — [CA DFPI](https://dfpi.ca.gov/rules-enforcement/laws-and-regulations/opinion-letters-by-law-subject/mta-payroll-processing/); [Minn. Stat. 53B.29](https://www.revisor.mn.gov/statutes/cite/53B.29/pdf)

### Inferences
- If BillingEase builds its own engine and moves money, it needs:
  - Reporting-agent status (Form 8655, plus state equivalents) in every state.
  - A sponsor bank and ODFI relationship for ACH.
  - An MTL analysis per state.
  - Probably SOC 1 Type II, which payroll customers' auditors expect, plus SOC 2.
  - Credit underwriting for pre-funded payrolls.

  Embedded providers absorb these.

### Gaps
- No sources retrieved on SOC 1/SOC 2 expectations, PSP bonding, ACH NSF loss rates, or state PSP registration. These need targeted follow-up.

## Build vs buy: cost and timeline

### Takeaway
No credible public estimate of the cost to build a US payroll engine was found. The evidence for buying is indirect but consistent: Wave limited full-service filing to 14 states for years; FreshBooks, Xero and banks like U.S. Bank chose Gusto rather than build; and embedded providers claim launches in "weeks" (Gusto: as little as 4 weeks with pre-built flows).

### Cited Findings
- Gusto Embedded: "live in as little as four weeks" with pre-built UI flows (third-party directory). — [Open Banking Tracker](https://openbankingtracker.com/embedded-finance/gusto-embedded)
- Salsa claims go-live "in weeks", via the Express UI components or the Paystream API. — [Salsa](https://www.salsa.dev/)
- Embedded economics: about $35–70 base + $6–10/employee/month; platform keeps about 2/3 and provider about 1/3 (third-party estimate). — [Open Banking Tracker](https://www.openbankingtracker.com/embedded-finance/category/payroll)
- FreshBooks went from announcement (Oct 2023) to launch (Jan 2024) in about 3 months. — [FreshBooks press release](https://freshbooks.com/press/releases/freshbooks-to-leverage-gusto-to-power-upcoming-embedded-payroll-service)

### Inferences
- Realistic plan:
  - **US:** embed (Gusto Embedded, Check, Salsa or Rollfi); about 1–3 months for the pre-built UI, 3–6 months for a native API build.
  - **Canada:** Salsa or Nmbr.
  - **UK:** Staffology or PayRun.io API.
  - **Australia:** Employment Hero white-label.
  - **India, Sri Lanka, Singapore, EU:** integrate-and-sync with local payroll providers, or a calculation-only "lite payroll" without filing.
- Building a US engine in-house plausibly takes multiple years and a dedicated tax-content team: thousands of jurisdictions, annual rate updates, filing and agency registrations, plus money movement. No source in this session quantifies this (UNVERIFIED).

### Gaps
- No published in-house build cost, team-size or timeline data.
- No information on tax-engine licensing alternatives (e.g., Symmetry Tax Engine as a "build engine, buy tax calcs" middle path).
- No published revenue-share percentages from any named vendor.
