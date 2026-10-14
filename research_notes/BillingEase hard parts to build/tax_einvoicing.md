# Indirect tax (sales tax / VAT / GST), filing and mandatory e-invoicing for BillingEase

Research date: 2026-10-10. Searches were run on 2026-10-10. Many sources are vendor blogs or aggregators; where a primary (tax authority) source was found it is marked [primary]. Items I know from background knowledge but did not verify in this session are listed under "Gaps", not "Cited Findings".

## 1. US sales tax: nexus, taxability, marketplace rules, filing, vendors and competitors

### Takeaway
US sales tax is the hardest market to build in-house. Economic nexus (post-Wayfair) varies by state and keeps changing: 16 states had dropped the 200-transaction test by 1 Jan 2026, and more followed during 2026. Rates and taxability are rooftop-level. Wave-style products only apply rates the user types in. Every serious competitor either integrates a tax engine (Avalara, TaxJar, Stripe Tax and others) or leaves compliance to the user.

### Cited Findings
- As of January 1, 2026, 16 states had eliminated the 200-transaction economic-nexus threshold (15 in July 2025) — [Avalara, states eliminating transaction thresholds](https://www.avalara.com/blog/en/north-america/2025/06/states-eliminating-economic-nexus-transaction-thresholds.html)
- Illinois dropped the transaction test effective 1 Jan 2026 (HB 2755). Nexus is now only >$100,000 gross receipts over the lookback period — [beancount.io Illinois](https://beancount.io/blog/2026/07/10/illinois-200-transaction-sales-tax-nexus-repeal-guide)
- Utah dropped the transaction test effective 1 Jul 2025. Alaska's Remote Seller Sales Tax Commission dropped it for member localities from 1 Jan 2025 — [Avalara](https://www.avalara.com/blog/en/north-america/2025/06/states-eliminating-economic-nexus-transaction-thresholds.html)
- Kentucky (HB 757) dropped the 200-transaction test from 1 Aug 2026 — [beancount.io Kentucky](https://beancount.io/blog/2026/07/16/kentucky-drops-200-transaction-sales-tax-threshold-guide); Avalara also listed it as scheduled for 1 Aug 2026 — [Avalara](https://www.avalara.com/blog/en/north-america/2025/06/states-eliminating-economic-nexus-transaction-thresholds.html)
- Connecticut requires both conditions, $100,000 and 200 transactions, not either one. Roughly 28 of 45 states that enforce economic nexus use revenue-only thresholds (early 2026 estimate; counts differ between sources) — [Kintsugi economic nexus by state](https://trykintsugi.com/sales-tax-guides/usa/economic-nexus)
- **Stripe Tax:** 0.5% per transaction, charged only where you are registered to collect (aggregator data, not Stripe's own page). UK listing: 0.5% "Basic" or from GBP 70/month "Complete". One source reports an enterprise tier of about $90/month plus 0.5%, and one blog claims $0.50 per transaction for the API variant; these two claims conflict and are unverified — [erpresearch Stripe Tax pricing](https://erpresearch.com/erp-add-ons/tax-compliance/stripe-tax/pricing); [flexprice 2026](https://flexprice.io/blog/stripe-pricing-breakdown-2026)
- **TaxJar** (Stripe-owned): Starter $39/month with 2 AutoFile credits per year ($50 per extra filing); Professional $99/month with 4 AutoFile credits ($55 per extra filing). The AutoFile price reportedly rose from $30–35 to $50–55 per filing in February 2026 — [Kintsugi TaxJar alternatives](https://trykintsugi.com/blog/top-4-tax-jar-alternatives-for-seamless-sales-tax-management); [TaxCloud TaxJar alternatives](https://taxcloud.com/blog/taxjar-alternatives/)
- **Avalara:** no public list price. One aggregator reports an entry tier of $69/month ($699/year) for Core Compliance + SST, plus $48 per state filing and $403 per state registration, limited to companies under $50M revenue. Mid-market estimates run $7,400–$18,000+ per year — [salestaxpricingindex Avalara](https://salestaxpricingindex.org/avalara-pricing); [costbench Avalara](https://costbench.com/software/tax-software/avalara/)
- **Anrok** (SaaS-focused): from $100 per market per month; other sources list Startups at $399/month and Enterprise at $1,000/month — [stackscored comparison](https://www.stackscored.com/pricing/sales-tax-compliance/); [Kintsugi best sales tax software](https://trykintsugi.com/blog/best-sales-tax-software)
- **Numeral:** $75 per return and $150 per state registration, with no monthly software fee and free nexus monitoring — [salestaxpricingindex calculator](https://salestaxpricingindex.org/calculator)
- **Zamp:** free one-time nexus analysis; paid plans by quote only — [salestaxpricingindex calculator](https://salestaxpricingindex.org/calculator)
- Modeled annual cost for an SMB with 50K orders in 10 states: Numeral about $9K, TaxJar about $22K, Anrok about $27K, Avalara $44K+ (estimate from a comparison site, not quotes) — [salestaxpricingindex calculator](https://salestaxpricingindex.org/calculator)
- **Wave:** when a user creates a sales tax, Wave adds a liability account and records the tax per transaction, with tax-exclusive and tax-inclusive modes [primary, Wave help] — [Wave help: how sales tax is tracked](https://support.waveapps.com/hc/en-us/articles/360039628292-How-sales-tax-is-tracked-and-calculated-in-Wave). Wave's free sales tax calculator tool is for US residents only — [Wave sales tax calculator](https://www.waveapps.com/tools/sales-tax-calculator)
- A competitor (Commenda, which sells a Wave plugin) reviewed Wave's help center on 30 Jul 2026. It reports that users enter every rate manually and pick it per invoice line, and that Wave has no nexus tracking, no multistate filing, no exemption-certificate management, and leaves sales tax out of its filing features — [Commenda Wave integration](https://www.commenda.io/integrations/wave/sales-tax-and-global-vat-software-for-wave)
- **QuickBooks Online "automated sales tax"** calculates tax on invoices and sales receipts using current rates for the business and customer locations, kept current by cloud updates (secondary source) — [Cleverence QBO automated sales tax](https://cleverence.com/articles/quickbooks-documentation/set-up-and-use-automated-sales-tax-in-quickbooks-online-4382)

### Inferences
- A Wave-like MVP can launch with user-entered rates plus a liability report. This is what Wave itself ships. "Ready to file" for US sales tax, however, requires an engine plus a filing partner. Filing per state per period costs $48–$75 per return through vendors, so pass-through or add-on pricing is the norm.
- For SMB unit economics, Stripe Tax (0.5% of taxable volume where registered) or a per-API-call engine fits better than Avalara's custom quotes. TaxJar's AutoFile price increase shows filing is the costly part.

### Gaps
- Not verified this session (background knowledge, needs checking): about 11,000+ US taxing jurisdictions; 45 states plus DC levy sales tax; South Dakota v. Wayfair decided 21 Jun 2018; all sales-tax states have marketplace facilitator laws; Vertex (enterprise-focused, quote-only pricing). Check [Tax Foundation](https://taxfoundation.org) and [Streamlined Sales Tax](https://www.streamlinedsalestax.org) (SST certified service providers are state-paid for volunteer sellers in 24 member states).
- Official Stripe Tax pricing (stripe.com/tax/pricing) and Avalara AvaTax per-transaction pricing were not fetched directly.
- FreshBooks' US sales tax capability was not found; it appears to support manual tax rates only (unverified).
- Product taxability matrices (SaaS, digital goods, clothing) were not researched in detail.

## 2. UK: VAT, MTD for VAT, MTD for Income Tax, flat rate scheme

### Takeaway
UK VAT filing for VAT-registered businesses must go through HMRC's MTD API from recognised software. Software makers are legally required to send fraud-prevention headers. MTD for Income Tax went live on 6 Apr 2026 for sole traders and landlords with qualifying income over £50k, dropping to £30k in 2027 and £20k in 2028. This creates a large new market for quarterly-update software, which aligns well with a Wave-like product.

### Cited Findings
- MTD for Income Tax started on 6 Apr 2026 for sole traders and landlords with qualifying income above £50,000; from 6 Apr 2027 for above £30,000; from 6 Apr 2028 for above £20,000 [primary] — [GOV.UK press release](https://www.gov.uk/government/news/one-year-until-making-tax-digital-for-income-tax-launches); [HMRC manual SALF1440](https://www.gov.uk/hmrc-internal-manuals/self-assessment-legal-framework/salf1440)
- Qualifying income is gross self-employment plus property income, tested on an earlier year's return (2024-25 for the April 2026 start) — [HMRC SALF1440](https://www.gov.uk/hmrc-internal-manuals/self-assessment-legal-framework/salf1440); [Deloitte Taxscape](https://taxscape.deloitte.com/insights/article/making-tax-digital-for-income-tax.aspx)
- MTD for Corporation Tax will not go ahead; VAT and Income Tax are the only MTD taxes — [Sage](https://www.sage.com/en-gb/blog/making-tax-digital-thresholds-vat-itsa-corporation-tax/)
- Fraud prevention headers: Commissioners' directions under s.135 Finance Act 2002 legally require software suppliers to capture and send all available fraud-prevention header data on the VAT (MTD) and ITSA (MTD) APIs and all their endpoints. In effect from 16 Oct 2023, replacing the 6 Jan 2021 directions [primary, file labelled draft] — [HMRC TxM Commissioners' Directions](https://assets.publishing.service.gov.uk/media/65c4d38bcc433b0011a90a6b/240207_Updated_Draft_TxM_Commissioners_Directions_FINAL.odt)
- HMRC policy is to grant MTD ITSA production credentials only to software that meets transaction-monitoring requirements — [same HMRC directions](https://assets.publishing.service.gov.uk/media/65c4d38bcc433b0011a90a6b/240207_Updated_Draft_TxM_Commissioners_Directions_FINAL.odt)
- The headers are the Gov-Client-* and Gov-Vendor-* families, validated by HMRC (vendor and dev guides) — [freeCodeCamp HMRC MTD API](https://freecodecamp.org/news/how-to-connect-to-hmrc-making-tax-digital-api)

### Inferences
- UK effort: MTD VAT (obligations, 9-box return, liabilities and payments endpoints, OAuth, fraud headers, sandbox testing, then the production-credential and recognition process) is a well-trodden integration of a few engineer-months. MTD ITSA (quarterly updates plus final declaration) is larger, but it is the bigger growth opportunity in 2026–2028.

### Gaps
- Not verified this session: VAT registration threshold of £90,000 (from 1 Apr 2024); standard rate 20%, reduced 5%; Flat Rate Scheme eligibility of £150k taxable turnover, with a 16.5% limited-cost-trader rate; HMRC monthly period exchange rates. Check [gov.uk VAT registration](https://www.gov.uk/vat-registration) and [gov.uk VAT Flat Rate Scheme](https://www.gov.uk/vat-flat-rate-scheme).
- HMRC's software-recognition steps for MTD VAT (listing on the "find software" page, demo to HMRC) were not documented from a primary source.

## 3. EU: VAT, OSS/IOSS, VIES, mandatory e-invoicing (ViDA and national mandates), Peppol

### Takeaway
2026–2028 is the e-invoicing crunch. Belgium has required Peppol B2B e-invoicing since 1 Jan 2026. Poland's KSeF clearance went live in Feb/Apr 2026, with micro-businesses joining 1 Jan 2027. France required receiving from 1 Sep 2026, with SME issuance from 1 Sep 2027. Germany has required receiving since 2025, with issuance from 2027 (turnover above €800k) and 2028 (everyone else). ViDA brings intra-EU digital reporting from 1 Jul 2030. An SMB invoicing app selling into the EU must at least issue EN 16931 / Peppol-compliant invoices, typically through a certified access point or accredited platform partner.

### Cited Findings
- Belgium: mandatory domestic B2B e-invoicing over Peppol since 1 Jan 2026. Sources conflict on the grace period (3 months for firms that show they started in time vs 6 months) — [SPS Commerce 2026 guide](https://www.spscommerce.com/community/articles/e-invoicing-mandates-in-europe-the-2026-business-guide); [Scanman](https://scanman.com/article/e-invoicing-what-to-expect-in-2026)
- Poland KSeF (clearance model; invoice valid only once accepted by KSeF): large taxpayers (over PLN 200M turnover) from 1 Feb 2026; other VAT payers from 1 Apr 2026; micro-entrepreneurs from 1 Jan 2027 — [originstamp EU timeline](https://originstamp.com/en/blog/reader/eu-e-invoicing-mandates-timeline-2026-2030); [invoicenavigator](https://www.invoicenavigator.eu/answers/eu-e-invoicing-requirements-2026)
- France: from 1 Sep 2026 all businesses must be able to receive e-invoices, and large (GE) and mid-size (ETI) firms must issue them and e-report. SMEs and micro-businesses issue from 1 Sep 2027. Decree No. 2026-677 of 27 Jul 2026 makes the "plateforme agréée" (PA) the single term for intermediaries, with a central directory for addressing. Finance Act 2026 (adopted 2 Feb 2026): €50 fine per e-invoice and €500 per e-reporting transmission, with annual caps. An outgoing PA must give one year of service guarantee when a customer switches — [SoftCo France Sept 2026 update](https://softco.com/blog/france-e-invoicing-2026-september-update/); [Banqup Finance Act 2026](https://www.banqup.com/resources/blog/france-approves-finance-act-2026-confirms-e-invoicing-and-e-reporting-rules)
- France had over 70 provisionally registered PAs in 2024 — [Basware](https://e-invoicing-compliance.basware.com/en/transition-from-public-portal-ppf-to-registered-dematerialization-platforms-pdp-for-e-invoicing-mandate-in-france)
- Germany: since 1 Jan 2025 all businesses must be able to receive EN 16931 e-invoices (XRechnung/ZUGFeRD). Issuance is mandatory from 1 Jan 2027 if prior-year turnover exceeds €800,000, and for all businesses from 1 Jan 2028. Peppol is not mandatory for German B2B — [e-invoicing.org Germany](https://e-invoicing.org/germany/); [ClearTax DE](https://www.cleartax.com/de/en/e-invoicing-germany); [Edicom](https://edicomgroup.com/electronic-invoicing/germany)
- ViDA: intra-EU B2B digital reporting and e-invoicing from 1 Jul 2030; some sources cite steps from 2028 — [originstamp](https://originstamp.com/en/blog/reader/eu-e-invoicing-mandates-timeline-2026-2030); [Odiverse](https://odiverse.com/ie/blog/e-invoicing-europe-2026-2030-country-guide)
- Exchange rate: under Art. 91(2) of the VAT Directive 2006/112/EC, the rate is the latest selling rate on the member state's most representative market at the time VAT becomes chargeable, or the latest ECB rate if the member state allows it [primary, legislation] — [Directive 2006/112/EC Art. 91](https://www.legislation.gov.uk/eudr/2006/112/article/91/2011-01-01/data.xht). Germany defaults to the BMF-published monthly VAT exchange rates; Poland and Czechia require national tables — [Stripe DE foreign-currency invoicing](https://stripe.com/resources/more/invoicing-in-foreign-currencies-from-germany); [allratestoday](https://allratestoday.com/for-finance-teams/vat-invoice-exchange-rates/)

### Inferences
- Belgium is a forcing function now: any BillingEase user established in Belgium already needs Peppol send and receive. Partnering with a Peppol access point (Storecove, Banqup/Unifiedpost, Pagero, Invopop and similar) is far cheaper than certifying as an access point. A partner can also cover Germany's XRechnung/ZUGFeRD formats, and France's PA requirement adds another partner layer.
- Poland's KSeF is a separate clearance API with its own authentication. Skip Poland at launch unless it is a target market.

### Gaps
- Peppol access point pricing (per-document costs, Storecove/Pagero SMB tiers) was not found. OpenPeppol access-point certification requirements (OpenPeppol membership fee, PKI certificate, testbed) were not verified.
- Not verified: Italy SDI mandatory B2B since 2019; Spain's "Crea y Crece" B2B mandate and Verifactu dates (reportedly pushed to 2027); OSS/IOSS (since 1 Jul 2021, €10k EU-wide distance-selling threshold, IOSS for consignments ≤€150); VIES validation API; EU standard rates 17–27%. Check [EC OSS](https://vat-one-stop-shop.ec.europa.eu) and [EC VIES](https://ec.europa.eu/taxation_customs/vies/).

## 4. Canada, Australia, Singapore, India, Sri Lanka

### Takeaway
Canada: no e-invoicing, but multi-layer GST/HST/PST/QST. Australia: GST and BAS, with Peppol voluntary for B2B. Singapore: InvoiceNow (Peppol) GST reporting phased in from Nov 2025 to 2031. India: heavy mandatory e-invoicing (IRP/IRN at ₹5 cr turnover) and GSTR-3B hard locking. Sri Lanka: a VAT e-invoicing pilot to RAMIS since May 2026, with 2026 changes to rates, thresholds and invoice formats in flux.

### Cited Findings
**Canada**
- Small supplier: no GST/HST registration required if taxable supplies (including associates) are ≤$30,000 (≤$50,000 for public service bodies) over the preceding four calendar quarters. Exceeding $30k in a single quarter requires registration within 29 days — [TaxTips.ca](https://www.taxtips.ca/gst/small-supplier.htm); [zenbooks.ca](https://zenbooks.ca/blog/gst-hst-small-business-canada-threshold-quick-method-guide/)
- Non-residents selling digital services or goods: $30,000 CAD over any 12 months (from 1 Jul 2021). Simplified registrants cannot claim ITCs [primary] — [CRA digital economy thresholds](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/digital-economy-gsthst/find-out-need-register/sales-goods-threshold-amounts.html)

**Australia**
- Peppol: the ATO has been the Australian Peppol Authority since 31 Oct 2019 and accredits access points. PINT A-NZ has been the only accepted format since 15 May 2025. B2B e-invoicing is voluntary; the proposed "Business E-Invoicing Right" was not enacted. Commonwealth agencies target 30% of invoices via Peppol by 1 Jul 2026 and pay e-invoices within 5 days, against the standard 20 — [fiscal-requirements AU](https://www.fiscal-requirements.com/news/4462-australias-e-invoicing-mandate-a-concise-overview); [invoicedataextraction AU](https://invoicedataextraction.com/blog/australia-peppol-e-invoicing-requirements); [Invopop AU](https://invopop.com/coverage/australia.md)

**Singapore (GST InvoiceNow)** [primary: IRAS]
- 1 Nov 2025: new companies that register for GST voluntarily within 6 months of incorporation. 1 Apr 2026: all new voluntary GST registrants. 1 Apr 2028: new compulsory registrants, plus existing businesses with annual supplies ≤S$200k. 1 Apr 2029: ≤S$1M. 1 Apr 2030: ≤S$4M. 1 Apr 2031: above S$4M (tiers based on supplies in periods ending in calendar 2025). Confirmed at COS on 26 Feb 2026; IRAS to notify existing registrants of their dates by mid-2026 — [IRAS GST InvoiceNow requirement](https://www.iras.gov.sg/taxes/goods-services-tax-(gst)/gst-invoicenow-requirement); [Sovos](https://sovos.com/regulatory-updates/vat/singapore-gst-invoicenow-expansion/); [KPMG SG tax alert 2026-01](https://assets.kpmg.com/content/dam/kpmgsites/sg/pdf/2026/03/taxalert-202601-updated.pdf)
- Reported grants of up to S$1,000 (SMEs) and S$5,000 (larger firms) for onboarding (secondary, unverified) — [Comarch](https://www.comarch.com/trade-and-services/data-management/legal-regulation-changes/singapore-expands-mandatory-gst-invoicenow-reporting-to-all-registered-businesses/)

**India**
- E-invoicing (IRN from the IRP) is mandatory when aggregate turnover exceeds ₹5 crore in any FY since 2017-18, PAN-wide, from 1 Aug 2023 (Notification 10/2023-CT), and the obligation continues even if turnover falls. An invoice without a valid IRN is not a valid invoice (Rule 48(5)), which puts the buyer's ITC at risk and triggers s.122 penalties — [e-invoice.app India guide](https://www.e-invoice.app/guides/india-e-invoicing); [fiscal-requirements](https://www.fiscal-requirements.com/news/3480-e-invoicing-30-day-reporting-in-india-threshold-cut-april-2025)
- 30-day reporting limit: invoices must be reported to the IRP within 30 days of the invoice date. This applied to AATO ≥₹100 cr from Nov 2023 and to AATO ≥₹10 cr from 1 Apr 2025 — [fiscal-requirements 3480](https://www.fiscal-requirements.com/news/3480-e-invoicing-30-day-reporting-in-india-threshold-cut-april-2025)
- GSTR-3B hard lock: under GSTN Advisory 606 (7 Jun 2025), auto-populated outward liability is non-editable from the July 2025 tax period, with corrections made through GSTR-1A. Table 3.2 was also locked (advisory of 19 Jul 2025). A Table 4 ITC lock is the expected next step, possibly from July 2026 (unconfirmed) — [EY India](https://www.ey.com/en_in/technical/alerts-hub/2024/10/gstn-issues-advisory-on-hard-locking-of-auto-populated-values-in-form-gstr-3b); [IndiaFilings](https://www.indiafilings.com/learn/major-gst-return-filing-changes-effective-july-2025); [taxupdate.in](https://taxupdate.in/gst/783/gstr-3b-hard-locking-ims-gstr-1a-input-tax-credit-table-4-july-2026/); [Lexology](https://www.lexology.com/library/detail.aspx?g=1ef254e9-3fdc-417f-9177-55ee8ee88d24)

**Sri Lanka**
- Standard VAT rate is 18% (from 15% on 1 Jan 2024). Financial services move to 20.5% from 1 Jul 2026. SSCL is 2.5%, a separate cascading levy with no input credit — [Kintsugi Sri Lanka](https://trykintsugi.com/sales-tax-guides/apac/sri-lanka); [induwara SSCL](https://induwara.lk/tools/sri-lanka-sscl-calculator)
- Registration threshold sources conflict: LKR 60M per 12 months / LKR 15M per quarter, versus a reported cut to LKR 36M annually / LKR 9M per quarter — [Kintsugi](https://trykintsugi.com/sales-tax-guides/apac/sri-lanka); [VATupdate May 2026](https://www.vatupdate.com/2026/05/04/sri-lanka-expands-vat-to-digital-services-raises-financial-services-rate-lowers-registration-threshold/)
- Effective date of VAT on non-resident digital services conflicts: 1 Apr 2026 or 1 Jul 2026 — [Fonoa](https://www.fonoa.com/resources/blog/sri-lanka-imposes-vat-cross-border-digital-services); [VATupdate](https://www.vatupdate.com/2026/05/14/sri-lanka-unveils-major-vat-reforms-targeting-digital-services-non-residents-and-compliance-measures/)
- IRD National e-Invoicing System: ERP to RAMIS via Web API. Pilot from 1 May 2026, full rollout targeted for end-2026. A revised VAT invoice format is mandatory from 1 Jul 2026, with the ERP–RAMIS API integration as an alternative until 31 Dec 2026 — [VATupdate](https://www.vatupdate.com/2026/05/14/sri-lanka-unveils-major-vat-reforms-targeting-digital-services-non-residents-and-compliance-measures/)

### Inferences
- India is effectively a "must partner" market. IRP access is through GSP/ASP intermediaries, and e-way bills, GSTR-1/1A and IMS reconciliation add a lot of scope. Indian incumbents (Zoho Books, Tally, ClearTax) set expectations, so treat India as phase 2.
- Singapore can start with InvoiceNow reporting through an IMDA-accredited Peppol access point for new voluntary registrants (mandatory since 1 Apr 2026). The broad SMB mandate only begins in 2028, giving a long runway.
- Sri Lanka is volatile. Rates, thresholds and the RAMIS API changed through 2026. Design the rate tables to be data-driven and confirm directly with the IRD.

### Gaps
- Not verified this session: Canada GST 5%, HST 13–15%, PST in BC/SK/MB, QST 9.975% and Quebec's $30k QST threshold; Australia GST 10%, $75k registration threshold, BAS monthly/quarterly, ABN Lookup web service (free with a GUID); India's e-way bill ₹50,000 threshold, GSP/ASP pricing, the 3-year time bar on returns, and CBIC/customs-notified exchange rates; Singapore GST 9% (from 2024) and S$1M registration threshold. Check [ato.gov.au](https://www.ato.gov.au), [abr.business.gov.au](https://abr.business.gov.au), [cbic-gst.gov.in](https://cbic-gst.gov.in), [einvoice1.gst.gov.in](https://einvoice1.gst.gov.in), [ird.gov.lk](https://www.ird.gov.lk) and [revenuquebec.ca](https://www.revenuquebec.ca).

## 5. Build vs buy: rate databases, certification, liability, effort

### Takeaway
Buy (or partner) for US rates, filing, and every e-invoicing network (Peppol access point, France PA, India GSP/IRP, Poland KSeF). Build in-house for single-rate VAT/GST logic (UK, Canada, Australia, Singapore, Sri Lanka) and for direct integrations where the authority certifies software rather than intermediaries, such as HMRC MTD.

### Cited Findings
- Engine and filing prices range from 0.5% per transaction (Stripe Tax) to $39–99/month plus $50–55 per filing (TaxJar) and $75 per return (Numeral) — see Section 1 sources ([salestaxpricingindex](https://salestaxpricingindex.org/calculator); [Kintsugi](https://trykintsugi.com/blog/top-4-tax-jar-alternatives-for-seamless-sales-tax-management))
- HMRC places the legal duty for fraud-prevention headers on the software supplier and gates production credentials on meeting transaction-monitoring requirements — [HMRC directions](https://assets.publishing.service.gov.uk/media/65c4d38bcc433b0011a90a6b/240207_Updated_Draft_TxM_Commissioners_Directions_FINAL.odt)
- In France, issuing through an accredited PA is required. PAs must provide one year of continuity when a customer switches, and penalties are €50 per invoice — [SoftCo](https://softco.com/blog/france-e-invoicing-2026-september-update/); [Banqup](https://www.banqup.com/resources/blog/france-approves-finance-act-2026-confirms-e-invoicing-and-e-reporting-rules)
- In Australia, the ATO accredits Peppol service providers — [fiscal-requirements AU](https://www.fiscal-requirements.com/news/4462-australias-e-invoicing-mandate-a-concise-overview)

### Inferences
- US: building a rooftop rate and taxability engine means maintaining thousands of jurisdictions with monthly rate changes and boundary data; not viable for a small team. Buying it plus a filing partner integrates in about 1–2 months.
- VAT/GST single-rate markets: about 2–6 engineer-weeks each for rate tables, reverse charge, reporting boxes and exchange-rate handling.
- Integrations: HMRC MTD VAT about 1–3 months including recognition; Peppol via an access-point API about 1–2 months, versus 6+ months to become an access point; India via a GSP/ASP about 2–3 months.
- Liability: vendor terms vary. Avalara and TaxJar historically offer limited accuracy guarantees, and SST CSPs assume liability for seller calculations in member states. This was not verified this session, and the legal liability to the authority stays with the merchant. Collect user acknowledgement and keep rate change history and audit trails.

### Gaps
- Vendor accuracy-guarantee and liability terms, Peppol access-point certification cost and timeline, and India GSP licensing criteria were not sourced in this session.
