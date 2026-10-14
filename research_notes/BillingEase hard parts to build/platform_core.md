# BillingEase: Non-Banking Hard Parts (Platform Core)

Research date: 2026-10-10. Many pricing figures come from third-party aggregators and are flagged as such. Check them against vendor pages before budgeting.

## Accounting core: ledger correctness, immutability, period locking, CoA localisation, precision; ledger build vs buy

### Takeaway
Use Postgres for the ledger. Make the entry tables append-only (corrections are posted as reversals or adjustments, never edits), and enforce balanced journals and locked periods in the database. Hosted ledgers (Modern Treasury) and ledger databases (TigerBeetle, Formance) are designed for moving money, not for SMB bookkeeping. None of them provides accrual/cash reporting, a localised chart of accounts or accountant workflows.

### Cited Findings
- Modern Treasury says its ledger has "never violated" three principles: double-entry, auditability and immutability. A correction leaves the original transaction untouched and posts a new transaction with the opposite amount, then a new entry with the corrected amount — [Modern Treasury: Enforcing immutability](https://moderntreasury.com/journal/enforcing-immutability-in-your-double-entry-ledger)
- Every change in Modern Treasury Ledgers creates an audit-log entry that records the actor. The product is a "fully managed cloud database for recording financial transactions and balances" with SDKs for JS, Java/Kotlin, Python and Go — [MT Ledgers](https://www.moderntreasury.com/ledgers); [MT Ledgers docs](https://docs.moderntreasury.com/ledgers/docs); [SoftwareOne listing](https://platform.softwareone.com/product/ledgers/PCP-8843-7659)
- Modern Treasury's "Accounting for Developers" series (Parts I–III) is a good primer for the engineering team — [MT Journal](https://www.moderntreasury.com/journal)
- Formance is an open-source programmable ledger that can be self-hosted or run on its cloud, with transactions written in Numscript. TigerBeetle is an open-source financial-transactions database for high-throughput double-entry workloads. It is "a specialized foundation, not a finished operational ledger product". A comparison describes Modern Treasury as strong for payment ops but needing "heavier lifting to deliver full bookkeeping" — [fintechspecs comparison](https://fintechspecs.com/blog/best-fintech-ledger-tools-startups/); [OpenLedger vs Modern Treasury](https://www.openledger.com/openledger-hq/assessing-embedded-accounting-apis-open-ledger-versus-modern-treasury-for-saas-solutions); [Open Banking Tracker TigerBeetle alternatives](https://openbankingtracker.com/embedded-finance/tigerbeetle/alternatives)
- India's Companies Act s.128(1) requires books of account kept "on accrual basis and according to the double entry system of accounting". So Indian company clients need accrual reports, and cash-basis output alone does not satisfy the requirement — [Companies Act 2013 s.128 (advocatekhoj)](https://www.advocatekhoj.com/library/bareacts/companies2013/128.php); [Tally summary](https://tallysolutions.com/accounting/mandatory-accounting-records-companies-act/)

### Inferences
- These are design rules from general accounting and engineering practice, not from the sources above:
  - Store amounts as integer minor units, or as NUMERIC with a currency-specific scale. Most currencies have 2 decimals, JPY has 0, KWD/BHD have 3. INR, LKR, SGD, AUD, CAD, GBP and EUR all use 2.
  - Round once per tax line or per invoice according to each country's rule, and post any rounding difference to a rounding account.
  - Check that debits equal credits in a deferred constraint or trigger.
  - Lock periods with a `locked_until` date per business, and reject backdated postings unless the user is an accountant who records an override reason.
  - Generate cash-basis reports from accrual data by allocating each payment against its invoice.
- The chart of accounts needs per-country templates: US (Schedule C-friendly), UK (FRS 102/105 and MTD VAT boxes), Canada (GIFI codes), Australia (BAS/GST), India (Schedule III, GST input/output by CGST/SGST/IGST), Singapore (GST F5) and Sri Lanka (VAT/SSCL). Expect about 1–2 accountant-weeks per country to design a template and test reports.
- Rough effort (my estimate): a correct Postgres ledger with journals, accounts, period locks, audit log, trial balance, P&L, balance sheet and accrual/cash toggle takes 2–3 senior engineers about 3–4 months. Buying Formance or Modern Treasury saves perhaps 4–6 weeks of ledger primitives. It adds vendor lock-in and does not remove the reporting, CoA or tax work.

### Gaps
- No published pricing for Modern Treasury Ledgers or Formance Cloud was found (both appear to be sales-led). TigerBeetle and Formance licences were not checked on GitHub.
- No sourced per-country rounding rules for tax lines (for example India GST rounding to the rupee, or the UK VAT per-line vs per-invoice option).

## Multi-currency: FX sources, tax-authority rates, realised/unrealised gains, revaluation

### Takeaway
Some tax authorities require or accept particular official rates: the HMRC monthly VAT rates and the Bank of Canada rate for CRA purposes. You therefore need to store several rate sources per date and record which source was used on each transaction. A commercial API alone is not enough. Realised and unrealised gains and period-end revaluation must post automatic journals into the ledger.

### Cited Findings
- HMRC publishes average monthly exchange rates that traders must use for VAT returns. For direct tax, HMRC generally accepts the rate a company uses in its accounts, provided it is used consistently — [HMRC CFM12070](https://www.gov.uk/hmrc-internal-manuals/corporate-finance-manual/cfm12070)
- The CRA accepts Bank of Canada rates. If the Bank does not quote a currency, the CRA accepts another verifiable source used consistently, including annual or monthly averages applied the same way each year. This guidance is from the Digital Services Tax context — [Canada.ca conversion of foreign currency](https://www.canada.ca/en/services/taxes/excise-taxes-duties-and-levies/digital-services-tax/rate-exchange.html)

### Inferences
- Likely rate sources: ECB reference rates (free, about 30 currencies, published daily, but not LKR), the HMRC monthly rates, Bank of Canada, the RBA, the RBI/FBIL reference rate or CBIC customs rates for India, MAS for Singapore and the Central Bank of Sri Lanka. Add a commercial feed (Open Exchange Rates, Fixer, XE, currencylayer) to cover every currency pair.
- Revaluation design: at period end, post an unrealised gain/loss journal on open AR/AP and foreign-currency balances and reverse it on day 1 of the next period. Post the realised gain/loss when a payment settles at a rate different from the invoice rate. Estimate 4–6 engineer-weeks including tests.

### Gaps
- Pricing for Open Exchange Rates, Fixer and XE was not retrieved in this pass. India's and Sri Lanka's tax-authority rate rules were not confirmed from primary sources.

## Receipt and bill capture (OCR/extraction)

### Takeaway
Cloud document APIs cost about $0.01 per page. Specialist receipt vendors cost $0.035–0.08 per document with monthly minimums. LLM vision models can be much cheaper per document (well under $0.01 on small Gemini models) and are competitive on accuracy. A practical design is a cheap LLM or prebuilt-model first pass, confidence scoring and human confirmation in the UI, plus an email-in address per business.

### Cited Findings
- AWS Textract AnalyzeExpense: about $0.010 per page ($10 per 1,000 pages) according to third parties — [aliteq IDP pricing](https://aliteq.com/idp-pricing-per-page); [wring.co Textract guide](https://wring.co/blog/aws-textract-pricing-guide)
- Azure Document Intelligence prebuilt receipt and invoice models: about $10 per 1,000 pages. One 2026 comparison gives $8–10 per 1,000 for prebuilt models across vendors — [LiteLLM docs](https://docs.litellm.ai/docs/providers/azure_document_intelligence); [ud.hk 2026 costs](https://ud.hk/en/blogs/insight/article/ai-document-processing-costs-2026-08-11)
- Mindee (official docs) prices in credits:

  | Plan | Price/month | Credits/year | Overage per credit |
  |---|---|---|---|
  | Starter | €44 | 6,000 | €0.05 |
  | Pro | €179 | 30,000 | €0.04 |
  | Business | €584 | 120,000 | €0.035 |

  Annual billing is 10% cheaper and the trial covers 200 pages. The page-to-credit mapping is not confirmed — [Mindee plans docs](https://docs.mindee.com/account-management/plans); [Mindee pricing](https://www.mindee.com/pricing)
- Veryfi: free tier up to 100 documents/month. Starter is about $500/month minimum for about 5,000 documents, around $0.08 per receipt and $0.16 per invoice. Another source quotes $0.10–0.20 per document, so the sources conflict — [erpresearch Veryfi](https://erpresearch.com/erp-add-ons/ocr/veryfi/pricing); [idp-software Veryfi](https://idp-software.com/vendors/verify/)
- One 2026 roundup lists Mistral OCR at $1–2 per 1,000 pages (third-party) — [aiproductivity.ai](https://aiproductivity.ai/blog/best-ai-ocr-tools/)
- Accuracy:
  - In one invoice test, Textract scored 91.3% without line items and 91.1% with them. Google Document AI scored 83.8%, falling to 68.1% with tables. Gemini scored 94.2% on tables. The LLMs in that test received OCR text, not images — [HackerNoon invoice test](https://hackernoon.com/can-your-llm-handle-an-invoice-i-tested-5heres-the-truth)
  - AIMultiple reported a 97% average success rate for Claude 3.5 Sonnet on receipts — [AIMultiple receipt OCR](https://research.aimultiple.com/receipt-ocr)
  - A Dec 2025 vendor guide estimates about $0.0006 per invoice on Gemini 2.5 Pro versus $0.045 on Claude Opus 4.5. Its methodology was not verified — [codesota guide](https://www.codesota.com/guides/invoice-processing-vllm)
  - Academic comparisons: [arXiv 2509.04469](https://arxiv.org/html/2509.04469v1); [ACL 2026 receipt MLLM benchmark](https://preview.aclanthology.org/ingest-acl/2026.acl-long.2135/)

### Inferences
- Example: 10k SMBs × 20 receipts/month = 200k pages/month. That costs about $2k/month on Textract or Azure, about €7k/month on Mindee overage rates, and possibly a few hundred dollars on small LLM models.
- Email-in receipts: one inbound address per business through SES inbound, Postmark inbound or a similar service, then parse attachments into the same pipeline. Estimate 2–3 weeks.
- Receipt capture overall (mobile capture, extraction, review UI, matching to bank lines and bills) is about 2–3 engineer-months.

### Gaps
- No Taggun per-page API price found; Capterra only shows "NZ$0.06" with no clear unit. Google Document AI expense parser pricing was not retrieved. No independent head-to-head receipt-image benchmark covering GPT, Gemini and Textract was found.

## Transaction categorisation and merchant cleaning

### Takeaway
The usual path is per-business rules ("always categorise X as Y"), then an LLM or ML fallback with confidence thresholds that learns from user corrections. Enrichment vendors are mostly sales-priced. Ntropy offers a 2,000-transaction free test, then custom pricing.

### Cited Findings
- Ntropy enrichment is credit-based at one credit per transaction, with a maximum balance of 100,000 credits. Sync requests take up to 4,000 transactions and batch up to 24,960. There is a free test of 2,000 transactions and "no commitment plans or custom pricing"; the public rate card says "Contact the product provider" — [Ntropy TX Enrichment](https://ntropy.com/txen); [Ntropy rate limits](https://docs.ntropy.com/api/rate-limits); [FitGap Ntropy](https://us.fitgap.com/products/047041/ntropy)

### Inferences
- An LLM classifier that sees the CoA, merchant string, amount and the user's past categorisations can run at fractions of a cent per transaction with batching and caching. Cache merchant-to-category mappings across tenants to cut cost.
- Estimate 4–8 engineer-weeks for rules, LLM fallback, a feedback loop and an evaluation set.

### Gaps
- Plaid Enrich/Transactions pricing was not found (likely sales-led). Ntropy's actual per-transaction price was not found.

## Security and compliance: SOC 2, ISO 27001, privacy laws, record retention

### Takeaway
A first SOC 2 Type II typically takes 3–6 months of preparation plus a 3–12 month observation window. Year-one cost is roughly $15k–50k at the lean end (platform plus auditor), rising to $75k–150k+ with consultants and internal time.

Two privacy deadlines fall right around launch:
- India's DPDP core obligations take effect about 13 May 2027 under phased rules notified 13 Nov 2025.
- Sri Lanka's PDPA core obligations take effect 1 January 2027, after an amendment and a July 2026 Gazette.

Statutory retention ranges from 5 to 8 years. Default to retaining 8 years from the end of the financial year, configurable per country.

### Cited Findings
- SOC 2:
  - Platforms such as Vanta and Drata cost about $10k–25k/year. Auditors charge $7k–50k (another estimate: 12k–60k). Type II totals range from $30k to $150k+ (another source: $75k–200k+). Internal time is about 100–300 hours. The observation window is 3–12 months and preparation 3–6 months. Most sources are vendor-affiliated — [guptadeepak SOC 2 for startups](https://guptadeepak.com/guides/soc-2-for-startups/); [startupdefense](https://www.startupdefense.io/soc-2-costs-for-startups-complete-breakdown-and-budget-guide); [beancount.io 2026 guide](https://beancount.io/ko/blog/2026/07/14/soc-2-type-ii-small-saas-audit-cost-guide); [cipherssecurity 2026](https://cipherssecurity.com/soc-2-type-ii-90-day-guide-cost-2026/)
  - A Drata customer story describes a small company choosing Drata over Vanta on cost (marketing material) — [Drata](https://drata.com/customers/wins/the-compliance-gap-standing-between-a-startup-and-enterprise-sales)
- India DPDP:
  - The Rules were notified 13 Nov 2025, after a draft on 3 Jan 2025. Data Protection Board provisions took effect immediately. Consent Manager registration follows after 12 months (Nov 2026).
  - Core obligations follow 18 months after notification: notice, consent, security safeguards, breach intimation and data principal rights. Hogan Lovells' description of the Rule 4 date conflicts with the others.
  - Final dates are quoted as 12, 13 or 14 May 2027 depending on the source. Check the Gazette — [Hogan Lovells](https://www.hoganlovells.com/en/publications/indias-digital-personal-data-protection-act-2023-brought-into-force-); [AZB Partners](https://www.azbpartners.com/bank/indias-digital-personal-data-protection-act-phased-rollout-and-key-compliance-milestones/); [TCSA roadmap](https://www.tcsa.in/resources/dpdp-rules-2025-implementation-roadmap)
- Sri Lanka PDPA (No. 9 of 2022):
  - The planned 18 Mar 2025 start was repealed days before it began. The Amendment Act No. 22 of 2025 (certified 30 Oct 2025) lets the Minister set dates by Gazette.
  - Extraordinary Gazette 2498/16 (22 Jul 2026) appoints 1 Jan 2027 for the scope provisions, Part I and Part III (controller and processor obligations).
  - Part V has applied since July 2023, and Parts VI, VIII, IX and X since 1 Dec 2023 — [DPA Sri Lanka](https://dpa.gov.lk/est.php); [Amendment Act 22/2025](https://dpa.gov.lk/acts/22-2025_E_251104_201549.pdf); [FT.lk](https://www.ft.lk/front-page/Data-protection-compliance-regime-takes-effect-on-1-Jan-2027/44-795776)
- Retention:
  - Canada (CRA): 6 years from the end of the last tax year the records relate to — [Montreal Financial summarising CRA](https://www.montrealfinancial.ca/blog/how-long-to-keep-your-business-documents-according-to-cra)
  - Australia (ATO): 5 years, plus any period of review — [ATO](https://www.ato.gov.au/businesses-and-organisations/preparing-lodging-and-paying/record-keeping-for-business/overview-of-record-keeping-rules-for-business/records-to-keep-longer-than-five-years)
  - UK: VAT records generally at least 6 years; the HMRC internal policy is "6+1" — [ionos UK](https://www.ionos.co.uk/digitalguide/startup/grow-your-business/retention-periods-for-business-records/); [HMRC policy](https://gov.uk/government/publications/hmrc-records-management-and-retention-and-disposal-policy/records-management-and-retention-and-disposal-policy)
  - India: Companies Act s.128 implies 8 years (s.128(5)). Penalties are a fine of ₹50k–5 lakh and/or up to 1 year imprisonment for officers — [Tally](https://tallysolutions.com/accounting/mandatory-accounting-records-companies-act/); [advocatekhoj](https://www.advocatekhoj.com/library/bareacts/companies2013/128.php)

### Inferences
- MFA (TOTP plus WebAuthn passkeys) should be in the MVP because accountant access multiplies credential risk. Use an auth vendor (Clerk, WorkOS, Auth0, Stytch) or open-source options (Keycloak, Ory). Budget 2–4 weeks including RBAC for owner, admin, accountant, read-only and similar roles.
- Data residency: the EU, UK, India, Australia and others make an EU region plus a US region a likely v1 need. India's DPDP allows cross-border transfer except to countries the government blacklists, so localisation is not strictly required for SMB bookkeeping data. That is background knowledge, not verified this pass.
- Retention conflicts with deletion rights: GDPR erasure versus 6–8 year tax retention. Implement "restrict and retain" — archive the data and block processing, then hard-delete after the retention expiry date.

### Gaps
- Not verified from primary sources this pass: GDPR, CCPA/CPRA, PIPEDA, the Australian Privacy Act 2024 amendments and Singapore PDPA specifics.
- The US 7-year guidance (IRS generally 3 years, 6–7 for some cases) and the Singapore 5-year (IRAS/ACRA) and Sri Lanka retention periods were not confirmed.
- ISO 27001 cost and timeline were not retrieved; the industry rule of thumb is similar to SOC 2 plus certification-body fees, unverified.

## Transactional email deliverability and SMS/WhatsApp reminders

### Takeaway
Invoice emails are sent "from" the customer's business. Use a shared, well-authenticated sending domain with Reply-To set to the customer, and optionally let customers verify their own domain (DKIM CNAMEs). Meet the Gmail/Yahoo rules (SPF, DKIM, DMARC, RFC 8058 one-click unsubscribe for marketing, spam rate below 0.3%). Costs per 10k emails: SES about $1, Resend about $4, Postmark $15–18 with better deliverability support. WhatsApp moved to per-template-message pricing on 1 July 2025. India utility templates were about ₹0.13 at that time.

### Cited Findings
- Gmail/Yahoo bulk senders (over 5,000 messages/day to Gmail) must use SPF, DKIM and DMARC (p=none is enough), offer one-click unsubscribe (RFC 8058) and honour unsubscribes within 2 days. Spam rates must stay below 0.3% (0.1% is the healthy target). Yahoo also expects 1024-bit or longer DKIM keys and ARC for forwarders — [Bird docs](https://bird.com/docs/knowledge-base/deliverability/gmail-yahoo-requirements); [Mailgun](https://www.mailgun.com/blog/deliverability/gmail-yahoo-webinar-key-takeaways/); [Bounteous](https://www.bounteous.com/insights/2024/01/31/2024-gmail-and-yahoo-deliverability-changes/)
- Email provider pricing:
  - SES: $0.10 per 1,000, dedicated IP $24.95/month.
  - Resend: free tier 3,000/month (100/day); Pro $20/month for 50k.
  - Postmark: Basic $15, Pro $16.50 and Platform $18 per month for 10k emails; overage $1.80, $1.30 or $1.20 per 1,000.
  - Sources: [automationatlas Postmark](https://automationatlas.io/answers/postmark-pricing-explained-2026/); [costbench SES vs Resend](https://costbench.com/compare/amazon-ses-vs-resend/); [surecontact SMTP pricing 2026](https://clone.surecontact.com/smtp-pricing-2026/)
- WhatsApp (Meta) charges per delivered template message from 1 Jul 2025, varying by category and country. Service messages inside the 24-hour window are free, as are utility templates sent inside an open window. Volume tiers took effect from Oct 2025 and rate cards were updated in Jan 2026.
- India rates (third-party): utility ₹0.13, authentication ₹0.13, marketing ₹0.86 — [Meta pricing](https://developers.facebook.com/docs/whatsapp/pricing); [MyOperator](https://support.myoperator.com/portal/en/kb/articles/whatsapp-has-shifted-to-per-message-pricing-effective-july-1-2025-based-on-message-categories-and-your-recipient-s-country-in-india-there-are-three-paid-categories)

### Inferences
- Payment reminders sent as WhatsApp utility templates suit India and Sri Lanka, where WhatsApp is the dominant channel.
- India SMS requires DLT template registration with TRAI (background knowledge, unverified here).
- Effort: 2–4 weeks for email with bounce/complaint webhooks and per-tenant domain verification, plus 2–3 weeks for WhatsApp through a BSP (Twilio, Gupshup, 360dialog) or Meta Cloud API directly.

### Gaps
- No primary Google page fetched this pass. Sri Lanka WhatsApp rates and Twilio SMS rates per country were not retrieved.

## Data import/migration from Wave, QuickBooks, Xero; accountant workflows

### Takeaway
API-based migration is now metered. Since 2 Mar 2026, Xero charges app partners by connections and data egress, and the Journals endpoint requires the Advanced tier (about $895/month). Intuit started metering CorePlus (read) calls on 28 Jul 2025, with Builder free for 500k credits/month. CSV/Excel import of contacts, items, opening balances and a trial balance is the cheap, universal fallback and works for Wave as well.

### Cited Findings
- Xero tiers (from 2 Mar 2026):

  | Tier | Price/month | Connections | Egress |
  |---|---|---|---|
  | Starter | free | 5 | — |
  | Core | ~$22 (also quoted ~€20) | 50 | 10 GB |
  | Plus | ~$152 | 1,000 | 50 GB |
  | Advanced | ~$895 (~$10.7k/year) | 10,000 | 250 GB |
  | Enterprise | — | — | — |

  - Egress overage is about A$2.40/GB.
  - Premium endpoints (Journals, Practice Manager) require Advanced or above.
  - Xero data may not be used to train AI/ML models.
  - This replaced the old free API with a 15% App Store revenue share.
  - Sources: [Xero developer pricing](https://developer.xero.com/pricing); [Xero FAQ](https://developer.xero.com/faq/pricing-and-policy-updates); [truto.one](https://truto.one/blog/xero-api-pricing-changes-2026-costs-tiers-and-how-to-minimize-egress/); [Codat](https://docs.codat.io/updates/260116-xero-pricing); [Chift](https://www.chift.eu/blog/xero-march-2026-changes-guide-for-third-party-developers)
- Intuit App Partner Program (QBO only, live 28 Jul 2025):
  - Core (write) calls are free and unlimited. CorePlus (read) calls are metered.
  - Builder: free, 500k credits, blocked beyond the allowance.
  - Silver: $300/month, 1M credits, $3.50 per 1,000 overage.
  - Gold: $1,700/month, 10M credits.
  - Platinum: $4,500/month, 75M credits, about $0.25 per 1,000 overage.
  - Sources: [Apideck](https://www.apideck.com/blog/quickbooks-api-pricing-and-the-intuit-app-partner-program); [truto.one](https://truto.one/blog/how-much-does-the-quickbooks-api-cost-2026-pricing-rate-limits/); [Woodard](https://report.woodard.com/articles/intuits-app-partner-program-marks-new-phase-in-developer-ecosystem-fpwr)

### Inferences
- A one-time pull per migrating customer is a read-heavy burst. On Xero Starter it is limited to 5 connections at a time. Plan on Core or Plus, or use unified APIs (Codat, Apideck, Rutter, Merge), which carry their own fees.
- Wave has no general public accounting API, so expect CSV exports (background knowledge, unverified).
- Accountant workflow needs:
  - multi-client dashboard
  - invite flow
  - adjusting journal entries
  - period lock with override
  - trial balance export, GIFI export for Canada, and exports for UK/India filing tools
- Effort: about 6–10 engineer-weeks for CSV import plus two API importers, and 4–6 weeks for accountant access.

### Gaps
- Wave export formats and API status were not verified. Unified-API vendor pricing was not retrieved.

## Localisation: languages, formats, invoice legal requirements

### Takeaway
E-invoicing mandates, more than UI translation, are what make localisation hard:
- India: IRN through the IRP is required for businesses with turnover above ₹5 crore, and businesses at ₹10 crore and above must report within 30 days.
- EU: Belgium has required Peppol B2B e-invoicing since 1 Jan 2026. Poland's KSeF started Feb/Apr 2026. France starts 1 Sep 2026 for large and mid-size firms. Germany is phasing in through 2027–28.

Most SMB customers in India are below ₹5 crore, so the IRN requirement does not apply to them yet. Belgian SMBs, however, need Peppol now.

### Cited Findings
- India: e-invoicing is mandatory above ₹5 crore aggregate turnover (unchanged since 1 Aug 2023 as of June 2026), with proposals to lower it to ₹2–3 crore. The 30-day IRP reporting limit applies at ₹10 crore and above, from 1 Apr 2025 or 2026 depending on the source. 2FA/MFA on the portal is being phased in — [Tally 2026](https://tallysolutions.com/accounting/e-invoicing-rules-in-india/); [Tally changes 2026](https://tallysolutions.com/business-guides/what-changed-in-e-invoicing-compliance-in-2026/); [GimBooks](https://www.gimbooks.com/blog/5-crore-e-invoice-turnover-rule-2026/amp/)
- Belgium: B2B Peppol e-invoicing (EN 16931) has been mandatory since 1 Jan 2026. Poland's KSeF started 1 Feb 2026 for taxpayers above PLN 200m and 1 Apr 2026 for others. France begins 1 Sep 2026. Germany's sending obligations phase in 2026/2027 to 2028, and sources conflict on the details — [Invoiced](https://www.invoiced.com/resources/blog/global-e-invoicing-mandates); [fintua watch list](https://fintua.com/blog/einvoicing-mandate-watch-list-2026); [Vertex](https://www.vertexinc.com/en-gb/node/8324)

### Inferences
- Other per-country invoice fields that matter (background knowledge, unverified):
  - India: GSTIN, HSN/SAC, place of supply, and CGST/SGST vs IGST split
  - UK: VAT number and Making Tax Digital VAT submission via API
  - Australia: "Tax invoice" heading and ABN
  - Singapore: GST registration number, plus the InvoiceNow/Peppol rollout for GST-registered businesses
  - Canada: GST/HST/QST numbers and provincial tax stacking
  - Sri Lanka: VAT and SSCL
- Use a Peppol access-point vendor (Storecove, Pagero, Tickstar) instead of becoming one.
- Languages for v1: English, plus French (Canada/EU), and probably German, Dutch, Hindi and Sinhala/Tamil for the invoice PDF rather than the full UI.
- Use ICU/Intl for number formats such as Indian lakh/crore grouping (12,34,567.00) and for date formats.

### Gaps
- Singapore InvoiceNow GST timeline, UK MTD and the UK e-invoicing 2029 plan, and Sri Lanka invoice rules were not verified this pass.

## Marketing website: CMS, SEO, cookie consent, analytics

### Takeaway
A Next.js site with MDX or a headless CMS is cheap:
- Sanity: free tier, Growth $15/seat/month.
- Payload: open source, self-host about $20–50/month or cloud from about $35/month.
- Contentful: jumps from free to about $300/month.

Expect 4–8 weeks of design and engineering for the site, plus continuous SEO content work.

### Cited Findings
- Sanity: free tier, Growth $15/seat/month, usage-based overage. Contentful: Lite about $300/month, with free-tier limits that vary by source. Payload: open source, VPS $20–50/month, cloud about $35/month — [cosmicjs](https://www.cosmicjs.com/blog/sanity-vs-contentful); [colorwhistle](https://colorwhistle.com/sanity-contentful-payload/); [flowninja Sanity](https://www.flowninja.com/blog/sanity-cms-pricing); [dev.to Contentful](https://dev.to/nayankyada/contentful-pricing-2026-free-tier-limits-the-300-cliff-and-enterprise-3gii); [costbench](https://costbench.com/compare/payload-cms-vs-sanity/)

### Inferences
- Use a GDPR/UK PECR consent management platform (Cookiebot, CookieYes, Osano), or avoid needing one by using cookieless analytics (Plausible, Fathom, PostHog with cookieless mode).
- High-value SEO assets for this category are country-specific free invoice templates and GST/VAT invoice generators.

### Gaps
- Cookiebot and CookieYes pricing were not retrieved.

## Team size and timeline benchmarks

### Takeaway
Wave (founded 2009/10 in Toronto, free accounting for businesses with 1–9 employees) had over 200 staff when H&R Block bought it for about US$398M (C$537M) in 2019, about 370 by 2023. Companies in this category take years and hundreds of people to build. A lean MVP for one country is realistic in 6–9 months with 5–8 people. Seven countries with compliance features is a v1 measured in 12–24 months.

### Cited Findings
- Wave was founded in 2009 or 2010 (sources conflict) by Kirk Simpson and James Lochrie. Its first product was free online accounting for businesses with 1–9 employees. H&R Block acquired it for about US$398M (C$537M), closing in June 2019. Headcount: over 200 at the deal, 370 (Jan 2023, Wikipedia) or 279 (levels.fyi) — [Wikipedia](https://en.wikipedia.org/wiki/Wave_Financial); [Glenbrook](https://glenbrook.com/payments_news/hr-block-acquires-wave-financial-for-398m/); [Ivey](https://ivey.uwo.ca/scotiabank-digital-banking-lab/canada-fintech/infrastructure-services/wave-financial)

### Inferences
- MVP team: 1 product engineering lead, 3–4 full-stack engineers, 1 designer, 0.5 QA, plus a contract accountant/tax advisor per country. Rough cost: about $0.8–1.5M/year in the US/UK, or $0.25–0.5M/year with an India or Sri Lanka team.
- v1 adds 2–4 engineers (mobile, integrations, platform/security) and compliance spend of $30–80k/year.
- These figures are my estimates, not sourced.

### Gaps
- No reliable sources were found on how long Xero's or FreshBooks' first versions took or their team sizes. Xero's 2006 founding and 2007 launch are background knowledge only and were not verified this pass.
