/*
 * BillingEase marketing site: plans and the site map, shared by every
 * marketing page (and the landing page) so prices and links never disagree.
 * Prices are placeholders for review.
 */
(function () {
  'use strict';
  var SITE = {
    // Prices in USD. `year` is the monthly price when paid yearly (2 months free).
    plans: [
      {
        id: 'free', name: 'Free', month: 0, year: 0, tag: 'For getting started',
        line: 'Everything one person needs to bill, track spending and see what’s theirs.',
        cta: 'Start free', href: 'AuthSignUp.dc.html',
        features: ['Your three numbers, always up to date', 'Unlimited invoices, quotes and customers', 'Record expenses and snap 10 receipts a month', 'Get paid by card and bank (pay per payment)', 'Profit & loss and sales tax reports', 'Just you']
      },
      {
        id: 'pro', name: 'Pro', month: 16, year: 13, tag: 'Most popular', popular: true,
        line: 'Your bank connected, everything sorted for you, and the books your accountant wants.',
        cta: 'Try Pro free for 30 days', href: 'AuthSignUp.dc.html',
        features: ['Everything in Free', 'Connect your bank and cards; charges sort themselves', 'Unlimited receipts, read and matched', 'Repeating invoices, retainers and automatic reminders', 'Bills, vendors and every-month costs', 'Time you can bill: log hours, invoice them', 'Multiple currencies and VAT', 'Products and stock', 'You plus your accountant']
      },
      {
        id: 'team', name: 'Team', month: 39, year: 32, tag: 'For businesses with people',
        line: 'Room for your whole team, with roles, and payroll when you need it.',
        cta: 'Try Team free for 30 days', href: 'AuthSignUp.dc.html',
        features: ['Everything in Pro', 'Up to 10 people with roles (Admin, Staff, Accountant)', 'Approvals for bills and payroll', 'Time you can bill, by person, with approvals', 'Several businesses under one sign-in', 'Priority help from a person']
      }
    ],
    addons: [
      { id: 'payroll', name: 'Payroll', price: '$20 a month + $6 per person', line: 'Direct deposit, pay stubs and payroll taxes filed for you. US only for now.' },
      { id: 'card', name: 'Card payments', price: '2.9% + 30¢ per payment', line: 'Visa, Mastercard, Amex and Apple Pay. Money lands in 2 business days.' },
      { id: 'bank', name: 'Bank payments', price: '1% per payment, $10 max', line: 'ACH in the US, SEPA in Europe. Cheapest for big invoices.' }
    ],
    // The marketing site's map. Every page's nav and footer come from here.
    nav: [
      { label: 'Product', items: [
        { label: 'Features', hint: 'Everything, around three numbers', href: 'SiteFeatures.dc.html' },
        { label: 'Coming in', hint: 'Invoices, quotes, getting paid', href: 'SiteComingIn.dc.html' },
        { label: 'Going out', hint: 'Expenses, receipts, bills, payroll', href: 'SiteGoingOut.dc.html' },
        { label: 'Yours to keep', hint: 'Profit, tax set-aside, reports', href: 'SiteKeep.dc.html' },
        { label: 'Security', hint: 'How we keep your books safe', href: 'SiteSecurity.dc.html' },
        { label: 'What’s new', hint: 'Every update, in plain words', href: 'SiteChangelog.dc.html' }
      ] },
      { label: 'Who it’s for', items: [
        { label: 'Freelancers and services', hint: 'Designers, consultants, agencies', href: 'SiteFreelancers.dc.html' },
        { label: 'Shops and makers', hint: 'Products, stock and sales tax', href: 'SiteShops.dc.html' },
        { label: 'Teams', hint: 'Roles, approvals and payroll', href: 'SiteTeams.dc.html' },
        { label: 'Outside the US', hint: 'Currencies, VAT and GST', href: 'SiteGlobal.dc.html' }
      ] },
      { label: 'Pricing', href: 'SitePricing.dc.html' },
      { label: 'Resources', items: [
        { label: 'Guides', hint: 'Money basics for small businesses', href: 'SiteGuides.dc.html' },
        { label: 'Help center', hint: 'Answers, and a person when you need one', href: 'SiteHelp.dc.html' },
        { label: 'Switch to BillingEase', hint: 'From Wave, QuickBooks or a spreadsheet', href: 'SiteSwitch.dc.html' },
        { label: 'For accountants', hint: 'Partner program and client access', href: 'SitePartners.dc.html' }
      ] },
      { label: 'Company', items: [
        { label: 'About', hint: 'Why we built BillingEase', href: 'SiteAbout.dc.html' },
        { label: 'Careers', hint: 'Open roles', href: 'SiteCareers.dc.html' },
        { label: 'Press', hint: 'News and brand kit', href: 'SitePress.dc.html' },
        { label: 'Contact sales', hint: 'For teams and accountants', href: 'SiteContact.dc.html' }
      ] }
    ],
    legal: [
      { label: 'Privacy', href: 'SiteLegal.dc.html#privacy' },
      { label: 'Terms', href: 'SiteLegal.dc.html#terms' },
      { label: 'Cookies', href: 'SiteLegal.dc.html#cookies' }
    ],
    company: { name: 'BillingEase, Inc.', address: '55 Washington St, Brooklyn, NY 11201', email: 'hello@billingease.app', sales: 'sales@billingease.app', press: 'press@billingease.app', support: 'help@billingease.app', privacy: 'privacy@billingease.app', jobs: 'jobs@billingease.app', security: 'security@billingease.app',
      founded: 2023, founders: 'Ines Alvarez and Theo Park', people: 42, businesses: '38,000', raised: '$31M', leadInvestor: 'Northbank Capital' },
    partnerDiscounts: [{ level: 'Partner', off: 10 }, { level: 'Silver', off: 20 }, { level: 'Gold', off: 30 }],
    money: function (n) { return '$' + Number(n).toLocaleString('en-US'); }
  };
  window.SITE = SITE;
})();
