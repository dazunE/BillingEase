/*
 * BillingEase marketing site: plans and the site map, shared by every
 * marketing page (and the landing page) so prices and links never disagree.
 * Mirrors apps/web/src/content/site (plans.ts, routes.ts, company.ts, country.ts).
 * Prices are placeholders while pricing is finished.
 *
 * Copy is UK by default. Pages that show both countries (Pricing, UK and
 * Sri Lanka) have their own UK / Sri Lanka switch, which starts from
 * SITE.startCountry() and remembers the choice in localStorage (be.site.country).
 */
(function () {
  'use strict';
  function plan(o) { o.month = o.price; o.year = o.price; return o; }
  var PLANS = {
    uk: [
      plan({
        id: 'free', name: 'Free', tag: 'For getting started', price: 0, per: '',
        line: 'Invoices, expenses and your three numbers, for as long as you like.',
        cta: 'Start free', href: 'AuthSignUp.dc.html',
        features: ['Your three numbers in pounds', 'Unlimited invoices, quotes and customers', 'Expenses and bills with a photo or PDF attached', 'HMRC categories built in', 'Just you']
      }),
      plan({
        id: 'mtd', name: 'MTD ready', tag: 'Most popular', price: 8, per: '/ month', popular: true,
        line: 'Everything a sole trader or landlord needs for Making Tax Digital quarters.',
        cta: 'Start free, upgrade later', href: 'AuthSignUp.dc.html',
        features: ['Everything in Free', 'MTD quarters with readiness checks', 'Landlord mode and mileage', 'Repeating invoices and VAT invoices', 'Income Tax and NI estimate', 'Your accountant sees the same books']
      }),
      plan({
        id: 'practice', name: 'For practices', tag: 'Accountants and bookkeepers', price: 3, per: 'per client / month',
        line: 'Give clients BillingEase and see every quarter from the TaxWise practice workbench.',
        cta: 'Talk to us', href: 'SitePartners.dc.html',
        features: ['Each client gets everything in MTD ready', 'Quarter status and requests', 'Lock a quarter once filed (next phase)', 'Your practice name on their books']
      })
    ],
    lk: [
      plan({
        id: 'free', name: 'Free', tag: 'For getting started', price: 0, per: '',
        line: 'Invoices, expenses and your three numbers, for as long as you like.',
        cta: 'Start free', href: 'AuthSignUp.dc.html',
        features: ['Your three numbers in rupees', 'Unlimited invoices, quotes and customers', 'Expenses and bills with a photo or PDF attached', 'Record bank transfers, cheques, cash and LankaQR', 'Just you']
      }),
      plan({
        id: 'business', name: 'Business', tag: 'Most popular', price: 2900, per: '/ month', popular: true,
        line: 'Tax Invoices, VAT and SSCL, and payroll for a small team.',
        cta: 'Start free, upgrade later', href: 'AuthSignUp.dc.html',
        features: ['Everything in Free', 'Tax Invoices with VAT 18% and SSCL 2.5%', 'VAT and SSCL period summaries', 'Payroll with EPF, ETF, APIT and payslips', 'Email and WhatsApp reminders', 'Year-end hand-off to TaxWise.lk']
      }),
      plan({
        id: 'practitioner', name: 'For practitioners', tag: 'Tax practitioners and firms', price: 750, per: 'per client / month',
        line: 'See every client’s books from the TaxWise.lk practitioner tool.',
        cta: 'Talk to us', href: 'SitePartners.dc.html',
        features: ['Monthly VAT, SSCL and payroll position', 'Requests to clients', 'Lock a period once filed (next phase)', 'Year-end hand-off to TaxWise.lk (next phase)']
      })
    ]
  };

  var SITE = {
    country: 'uk',
    countries: {
      uk: { id: 'uk', name: 'United Kingdom', short: 'UK', sym: '£', currency: 'pounds', taxYear: '6 April to 5 April', yearWord: 'tax year' },
      lk: { id: 'lk', name: 'Sri Lanka', short: 'Sri Lanka', sym: 'Rs', currency: 'rupees', taxYear: '1 April to 31 March', yearWord: 'year of assessment' }
    },
    priceNote: 'Prices are placeholders while we finish pricing. Everything on the free plan stays free.',
    // UK plans by default; plansBy.lk for Sri Lanka.
    plans: PLANS.uk,
    plansBy: PLANS,
    // What every plan includes. BillingEase never handles payments, so there are no payment add-ons.
    included: [
      { id: 'fees', name: 'No fees on payments', price: { uk: '£0 per payment', lk: 'Rs 0 per payment' }, line: { uk: 'Customers pay you by transfer, card machine, cash or cheque. You record it; we take nothing.', lk: 'Customers pay you by transfer, cheque, cash or LankaQR. You record it; we take nothing.' } },
      { id: 'invoices', name: 'Unlimited invoices and quotes', price: { uk: 'No monthly cap', lk: 'No monthly cap' }, line: { uk: 'As many invoices, quotes, credit notes and customers as you need, each as a PDF.', lk: 'As many Tax Invoices, quotes, credit notes and customers as you need, each as a PDF.' } },
      { id: 'attach', name: 'Attachments on every cost', price: { uk: 'Photos and PDFs', lk: 'Photos and PDFs' }, line: { uk: 'Attach the receipt or bill to each expense, so the paperwork is where HMRC expects it.', lk: 'Attach the receipt or Tax Invoice to each expense, so the paperwork is where the IRD expects it.' } }
    ],
    // The marketing site's map. Every page's nav and footer come from here (routes.ts NAV).
    nav: [
      { label: 'Product', items: [
        { label: 'Features', hint: 'Everything, around three numbers', href: 'SiteFeatures.dc.html' },
        { label: 'Coming in', hint: 'Invoices, quotes, payments you record', href: 'SiteComingIn.dc.html' },
        { label: 'Going out', hint: 'Expenses, bills, suppliers, payroll records', href: 'SiteGoingOut.dc.html' },
        { label: 'Yours to keep', hint: 'Profit after tax, MTD quarters, reports', href: 'SiteKeep.dc.html' },
        { label: 'Security', hint: 'How we keep your books safe', href: 'SiteSecurity.dc.html' },
        { label: 'What’s new', hint: 'Every update, in plain words', href: 'SiteChangelog.dc.html' }
      ] },
      { label: 'Who it’s for', items: [
        { label: 'Sole traders', hint: 'Ready for Making Tax Digital', href: 'SiteFreelancers.dc.html' },
        { label: 'Landlords', hint: 'Properties, rent and mortgage interest', href: 'SiteTeams.dc.html' },
        { label: 'Small businesses', hint: 'Sri Lanka: Tax Invoices, VAT, SSCL and payroll', href: 'SiteShops.dc.html' },
        { label: 'Accountants', hint: 'See every client’s books in one place', href: 'SitePartners.dc.html' },
        { label: 'UK and Sri Lanka', hint: 'What changes with your country', href: 'SiteGlobal.dc.html' }
      ] },
      { label: 'Pricing', href: 'SitePricing.dc.html' },
      { label: 'Resources', items: [
        { label: 'Guides', hint: 'MTD, VAT and tax dates, explained', href: 'SiteGuides.dc.html' },
        { label: 'Help centre', hint: 'Answers, and a person when you need one', href: 'SiteHelp.dc.html' },
        { label: 'Switch to BillingEase', hint: 'From spreadsheets or another tool', href: 'SiteSwitch.dc.html' }
      ] },
      { label: 'Company', items: [
        { label: 'About', hint: 'Why we built BillingEase', href: 'SiteAbout.dc.html' },
        { label: 'Careers', hint: 'Work with us', href: 'SiteCareers.dc.html' },
        { label: 'Press', hint: 'News and brand kit', href: 'SitePress.dc.html' },
        { label: 'Contact', hint: 'For practices, teams and questions', href: 'SiteContact.dc.html' }
      ] }
    ],
    legal: [
      { label: 'Terms', href: 'SiteLegal.dc.html#terms' },
      { label: 'Privacy', href: 'SiteLegal.dc.html#privacy' },
      { label: 'Cookies', href: 'SiteLegal.dc.html#cookies' },
      { label: 'Data processing', href: 'SiteLegal.dc.html#data-processing' }
    ],
    // company.ts: only what we can say today (no address, headcount, funding or customer numbers).
    company: {
      name: 'BillingEase', tagline: 'Coming in − Going out = Yours to keep.',
      blurb: 'Bookkeeping, invoicing and payroll you enter by hand, for sole traders, landlords and small businesses in the UK and Sri Lanka.',
      email: 'hello@billingease.app', support: 'help@billingease.app', practices: 'practices@billingease.app', sales: 'practices@billingease.app',
      press: 'press@billingease.app', privacy: 'privacy@billingease.app', security: 'security@billingease.app', jobs: 'hello@billingease.app',
      year: 2026
    },
    pick: function (v, c) { return (v && typeof v === 'object' && !Array.isArray(v) && 'uk' in v && 'lk' in v) ? v[c || 'uk'] : v; },
    // Whole amounts: £12,400 or Rs 1,240,000.
    money: function (n, c) {
      var v = Number(n) || 0;
      var s = Math.round(Math.abs(v)).toLocaleString('en-GB');
      var sign = v < 0 ? '−' : '';
      return (c === 'lk') ? sign + 'Rs ' + s : sign + '£' + s;
    },
    // Where a two-country page starts: the visitor's last choice, else the loaded sample business, else the UK.
    startCountry: function () {
      var c = null;
      try { c = localStorage.getItem('be.site.country'); } catch (e) { c = null; }
      if (c === 'uk' || c === 'lk') return c;
      try { var b = JSON.parse(localStorage.getItem('billingease.prototype.v2') || 'null'); if (b && (b._country === 'uk' || b._country === 'lk')) return b._country; } catch (e) { /* no business loaded */ }
      return 'uk';
    },
    rememberCountry: function (c) {
      try { localStorage.setItem('be.site.country', c); } catch (e) { /* private mode */ }
    }
  };
  window.SITE = SITE;
})();
