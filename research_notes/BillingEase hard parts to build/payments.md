# Online Invoice Payments, Bill Pay and Payouts for BillingEase (platform vs PayFac vs build)

Research date: 2026-10-10. Method note: WebFetch could not resolve hosts (DNS failure) in this session, so every finding below comes from web-search result snippets and summaries, not full-page reads. Many official pricing pages (Stripe, Wave, Adyen, HitPay, GoCardless) appeared only as search hits. Re-verify every number on the vendor's live page before it goes into a final decision. Items from the researcher's background knowledge that could not be sourced are kept out of "Cited Findings" and listed under Inferences or Gaps.

## 1. Platforms per market: connected-account models, availability, pricing, revenue share

### Takeaway
Stripe Connect is the only option that covers most launch markets (US, UK, EU, CA, AU, SG) on one connected-account model. It has two pricing modes: Stripe charges the businesses directly (no platform fees), or the platform sets the price and pays $2 per monthly active account plus 0.25% + 25¢ per payout. India and Sri Lanka need local providers. In India, Stripe has been invite-only since May 2024; Razorpay Route is the local option, and RBI rules now gate who can use it. In Sri Lanka, PayHere is a CBSL-approved aggregator. Adyen for Platforms has minimum-invoice and volume floors that do not suit a small-business SaaS at launch.

### Cited Findings
**Stripe Connect (US/UK/EU/CA/AU/SG)**
- Pricing mode A, "Stripe handles pricing": Stripe collects processing fees directly from connected accounts. The platform pays no Connect account, payout-volume, tax-reporting or per-payout fees. — [Stripe Connect pricing](https://stripe.com/fr-us/connect/pricing)
- Pricing mode B, "You handle pricing": $2 per monthly active account and 0.25% + 25¢ per payout sent (US). Instant Payouts are 1% of payout volume; cross-border payouts are 0.25% of payout volume. Local-currency equivalents apply elsewhere, e.g. 15 kr per active account and 0.25% + 5 kr per payout on the Swedish page. — [Stripe Connect pricing (US)](https://stripe.com/it-us/connect/pricing); [Stripe Connect pricing (SE)](https://stripe.com/sv-no/connect/pricing)
- An account counts as "active" in any month it receives a payout. Months with no payout are free (third-party reading of Stripe's terms). — [drop-desk guide](https://drop-desk.com/blog/guides/stripe-fees-for-marketplace-operators/)
- Stripe's standard US online card rate is 2.9% + 30¢. ACH is reported as 0.8% capped at $5, but only in one third-party table, so it is uncorroborated. — [usecarly Stripe vs Square](https://www.usecarly.com/blog/stripe-vs-square/)
- Stripe India: invite-only for new accounts since May 2024. Businesses cannot sign up through the website and must request an invite. Stripe said it aimed to support more users by H2 2025; whether it did is not confirmed. — [Stripe support: Moving to invite only in India](https://support.stripe.com/questions/moving-to-invite-only-in-india); [The Paypers](https://thepaypers.com/payments/news/stripe-moves-to-invite-only-in-india)
- A 2025 third-party guide says Stripe India does not support UPI, wallets or EMI. This is a secondary source. — [PayGlocal](https://payglocal.in/blog/using-stripe-payment-gateway-india)

**Adyen for Platforms**
- Reported minimum monthly invoice of about $120, and typically about $1M+ annual volume for most merchants (comparison-site estimates). Adyen for Platforms' exact minimum is not published. — [costbench Adyen vs Stripe](https://costbench.com/compare/adyen-vs-stripe/); [Convesio Adyen for Platforms overview](https://convesio.com/knowledgebase/article/adyen-for-platforms-overview/)
- Considered less suitable below about 1,000 transactions per month: "choose Adyen when you scale, not when you start." — [Monkeyvision](https://www.monkeyvision.nl/en/knowledge-base/adyen/)
- NerdWallet lists the minimum invoice amount as a con (2024 review, dated). — [NerdWallet](https://www.nerdwallet.com/business/software/learn/adyen)

**Square (US benchmark)**
- Invoice card payments: 3.3% + 30¢ on the Free plan, and sending invoices is free. ACH: 1% with a $1 minimum. Sources conflict on the cap: $10 on Plus/Premium vs a $5 cap on Free. — [checkoutpage Square fees 2026](https://checkoutpage.com/blog/square-fees); [dodopayments Square fees](https://dodopayments.com/blogs/square-fees-explained)

**GoCardless (bank debits: UK Bacs, SEPA, ACH, BECS, PAD)**
- UK: Standard 1% + 20p capped at £4; Advanced 1.25% + 20p capped at £5; Pro 1.4% + 20p capped at £5.60. No setup or monthly fee. Custom pricing above £1m annual revenue. — [dodopayments GoCardless alternatives (2026-09)](https://dodopayments.com/blogs/gocardless-alternatives/)
- USD pricing reported as Standard 0.5% + $0.05 capped at $5 (Advanced 0.75%, Pro 0.9%). This conflicts with Toolradar's "1% + $0.20" figure. A tracking site shows the pricing page was revised several times in early 2026. — [erpresearch](https://erpresearch.com/erp-add-ons/billing-subscriptions/gocardless/pricing); [toolradar](https://toolradar.com/tools/gocardless/pricing); [visualping](https://visualping.io/pages/gocardless-pricing-alerts-4895310)

**India: Razorpay Route / Cashfree**
- Razorpay Route splits incoming funds among third parties, sellers or bank accounts. It is built for marketplaces and platforms. — [Razorpay Route docs](https://razorpay.com/docs/payments/route/)
- Under the RBI PA Directions (September 2025), businesses must meet minimum turnover thresholds (FY25/FY26) to get or keep Route access. — [Razorpay Route docs](https://razorpay.com/docs/payments/settlements/direct/route)
- A Direct Settlement split variant exists, where funds bypass Razorpay's escrow. It is activated on request. — [Razorpay Route DS](https://razorpay.com/docs/payments/settlements/direct/route.md)

**Singapore: HitPay**
- PayNow online: 0.65% + S$0.30 for transactions of S$100 and above, 0.9% (min S$0.20) below S$100. PayNow offline: 0.4% (min S$0.10). Domestic online cards 2.8% + S$0.50; international cards 3.65% + S$0.50. — [HitPay SG pricing](https://hitpayapp.com/pricing/sg)
- HitPay says it holds MAS Major Payment Institution licence PS20200643 (self-reported, not checked against the MAS register). — [HitPay blog](https://hitpayapp.com/my/blog/online-payment-singapore)

**Sri Lanka: PayHere**
- PayHere was the first aggregated payment gateway approved by CBSL under General Direction No. 1 of 2018 (Payment and Settlement Systems Act). It acquires through Sampath Bank and Seylan Bank. — [Daily FT](https://www.ft.lk/Financial-Services/PayHere-payment-aggregator-platform-Long-awaited-breakthrough-for-Sri-Lankan-businesses/42-674482); [The Morning](https://themorning.lk/do-it-yourself-payhere)
- 2019 pricing: 3.9%, 2.99% or 2.9% depending on package. This is dated. — [readme.lk 2019](https://readme.lk/internet-payment-gateways-in-sri-lanka-2019/)

### Inferences
- For US/UK/EU/CA/AU/SG, Stripe Connect in "you handle pricing" mode lets BillingEase set its own rate, e.g. 2.9% + 60¢ like Wave, and keep the difference. The cost is $2 per active account per month plus 0.25% + 25¢ per payout. On a $500 invoice at a 2.9% + 30¢ cost basis, a 0.5% markup earns $2.50, which roughly covers the per-account fee if each business averages one such invoice a month.
- Use GoCardless as the bank-debit add-on where Stripe's local debit coverage is weak. Xero already uses this pattern (see Q5).
- India needs a separate Razorpay or Cashfree integration. Sri Lanka probably needs PayHere with merchant-level accounts rather than a true platform split; split support is unverified.
- Stripe is not known to be available to Sri Lankan businesses. This is the researcher's understanding and was not confirmed in this session.

### Gaps
- Current Stripe Connect support for UPI, PayNow and FPX could not be verified. Neither could Stripe's SG PayNow fee or its UK/EU/AU/CA local card rates.
- Not found: Razorpay Route fee per transfer, Razorpay Partner Program commission rates, Cashfree Easy Split pricing, current PayHere pricing and marketplace split support, Checkout.com and PayPal/Braintree platform pricing, Square platform/partner rev-share, and Adyen for Platforms' official minimums.
- No official revenue-share schedule was found for any provider's ISV/partner program. These are usually negotiated.
- FPX (Malaysia) is not a stated launch market; possibly a scope mismatch.

## 2. KYC/KYB, chargebacks, negative balances and fraud liability

### Takeaway
With Stripe Connect, the platform chooses whether Stripe or the platform bears connected accounts' negative balances and losses, and that choice cannot be changed after account creation. Stripe collects KYC unless the platform takes it on. Becoming a PayFac makes BillingEase fully liable for sub-merchant losses and KYB.

### Cited Findings
- Stripe Accounts v2 sets the loss-bearer at `defaults.responsibilities.losses_collector` (v1: `controller.losses.payments`): `stripe` means Stripe bears losses, `application` means the platform does. With `application`, the platform must also be `fees_collector`. These responsibilities are fixed once set. — [Stripe connected account configuration](https://docs.stripe.com/connect/accounts-v2/connected-account-configuration)
- Stripe collects KYC from connected accounts unless the platform takes on that duty. — [Stripe Connect manage risk](https://docs.stripe.com/connect/manage-risk)
- Under a PayFac model "you take on liability for your sub-merchants". — [Convesio](https://convesio.com/knowledgebase/article/how-to-start-credit-card-processing-company/)

### Inferences
- The lowest-risk setup is Stripe-hosted onboarding with Stripe as losses collector (Standard-like or Express-like accounts). It costs some UX control and pricing flexibility.
- In "you handle pricing" mode, BillingEase would likely bear negative balances. It then needs reserves, dispute workflows and fraud monitoring.

### Gaps
- Chargeback fees (e.g. Stripe's $15 US dispute fee) were not verified. Neither were Adyen's, Razorpay's or PayHere's merchant-liability terms.

## 3. Licensing: MTLs, PayFac registration, EMI/PI, RBI PA, MAS PSA, CBSL; PCI scope

### Takeaway
A SaaS that never takes possession of funds and routes them through a licensed provider (Stripe Connect, Razorpay, PayHere, HitPay) generally stays out of licensing; the provider holds the licences. Taking possession or control of funds triggers US state MTLs (or reliance on a patchy agent-of-payee exemption), UK/EU PI/EMI authorisation (the commercial-agent exclusion does not fit two-sided platforms), an RBI PA authorisation (₹15 crore net worth) in India, and an MAS licence in Singapore.

### Cited Findings
- **US federal:** FinCEN's payment-processor exemption has four conditions. The business must facilitate purchases of goods or services or bill payments, operate through clearance and settlement systems that admit only BSA-regulated institutions, and have a formal agreement with at least the seller or creditor. — [Gunster on FinCEN rulings](https://gunster.com/alerts/fincen-on-currency-transporters-and-payment-processors/); [FinCEN administrative ruling](https://www.fincen.gov/resources/statutes-regulations/administrative-rulings/administrative-ruling-whether-company-offers)
- **US states:** Money transmission is licensed in 49 states plus DC and the territories; Montana is the exception (secondary source). — [private.law wiki](https://wiki.private.law/en/msb-license-usa.md)
- **US states, agent-of-payee exemption:** It is the most common exemption for PayFacs and needs specific contract language, but only about half the states recognise it. Vermont says it does not exempt payment processors or agents of a payee. — [Venable](https://www.venable.com/money-transmission-in-the-payment-facilitator-model-06-27-2018/) (2018, dated); [faisalkhan.com](https://faisalkhan.com/?p=5163)
- **California:** The DFPI issued opinion letters that a payment processing service was not exempt as an agent of payee. Stripe obtained a California MTL in 2016 and is licensed across US states. — [DFPI opinion](https://dfpi.ca.gov/rules-enforcement/laws-and-regulations/opinion-letters-by-law-subject/opinion-letter-payment-processing-service-not-exempt-as-agent-of-payee-or-factoring); [Stripe DFPI comment](https://dfpi.ca.gov/wp-content/uploads/sites/337/2019/05/PRO-07-17-Stripe.pdf); [MoFo](https://mofo.com/resources/insights/200921-california-agent-payee-exemption-shrinking)
- **FinCEN reform:** FinCEN proposed an AML/CFT program overhaul on 10 April 2026, with comments through 9 June 2026 (secondary source). — [private.law wiki](https://wiki.private.law/en/msb-license-usa.md)
- **UK/EU (PSD2):** The commercial-agent exclusion now covers only agents acting for one side of a transaction, which removes platform models from it. — [Womble Bond Dickinson](https://www.womblebonddickinson.com/uk/insights/articles-and-briefings/how-uk-law-changing-under-psd2)
- **UK/EU:** A platform that cannot meet the conditions may not route user funds into its own accounts or control them. Claiming the exclusion requires notifying the regulator (BaFin in Germany). — [Solaris](https://www.solarisgroup.com/blog/part-1-psd2-and-marketplaces-or-fireside-q-and-a-with-frank-mueller/)
- **UK/EU:** Platforms either get their own PI/EMI licence or use a licensed provider that takes regulatory responsibility (e.g. Stripe Connect, Mangopay). — [Ryft](https://ryftpay.com/blog/impact-of-psd2-law-on-marketplaces-and-digital-platforms)
- **India, RBI Regulation of Payment Aggregators Directions 2025 (15 Sep 2025):** These consolidate the 2020/21 PA-PG guidelines and the 2023 cross-border rules. Categories are PA-O (online), PA-P (physical) and PA-CB (cross-border). Net worth must be ₹15 crore at application and ₹25 crore by the end of the third financial year. Non-bank PAs had to apply by 31 Dec 2025 or wind up by 28 Feb 2026. — [RBI notification 12896](https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12896); [RBI consolidated PA direction](https://website.rbi.org.in/documents/d/rbi/finalconsolidatedpadirection15092025_ann); [Inc42](https://inc42.com/buzz/rbi-issues-new-master-directions-for-payment-aggregators)
- **Singapore, MAS PSA:** "Merchant acquisition service" covers accepting and processing payment transactions for a merchant that result in a transfer of money to the merchant, whether or not the provider comes into possession of the money. It is a licensable activity. — [Duane Morris](https://www.duanemorris.com/alerts/singapore_payment_services_act_what_you_should_do_comply_0220.html); [Conventus Law](https://conventuslaw.com/report/the-singapore-payment-services-act-and-what-you/)
- **Sri Lanka:** Aggregated payment services are regulated under CBSL General Direction No. 1 of 2018; PayHere operates under it with partner banks. — [Daily FT](https://www.ft.lk/Financial-Services/PayHere-payment-aggregator-platform-Long-awaited-breakthrough-for-Sri-Lankan-businesses/42-674482)
- **PCI, SAQ A:** All elements of the payment pages must originate only from PCI DSS compliant service providers, and none from the merchant's website. SAQ A-EP applies when elements come from both. — [PCI SSC FAQ](https://www.pcisecuritystandards.org/faqs/if-a-merchant-s-e-commerce-implementation-meets-the-criteria-that-all-elements-of-payment-pages-originate-from-a-pci-dss-compliant-service-provider-is-the-merchant-eligible-to-complete-saq-a-or-saq-a-ep/)
- **PCI for PayFacs:** A PayFac must be PCI DSS compliant before its first transaction. Validation ranges from SAQ to QSA audit depending on the acquirer. — [RSI Security](https://blog.rsisecurity.com/does-pci-compliance-apply-to-payment-facilitators/); [PCI SSC PayFac presentation 2025](https://www.pcisecuritystandards.org/wp-content/uploads/2025/09/NACM_WEDNESDAY_Track-1_7_Payment-Facilitators-and-PCI-DSS-Compliance_Dr.-Sam-Pfanstiel-Helen-Huyton_FINAL.pdf)

### Inferences
- Using Stripe Checkout/Payment Links or Stripe-hosted elements on the invoice pay page keeps BillingEase in SAQ A. Any self-hosted card field pushes toward SAQ A-EP or D. Becoming a PayFac means service-provider PCI DSS (Level 1 at scale).
- In Singapore, because the definition applies "regardless of whether the service provider comes into possession of the money", even a non-custodial integration should be checked with counsel. Partnering with a licensed MPI (Stripe SG, HitPay) is the standard route.
- India's ₹15 crore net worth requirement and the closed application window make an in-house PA licence unrealistic. Use an authorised PA (Razorpay, Cashfree).

### Gaps
- Not found: the number of states that have adopted the CSBS Money Transmission Modernization Act as of 2026, MAS PSA exclusions specific to SaaS platforms, the current CBSL direction text and any 2024–2026 updates, and the status of the EU PSD3/PSR and UK payments reforms as of 2026.

## 4. Bill pay / vendor payouts and reconciliation

### Takeaway
Little was found. Airwallex offers Bill Pay and programmatic Payouts for domestic and international suppliers. Routable, Wise Platform, Modern Treasury and Stripe Treasury pricing and licensing could not be retrieved. Holding funds for bill pay triggers the same money-transmission and EMI questions as acceptance, which is why vendors rely on bank partners and licensed entities.

### Cited Findings
- Airwallex markets Bill Pay (automated domestic and international supplier payments), programmatic global Payouts, and Global Treasury. — [Airwallex llms.txt](https://airwallex.com/llms.txt)
- Stripe Connect: Instant Payouts cost 1% and cross-border payouts 0.25% of payout volume. — [Stripe Connect pricing](https://stripe.com/it-us/connect/pricing)

### Inferences
- Bill pay is a separate, higher-risk product. It needs funds-in (debiting the business) plus funds-out, which is classic money transmission. A licensed partner (Stripe Treasury/Financial Accounts, Airwallex, Wise Platform, Routable) is required unless BillingEase gets MTLs or an EMI licence. Defer it to phase 2.
- Reconciliation (researcher's background knowledge, not verified this session): Stripe and Razorpay emit webhooks for payment, payout and dispute events, and Stripe's balance transactions link each payout to its underlying charges and fees. These allow invoice-level auto-matching: gross to invoice, fee to an expense account, net to a clearing account, payout to bank.

### Gaps
- Not found: Routable, Wise Platform, Modern Treasury and Stripe Treasury pricing and licensing structures, Airwallex fees, or multi-currency settlement specifics.

## 5. Competitors: Wave, Xero, QuickBooks, FreshBooks

### Takeaway
Card fees cluster at about 2.9–3.3% plus a fixed fee, and ACH at about 1%. Wave earns its spread by charging 2.9% + 60¢, double Stripe's 30¢ fixed fee, while the software is free. Xero passes through Stripe and GoCardless rather than running its own processing.

### Cited Findings
- **Wave (US):** Visa, Mastercard and Discover at 2.9% + $0.60 on Starter. Pro gets 2.9% + $0 for the first 10 transactions per month, then 2.9% + $0.60. Amex is 3.4% + the same fixed fee. ACH is 1% (min $1) on both plans. Card payouts take 2 business days; ACH 2–7 business days. — [Wave support: processing fees](https://support.waveapps.com/hc/en-us/articles/218323823)
- **Wave's business model:** Paid financial services (Payments, Payroll) generate revenue while the core software is free. H&R Block bought Wave for $405M cash (2019) and expected $40–45M FY2020 revenue. More than 400,000 SMBs used it monthly at the time. — [BetaKit](https://betakit.com/?p=197829); [H&R Block 8-K](https://www.sec.gov/Archives/edgar/data/12659/000157484219000017/form8-k06x11x19nazarexexhi.htm)
- **QuickBooks Payments:** About 2.99% on invoiced and online cards, about 3.5% keyed, about 2.5% card-reader, and 1% ACH. Sources conflict on the ACH cap: uncapped vs a $20 cap on some plans. — [givepayments 2026](https://www.givepayments.com/blog/quickbooks-payments-fees-2026/); [QuickBooks community](https://quickbooks.intuit.com/community/payments-3/convenience-fee-for-ach-bank-payments-19257)
- **FreshBooks (Sep 2026):** 2.9% + $0.30 on domestic consumer cards; 3.5% + $0.30 on Amex and commercial cards; ACH 1%, uncapped except on Select (US only); Advanced Payments add-on $20/month. — [paymentreview FreshBooks](https://paymentreview.com/reviews/freshbooks-payments/)
- **Xero:** Uses Stripe for cards (2.9% + $0.30 US) and GoCardless for ACH (1% capped at $5), per a third-party calculator. — [feeflowcalculator](https://feeflowcalculator.com/xero-payments)

### Gaps
- No official Xero or QuickBooks pricing pages were retrieved. Not found: Wave Canada fees, any revenue-share terms Xero gets from Stripe, and Wave's 2026 payments revenue.

## 6. Build vs buy, effort, timeline and revenue opportunity

### Takeaway
Buy (Stripe Connect plus local PAs) is the clear choice for launch: weeks to months of integration and no licences. A full PayFac takes about 12–24 months and $2–10M+, with full sub-merchant liability. Building your own (acquirer or licences) takes years. PayFac-as-a-service (Finix, Tilled, Stripe "you handle pricing") is a middle path once volume justifies it.

### Cited Findings
- **ISO:** about 3–6 months and $50K–200K. **Full PayFac:** about 12–24 months and $2M–10M+. **Direct acquiring:** 2–5 years. Visa and Mastercard registration starts at $5K+ each (vendor source). — [Convesio](https://convesio.com/knowledgebase/article/how-to-start-credit-card-processing-company/)
- **PayFac build:** 18–24 months of development. At least $50K for Level 1 PCI and EMV certification. About $600K staffing for the merchant-management build-out. — [Stax](https://staxpayments.com/blog/becoming-your-own-payment-facilitator)
- **Ongoing PayFac costs:** network fees of about $5K each to Visa and Mastercard every 12 months, PCI maintenance typically over $50K a year, and an annual acquirer audit. A sponsor bank is the gating step. Only a few hundred registered PayFacs exist in the US. — [Tilled](https://www.tilled.com/blog/the-day-to-day-of-operating-as-a-payment-facilitator); [Tilled PFaaS](https://tilled.com/payfac-as-a-service-holy-grail/)
- Older figure: about $15K upfront and about $7.5K a year in registration (about 2021). — [Greensheet](https://www.greensheet.com/emagazine&article_id=3428)

### Inferences
- **Revenue model (illustrative arithmetic, not sourced):** A Wave-style 2.9% + 60¢ price on a Stripe cost of about 2.9% + 30¢ leaves about 30¢ per transaction gross, minus Connect fees in "you handle pricing" mode. On 1% ACH priced against a roughly 0.8% capped cost, the spread on large invoices can be well above 0.2% because the cost is capped and the price is not. Payments can fund a free tier, which is the model Wave proves.
- **Path:**
  - Phase 1: Stripe Connect hosted checkout (SAQ A) in US/UK/EU/CA/AU/SG, plus GoCardless for debits.
  - Phase 2: Razorpay in India and PayHere in Sri Lanka, plus reconciliation automation.
  - Phase 3: Bill pay via a licensed partner.
  - Revisit PayFac above roughly $100M+ annual processed volume. This threshold is a judgement call, not sourced.

### Gaps
- Not found: an independent source quantifying SaaS revenue uplift from embedded payments, actual Stripe or Adyen partner rev-share percentages, or reliable 2026 PayFac registration fees (sources range from $5K to $10K per network).
