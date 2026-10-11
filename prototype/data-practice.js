/*
 * Properties, mileage and the accountant link.
 *   properties, propertyEntries, landlord  UK landlord mode (Flat 2, 18 Ash Grove)
 *   trips                                  UK mileage log (simplified rates from the pack)
 *   practice                               your accountant / practitioner, what they can see,
 *                                          filed (locked) periods, TaxWise.lk link, and the
 *                                          practice's other clients for the PracticeView preview
 *   practiceMessages                       messages between you and your accountant
 * Helpers: BE.propertyTotals(q), BE.mileageTotals(q), BE.ukQuarterOf(date), BE.isFiled(id),
 * BE.filedInfo(id), BE.markFiled(id), BE.reopenPeriod(id), BE.markRent(prop, month),
 * BE.unmarkRent(prop, month), BE.clientSummary(periodId), BE.dateOf(label).
 */
(function () {
  'use strict';

  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function iso(y, m, d) { return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }

  // ---- UK property: Flat 2, 18 Ash Grove, Headingley ----------------------
  var ASH = { id: 'ash', name: 'Flat 2, 18 Ash Grove', area: 'Headingley, Leeds LS6', share: 100, rent: 1050, rentDay: 7,
    agent: 'Headingley Lettings', agentPct: 10, mortgage: 410, lender: 'Leeds Building Society', since: 'Let since Aug 2023',
    statements: ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08'] };

  var entries = [];
  var n = 0;
  function E(kind, cat, what, amount, y, m, d, extra) {
    n++;
    entries.push(Object.assign({ id: 'pe-' + n, prop: 'ash', kind: kind, cat: cat, what: what, amount: amount, iso: iso(y, m, d), date: d + ' ' + MON[m - 1] }, extra || {}));
  }
  // Rent arrives on the 7th through the letting agent. April to September are ticked; October isn't yet.
  // Property costs from 6 July on are ordinary expenses in Going out (with property: 'ash'), so they are
  // entered once; the costs below are from before Harper Studio started using BillingEase (Q1).
  [4, 5, 6, 7, 8, 9].forEach(function (m) {
    var month = iso(2026, m, 1).slice(0, 7);
    E('income', 'rent', 'Rent for ' + MON[m - 1] + ' 2026', 1050, 2026, m, 7, { rentMonth: month });
  });
  [5, 6, 7].forEach(function (m) {
    E('cost', 'p-finance', 'Mortgage interest · Leeds Building Society', 410, 2026, m, 1);
    E('cost', 'p-professional', 'Headingley Lettings · 10% management fee', 105, 2026, m, 1);
  });
  E('cost', 'p-running', 'Landlord insurance (annual)', 186, 2026, 5, 2);
  entries.sort(function (a, b) { return a.iso < b.iso ? 1 : -1; });

  BE.define('properties', BE.perCountry({ uk: [ASH], lk: [] }), BE.perCountry({ uk: [], lk: [] }));
  BE.define('propertyEntries', BE.perCountry({ uk: entries, lk: [] }), BE.perCountry({ uk: [], lk: [] }));
  BE.define('landlord', { useAllowance: false }, { useAllowance: false });

  // ---- UK mileage: client trips from Leeds -------------------------------
  var T = function (id, y, m, d, from, to, purpose, miles, who) { return { id: id, iso: iso(y, m, d), date: d + ' ' + MON[m - 1], from: from, to: to, purpose: purpose, miles: miles, who: who || '' }; };
  BE.define('trips', BE.perCountry({
    uk: [
      T('trip-8', 2026, 10, 8, 'Leeds', 'York', 'Ochre Café · winter menu proofs', 50, 'Ochre Café'),
      T('trip-7', 2026, 9, 30, 'Leeds', 'Harrogate', 'Moor & Dale Outdoor · catalogue sign-off', 32, 'Moor & Dale Outdoor'),
      T('trip-6', 2026, 9, 3, 'Leeds', 'Huddersfield', 'Pennine Physio · clinic signage measure-up', 36, 'Pennine Physio'),
      T('trip-5', 2026, 8, 6, 'Leeds', 'York', 'Ochre Café · signage install', 50, 'Ochre Café'),
      T('trip-4', 2026, 7, 22, 'Leeds', 'Harrogate', 'Moor & Dale Outdoor · press check at the printer', 32, 'Moor & Dale Outdoor'),
      T('trip-3', 2026, 6, 18, 'Leeds', 'Huddersfield', 'Pennine Physio · brand workshop', 36, 'Pennine Physio'),
      T('trip-2', 2026, 5, 9, 'Leeds', 'York', 'Ochre Café · first meeting', 50, 'Ochre Café'),
      T('trip-1', 2026, 4, 14, 'Leeds', 'Harrogate', 'Moor & Dale Outdoor · kick-off', 32, 'Moor & Dale Outdoor')
    ],
    lk: []
  }), BE.perCountry({ uk: [], lk: [] }));

  // ---- The accountant link -------------------------------------------------
  var ACCESS_UK = [
    { id: 'books', label: 'Your books and every entry', note: 'Needed to prepare your quarterly updates', fixed: true, on: true },
    { id: 'quarters', label: 'Quarter totals and readiness checks', note: 'What they file from', fixed: true, on: true },
    { id: 'properties', label: 'Property income and costs', note: 'Flat 2, 18 Ash Grove', on: true },
    { id: 'payroll', label: 'Payroll records', note: 'Pay runs entered from your payroll software', on: true },
    { id: 'journal', label: 'Add adjusting entries', note: 'Journal entries, marked as theirs', on: true }
  ];
  var ACCESS_LK = [
    { id: 'books', label: 'Your books and every entry', note: 'Needed to prepare your returns', fixed: true, on: true },
    { id: 'periods', label: 'VAT and SSCL periods', note: 'Monthly summaries in return order', fixed: true, on: true },
    { id: 'payroll', label: 'Payroll, EPF, ETF and APIT', note: 'Pay runs, schedules and payslips', on: true },
    { id: 'journal', label: 'Add adjusting entries', note: 'Journal entries, marked as theirs', on: true }
  ];
  var CANNOT = ['Change your password or how you sign in', 'Send invoices or record payments in your name', 'Delete your business or its records'];

  var UK_CLIENTS = [
    { id: 'calder', name: 'Calder Joinery', owner: 'Gareth Lowe', kind: 'Sole trader', status: 'ready', statusLabel: 'Ready to file', period: 'Q2', due: '7 Nov 2026', requests: [], totals: [['Income', 21400], ['Stock and materials you resell', 6120], ['Car, van and travel', 1180], ['Phone, internet and office', 240]] },
    { id: 'kirkgate', name: 'Kirkgate Flowers', owner: 'Hannah Bell', kind: 'Sole trader', status: 'waiting', statusLabel: 'Waiting on client', period: 'Q2', due: '7 Nov 2026', requests: [{ id: 'kg-1', title: 'Add August card sales', status: 'open', created: '2 Oct' }], totals: [['Income', 14250], ['Stock and materials you resell', 5310], ['Premises', 1950]] },
    { id: 'wharfe', name: 'Wharfe Valley Lets', owner: 'Ian Moss', kind: 'Landlord', status: 'filed', statusLabel: 'Filed', period: 'Q2', due: 'Filed 3 Oct', filed: true, requests: [], totals: [['Property income', 9600], ['Repairs', 820], ['Mortgage interest', 2340]] },
    { id: 'okafor', name: 'Sam Okafor Photography', owner: 'Sam Okafor', kind: 'Sole trader', status: 'started', statusLabel: 'In progress', period: 'Q2', due: '7 Nov 2026', requests: [], totals: [['Income', 8900], ['Equipment (capital)', 1450], ['Car, van and travel', 310]] }
  ];
  var LK_CLIENTS = [
    { id: 'lavinia', name: 'Mount Lavinia Bakers', owner: 'Chaminda Silva', kind: 'Sole proprietor', status: 'ready', statusLabel: 'VAT ready · payroll run', period: 'September 2026', due: '20 Oct 2026', requests: [], totals: [['Sales', 4850000], ['Output VAT', 873000], ['SSCL', 121250], ['Salaries and wages', 1260000]] },
    { id: 'nugegoda', name: 'Nugegoda Hardware Stores', owner: 'Priyantha Gunasekara', kind: 'Partnership', status: 'waiting', statusLabel: 'Waiting on client', period: 'September 2026', due: '20 Oct 2026', requests: [{ id: 'ng-1', title: 'Send the September purchase invoices', status: 'open', created: '5 Oct' }], totals: [['Sales', 7120000], ['Purchases and materials', 5480000]] },
    { id: 'kelaniya', name: 'Kelaniya Auto Care', owner: 'Dinesh Kumar', kind: 'Sole proprietor', status: 'filed', statusLabel: 'Filed · payroll run', period: 'September 2026', due: 'Filed 9 Oct', filed: true, requests: [], totals: [['Sales', 3260000], ['Output VAT', 586800], ['SSCL', 81500]] },
    { id: 'rajagiriya', name: 'Rajagiriya Tuition Centre', owner: 'Nadeesha Perera', kind: 'Sole proprietor', status: 'started', statusLabel: 'Payroll not run', period: 'Not VAT registered', due: 'Payroll by 31 Oct', requests: [], totals: [['Fees received', 1940000], ['Salaries and wages', 860000]] }
  ];

  BE.define('practice', BE.perCountry({
    uk: {
      status: 'linked', since: '14 Mar 2026', role: 'Partner', phone: '0113 496 0730', city: 'Leeds',
      access: ACCESS_UK, cannot: CANNOT,
      filed: { q1: { on: '4 Aug', by: 'Priya Shaw' } },
      clients: UK_CLIENTS
    },
    lk: {
      status: 'linked', since: '2 Feb 2026', role: 'Partner', phone: '011 268 1924', city: 'Colombo 05',
      access: ACCESS_LK, cannot: CANNOT,
      filed: { '2026-08': { on: '16 Sep', by: 'Ruwan Jayasinghe' } },
      taxwise: { account: 'ayesha@serendibstudio.lk', since: '2 Feb 2026', lastHandoff: 'August VAT and SSCL figures, 16 Sep', yearHandoff: 'The 2026/27 year goes to your TaxWise.lk return after 31 Mar 2027' },
      clients: LK_CLIENTS
    }
  }), BE.perCountry({
    uk: { status: 'none', since: '', access: ACCESS_UK, cannot: CANNOT, filed: {}, clients: UK_CLIENTS },
    lk: { status: 'none', since: '', access: ACCESS_LK, cannot: CANNOT, filed: {}, taxwise: null, clients: LK_CLIENTS }
  }));

  BE.define('practiceMessages', BE.perCountry({
    uk: [
      { id: 'pm-1', from: 'them', who: 'Priya Shaw', when: '8 Oct', text: 'Hi Ellie, Q2 has closed and I’m aiming to file well before 7 Nov. Two things first: there’s a gap in your records from 12 to 25 September, and I need the September statement from Headingley Lettings.' },
      { id: 'pm-2', from: 'me', who: 'Ellie Harper', when: '9 Oct', text: 'Thanks Priya. I was away for some of that fortnight, but I’ll check my cards and add anything I find this weekend.' }
    ],
    lk: [
      { id: 'pm-1', from: 'them', who: 'Ruwan Jayasinghe', when: '7 Oct', text: 'Good morning Ayesha. The September VAT and SSCL return is due on 20 Oct. Could you confirm the Galle Fort Boutique Hotel cheque has cleared, and upload the September electricity bill?' },
      { id: 'pm-2', from: 'me', who: 'Ayesha Fernando', when: '8 Oct', text: 'Will do, Ruwan. The cheque went in on Monday; I’ll confirm once it shows on the statement.' }
    ]
  }), BE.perCountry({ uk: [], lk: [] }));

  // Practitioners on TaxWise.lk a direct user can invite (illustrative).
  BE.LK_PRACTITIONERS = [
    { id: 'perera', name: 'Perera Associates', contact: 'Sanjeewa Perera', email: 'sanjeewa@pereraassociates.lk', city: 'Nugegoda', note: 'Small businesses and payroll' },
    { id: 'siva', name: 'K. Sivakumar & Co', contact: 'K. Sivakumar', email: 'office@sivakumarco.lk', city: 'Colombo 06', note: 'VAT, SSCL and retail clients' },
    { id: 'amara', name: 'Amarasekara Tax Consultants', contact: 'Dilhani Amarasekara', email: 'dilhani@amarasekaratax.lk', city: 'Kandy', note: 'Sole proprietors and partnerships' }
  ];

  // ---- Requests: owned by data-home.js (status 'open' | 'done', dir 'in' | 'out'). Fallback only if nobody defined it. --
  if (BE.get('requests') === undefined) {
    BE.define('requests', BE.perCountry({
      uk: [
        { id: 'req-2', dir: 'in', from: 'Priya Shaw', kind: 'upload', status: 'open', created: '9 Oct', period: 'q2', title: 'Upload the September letting agent statement', body: 'For Flat 2, 18 Ash Grove.', href: 'Properties.dc.html', cta: 'Open the flat' },
        { id: 'req-1', dir: 'in', from: 'Priya Shaw', kind: 'gap', status: 'open', created: '8 Oct', period: 'q2', title: 'Add records for 12–25 September', body: 'Nothing is recorded for these two weeks.', href: 'ThreeOut.dc.html#expense', cta: 'Add an expense' }
      ],
      lk: [
        { id: 'req-2', dir: 'in', from: 'Ruwan Jayasinghe', kind: 'confirm', status: 'open', created: '9 Oct', period: '2026-09', title: 'Confirm the September cheque from Galle Fort Boutique Hotel', body: 'Has their cheque cleared?', href: 'SellCustomers.dc.html', cta: 'See their invoices' },
        { id: 'req-1', dir: 'in', from: 'Ruwan Jayasinghe', kind: 'upload', status: 'open', created: '8 Oct', period: '2026-09', title: 'Upload the electricity bill for September', body: 'Ceylon Electricity Board, about Rs 48,000.', href: 'SpendBill.dc.html', cta: 'Open bills' }
      ]
    }), []);
  }

  // ---- Dates -------------------------------------------------------------
  /** A Date from '2026-09-12', '12 Sep', '12 Sep 2026', 'Sep 12' or an item with iso/date. Earlier years are guessed from today (11 Oct 2026). */
  BE.dateOf = function (v) {
    if (!v) return null;
    if (typeof v === 'object' && !(v instanceof Date)) v = v.iso || v.date || v.paidOn || v.issued || '';
    if (v instanceof Date) return v;
    var s = String(v).trim(), m;
    if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return new Date(+m[1], +m[2] - 1, +m[3]);
    var dm = s.match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?(?:\s+(\d{4}))?/);
    var md = s.match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?/);
    var day, mon, yr;
    if (dm && MON.indexOf(dm[2].slice(0, 1).toUpperCase() + dm[2].slice(1, 3).toLowerCase()) >= 0) { day = +dm[1]; mon = dm[2]; yr = dm[3]; }
    else if (md) { mon = md[1]; day = +md[2]; yr = md[3]; }
    else return null;
    var mi = MON.indexOf(mon.slice(0, 1).toUpperCase() + mon.slice(1, 3).toLowerCase());
    if (mi < 0) return null;
    var y = yr ? +yr : (mi > 9 ? 2025 : 2026);
    return new Date(y, mi, day);
  };
  BE.isoOf = function (d) { return d ? iso(d.getFullYear(), d.getMonth() + 1, d.getDate()) : ''; };
  BE.dayLabel = function (d) { return d ? d.getDate() + ' ' + MON[d.getMonth()] : ''; };

  /** The UK tax-year quarter ('q1'..'q4') a date falls in, '' outside 2026/27. */
  BE.ukQuarterOf = function (v) {
    var d = BE.dateOf(v);
    if (!d) return '';
    var t = d.getTime();
    var b = [new Date(2026, 3, 6), new Date(2026, 6, 6), new Date(2026, 9, 6), new Date(2027, 0, 6), new Date(2027, 3, 6)];
    for (var i = 0; i < 4; i++) if (t >= b[i].getTime() && t < b[i + 1].getTime()) return 'q' + (i + 1);
    return '';
  };
  /** 'YYYY-MM' for a date (Sri Lanka VAT/SSCL periods are months). */
  BE.monthOf = function (v) { var d = BE.dateOf(v); return d ? BE.isoOf(d).slice(0, 7) : ''; };
  function inPeriod(v, periodId) {
    if (!periodId) { var d = BE.dateOf(v); return !!d && d.getTime() >= new Date(2026, 3, 6).getTime(); }
    return /^q\d$/.test(periodId) ? BE.ukQuarterOf(v) === periodId : BE.monthOf(v) === periodId;
  }

  // ---- Filed periods (locked in your books) -----------------------------
  BE.filedInfo = function (id) { var p = BE.get('practice') || {}; return (p.filed || {})[id] || null; };
  BE.isFiled = function (id) { return !!BE.filedInfo(id); };
  /** The accountant marks a quarter ('q2') or a VAT/SSCL period ('2026-09') filed; it locks in the books. */
  BE.markFiled = function (id, label) {
    var prof = BE.get('profile') || {};
    var by = (prof.practice && (prof.practice.contact || prof.practice.name)) || 'Your accountant';
    BE.change(function (s) {
      var p = Object.assign({}, s.practice || {});
      p.filed = Object.assign({}, p.filed || {});
      p.filed[id] = { on: BE.today, by: by };
      s.practice = p;
      BE._log(s, by + ' filed ' + (label || id) + ' · now locked in your books');
      BE._notify(s, (label || id) + ' has been filed', 'By ' + by + '. Entries in it are locked; ask them if something needs to change.', BE.is('uk') ? 'Quarters.dc.html' : 'TaxPeriods.dc.html');
    });
  };
  BE.reopenPeriod = function (id, label) {
    BE.change(function (s) {
      var p = Object.assign({}, s.practice || {});
      p.filed = Object.assign({}, p.filed || {});
      delete p.filed[id];
      s.practice = p;
      BE._log(s, (label || id) + ' reopened by your accountant');
    });
  };

  // ---- Properties --------------------------------------------------------
  function propCats() { return ((window.COUNTRY || {}).uk || {}).propertyCategories || []; }
  /**
   * Property totals for a quarter ('q2'), or the tax year so far (no argument).
   * Amounts are your share. finance = residential mortgage interest, kept out of costs:
   * it earns a 20% tax reduction instead of being deducted.
   */
  /**
   * Every property line in one list: rent and income from propertyEntries, plus costs entered in
   * Going out (expenses with a property) shown in the same shape, with expenseId set.
   */
  BE.propertyLedger = function () {
    var fromOut = BE.all('expenses').filter(function (x) { return x.property; }).map(function (x) {
      return { id: 'exp-' + x.id, expenseId: x.id, prop: x.property, kind: 'cost', cat: x.catId || 'p-other', what: x.who + (x.note ? ' · ' + x.note : ''),
        amount: Number(x.amount) || 0, iso: x.iso, date: x.date, isNew: x.isNew };
    });
    return BE.all('propertyEntries').concat(fromOut).sort(function (a, b) { return a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : 0; });
  };

  BE.propertyTotals = function (quarterId) {
    var props = BE.all('properties');
    var share = {};
    props.forEach(function (p) { share[p.id] = (Number(p.share) || 100) / 100; });
    var byCat = {};
    var income = 0, costs = 0, finance = 0, count = 0;
    BE.propertyLedger().forEach(function (e) {
      if (!(e.prop in share) || !inPeriod(e.iso || e.date, quarterId)) return;
      var a = (Number(e.amount) || 0) * share[e.prop];
      count++;
      if (e.kind === 'income') { income += a; return; }
      if (e.cat === 'p-finance') finance += a; else costs += a;
      byCat[e.cat] = (byCat[e.cat] || 0) + a;
    });
    var r2 = function (x) { return Math.round(x * 100) / 100; };
    var cats = propCats().map(function (c) { return { id: c.id, name: c.name, official: c.official, amount: r2(byCat[c.id] || 0) }; }).filter(function (c) { return c.amount; });
    var allowance = ((window.COUNTRY || {}).uk || {}).propertyAllowance || 1000;
    var useAllowance = !!(BE.get('landlord') || {}).useAllowance;
    return {
      income: r2(income), costs: r2(costs), finance: r2(finance), byCat: cats, count: count,
      profit: r2(income - (useAllowance ? Math.min(allowance, income) : costs)),
      financeRelief: useAllowance ? 0 : Math.round(finance * 0.2),
      allowance: allowance, useAllowance: useAllowance,
      allowanceBetter: income > 0 && costs < allowance
    };
  };

  /** Tick a month's rent as received ('2026-10'). */
  BE.markRent = function (propId, month) {
    var p = BE.find('properties', propId);
    if (!p) return null;
    var y = +month.slice(0, 4), m = +month.slice(5, 7);
    var due = new Date(y, m - 1, Number(p.rentDay) || 1);
    var d = due.getTime() > BE.todayDate.getTime() ? BE.todayDate : due;
    var dIso = BE.isoOf(d);
    BE.change(function (s) {
      var list = (s.propertyEntries || []).slice();
      list.unshift({ id: BE.id('pe'), prop: p.id, kind: 'income', cat: 'rent', what: 'Rent for ' + MON[m - 1] + ' ' + y, amount: Number(p.rent) || 0, iso: dIso, date: BE.dayLabel(d), rentMonth: month, isNew: true });
      // The agent's fee is a monthly cost recorded in Going out, so it isn't added here.
      s.propertyEntries = list.sort(function (a, b) { return a.iso < b.iso ? 1 : -1; });
      BE._log(s, 'Rent for ' + MON[m - 1] + ' received · ' + p.name);
    });
    return true;
  };
  BE.unmarkRent = function (propId, month) {
    BE.change(function (s) {
      s.propertyEntries = (s.propertyEntries || []).filter(function (e) { return !(e.prop === propId && e.rentMonth === month); });
    });
  };

  // ---- Mileage -----------------------------------------------------------
  /** Each trip's claim at the pack's rates: 45p a mile for the first 10,000 business miles of the tax year, then 25p. */
  BE.tripClaims = function () {
    var r = ((window.COUNTRY || {}).uk || {}).mileage || { first: 10000, rate1: 0.45, rate2: 0.25 };
    var list = BE.all('trips').slice().sort(function (a, b) { return a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0; });
    var run = 0, out = {};
    list.forEach(function (t) {
      var mi = Number(t.miles) || 0;
      var at1 = Math.max(0, Math.min(mi, r.first - run));
      var amt = Math.round((at1 * r.rate1 + (mi - at1) * r.rate2) * 100) / 100;
      run += mi;
      out[t.id] = { amount: amt, running: run, rate: at1 === mi ? r.rate1 : at1 === 0 ? r.rate2 : null };
    });
    return out;
  };
  /** Mileage for a quarter ('q3') or the tax year so far (no argument). Adds to "Car, van and travel". */
  BE.mileageTotals = function (quarterId) {
    var claims = BE.tripClaims();
    var miles = 0, amount = 0, trips = 0, all = 0;
    BE.all('trips').forEach(function (t) {
      all += Number(t.miles) || 0;
      if (!inPeriod(t.iso || t.date, quarterId)) return;
      miles += Number(t.miles) || 0; amount += (claims[t.id] || {}).amount || 0; trips++;
    });
    var r = ((window.COUNTRY || {}).uk || {}).mileage || { first: 10000 };
    return { miles: miles, amount: Math.round(amount * 100) / 100, trips: trips, yearMiles: all, toBand: Math.max(0, r.first - all), category: 'travel' };
  };

  // ---- What the accountant sees for this business ------------------------
  function catFor(c, cats) {
    var s = String(c || '').toLowerCase();
    if (!s) return null;
    for (var i = 0; i < cats.length; i++) {
      var k = cats[i];
      if (k.id === c || k.name.toLowerCase() === s || String(k.official).toLowerCase() === s) return k;
    }
    return null;
  }
  /**
   * Totals by category for one period of the current business: a UK quarter ('q2')
   * or a Sri Lanka month ('2026-09'). Uses BE.quarterSummary / BE.taxPeriodSummary when the
   * Quarters / TaxPeriods screens provide them, otherwise adds up the entries.
   */
  BE.clientSummary = function (periodId) {
    var pack = BE.pack();
    var cats = pack.categories || [];
    var uk = BE.is('uk');
    var sum = function (list, f) { return list.reduce(function (a, x) { return a + (Number(f(x)) || 0); }, 0); };
    var payments = BE.all('payments').filter(function (p) { return inPeriod(p.date || p.paidOn, periodId); });
    var expenses = BE.all('expenses').filter(function (x) { return x.kind !== 'personal' && x.kind !== 'transfer' && inPeriod(x.iso || x.date, periodId); });
    var byCat = {}, unsorted = 0;
    expenses.forEach(function (x) {
      var k = catFor(x.cat, cats);
      if (!k) { unsorted++; k = { id: 'unsorted', name: 'Not sorted yet', official: 'Needs a category' }; }
      if (!byCat[k.id]) byCat[k.id] = { id: k.id, name: k.name, official: k.official, amount: 0 };
      byCat[k.id].amount += Number(x.amount) || 0;
    });
    var out = { periodId: periodId, lines: [], checks: [] };
    if (uk) {
      var miles = BE.mileageTotals(periodId);
      if (miles.amount) {
        var t = cats.filter(function (c) { return c.id === 'travel'; })[0] || { id: 'travel', name: 'Car, van and travel', official: 'Car, van and travel expenses' };
        if (!byCat.travel) byCat.travel = { id: 'travel', name: t.name, official: t.official, amount: 0 };
        byCat.travel.amount += miles.amount;
        byCat.travel.note = 'includes ' + miles.miles + ' miles';
      }
      out.income = Math.round(sum(payments, function (p) { return p.amount; }) * 100) / 100;
      out.property = BE.all('properties').length ? BE.propertyTotals(periodId) : null;
    } else {
      var invs = BE.all('invoices').filter(function (i) { return !i.draft && !i.void && inPeriod(i.issued, periodId); });
      var sub = sum(invs, function (i) { return BE.invSubtotal(i); });
      var prof = BE.get('profile') || {};
      var sscl = prof.ssclRegistered ? sum(invs, function (i) { return i.sscl != null ? i.sscl : BE.invSubtotal(i) * (pack.sscl || 0); }) : 0;
      var vat = prof.vatRegistered ? sum(invs, function (i) { return i.vat != null ? i.vat : (i.tax || 0); }) : 0;
      var inputVat = sum(BE.all('bills').filter(function (b) { return inPeriod(b.entered || b.date, periodId); }), function (b) { return b.vat || b.inputVat || 0; });
      out.income = Math.round(sub * 100) / 100;
      out.vat = { sales: Math.round(sub), output: Math.round(vat), sscl: Math.round(sscl), input: Math.round(inputVat), net: Math.round(vat - inputVat), registered: !!prof.vatRegistered };
    }
    out.expenses = Object.keys(byCat).map(function (k) { var c = byCat[k]; c.amount = Math.round(c.amount * 100) / 100; return c; }).sort(function (a, b) { return b.amount - a.amount; });
    out.totalExpenses = Math.round(sum(out.expenses, function (c) { return c.amount; }) * 100) / 100;
    out.unsorted = unsorted;
    out.count = payments.length + expenses.length;
    // Prefer the owning screens' figures when they exist.
    try {
      if (uk && typeof BE.quarterSummary === 'function') {
        var q = BE.quarterSummary(periodId) || {};
        if (q.income != null) out.income = q.income;
        if (q.uncategorised != null) out.unsorted = q.uncategorised;
        if (typeof q.expenses === 'number') out.officialExpenses = q.expenses;
      }
      if (!uk && typeof BE.taxPeriodSummary === 'function') {
        var pt = BE.taxPeriodSummary(periodId) || {};
        if (typeof pt.vat === 'number') out.vat.net = pt.vat;
        if (typeof pt.sscl === 'number') out.vat.sscl = pt.sscl;
        if (typeof pt.total === 'number') out.vat.total = pt.total;
        if (typeof pt.output === 'number') out.vat.output = pt.output;
        if (typeof pt.input === 'number') out.vat.input = pt.input;
        if (typeof pt.sales === 'number') out.vat.sales = pt.sales;
      }
    } catch (e) { /* fall back to our own sums */ }
    return out;
  };
})();
