/*
 * Country packs. A business belongs to one country (chosen at sign-up) and its
 * pack decides currency, tax year, categories, tax rates, invoice wording,
 * payroll depth, deadlines and which features show. Screens read it with
 * BE.pack() and BE.is('uk' | 'lk').
 *
 * Every rate and threshold here is illustrative for the prototype and must be
 * checked against gov.uk / ird.gov.lk before build (see the spec, section 15).
 */
(function () {
  'use strict';

  function bands(amount, list) {
    // list: [[width, rate], ...] with the last width Infinity. Returns tax and the steps.
    var left = Math.max(0, amount), tax = 0, steps = [];
    for (var i = 0; i < list.length && left > 0; i++) {
      var w = Math.min(left, list[i][0]);
      var t = w * list[i][1];
      if (w > 0) steps.push({ amount: w, rate: list[i][1], tax: t });
      tax += t; left -= w;
    }
    return { tax: Math.round(tax * 100) / 100, steps: steps };
  }

  var COUNTRY = {
    uk: {
      id: 'uk', name: 'United Kingdom', short: 'UK', currency: 'GBP', symbol: '£', locale: 'en-GB',
      taxYear: { label: '2026/27', start: '6 Apr 2026', end: '5 Apr 2027' },
      taxIdLabel: 'UTR', vatIdLabel: 'VAT number', invoiceTitle: 'Invoice', vatInvoiceTitle: 'VAT invoice',
      features: { landlord: true, mileage: true, quarters: true, taxPeriods: 'vat', payroll: 'records', whatsapp: false, sscl: false, languages: ['English'] },
      // MTD for Income Tax standard update periods for 2026/27 (verify).
      quarters: [
        { id: 'q1', label: 'Q1', from: '6 Apr', to: '5 Jul', due: '7 Aug 2026' },
        { id: 'q2', label: 'Q2', from: '6 Jul', to: '5 Oct', due: '7 Nov 2026' },
        { id: 'q3', label: 'Q3', from: '6 Oct', to: '5 Jan', due: '7 Feb 2027' },
        { id: 'q4', label: 'Q4', from: '6 Jan', to: '5 Apr', due: '7 May 2027' }
      ],
      currentQuarter: 'q3', lastQuarter: 'q2',
      finalDeclarationDue: '31 Jan 2028',
      // Self-employment categories as in the MTD quarterly update / SA103F (verify names for 2026/27).
      categories: [
        { id: 'cogs', name: 'Stock and materials you resell', official: 'Cost of goods bought for resale or goods used', allowable: true },
        { id: 'cis', name: 'Subcontractors', official: 'Construction industry: payments to subcontractors', allowable: true, onlyFor: 'construction' },
        { id: 'staff', name: 'Staff costs', official: 'Wages, salaries and other staff costs', allowable: true },
        { id: 'travel', name: 'Car, van and travel', official: 'Car, van and travel expenses', allowable: true },
        { id: 'premises', name: 'Premises', official: 'Rent, rates, power and insurance costs', allowable: true },
        { id: 'repairs', name: 'Repairs', official: 'Repairs and maintenance of property and equipment', allowable: true },
        { id: 'office', name: 'Phone, internet and office', official: 'Phone, fax, stationery and other office costs', allowable: true },
        { id: 'advertising', name: 'Advertising', official: 'Advertising and business entertainment costs', allowable: true },
        { id: 'entertaining', name: 'Client entertaining', official: 'Advertising and business entertainment costs (not allowable)', allowable: false },
        { id: 'interest', name: 'Loan interest', official: 'Interest on bank and other loans', allowable: true },
        { id: 'bank', name: 'Bank and card charges', official: 'Bank, credit card and other financial charges', allowable: true },
        { id: 'baddebts', name: 'Bad debts', official: 'Irrecoverable debts written off', allowable: true },
        { id: 'professional', name: 'Accountant and legal fees', official: 'Accountancy, legal and other professional fees', allowable: true },
        { id: 'capital', name: 'Equipment (capital)', official: 'Depreciation and loss or profit on sale (not allowable); capital allowances claimed separately', allowable: false },
        { id: 'other', name: 'Other', official: 'Other business expenses', allowable: true }
      ],
      propertyCategories: [
        { id: 'p-running', name: 'Running costs', official: 'Premises running costs (rent, rates, insurance, ground rent)' },
        { id: 'p-repairs', name: 'Repairs', official: 'Repairs and maintenance' },
        { id: 'p-finance', name: 'Mortgage interest', official: 'Residential property finance costs (basic-rate tax reduction, not a deduction)' },
        { id: 'p-other-finance', name: 'Other finance costs', official: 'Other allowable property expenses: finance' },
        { id: 'p-professional', name: 'Letting and legal fees', official: 'Legal, management and other professional fees' },
        { id: 'p-services', name: 'Services you provide', official: 'Costs of services provided, including wages' },
        { id: 'p-travel', name: 'Travel', official: 'Travel costs' },
        { id: 'p-other', name: 'Other', official: 'Other allowable property expenses' }
      ],
      vatRates: [{ id: 'std', label: '20%', rate: 0.2 }, { id: 'reduced', label: '5%', rate: 0.05 }, { id: 'zero', label: '0%', rate: 0 }, { id: 'exempt', label: 'Exempt', rate: 0 }, { id: 'outside', label: 'Outside scope', rate: 0 }],
      vatThreshold: 90000,
      mileage: { first: 10000, rate1: 0.45, rate2: 0.25 },
      propertyAllowance: 1000,
      payroll: {
        mode: 'records',
        banner: 'BillingEase keeps your payroll records. Run payroll and report to HMRC (RTI) through your payroll software.',
        payeDueDay: 22,
        // For the "check the figures" calculator only (a sense check, not a payroll calculation). Illustrative 2026/27 (verify).
        check: { personalAllowance: 12570, basicRate: 0.2, higherRate: 0.4, basicBand: 37700, eeNIThreshold: 12570, eeNIUpper: 50270, eeNIRate: 0.08, eeNIUpperRate: 0.02, erNIThreshold: 5000, erNIRate: 0.15, pensionLower: 6240, pensionUpper: 50270, pensionEe: 0.05, pensionEr: 0.03, taxCode: '1257L' },
        pensionDueDay: 22
      },
      /** Income Tax (England, Wales and NI bands) plus Class 4 NI on a year's profit. Illustrative 2026/27 figures. */
      estimate: function (profit, o) {
        o = o || {};
        var pa = 12570;
        if (profit > 100000) pa = Math.max(0, pa - (profit - 100000) / 2);
        var taxable = Math.max(0, profit - pa);
        var it = bands(taxable, [[37700, 0.2], [125140 - 37700 - 12570, 0.4], [Infinity, 0.45]]);
        var ni = bands(Math.max(0, profit - 12570), [[50270 - 12570, 0.06], [Infinity, 0.02]]);
        var financeRelief = Math.round((o.financeCosts || 0) * 0.2);
        var incomeTax = Math.max(0, it.tax - financeRelief);
        var total = Math.round(incomeTax + ni.tax);
        return {
          lines: [
            { label: 'Personal allowance', amount: pa, note: 'Tax-free' },
            { label: 'Income Tax', amount: Math.round(incomeTax), note: '20%, 40% and 45% bands' + (financeRelief ? ' less £' + financeRelief + ' mortgage interest relief' : '') },
            { label: 'Class 4 National Insurance', amount: Math.round(ni.tax), note: '6% then 2%' }
          ],
          total: total,
          paymentsOnAccount: total > 1000 ? [{ due: '31 Jan 2027', amount: Math.round(total / 2) }, { due: '31 Jul 2027', amount: Math.round(total / 2) }] : [],
          label: 'Income Tax and NI'
        };
      },
      deadlines: [
        { label: 'Q2 update sent by your accountant', due: '7 Nov 2026' },
        { label: '2025/26 tax return and balancing payment', due: '31 Jan 2027' },
        { label: 'First payment on account 2026/27', due: '31 Jan 2027' }
      ],
      askSources: 'HMRC manuals, gov.uk guidance and UK legislation',
      practitioner: { tool: 'TaxWise practice workbench', noun: 'accountant', practice: 'practice' },
      // How customers pay, recorded by hand (Coming in).
      payMethods: ['Bank transfer', 'Card machine', 'Cash', 'Cheque']
    },

    lk: {
      id: 'lk', name: 'Sri Lanka', short: 'Sri Lanka', currency: 'LKR', symbol: 'Rs', locale: 'en-LK',
      taxYear: { label: '2026/27', start: '1 Apr 2026', end: '31 Mar 2027' },
      taxIdLabel: 'TIN', vatIdLabel: 'VAT registration number', invoiceTitle: 'Invoice', vatInvoiceTitle: 'Tax Invoice',
      features: { landlord: false, mileage: false, quarters: false, taxPeriods: 'vat-sscl', payroll: 'full', whatsapp: true, sscl: true, languages: ['English', 'Sinhala (soon)', 'Tamil (soon)'] },
      // Categories that map to the business income schedule handed to TaxWise.lk (verify against the return).
      categories: [
        { id: 'cogs', name: 'Purchases and materials', official: 'Cost of sales', allowable: true },
        { id: 'staff', name: 'Salaries and wages', official: 'Salaries, wages and EPF/ETF contributions', allowable: true },
        { id: 'rent', name: 'Rent and rates', official: 'Rent, rates and taxes on premises', allowable: true },
        { id: 'utilities', name: 'Electricity, water and phone', official: 'Utilities and communication', allowable: true },
        { id: 'travel', name: 'Travel and vehicle', official: 'Travelling and vehicle running expenses', allowable: true },
        { id: 'repairs', name: 'Repairs and maintenance', official: 'Repairs and maintenance', allowable: true },
        { id: 'office', name: 'Office and stationery', official: 'Printing, stationery and office expenses', allowable: true },
        { id: 'advertising', name: 'Advertising', official: 'Advertising and promotion', allowable: true },
        { id: 'entertaining', name: 'Entertainment', official: 'Entertainment (restricted)', allowable: false },
        { id: 'interest', name: 'Loan interest', official: 'Interest on business loans', allowable: true },
        { id: 'bank', name: 'Bank charges', official: 'Bank charges', allowable: true },
        { id: 'professional', name: 'Professional fees', official: 'Audit, legal and professional fees', allowable: true },
        { id: 'capital', name: 'Equipment (capital)', official: 'Capital asset (capital allowances claimed in the return)', allowable: false },
        { id: 'other', name: 'Other', official: 'Other expenses', allowable: true }
      ],
      vatRates: [{ id: 'std', label: '18%', rate: 0.18 }, { id: 'fin', label: '20.5% (financial services)', rate: 0.205 }, { id: 'zero', label: '0%', rate: 0 }, { id: 'exempt', label: 'Exempt', rate: 0 }],
      sscl: 0.025,
      vatThreshold: 60000000, // sources conflict: LKR 60M or 36M a year (verify)
      // Monthly VAT/SSCL periods (verify return frequency and due dates).
      periods: [
        { id: '2026-08', label: 'August 2026', due: '20 Sep 2026', status: 'filed' },
        { id: '2026-09', label: 'September 2026', due: '20 Oct 2026', status: 'due' },
        { id: '2026-10', label: 'October 2026', due: '20 Nov 2026', status: 'open' }
      ],
      payroll: {
        mode: 'full',
        banner: 'BillingEase calculates payroll. Pay EPF, ETF and APIT and file returns through the EPF, ETF and IRD channels.',
        epfEmployee: 0.08, epfEmployer: 0.12, etf: 0.03,
        /** Monthly APIT on regular profits from employment. Illustrative tables after the 2025 amendment (verify). */
        apit: function (monthly) {
          var r = bands(Math.max(0, monthly - 150000), [[1000000 / 12, 0.06], [500000 / 12, 0.18], [500000 / 12, 0.24], [500000 / 12, 0.30], [Infinity, 0.36]]);
          return Math.round(r.tax);
        },
        dues: { epf: 'last working day of the following month', apit: '15th of the following month' },
        apitDueDay: 15,
        payTo: { epf: 'EPF, Central Bank of Sri Lanka', etf: 'Employees’ Trust Fund Board', apit: 'Inland Revenue Department' },
        // Overtime is left out of EPF/ETF earnings; fixed allowances count unless marked otherwise (verify, spec section 14).
        overtimeInEpf: false,
        reliefMonthly: 150000
      },
      /** Income tax for an individual on a year's business profit. Illustrative 2026/27 bands (verify). */
      estimate: function (profit) {
        var relief = 1800000;
        var r = bands(Math.max(0, profit - relief), [[1000000, 0.06], [500000, 0.18], [500000, 0.24], [500000, 0.30], [Infinity, 0.36]]);
        var total = Math.round(r.tax);
        return {
          lines: [
            { label: 'Personal relief', amount: relief, note: 'Tax-free' },
            { label: 'Income tax', amount: total, note: '6%, 18%, 24%, 30% and 36% bands' }
          ],
          total: total,
          paymentsOnAccount: total > 0 ? [
            { due: '15 Aug 2026', amount: Math.round(total / 4) }, { due: '15 Nov 2026', amount: Math.round(total / 4) },
            { due: '15 Feb 2027', amount: Math.round(total / 4) }, { due: '15 May 2027', amount: total - 3 * Math.round(total / 4) }
          ] : [],
          label: 'Income tax'
        };
      },
      deadlines: [
        { label: 'September VAT and SSCL return', due: '20 Oct 2026' },
        { label: 'APIT for October salaries', due: '15 Nov 2026' },
        { label: 'EPF and ETF for October', due: '30 Nov 2026' },
        { label: 'Income tax instalment', due: '15 Nov 2026' }
      ],
      askSources: 'the Inland Revenue Act, IRD guidance and gazettes, and EPF/ETF rules',
      practitioner: { tool: 'TaxWise.lk', noun: 'tax practitioner', practice: 'firm' },
      // How customers pay, recorded by hand (Coming in). Cheques keep their number, bank and date.
      payMethods: ['Bank transfer', 'Cheque', 'Cash', 'LankaQR'],
      // Tax Invoice: SSCL is shown as its own line and included in the VAT base (to confirm with IRD).
      ssclInVatBase: true,
      ssclNote: 'SSCL is shown as its own line and included in the value VAT is charged on. To confirm with IRD.'
    }
  };

  window.COUNTRY = COUNTRY;
})();
