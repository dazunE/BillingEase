/*
 * Yours to keep: the books behind Reports, Quarters (UK), Tax periods, Tax year end, the bank
 * check and Categories, per country (UK: Harper Studio, Leeds; Sri Lanka: Serendib Design Studio,
 * Colombo). Owned by ThreeKeep, Quarters, TaxPeriods, BooksReports, BooksTax, BooksReconcile and
 * BooksCategories.
 *
 * Everything is worked out from the shared entries (payments, invoices, expenses, bills, payroll
 * runs, property entries, mileage) through one ledger, BE.books.ledger(), so the quarter card on
 * Home, the practice view, Reports and Yours to keep agree. Figures from before the business moved
 * its records into BillingEase (UK Q1 self-employment; Sri Lanka April to August) come from
 * `booksBefore`, a summary by category.
 *
 * Hooks for other screens: BE.quarterSummary(id) / BE.quarterTotals(id) (Home, PracticeView),
 * BE.taxPeriodSummary(id) / BE.periodTotals(id) (Home, PracticeView), BE.keepTotals(period)
 * gains UK mortgage-interest relief (finance costs) from the property entries.
 */
(function () {
  'use strict';
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var r2 = function (n) { return Math.round((Number(n) || 0) * 100) / 100; };
  var C = window.COUNTRY || {};

  // ---- Money in and out before October, for BE.totals('year') (the tax year / year of assessment so far).
  // Worked out from the ledger below for 6 Apr (UK) / 1 Apr (Sri Lanka) to 30 Sep; October comes from the entries.
  BE.define('history', BE.perCountry({
    uk: { month: { inPaid: 0, outPaid: 0 }, quarter: { inPaid: 0, outPaid: 0 }, year: { inPaid: 34350, outPaid: 13684.55 } },
    lk: { month: { inPaid: 0, outPaid: 0 }, quarter: { inPaid: 0, outPaid: 0 }, year: { inPaid: 14000000, outPaid: 11136877.97 } }
  }), { month: { inPaid: 0, outPaid: 0 }, quarter: { inPaid: 0, outPaid: 0 }, year: { inPaid: 0, outPaid: 0 } });

  // ---- Figures from before the records moved into BillingEase, by category (one line per period).
  // UK: Q1 self-employment came from Ellie's spreadsheet (payroll, the flat and mileage are entries).
  // Sri Lanka: April to July sales and April to August running costs (payroll and invoices are entries).
  var S = function (iso, cat, amount, kind) { return { iso: iso, cat: cat, amount: amount, kind: kind || 'out' }; };
  BE.define('booksBefore', BE.perCountry({
    uk: { note: 'Q1 self-employment totals from your spreadsheet, before you moved your records into BillingEase in July', lines: [
      S('2026-07-05', 'turnover', 14200, 'in'),
      S('2026-07-05', 'premises', 540), S('2026-07-05', 'office', 322), S('2026-07-05', 'travel', 186.4),
      S('2026-07-05', 'advertising', 90), S('2026-07-05', 'bank', 15), S('2026-07-05', 'other', 48)
    ] },
    lk: { note: 'Monthly totals from your previous books, before you moved them into BillingEase in September', lines: [].concat(
      [['2026-04-30', 2350000], ['2026-05-31', 2600000], ['2026-06-30', 2200000], ['2026-07-31', 2750000]].map(function (m) { return S(m[0], 'sales', m[1], 'in'); }),
      ['2026-04-30', '2026-05-31', '2026-06-30', '2026-07-31', '2026-08-31'].reduce(function (a, d, i) {
        return a.concat([S(d, 'rent', 350000), S(d, 'utilities', 66800), S(d, 'office', 31500), S(d, 'cogs', [48000, 61000, 39500, 72000, 58000][i]),
          S(d, 'travel', 39800), S(d, 'other', 77000), S(d, 'bank', 2500), S(d, 'entertaining', 9600)]);
      }, []),
      [S('2026-05-31', 'advertising', 60000), S('2026-06-30', 'repairs', 38000), S('2026-07-31', 'professional', 75000), S('2026-08-31', 'advertising', 45000)]
    ) }
  }), BE.perCountry({ uk: { note: '', lines: [] }, lk: { note: '', lines: [] } }));

  // ---- Sri Lanka: input VAT on August's purchases (the August return was filed before the bills were entered here).
  BE.define('vatInputsBefore', BE.perCountry({
    uk: [],
    lk: [
      { id: 'vi-1', iso: '2026-08-04', who: 'Colombo Print House (Pvt) Ltd', ref: 'CPH-2164', vatNo: '114320778-7000', value: 38000, vat: 6840 },
      { id: 'vi-2', iso: '2026-08-05', who: 'SLT-Mobitel', ref: 'Fibre, August', vatNo: '114245160-7000', value: 10593.22, vat: 1906.78 },
      { id: 'vi-3', iso: '2026-08-15', who: 'Guardian Security Services', ref: 'GSS-0815', vatNo: '409778124-7000', value: 55084.75, vat: 9915.25 }
    ]
  }), BE.perCountry({ uk: [], lk: [] }));

  // ---- Quarters (UK) and tax periods (Sri Lanka): what you've done with each.
  // sent: the day you sent it to your accountant; gapsOk: gaps you confirmed had no business; filed lives in practice.filed.
  BE.define('periodState', BE.perCountry({
    uk: { q1: { sent: '29 Jul', by: 'Ellie Harper' } },
    lk: { '2026-08': { sent: '10 Sep', by: 'Ayesha Fernando', ref: 'IRD acknowledgement 2608-55130' } }
  }), BE.perCountry({ uk: {}, lk: {} }));

  // ---- Tax payments already made (UK payments on account; Sri Lanka quarterly instalments).
  BE.define('taxPayments', BE.perCountry({
    uk: [{ id: 'tp-1', due: '31 Jul 2026', label: 'Second payment on account for 2025/26', amount: 4180, paidOn: '28 Jul', year: '2025/26' }],
    lk: [{ id: 'tp-1', due: '15 Aug 2026', label: 'First instalment for 2026/27', amount: 640000, paidOn: '14 Aug', year: '2026/27' }]
  }), BE.perCountry({ uk: [], lk: [] }));

  // ---- Tax year end: the checklist you tick and the hand-off you send.
  BE.define('yearEnd', BE.perCountry({
    uk: { year: '2026/27', ticks: { capital: true }, sent: null },
    lk: { year: '2026/27', ticks: { capital: true }, sent: null }
  }), BE.perCountry({ uk: { year: '2026/27', ticks: {}, sent: null }, lk: { year: '2026/27', ticks: {}, sent: null } }));

  // ---- Balances that don't come from entries (as of 1 Oct).
  BE.define('balances', BE.perCountry({
    uk: { cashOct1: 18420.55, bankName: 'Business current account ••6402', fixedAssets: 2950, card: 0, cardName: '', draws: -21000 },
    lk: { cashOct1: 4862500, bankName: 'Commercial Bank current account ••8830', fixedAssets: 3480000, card: 0, cardName: '', draws: -2400000 }
  }), BE.perCountry({
    uk: { cashOct1: 0, bankName: 'Business bank account', fixedAssets: 0, card: 0, cardName: '', draws: 0 },
    lk: { cashOct1: 0, bankName: 'Business bank account', fixedAssets: 0, card: 0, cardName: '', draws: 0 }
  }));

  // ---- Categories: the pack's, plus income and the accounts the balance sheet and journal use.
  function catsFor(country) {
    var P = C[country] || {};
    var uk = country === 'uk';
    var g = function (group) { return function (c) { return { id: c.id, group: group, name: c.name, official: c.official, allowable: c.allowable !== false && c.id !== 'p-finance', onlyFor: c.onlyFor || '' }; }; };
    var A = function (id, group, name, official) { return { id: id, group: group, name: name, official: official, allowable: true }; };
    var income = uk
      ? [A('turnover', 'in', 'Your sales', 'Turnover'), A('other-income', 'in', 'Other business income', 'Any other business income')]
      : [A('sales', 'in', 'Sales and services', 'Gains and profits from business: sales and services'), A('other-income', 'in', 'Other business income', 'Other business receipts')];
    var prop = uk ? [A('rent', 'prop-in', 'Rent', 'Total rents and other income from property')].concat((P.propertyCategories || []).map(g('prop'))) : [];
    var own = [A('cash', 'own', 'Business bank account', 'Cash at bank'), A('ar', 'own', 'Money customers owe you', uk ? 'Trade debtors' : 'Trade receivables'), A('fixed', 'own', 'Equipment, after wear', uk ? 'Fixed assets (net book value)' : 'Property, plant and equipment')];
    var owe = [A('ap', 'owe', 'Bills to pay', uk ? 'Trade creditors' : 'Trade payables')]
      .concat(uk ? [A('paye', 'owe', 'PAYE, NI and pension to pay', 'PAYE, NIC and pension payable'), A('vat', 'owe', 'VAT to pay', 'VAT payable (if registered)')]
        : [A('vat', 'owe', 'VAT and SSCL to pay', 'VAT and SSCL payable'), A('stat', 'owe', 'EPF, ETF and APIT to pay', 'Statutory payroll liabilities')])
      .concat([A('accrued', 'owe', 'Costs owed but not billed yet', 'Accruals')]);
    var eq = [A('capital', 'eq', 'Your money in the business', 'Capital account'), A('draw', 'eq', 'Money you took out', 'Drawings')];
    return income.concat((P.categories || []).map(g('out')), prop, own, owe, eq);
  }
  BE.define('categories', BE.perCountry({ uk: catsFor('uk'), lk: catsFor('lk') }));

  // ---- Entries made by hand (journal). lines: side 'to' (debit) / 'from' (credit), cat = category id.
  var J = function (side, cat, amt) { return { side: side, cat: cat, amt: amt }; };
  BE.define('journal', BE.perCountry({
    uk: [
      { id: 'je-2', date: '5 Oct', note: 'Q2: 30% of the EE phone bill is personal', who: 'Priya Shaw', practice: true, lines: [J('to', 'draw', 28.8), J('from', 'office', 28.8)] },
      { id: 'je-1', date: '5 Jul', note: 'Q1: working from home, flat rate £10 a month', who: 'Priya Shaw', practice: true, lines: [J('to', 'other', 30), J('from', 'capital', 30)] }
    ],
    lk: [
      { id: 'je-2', date: '30 Sep', note: 'Accrue the September electricity bill (CEB bill arrived in October)', who: 'Ruwan Jayasinghe', practice: true, lines: [J('to', 'utilities', 48000), J('from', 'accrued', 48000)] },
      { id: 'je-1', date: '31 Aug', note: 'Owner paid the studio insurance from a personal account', who: 'Ayesha Fernando', practice: false, lines: [J('to', 'other', 42500), J('from', 'capital', 42500)] }
    ]
  }), BE.perCountry({ uk: [], lk: [] }));

  // ---- The bank check (reconcile): September's entries in the business account.
  // amount: + money in, − money out. cleared: ticked against the statement. ending: the statement's closing balance you typed.
  var T = function (id, date, name, sub, amount, cleared, extra) { return Object.assign({ id: id, date: date, name: name, sub: sub, amount: amount, cleared: cleared }, extra || {}); };
  BE.define('bank', BE.perCountry({
    uk: {
      acct: 'Business current account ••6402', month: 'September 2026', short: 'September', opening: 17642.85, ending: 18420.55,
      done: false, doneOn: '', imported: null, extra: [],
      lines: [
        T('t1', '1 Sep', 'Northern Desk Co-working', 'Premises', -180, true),
        T('t2', '1 Sep', 'Leeds Building Society', 'Mortgage interest, Flat 2', -410, true),
        T('t3', '2 Sep', 'Adobe Creative Cloud', 'Phone, internet and office', -54, true),
        T('t4', '3 Sep', 'EE', 'Phone, internet and office', -32, true),
        T('t5', '3 Sep', 'Ochre Café', 'Paid HS-0044 (card machine)', 850, true),
        T('t6', '4 Sep', 'Northern Rail', 'Car, van and travel', -18.9, true),
        T('t7', '7 Sep', 'Headingley Lettings', 'Rent for September, less 10% fee', 945, true),
        T('t8', '9 Sep', 'Footprint Print', 'Phone, internet and office', -232, true),
        T('t9', '10 Sep', 'Northern Rail', 'Car, van and travel', -9.8, true),
        T('t10', '11 Sep', 'Laynes Espresso', 'Client entertaining', -23.5, true),
        T('t11', '15 Sep', 'Pennine Physio', 'Paid HS-0045', 1650, true),
        T('t12', '26 Sep', 'Fontshop', 'Not sorted yet', -118, false),
        T('t13', '28 Sep', 'Krystal Hosting', 'Phone, internet and office', -12, true),
        T('t14', '30 Sep', 'Tom Whitaker', 'September pay', -945.26, true),
        T('t15', '30 Sep', 'Transfer to Ellie Harper', 'Money you took out', -1500, true)
      ]
    },
    lk: {
      acct: 'Commercial Bank current account ••8830', month: 'September 2026', short: 'September', opening: 4618742.14, ending: 4862500,
      done: false, doneOn: '', imported: null, extra: [],
      lines: [
        T('t1', '1 Sep', 'Kandyan Spice Co (Pvt) Ltd', 'Paid SDS-0210', 544275, true),
        T('t2', '1 Sep', 'Cheque 004498 · Kollupitiya Estates', 'Rent and rates', -350000, true),
        T('t3', '5 Sep', 'SLT-Mobitel', 'Electricity, water and phone', -12500, true),
        T('t4', '8 Sep', 'Ceylon Electricity Board', 'Electricity, water and phone', -46200, true),
        T('t5', '10 Sep', 'Lanka Agri Exports (Pvt) Ltd', 'Paid SDS-0211', 1028075, true),
        T('t6', '12 Sep', 'Colombo Print House (Pvt) Ltd', 'Bill CPH-2190', -68440, true),
        T('t7', '15 Sep', 'Guardian Security Services', 'Other', -65000, true),
        T('t8', '15 Sep', 'IRD · APIT for August', 'APIT to pay', -45375, true),
        T('t9', '18 Sep', 'Adobe Creative Cloud', 'Office and stationery', -28500, true),
        T('t10', '19 Sep', 'IRD · VAT and SSCL for August', 'VAT and SSCL to pay', -312347.97, true),
        T('t11', '22 Sep', 'NWSDB water', 'Electricity, water and phone', -3800, true),
        T('t12', '26 Sep', 'Techzone Lanka (Pvt) Ltd', 'Equipment (capital)', -572300, true),
        T('t13', '29 Sep', 'Hill Country Tea Estates', 'Paid SDS-0213', 1451400, true),
        T('t14', '30 Sep', 'Salaries · September', '5 people, by bank transfer list', -808803.57, false),
        T('t15', '30 Sep', 'EPF and ETF for August', 'EPF, ETF and APIT to pay', -192450, true),
        T('t16', '30 Sep', 'Transfer to Ayesha Fernando', 'Money you took out', -400000, true)
      ]
    }
  }), BE.perCountry({
    uk: { acct: '', month: '', short: '', opening: 0, ending: null, done: false, doneOn: '', imported: null, extra: [], lines: [] },
    lk: { acct: '', month: '', short: '', opening: 0, ending: null, done: false, doneOn: '', imported: null, extra: [], lines: [] }
  }));
  BE.define('reconciles', BE.perCountry({
    uk: [
      { id: 'rc-2', month: 'August 2026', acct: 'Business current account ••6402', when: '6 Sep', who: 'Ellie Harper', bal: 17642.85 },
      { id: 'rc-1', month: 'July 2026', acct: 'Business current account ••6402', when: '3 Aug', who: 'Ellie Harper', bal: 15318.4 }
    ],
    lk: [
      { id: 'rc-2', month: 'August 2026', acct: 'Commercial Bank current account ••8830', when: '5 Sep', who: 'Ayesha Fernando', bal: 4618742.14 },
      { id: 'rc-1', month: 'July 2026', acct: 'Commercial Bank current account ••8830', when: '4 Aug', who: 'Ruwan Jayasinghe', bal: 4120310.6 }
    ]
  }), BE.perCountry({ uk: [], lk: [] }));

  // CSV statement layouts. UK: two common shapes. Sri Lanka: saved templates for the main banks' CSV exports
  // (named generically until each bank's layout is confirmed: Commercial Bank, Sampath, HNB, BOC, People's Bank).
  var TPL = {
    uk: [
      { id: 'amount', name: 'One amount column', cols: 'Date, Description, Amount, Balance', map: { date: 'Date', desc: 'Description', amount: 'Amount', balance: 'Balance' } },
      { id: 'inout', name: 'Money in and money out columns', cols: 'Date, Description, Paid out, Paid in, Balance', map: { date: 'Date', desc: 'Description', out: 'Paid out', in: 'Paid in', balance: 'Balance' } }
    ],
    lk: [
      { id: 'bank-a', name: 'Bank template A', cols: 'Txn Date, Description, Withdrawals, Deposits, Balance', map: { date: 'Txn Date', desc: 'Description', out: 'Withdrawals', in: 'Deposits', balance: 'Balance' } },
      { id: 'bank-b', name: 'Bank template B', cols: 'Date, Narration, Debit, Credit, Balance', map: { date: 'Date', desc: 'Narration', out: 'Debit', in: 'Credit', balance: 'Balance' } },
      { id: 'bank-c', name: 'Bank template C', cols: 'Value Date, Particulars, Amount, Running Balance', map: { date: 'Value Date', desc: 'Particulars', amount: 'Amount', balance: 'Running Balance' } }
    ]
  };
  var SAMPLE_CSV = {
    uk: 'Date,Description,Amount,Balance\n26/09/2026,FONTSHOP,-118.00,19094.69\n27/09/2026,LEEDS PRINT ROOM,-64.00,19030.69\n28/09/2026,KRYSTAL HOSTING,-12.00,19018.69\n30/09/2026,TOM WHITAKER SALARY,-945.26,18073.43\n30/09/2026,TRANSFER E HARPER,-1500.00,16573.43\n30/09/2026,MOOR & DALE OUTDOOR,1847.12,18420.55',
    lk: 'Txn Date,Description,Withdrawals,Deposits,Balance\n29/09/2026,HILL COUNTRY TEA ESTATES,,1451400.00,6083496.17\n30/09/2026,SALARY TRANSFER LIST SEP,808803.57,,5274692.60\n30/09/2026,EPF ETF AUG,192450.00,,5082242.60\n30/09/2026,TRANSFER A FERNANDO,400000.00,,4682242.60\n30/09/2026,CASH DEPOSIT - KANDYAN SPICE,,180257.40,4862500.00'
  };

  // ---------------------------------------------------------------------------
  // The ledger: every entry as { d, iso, kind 'in' | 'out', biz 'se' | 'prop', cat, amount, who, what, href, src }
  // ---------------------------------------------------------------------------
  function dOf(v) {
    if (!v) return null;
    if (typeof BE.dateOf === 'function') return BE.dateOf(v);
    var m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    var dm = String(v).match(/(\d{1,2})\s+([A-Z][a-z]{2})/);
    if (dm && MON.indexOf(dm[2]) >= 0) { var mi = MON.indexOf(dm[2]); return new Date(mi > 9 ? 2025 : 2026, mi, +dm[1]); }
    return null;
  }
  function isoOf(d) { return d ? d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') : ''; }
  function lbl(d) { return d ? d.getDate() + ' ' + MON[d.getMonth()] : ''; }
  function lblY(d) { return d ? d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear() : ''; }
  function prof() { return BE.get('profile') || {}; }
  function pack() { return BE.pack() || {}; }
  function basis() { var b = prof().basis; return b === 'accrual' || b === 'cash' ? b : (BE.is('lk') ? 'accrual' : 'cash'); }
  function catById(id) {
    if (!id) return null;
    var list = BE.all('categories');
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  // An expense or bill's pack category id (null when it isn't sorted yet).
  function catIdOf(x) {
    if (!x) return null;
    if (x.catId) return x.catId;
    if (typeof BE.catOf === 'function') { var c = BE.catOf(x); if (c) return c.id; }
    var n = String(x.cat || '').toLowerCase();
    if (!n || /uncategori|not sorted|needs a cat/.test(n)) return null;
    var hit = BE.all('categories').filter(function (k) { return k.name.toLowerCase() === n || String(k.official).toLowerCase() === n; })[0];
    return hit ? hit.id : null;
  }
  function invNet(inv) {
    var sub = BE.invSubtotal(inv), total = BE.invTotal(inv) + (Number(inv.credit) || 0);
    var credit = Number(inv.credit) || 0;
    return total > 0 ? r2(sub * (1 - credit / total)) : sub;
  }
  function runDate(r) {
    var d = dOf(r.date);
    if (d && r.year) d.setFullYear(r.year);
    if (!d && r.m) d = new Date(2026, r.m, 0);
    return d;
  }

  function ledger() {
    var uk = BE.is('uk'), acc = basis() === 'accrual', vatOn = !!prof().vatRegistered;
    var out = [];
    var push = function (o) { if (!o.d || !(Number(o.amount))) return; o.iso = isoOf(o.d); o.amount = r2(o.amount); out.push(o); };
    var incomeCat = uk ? 'turnover' : 'sales';
    // Income
    if (acc) {
      BE.all('invoices').forEach(function (i) {
        if (i.draft || i.void) return;
        push({ id: i.num, d: dOf(i.iso || i.issued), kind: 'in', biz: 'se', cat: incomeCat, amount: invNet(i), who: i.who, what: i.num + (i.what ? ' · ' + i.what : ''), href: 'SellInvoices.dc.html#' + i.num, src: 'invoice' });
      });
    } else {
      BE.all('payments').forEach(function (p) {
        var inv = p.inv ? BE.find('invoices', p.inv, 'num') : null;
        var amt = Number(p.amount) || 0;
        if (vatOn && inv) { var tot = BE.invTotal(inv) + (Number(inv.credit) || 0); if (tot > 0) amt = amt * BE.invSubtotal(inv) / tot; }
        push({ id: p.id, d: dOf(p.iso || p.date), kind: 'in', biz: 'se', cat: incomeCat, amount: amt, who: p.who, what: p.inv ? 'Paid ' + p.inv : (p.note || 'Money in with no invoice'), href: p.inv ? 'SellInvoices.dc.html#' + p.inv : '', src: 'payment', payId: p.id, noInvoice: !p.inv && !p.note });
      });
    }
    // Costs: expenses (accrual skips the ones that paid a bill: the bill counts instead)
    BE.all('expenses').forEach(function (x) {
      if (x.kind === 'personal' || x.kind === 'transfer') return;
      if (acc && x.bill) return;
      var cid = catIdOf(x);
      if (uk && (x.property || /^p-/.test(cid || ''))) return; // the flat's costs come from the property entries
      push({ id: x.id, d: dOf(x.iso || x.date), kind: 'out', biz: 'se', cat: cid, amount: (Number(x.amount) || 0) - (vatOn ? (Number(x.vat) || 0) : 0), who: x.who, what: x.note || x.cat || '', href: 'SpendTransaction.dc.html#' + x.id, src: 'expense', expId: x.id });
    });
    if (acc) BE.all('bills').forEach(function (b) {
      var cid = catIdOf(b);
      if (uk && (b.property || /^p-/.test(cid || ''))) return;
      var total = typeof BE.billTotal === 'function' ? BE.billTotal(b) : b.amount;
      push({ id: b.id, d: dOf(b.date || b.entered), kind: 'out', biz: 'se', cat: cid, amount: total - (vatOn ? (Number(b.vat) || 0) : 0), who: b.who, what: (b.num ? b.num + ' · ' : '') + (b.what || ''), href: 'SpendBill.dc.html#' + b.id, src: 'bill' });
    });
    // Payroll runs: staff costs (gross pay plus the employer's share)
    BE.all('payroll').forEach(function (r) {
      if (r.kind === 'due' || r.status === 'needs') return;
      push({ id: r.id, d: runDate(r), kind: 'out', biz: 'se', cat: 'staff', amount: r.cost || r.gross, who: (r.people || []).length + ' on payroll', what: r.label || 'Pay run', href: 'SpendPayroll.dc.html', src: 'payroll' });
    });
    if (uk) {
      // Mileage at the simplified rates (Car, van and travel)
      var claims = typeof BE.tripClaims === 'function' ? BE.tripClaims() : {};
      BE.all('trips').forEach(function (t) {
        push({ id: t.id, d: dOf(t.iso || t.date), kind: 'out', biz: 'se', cat: 'travel', amount: (claims[t.id] || {}).amount || 0, who: 'Mileage', what: t.from + ' to ' + t.to + ' · ' + t.miles + ' miles', href: 'Mileage.dc.html', src: 'mileage' });
      });
      // The let property (your share)
      var share = {};
      BE.all('properties').forEach(function (p) { share[p.id] = (Number(p.share) || 100) / 100; });
      BE.all('propertyEntries').forEach(function (e) {
        if (!(e.prop in share)) return;
        push({ id: e.id, d: dOf(e.iso || e.date), kind: e.kind === 'income' ? 'in' : 'out', biz: 'prop', cat: e.kind === 'income' ? 'rent' : e.cat, amount: (Number(e.amount) || 0) * share[e.prop], who: 'Flat', what: e.what, href: 'Properties.dc.html', src: 'property' });
      });
    }
    // Before BillingEase
    var before = BE.get('booksBefore') || {};
    (before.lines || []).forEach(function (l, i) {
      push({ id: 'before-' + i, d: dOf(l.iso), kind: l.kind, biz: 'se', cat: l.cat, amount: l.amount, who: 'Earlier records', what: 'Total for the period, from before BillingEase', href: '', src: 'before', summary: true });
    });
    return out.sort(function (a, b) { return a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : 0; });
  }

  // ---- periods --------------------------------------------------------------
  function yearRange() {
    var ty = pack().taxYear || {};
    return { from: dOf(ty.start) || new Date(2026, 3, 6), to: dOf(ty.end) || new Date(2027, 3, 5), label: ty.label || '2026/27' };
  }
  function fixYear(d, ref) { // '5 Jan' after an October start belongs to next year
    if (d && ref && d < ref) d = new Date(d.getFullYear() + 1, d.getMonth(), d.getDate());
    return d;
  }
  function quarters() {
    var start = yearRange().from;
    return (pack().quarters || []).map(function (q) {
      var from = fixYear(dOf(q.from + ' ' + start.getFullYear()), start), to = fixYear(dOf(q.to + ' ' + start.getFullYear()), from);
      return Object.assign({}, q, { fromD: from, toD: to, range: q.from + ' – ' + q.to + (to.getFullYear() !== from.getFullYear() ? ' ' + to.getFullYear() : '') });
    });
  }
  function monthRange(id) {
    var y = +id.slice(0, 4), m = +id.slice(5, 7);
    return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0) };
  }
  function within(e, from, to) { var t = e.d.getTime(); return t >= from.getTime() && t <= to.getTime() + 86399999; }
  function entries(from, to) { return ledger().filter(function (e) { return within(e, from, to); }); }

  // ---- totals by category -----------------------------------------------------------------
  function group(list) {
    var se = { income: 0, other: 0, costs: {}, unsorted: [], items: {} };
    var prop = { income: 0, costs: {}, finance: 0, items: {} };
    list.forEach(function (e) {
      var bag = e.biz === 'prop' ? prop : se;
      var key = e.kind === 'in' ? (e.cat || 'turnover') : (e.cat || 'unsorted');
      (bag.items[key] = bag.items[key] || []).push(e);
      if (e.kind === 'in') { if (e.biz === 'prop') prop.income += e.amount; else if (e.cat === 'other-income') se.other += e.amount; else se.income += e.amount; return; }
      if (e.biz === 'prop' && e.cat === 'p-finance') { prop.finance += e.amount; return; }
      if (!e.cat && e.biz !== 'prop') se.unsorted.push(e);
      bag.costs[key] = (bag.costs[key] || 0) + e.amount;
    });
    return { se: se, prop: prop };
  }
  function rows(costs, items, cats) {
    return Object.keys(costs).map(function (k) {
      var c = catById(k) || (k === 'unsorted' ? { id: 'unsorted', name: 'Not sorted yet', official: 'Needs a category', allowable: true } : { id: k, name: k, official: '', allowable: true });
      return { id: k, name: c.name, official: c.official, allowable: c.allowable !== false, amount: r2(costs[k]), count: (items[k] || []).length, items: items[k] || [] };
    }).sort(function (a, b) {
      var order = cats.map(function (c) { return c.id; });
      var ia = a.id === 'unsorted' ? -1 : order.indexOf(a.id), ib = b.id === 'unsorted' ? -1 : order.indexOf(b.id);
      return ia - ib;
    });
  }
  function summarise(list) {
    var g = group(list);
    var cats = BE.all('categories');
    var seRows = rows(g.se.costs, g.se.items, cats);
    var propRows = rows(g.prop.costs, g.prop.items, cats);
    var sum = function (rs, f) { return r2(rs.reduce(function (a, r) { return a + (f(r) ? r.amount : 0); }, 0)); };
    var seCosts = sum(seRows, function () { return true; });
    var seAllow = sum(seRows, function (r) { return r.allowable; });
    var propCosts = sum(propRows, function () { return true; });
    return {
      se: { income: r2(g.se.income), other: r2(g.se.other), rows: seRows, costs: seCosts, allowable: seAllow, notAllowable: r2(seCosts - seAllow), profit: r2(g.se.income + g.se.other - seAllow), unsorted: g.se.unsorted, incomeItems: (g.se.items.turnover || g.se.items.sales || []).concat(g.se.items['other-income'] || []) },
      prop: { income: r2(g.prop.income), rows: propRows, costs: propCosts, finance: r2(g.prop.finance), profit: r2(g.prop.income - propCosts), incomeItems: g.prop.items.rent || [], financeItems: g.prop.items['p-finance'] || [] },
      count: list.length
    };
  }

  // ---- readiness checks for a stretch of time ----------------------------------------------
  function gapsIn(list, from, to) {
    var end = to.getTime() > BE.todayDate.getTime() ? BE.todayDate : to;
    var days = {};
    list.forEach(function (e) { if (!e.summary && e.biz !== 'prop') days[e.iso] = true; });
    var keys = Object.keys(days).sort();
    if (!keys.length) return [];
    var out = [];
    var prev = new Date(from.getTime() - 86400000);
    keys.concat([isoOf(new Date(end.getTime() + 86400000))]).forEach(function (k) {
      var d = dOf(k);
      var gap = Math.round((d - prev) / 86400000) - 1;
      if (gap >= 7) {
        var a = new Date(prev.getTime() + 86400000), b = new Date(d.getTime() - 86400000);
        out.push({ id: isoOf(a), from: lbl(a), to: lbl(b), label: a.getMonth() === b.getMonth() ? a.getDate() + '–' + b.getDate() + ' ' + MON[b.getMonth()] : lbl(a) + ' – ' + lbl(b), days: gap });
      }
      prev = d;
    });
    return out;
  }

  // ---- UK quarters -----------------------------------------------------------------------
  function quarterInfo(id) {
    var q = quarters().filter(function (x) { return x.id === id; })[0];
    if (!q) return null;
    var today = BE.todayDate.getTime();
    var list = entries(q.fromD, q.toD);
    var sm = summarise(list);
    var st = (BE.get('periodState') || {})[id] || {};
    var filed = typeof BE.filedInfo === 'function' ? BE.filedInfo(id) : null;
    var started = q.fromD.getTime() <= today, closed = q.toD.getTime() < today;
    var hasData = list.length > 0;
    var gaps = (closed || started) && hasData && !BE.isEmpty() ? gapsIn(list, q.fromD, q.toD) : [];
    var req = BE.all('requests').filter(function (r) { return r.kind === 'gap' && r.period === id; })[0] || null;
    gaps = gaps.map(function (g) {
      var ok = (st.gapsOk || []).indexOf(g.id) >= 0 || (req && req.status === 'done' && String(req.gap || req.title || '').indexOf(String(g.from).split(' ')[0]) >= 0);
      return Object.assign(g, { ok: !!ok });
    });
    var noInv = sm.se.incomeItems.filter(function (e) { return e.noInvoice; });
    var checks = [
      { id: 'cats', ok: !sm.se.unsorted.length, n: sm.se.unsorted.length, text: sm.se.unsorted.length ? sm.se.unsorted.length + ' item' + (sm.se.unsorted.length === 1 ? ' needs' : 's need') + ' an HMRC category' : 'Everything has an HMRC category' },
      { id: 'gaps', ok: !gaps.filter(function (g) { return !g.ok; }).length, n: gaps.filter(function (g) { return !g.ok; }).length, text: gaps.filter(function (g) { return !g.ok; }).length ? 'No records ' + gaps.filter(function (g) { return !g.ok; }).map(function (g) { return g.label; }).join(' and ') : 'No weeks without records' },
      { id: 'income', ok: !noInv.length, n: noInv.length, text: noInv.length ? noInv.length + ' payment' + (noInv.length === 1 ? ' has' : 's have') + ' no invoice or note' : 'Every payment has an invoice or a note' }
    ];
    var left = checks.filter(function (c) { return !c.ok; }).length;
    var status = filed ? 'filed' : st.sent ? 'sent' : closed ? 'ready' : started ? 'open' : 'upcoming';
    var dueDays = typeof BE.daysUntil === 'function' ? BE.daysUntil(q.due) : null;
    return Object.assign({}, q, {
      list: list, sum: sm, checks: checks, left: left, gaps: gaps, noInvoice: noInv, req: req,
      status: status, filed: filed, sent: st.sent || '', sentBy: st.by || '', locked: !!filed, closed: closed, started: started, hasData: hasData, dueDays: dueDays,
      income: r2(sm.se.income + sm.se.other), expenses: sm.se.costs, profit: sm.se.profit
    });
  }
  /** The UK quarter card's figures: { income, expenses, uncategorised, status, ... }. */
  BE.quarterSummary = function (id) {
    if (!BE.is('uk')) return null;
    var q = quarterInfo(id);
    if (!q) return null;
    return { id: id, label: q.label, income: q.income, expenses: q.expenses, profit: q.profit, uncategorised: q.sum.se.unsorted.length, gaps: q.gaps.filter(function (g) { return !g.ok; }).length, left: q.left, status: q.status, sent: q.sent, filed: q.filed, property: q.sum.prop };
  };
  BE.quarterTotals = BE.quarterSummary;

  /** CSV in the practice's agreed layout: one row per HMRC category, then the entries. */
  function quarterCsv(q) {
    var p = prof();
    var rowsOut = [['Business', 'UTR', 'Quarter', 'Period', 'Business type', 'HMRC category', 'Your name for it', 'Amount (GBP)']];
    var base = [p.business || '', p.utr || '', q.label + ' ' + yearRange().label, q.range];
    rowsOut.push(base.concat(['Self-employment', 'Turnover', 'Your sales', q.sum.se.income.toFixed(2)]));
    if (q.sum.se.other) rowsOut.push(base.concat(['Self-employment', 'Other business income', 'Other business income', q.sum.se.other.toFixed(2)]));
    q.sum.se.rows.forEach(function (r) { rowsOut.push(base.concat(['Self-employment', r.official || r.name, r.name, r.amount.toFixed(2)])); });
    if (BE.all('properties').length) {
      rowsOut.push(base.concat(['UK property', 'Total rents and other income from property', 'Rent', q.sum.prop.income.toFixed(2)]));
      q.sum.prop.rows.forEach(function (r) { rowsOut.push(base.concat(['UK property', r.official || r.name, r.name, r.amount.toFixed(2)])); });
      rowsOut.push(base.concat(['UK property', 'Residential property finance costs', 'Mortgage interest', q.sum.prop.finance.toFixed(2)]));
    }
    rowsOut.push([]);
    rowsOut.push(['Date', 'Business type', 'Category', 'Who', 'What', 'Amount (GBP)']);
    q.list.slice().reverse().forEach(function (e) {
      var c = e.kind === 'in' ? (e.biz === 'prop' ? 'Rent' : 'Turnover') : ((catById(e.cat) || {}).official || 'Not sorted yet');
      rowsOut.push([e.iso, e.biz === 'prop' ? 'UK property' : 'Self-employment', c, e.who, e.what, (e.kind === 'in' ? 1 : -1) * e.amount]);
    });
    return books.csv(rowsOut);
  }

  // ---- Sri Lanka VAT and SSCL periods (and UK VAT quarters if registered) -------------------
  function periodList() {
    var P = pack();
    if (BE.is('lk')) return (P.periods || []).map(function (p) { var r = monthRange(p.id); return Object.assign({}, p, { fromD: r.from, toD: r.to, short: FULL[r.from.getMonth()] }); });
    // UK VAT quarters (standard stagger: calendar quarters)
    return [
      { id: 'vat-2026-q2', label: 'April to June 2026', from: '1 Apr', to: '30 Jun', due: '7 Aug 2026', fromD: new Date(2026, 3, 1), toD: new Date(2026, 5, 30), short: 'Apr–Jun' },
      { id: 'vat-2026-q3', label: 'July to September 2026', from: '1 Jul', to: '30 Sep', due: '7 Nov 2026', fromD: new Date(2026, 6, 1), toD: new Date(2026, 8, 30), short: 'Jul–Sep' },
      { id: 'vat-2026-q4', label: 'October to December 2026', from: '1 Oct', to: '31 Dec', due: '7 Feb 2027', fromD: new Date(2026, 9, 1), toD: new Date(2026, 11, 31), short: 'Oct–Dec' }
    ];
  }
  function periodInfo(id) {
    var p = periodList().filter(function (x) { return x.id === id; })[0];
    if (!p) return null;
    var P = pack(), lk = BE.is('lk');
    var vatOn = !!prof().vatRegistered, ssclOn = lk && !!prof().ssclRegistered;
    var std = ((P.vatRates || [])[0] || { rate: 0 }).rate;
    // Output: invoices issued in the period
    var outLines = [];
    BE.all('invoices').forEach(function (i) {
      if (i.draft || i.void) return;
      var d = dOf(i.iso || i.issued);
      if (!d || !within({ d: d }, p.fromD, p.toD)) return;
      var t = typeof BE.invTax === 'function' ? BE.invTax(i) : null;
      var sub = BE.invSubtotal(i);
      var whole = (t ? t.total : BE.invTotal(i) + (Number(i.credit) || 0)) || 1;
      var f = Math.max(0, 1 - (Number(i.credit) || 0) / whole);
      var sscl = (i.ssclAmt != null ? i.ssclAmt : t ? t.sscl : 0) * f;
      var vat = (i.vatAmt != null ? i.vatAmt : t ? t.vat : 0) * f;
      var zero = 0, exempt = 0;
      if (t && t.vatRows) t.vatRows.forEach(function (g) { if (g.id === 'zero') zero += g.base * f; if (g.id === 'exempt' || g.id === 'outside') exempt += g.base * f; });
      outLines.push({ id: i.num, date: lbl(d), iso: isoOf(d), who: i.who, value: r2(sub * f), sscl: r2(sscl), base: r2(sub * f + sscl - zero - exempt), zero: r2(zero), exempt: r2(exempt), vat: r2(vat), credit: Number(i.credit) || 0, href: 'SellInvoices.dc.html#' + i.num });
    });
    // Input: bills (by bill date), expenses that didn't pay a bill, and anything recorded before BillingEase
    var inLines = [];
    BE.all('bills').forEach(function (b) {
      var d = dOf(b.date || b.entered);
      if (!d || !(Number(b.vat) > 0) || !within({ d: d }, p.fromD, p.toD)) return;
      inLines.push({ id: b.id, date: lbl(d), iso: isoOf(d), who: b.who, ref: b.num || '', value: r2((typeof BE.billTotal === 'function' ? BE.billTotal(b) : b.amount) - b.vat), vat: r2(b.vat), capital: catIdOf(b) === 'capital', href: 'SpendBill.dc.html#' + b.id });
    });
    BE.all('expenses').forEach(function (x) {
      if (x.bill || !(Number(x.vat) > 0)) return;
      var d = dOf(x.iso || x.date);
      if (!d || !within({ d: d }, p.fromD, p.toD)) return;
      inLines.push({ id: x.id, date: lbl(d), iso: isoOf(d), who: x.who, ref: x.note || '', value: r2(x.amount - x.vat), vat: r2(x.vat), capital: catIdOf(x) === 'capital', href: 'SpendTransaction.dc.html#' + x.id });
    });
    BE.all('vatInputsBefore').forEach(function (v) {
      var d = dOf(v.iso);
      if (!d || !within({ d: d }, p.fromD, p.toD)) return;
      inLines.push({ id: v.id, date: lbl(d), iso: v.iso, who: v.who, ref: v.ref, value: v.value, vat: v.vat, capital: !!v.capital, href: '' });
    });
    var by = function (a, b) { return a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0; };
    outLines.sort(by); inLines.sort(by);
    var s = function (list, k) { return r2(list.reduce(function (a, x) { return a + (Number(x[k]) || 0); }, 0)); };
    var value = s(outLines, 'value'), sscl = s(outLines, 'sscl'), base = s(outLines, 'base'), zero = s(outLines, 'zero'), exempt = s(outLines, 'exempt'), outVat = s(outLines, 'vat');
    var inLocal = s(inLines.filter(function (x) { return !x.capital; }), 'vat'), inCap = s(inLines.filter(function (x) { return x.capital; }), 'vat');
    var inVat = r2(inLocal + inCap);
    var netVat = r2(outVat - inVat);
    var filed = typeof BE.filedInfo === 'function' ? BE.filedInfo(id) : null;
    var st = (BE.get('periodState') || {})[id] || {};
    var today = BE.todayDate.getTime();
    var closed = p.toD.getTime() < today, started = p.fromD.getTime() <= today;
    var status = filed ? 'filed' : closed ? 'due' : started ? 'open' : 'upcoming';
    var reqs = BE.all('requests').filter(function (r) { return r.period === id && r.status !== 'done' && (r.dir || 'in') === 'in'; });
    var boxes = lk ? [
      { n: '1', label: 'Value of taxable supplies at ' + Math.round(std * 100) + '%', sub: 'Includes SSCL in the VAT base (to confirm with IRD)', amount: base, sec: 'vat' },
      { n: '2', label: 'Zero-rated supplies', amount: zero, sec: 'vat' },
      { n: '3', label: 'Exempt supplies', amount: exempt, sec: 'vat' },
      { n: '4', label: 'Total supplies', amount: r2(base + zero + exempt), sec: 'vat', total: true },
      { n: '5', label: 'Output VAT', sub: Math.round(std * 100) + '% of box 1', amount: outVat, sec: 'vat' },
      { n: '6', label: 'Input VAT on local purchases', amount: inLocal, sec: 'vat' },
      { n: '7', label: 'Input VAT on capital goods', amount: inCap, sec: 'vat' },
      { n: '8', label: 'Total input VAT', sub: 'Box 6 + box 7', amount: inVat, sec: 'vat', total: true },
      { n: '9', label: netVat >= 0 ? 'VAT payable' : 'VAT to carry forward', sub: 'Box 5 − box 8', amount: Math.abs(netVat), sec: 'vat', total: true, key: true }
    ].concat(ssclOn ? [
      { n: 'S1', label: 'Liable turnover for SSCL', amount: value, sec: 'sscl' },
      { n: 'S2', label: 'SSCL at ' + ((P.sscl || 0) * 100) + '%', amount: sscl, sec: 'sscl' },
      { n: 'S3', label: 'SSCL payable', sub: 'No input credit for SSCL', amount: sscl, sec: 'sscl', total: true, key: true }
    ] : []) : [
      { n: '1', label: 'VAT due on sales', amount: outVat, sec: 'vat' },
      { n: '2', label: 'VAT due on goods from abroad', amount: 0, sec: 'vat' },
      { n: '3', label: 'Total VAT due', sub: 'Box 1 + box 2', amount: outVat, sec: 'vat', total: true },
      { n: '4', label: 'VAT reclaimed on purchases', amount: inVat, sec: 'vat' },
      { n: '5', label: netVat >= 0 ? 'VAT to pay HMRC' : 'VAT HMRC owes you', sub: 'Box 3 − box 4', amount: Math.abs(netVat), sec: 'vat', total: true, key: true },
      { n: '6', label: 'Total sales, before VAT', amount: Math.round(value), sec: 'vat' },
      { n: '7', label: 'Total purchases, before VAT', amount: Math.round(s(inLines, 'value')), sec: 'vat' },
      { n: '8', label: 'Sales of goods to the EU (NI only)', amount: 0, sec: 'vat' },
      { n: '9', label: 'Goods from the EU (NI only)', amount: 0, sec: 'vat' }
    ];
    return Object.assign({}, p, {
      outLines: outLines, inLines: inLines, boxes: boxes, value: value, sscl: sscl, base: base, output: outVat, input: inVat, inLocal: inLocal, inCap: inCap,
      net: netVat, total: r2(Math.max(netVat, 0) + (ssclOn ? sscl : 0)), filed: filed, ref: st.ref || '', sent: st.sent || '', status: status, locked: !!filed,
      closed: closed, started: started, requests: reqs, ssclOn: ssclOn, vatOn: vatOn, dueDays: typeof BE.daysUntil === 'function' ? BE.daysUntil(p.due) : null
    });
  }
  /** The Sri Lanka month card on Home: { vat, sscl, total, status, ... } for '2026-09'. */
  BE.taxPeriodSummary = function (id) {
    var p = periodInfo(id);
    if (!p) return null;
    return { id: id, label: p.label, vat: Math.max(p.net, 0), sscl: p.ssclOn ? p.sscl : 0, total: p.total, output: p.output, input: p.input, sales: p.value, status: p.status, filed: p.filed, due: p.due };
  };
  /** For the practice view: { sales, output, sscl, input, net, registered }. */
  BE.periodTotals = function (id) {
    var p = periodInfo(id);
    if (!p) return null;
    return { sales: Math.round(p.value), output: Math.round(p.output), sscl: Math.round(p.ssclOn ? p.sscl : 0), input: Math.round(p.input), net: Math.round(p.net), registered: p.vatOn };
  };
  function periodCsv(p) {
    var lk = BE.is('lk');
    var cur = lk ? 'LKR' : 'GBP';
    var out = [[lk ? 'VAT and SSCL return (layout to confirm with IRD)' : 'VAT return summary'], ['Business', prof().business || ''], [lk ? 'TIN' : 'VAT number', lk ? (prof().tin || '') : (prof().vatNo || '')], lk ? ['VAT registration number', prof().vatNo || ''] : [], ['Period', p.label], [], ['Box', 'Line', 'Amount (' + cur + ')']];
    p.boxes.forEach(function (b) { out.push([b.n, b.label, b.amount.toFixed(2)]); });
    out.push([]);
    out.push(['Output', 'Date', 'Invoice', 'Customer', 'Value', 'SSCL', 'VAT']);
    p.outLines.forEach(function (l) { out.push(['', l.iso, l.id, l.who, l.value.toFixed(2), l.sscl.toFixed(2), l.vat.toFixed(2)]); });
    out.push([]);
    out.push(['Input', 'Date', 'Reference', 'Supplier', 'Value', 'Capital goods', 'VAT']);
    p.inLines.forEach(function (l) { out.push(['', l.iso, l.ref, l.who, l.value.toFixed(2), l.capital ? 'Yes' : 'No', l.vat.toFixed(2)]); });
    return books.csv(out.filter(function (r) { return r.length; }).concat([]));
  }

  // ---- turnover against the VAT threshold (UK; Sri Lanka when not registered) -------------
  // UK months before the ledger starts (Nov 2025 – Jun 2026), self-employment turnover only (rent from a home is exempt).
  BE.define('turnoverBefore', BE.perCountry({
    uk: [['2025-11', 6900], ['2025-12', 5100], ['2026-01', 6400], ['2026-02', 7050], ['2026-03', 6570], ['2026-04', 5050], ['2026-05', 4380], ['2026-06', 4770]],
    lk: []
  }), BE.perCountry({ uk: [], lk: [] }));
  function turnover() {
    var lk = BE.is('lk');
    var months = {};
    var start = lk ? yearRange().from : new Date(2025, 10, 1);
    BE.all('turnoverBefore').forEach(function (m) { months[m[0]] = (months[m[0]] || 0) + m[1]; });
    ledger().forEach(function (e) {
      if (e.kind !== 'in' || e.biz !== 'se' || e.d < start) return;
      if (!lk && e.summary) return; // the Q1 summary is already in turnoverBefore
      var k = e.iso.slice(0, 7);
      months[k] = (months[k] || 0) + e.amount;
    });
    var list = Object.keys(months).sort().map(function (k) { return { id: k, label: MON[+k.slice(5, 7) - 1], year: k.slice(0, 4), amount: r2(months[k]) }; });
    var total = r2(list.reduce(function (a, m) { return a + m.amount; }, 0));
    var limit = pack().vatThreshold || 0;
    return { months: list, total: total, limit: limit, pct: limit ? Math.min(100, Math.round(total / limit * 100)) : 0, left: r2(Math.max(0, limit - total)), rolling: !lk };
  }

  // ---- the estimate behind Yours to keep -----------------------------------------------------
  function monthsIntoYear() { return Math.max(1, (BE.todayDate - yearRange().from) / 86400000 / 30.4375); }
  function financeSoFar() {
    if (!BE.is('uk')) return 0;
    var y = yearRange();
    return r2(ledger().filter(function (e) { return e.biz === 'prop' && e.cat === 'p-finance' && within(e, y.from, BE.todayDate); }).reduce(function (a, e) { return a + e.amount; }, 0));
  }
  /** The year's estimate: profit so far, scaled to a full year, through the pack's estimate. */
  function estimate() {
    var P = pack();
    var y = BE.totals('year');
    var m = monthsIntoYear();
    var annual = Math.round(Math.max(0, y.profit) * 12 / m);
    var finance = Math.round(financeSoFar() * 12 / m);
    var est = typeof P.estimate === 'function' ? P.estimate(annual, { financeCosts: finance }) : { total: Math.round(annual * 0.25), lines: [], paymentsOnAccount: [], label: 'Tax' };
    var rate = annual > 0 ? est.total / annual : 0;
    return { soFar: y.profit, annual: annual, months: r2(m), finance: finance, est: est, total: est.total, rate: rate, monthly: Math.round(est.total / 12), label: est.label || 'Tax' };
  }
  // Yours to keep on Home and here: after the estimate, with UK mortgage interest relief.
  var homeKeep = BE.keepTotals;
  if (typeof homeKeep === 'function') {
    BE.keepTotals = function (period) {
      var t = homeKeep(period);
      if (!BE.is('uk') || !financeSoFar()) return t;
      var e = estimate();
      var tax = Math.round(Math.max(t.profit, 0) * e.rate);
      var keep = Math.round(t.profit - tax);
      var W = function (n) { return BE.money(n, t.currency, { whole: true }); };
      return Object.assign({}, t, { tax: tax, keep: keep, rate: e.rate, estimate: e.est, keepPct: t.profit > 0 ? Math.max(keep > 0 ? 2 : 0, Math.min(100, Math.round(keep / t.profit * 100))) : 0, fmt: Object.assign({}, t.fmt, { tax: W(tax), keep: W(keep) }) });
    };
  }

  // ---- profit and loss, balance sheet, aged lists -------------------------------------------
  function plFor(from, to) { return summarise(entries(from, to)); }
  function balance() {
    var b = BE.get('balances') || {};
    var lk = BE.is('lk');
    var t = BE.totals('month');
    var payIn = BE.all('payments').reduce(function (a, p) { return a + (p.inMonth ? (Number(p.amount) || 0) : 0); }, 0);
    var paidOut = BE.all('expenses').reduce(function (a, x) { return a + (x.inMonth && x.kind !== 'personal' ? (Number(x.amount) || 0) : 0); }, 0);
    var cash = r2((b.cashOct1 || 0) + payIn - paidOut);
    var ar = r2(BE.all('invoices').reduce(function (a, i) { return a + (i.draft || i.void ? 0 : BE.invOpen(i)); }, 0));
    var ap = r2(BE.all('bills').reduce(function (a, x) { return a + (x.status === 'paid' ? 0 : (typeof BE.billLeft === 'function' ? BE.billLeft(x) : x.amount - (x.paid || 0))); }, 0));
    var dues = r2(BE.all('payroll').reduce(function (a, r) { return a + (r.kind === 'due' && r.status !== 'paid' ? (Number(r.amount || r.net) || 0) : 0); }, 0));
    var unpaidRuns = r2(BE.all('payroll').reduce(function (a, r) { return a + (r.kind !== 'due' && (r.status === 'approved' || r.status === 'entered') ? (Number(r.net) || 0) : 0); }, 0));
    var vat = 0;
    if (prof().vatRegistered) periodList().forEach(function (p) { var i = periodInfo(p.id); if (i && i.started && !i.filed) vat += i.total; });
    var capThisYear = r2(ledger().filter(function (e) { return e.cat === 'capital' && e.d >= new Date(2026, 9, 1); }).reduce(function (a, e) { return a + e.amount; }, 0));
    var own = [
      { key: 'cash', label: 'Cash in ' + (b.bankName || 'your bank'), formal: 'Cash at bank', amount: cash },
      { key: 'ar', label: 'Money customers owe you', formal: lk ? 'Trade receivables' : 'Trade debtors', amount: ar },
      { key: 'fixed', label: 'Equipment, after wear', formal: lk ? 'Property, plant and equipment' : 'Fixed assets', amount: r2((b.fixedAssets || 0) + capThisYear) }
    ];
    var owe = [
      { key: 'ap', label: 'Bills to pay', formal: lk ? 'Trade payables' : 'Trade creditors', amount: ap },
      { key: 'pay', label: lk ? 'EPF, ETF, APIT and salaries to pay' : 'PAYE, NI, pension and pay still to pay', formal: lk ? 'Statutory payroll liabilities' : 'PAYE and NIC payable', amount: r2(dues + unpaidRuns) }
    ];
    if (prof().vatRegistered) owe.push({ key: 'vat', label: lk ? 'VAT and SSCL to pay' : 'VAT to pay', formal: lk ? 'VAT and SSCL payable' : 'VAT payable', amount: r2(vat) });
    if (b.card) owe.push({ key: 'card', label: b.cardName || 'Business card', formal: 'Credit card', amount: b.card });
    var tOwn = r2(own.reduce(function (a, r) { return a + r.amount; }, 0));
    var tOwe = r2(owe.reduce(function (a, r) { return a + r.amount; }, 0));
    var y = BE.totals('year');
    var draws = b.draws || 0;
    var capital = r2(tOwn - tOwe - y.profit - draws);
    var eq = [
      { key: 'profit', label: 'Profit so far this ' + (lk ? 'year of assessment' : 'tax year'), formal: 'Net profit', amount: r2(y.profit) },
      { key: 'capital', label: 'Your money in the business', formal: 'Capital account', amount: capital },
      { key: 'draws', label: 'Money you took out', formal: 'Drawings', amount: draws }
    ];
    return { own: own, owe: owe, eq: eq, tOwn: tOwn, tOwe: tOwe, tEq: r2(tOwn - tOwe), cash: cash, ar: ar, ap: ap, outSch: t.outSch };
  }
  function aged(kind) {
    var buckets = [{ id: 'cur', label: 'Not due yet', amount: 0, items: [] }, { id: 'd30', label: '1–30 days late', amount: 0, items: [] }, { id: 'd60', label: '31–60 days late', amount: 0, items: [] }, { id: 'd61', label: 'Over 60 days late', amount: 0, items: [] }];
    var put = function (dueIn, item) {
      var b = dueIn >= 0 ? buckets[0] : dueIn >= -30 ? buckets[1] : dueIn >= -60 ? buckets[2] : buckets[3];
      b.amount = r2(b.amount + item.amount); b.items.push(item);
    };
    if (kind === 'in') BE.all('invoices').forEach(function (i) {
      if (i.draft || i.void) return;
      var open = BE.invOpen(i);
      if (open > 0) put(i.dueIn, { id: i.num, who: i.who, what: i.num + (i.what ? ' · ' + i.what : ''), due: i.due, dueIn: i.dueIn, amount: open, href: 'SellInvoices.dc.html#' + i.num });
    });
    else BE.all('bills').forEach(function (b) {
      if (b.status === 'paid') return;
      var open = typeof BE.billLeft === 'function' ? BE.billLeft(b) : b.amount - (b.paid || 0);
      if (open > 0) put(b.dueIn, { id: b.id, who: b.who, what: (b.num ? b.num + ' · ' : '') + (b.what || ''), due: b.due, dueIn: b.dueIn, amount: open, href: 'SpendBill.dc.html#' + b.id });
    });
    return { buckets: buckets, total: r2(buckets.reduce(function (a, b) { return a + b.amount; }, 0)) };
  }

  // ---- CSV statement import ----------------------------------------------------------------
  function parseCsv(text) {
    var rowsOut = [], row = [], cell = '', q = false;
    text = String(text || '').replace(/\r\n?/g, '\n');
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; continue; }
      if (ch === '"') q = true;
      else if (ch === ',') { row.push(cell.trim()); cell = ''; }
      else if (ch === '\n') { row.push(cell.trim()); if (row.some(function (c) { return c !== ''; })) rowsOut.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    row.push(cell.trim());
    if (row.some(function (c) { return c !== ''; })) rowsOut.push(row);
    return rowsOut;
  }
  function csvDate(s) {
    s = String(s || '').trim();
    var m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
    if (m) return new Date(+m[3] < 100 ? 2000 + +m[3] : +m[3], +m[2] - 1, +m[1]);
    return dOf(s);
  }
  function csvNum(s) { s = String(s == null ? '' : s).replace(/[^0-9.\-()]/g, ''); if (/^\(.*\)$/.test(s)) s = '-' + s.slice(1, -1); var v = parseFloat(s); return isFinite(v) ? v : 0; }

  var books = {
    MON: MON, FULL: FULL,
    ledger: ledger, entries: entries, summarise: summarise, catIdOf: catIdOf, catById: catById, basis: basis,
    yearRange: yearRange, quarters: quarters, quarter: quarterInfo, quarterCsv: quarterCsv,
    periods: periodList, period: periodInfo, periodCsv: periodCsv, turnover: turnover,
    estimate: estimate, financeSoFar: financeSoFar, monthsIntoYear: monthsIntoYear,
    pl: plFor, balance: balance, aged: aged, gaps: gapsIn,
    templates: function () { return TPL[BE.country()] || []; }, sampleCsv: function () { return SAMPLE_CSV[BE.country()] || ''; },
    parseCsv: parseCsv, csvDate: csvDate, csvNum: csvNum,
    dOf: dOf, isoOf: isoOf, lbl: lbl, lblY: lblY,
    /** Year by month: { id 'YYYY-MM', label, income, costs, profit } from the start of the tax year to today. */
    months: function () {
      var y = yearRange(), out = [];
      var all = ledger().filter(function (e) { return within(e, y.from, BE.todayDate) && !(e.biz === 'prop' && e.cat === 'p-finance'); });
      for (var d = new Date(y.from.getFullYear(), y.from.getMonth(), 1); d <= BE.todayDate; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
        var k = isoOf(d).slice(0, 7);
        var inc = 0, cost = 0;
        all.forEach(function (e) { if (e.iso.slice(0, 7) === k) { if (e.kind === 'in') inc += e.amount; else cost += e.amount; } });
        out.push({ id: k, label: MON[d.getMonth()], income: r2(inc), costs: r2(cost), profit: r2(inc - cost) });
      }
      return out;
    },
    /** Amounts per category for the tax year so far. */
    yearByCat: function () {
      var y = yearRange(), out = {};
      ledger().forEach(function (e) { if (!within(e, y.from, BE.todayDate)) return; var k = e.cat || 'unsorted'; out[k] = r2((out[k] || 0) + e.amount); });
      BE.all('journal').forEach(function (j) { (j.lines || []).forEach(function (l) { out[l.cat] = r2((out[l.cat] || 0) + (l.side === 'to' ? 1 : -1) * l.amt); }); });
      return out;
    },
    /** Old callers (AppTools before the country rework) asked for sales tax: there is none now. */
    salesTax: function () { return { s: {}, open: null, filed: null, filings: [], q4: { invoices: [], sales: 0, tax: 0 }, owed: 0 }; },
    /** A CSV text from rows of cells. */
    csv: function (rowsIn) {
      return rowsIn.map(function (r) { return r.map(function (c) { var s = String(c == null ? '' : c); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(','); }).join('\n');
    },
    /** Copy text to the clipboard (where the browser allows it). The CSV is always shown in the page too. */
    copy: function (text) {
      try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).catch(function () {}); return true; } } catch (e) { /* blocked */ }
      return false;
    },

    // ---- writes ----
    /** Send a UK quarter to your accountant: marks it ready for them, tells them, logs it. */
    sendQuarter: function (id) {
      var q = quarterInfo(id);
      if (!q) return null;
      var pr = typeof BE.practice === 'function' ? BE.practice() : { short: 'your accountant' };
      BE.change(function (s) {
        var ps = Object.assign({}, s.periodState || {});
        ps[id] = Object.assign({}, ps[id] || {}, { sent: BE.today, by: (s.profile || {}).owner || '' });
        s.periodState = ps;
        BE._log(s, 'Sent ' + q.label + ' (' + q.range + ') to ' + pr.short + ' · income ' + BE.money(q.income, null, { whole: true }) + ', expenses ' + BE.money(q.expenses, null, { whole: true }));
        BE._notify(s, q.label + ' sent to ' + pr.short, 'They file it by ' + q.due + '. It locks in your books once they mark it filed.', 'Quarters.dc.html#' + id);
      });
      return q;
    },
    unsendQuarter: function (id) {
      BE.change(function (s) {
        var ps = Object.assign({}, s.periodState || {});
        ps[id] = Object.assign({}, ps[id] || {}, { sent: '' });
        s.periodState = ps;
        BE._log(s, 'Took ' + id.toUpperCase() + ' back from your accountant to make changes');
      });
    },
    /** A gap in the records that really had no business in it. */
    confirmGap: function (qid, gapId, label) {
      BE.change(function (s) {
        var ps = Object.assign({}, s.periodState || {});
        var st = Object.assign({}, ps[qid] || {});
        st.gapsOk = (st.gapsOk || []).concat([gapId]);
        ps[qid] = st; s.periodState = ps;
        BE._log(s, 'Confirmed there was no business ' + label);
      });
      var req = BE.all('requests').filter(function (r) { return r.kind === 'gap' && r.period === qid && r.status !== 'done'; })[0];
      if (req && typeof BE.completeRequest === 'function') BE.completeRequest(req.id, 'No business ' + label);
    },
    /** Sort an expense into a pack category. */
    setCategory: function (expId, catId) {
      var c = catById(catId);
      if (!c) return null;
      return BE.update('expenses', expId, function (x) { return { catId: c.id, cat: c.name, events: [{ label: 'Sorted into ' + c.name, date: BE.today }].concat(x.events || []) }; });
    },
    /** Note what a payment with no invoice was for. */
    notePayment: function (payId, note) { return BE.update('payments', payId, { note: note }); },
    /** Record a tax period as filed (with an optional reference). Locks it. */
    filePeriod: function (id, ref) {
      var p = periodInfo(id);
      if (!p) return null;
      BE.change(function (s) {
        var ps = Object.assign({}, s.periodState || {});
        ps[id] = Object.assign({}, ps[id] || {}, { ref: ref || '', snapshot: { value: p.value, output: p.output, input: p.input, sscl: p.sscl, net: p.net } });
        s.periodState = ps;
      });
      if (typeof BE.markFiled === 'function') BE.markFiled(id, p.label + (BE.is('lk') ? ' VAT and SSCL return' : ' VAT return'));
      return p;
    },
    /** Mark a tax payment (payment on account or instalment) paid. */
    payTax: function (due, label, amount) {
      BE.change(function (s) {
        s.taxPayments = [{ id: BE.id('tp'), due: due, label: label, amount: amount, paidOn: BE.today, year: yearRange().label }].concat(s.taxPayments || []);
        BE._log(s, 'Recorded ' + label.toLowerCase() + ' paid · ' + BE.money(amount, null, { whole: true }));
      });
    },
    unpayTax: function (due) { BE.change(function (s) { s.taxPayments = (s.taxPayments || []).filter(function (p) { return !(p.due === due && p.paidOn === BE.today); }); }); }
  };
  BE.books = books;
})();
