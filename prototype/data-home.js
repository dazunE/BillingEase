/* Home: recent activity, notifications, requests from your accountant or tax practitioner,
   and the helpers Home uses to work out what needs you and the period card
   (shared by ThreeHome, ThreeMobile, Ask, the Accountant screen and AppCrumbs). */
(function () {
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ---- Recent activity: a plain list of what happened, newest first ---------------------
  BE.define('activity', BE.perCountry({
    uk: [
      { id: 'act-1', t: 'You recorded £54 to Adobe under Phone, internet and office', when: 'Today' },
      { id: 'act-2', t: 'Dale & Shaw asked for the September letting agent statement', when: '9 Oct' },
      { id: 'act-3', t: 'Dale & Shaw asked for records for 12–25 September', when: '8 Oct' },
      { id: 'act-4', t: 'Moor & Dale Outdoor paid £1,800 by bank transfer', when: '7 Oct' },
      { id: 'act-5', t: 'Q2 closed (6 Jul – 5 Oct). Dale & Shaw file it by 7 Nov', when: '6 Oct' },
      { id: 'act-6', t: 'You logged a 46-mile return trip to Harrogate for Moor & Dale Outdoor', when: '2 Oct' },
      { id: 'act-7', t: 'Rent for Flat 2, 18 Ash Grove recorded · £1,050', when: '1 Oct' },
      { id: 'act-8', t: 'September pay for Tom Whitaker recorded from Dale & Shaw’s payroll software', when: '30 Sep' }
    ],
    lk: [
      { id: 'act-1', t: 'You recorded Lanka Agri Exports (Pvt) Ltd’s bank transfer · Rs 708,000', when: 'Today' },
      { id: 'act-2', t: 'Ruwan Jayasinghe asked you to confirm the Galle Fort Boutique Hotel cheque', when: '9 Oct' },
      { id: 'act-3', t: 'Ruwan Jayasinghe asked for the September electricity bill', when: '8 Oct' },
      { id: 'act-4', t: 'You sent a tax invoice to Hill Country Tea Estates', when: '6 Oct' },
      { id: 'act-5', t: 'Office rent for October recorded · Rs 350,000', when: '1 Oct' },
      { id: 'act-6', t: 'September payroll paid to 5 people', when: '30 Sep' },
      { id: 'act-7', t: 'Jayasinghe & Co filed the August VAT and SSCL return', when: '18 Sep' }
    ]
  }));

  BE.define('notifications', BE.perCountry({
    uk: [
      { id: 'ntf-1', title: 'Priya Shaw sent you a request', body: 'Upload the September letting agent statement', href: 'Accountant.dc.html', when: '9 Oct', read: false },
      { id: 'ntf-2', title: 'Priya Shaw sent you a request', body: 'Add records for 12–25 September', href: 'Accountant.dc.html', when: '8 Oct', read: false },
      { id: 'ntf-3', title: 'Q2 has closed', body: '6 Jul – 5 Oct · Dale & Shaw file it by 7 Nov', href: 'Quarters.dc.html', when: '6 Oct', read: false },
      { id: 'ntf-4', title: 'Moor & Dale Outdoor paid £1,800', body: 'Recorded as a bank transfer', href: 'SellInvoices.dc.html', when: '7 Oct', read: true },
      { id: 'ntf-5', title: 'PAYE for September is due 22 Oct', body: 'Tom Whitaker · pay HMRC from your bank; Dale & Shaw’s payroll software reports it', href: 'SpendPayroll.dc.html', when: '5 Oct', read: true },
      { id: 'ntf-6', title: 'Boiler repair at Flat 2 recorded', body: '£340 under Repairs · 18 Ash Grove, Headingley', href: 'Properties.dc.html', when: '22 Sep', read: true }
    ],
    lk: [
      { id: 'ntf-1', title: 'Ruwan Jayasinghe sent you a request', body: 'Confirm the September cheque from Galle Fort Boutique Hotel', href: 'Accountant.dc.html', when: '9 Oct', read: false },
      { id: 'ntf-2', title: 'September VAT and SSCL return is due 20 Oct', body: 'Jayasinghe & Co enter it on the IRD return once September is complete', href: 'TaxPeriods.dc.html', when: '8 Oct', read: false },
      { id: 'ntf-3', title: 'Ruwan Jayasinghe sent you a request', body: 'Upload the electricity bill for September', href: 'Accountant.dc.html', when: '8 Oct', read: false },
      { id: 'ntf-4', title: 'October payroll is ready to run', body: '5 people · run it by 31 Oct', href: 'SpendPayroll.dc.html', when: '5 Oct', read: true },
      { id: 'ntf-5', title: 'Lanka Agri Exports (Pvt) Ltd paid Rs 708,000', body: 'Recorded as a bank transfer', href: 'SellInvoices.dc.html', when: 'Today', read: true },
      { id: 'ntf-6', title: 'August VAT and SSCL return filed', body: 'Filed by Jayasinghe & Co on 18 Sep · the period is locked', href: 'TaxPeriods.dc.html', when: '18 Sep', read: true }
    ]
  }));

  // ---- Requests between you and your accountant / tax practitioner ----------------------
  // dir: 'in' (they ask you; shows in Needs you on Home) or 'out' (you asked them, e.g. from Ask).
  // status: 'open' | 'done'. kind: 'gap' (missing records), 'upload', 'confirm', 'question'.
  // href / cta: where you do it. who: a customer or supplier it's about. period: 'q2', '2026-09'...
  // The Accountant screen reads and writes this too (BE.completeRequest, BE.reopenRequest, BE.askPractitioner).
  // Older readers use done / asked / detail; seeds carry both spellings.
  function R(o) { return Object.assign({ done: o.status === 'done', asked: o.created, detail: o.body }, o); }
  BE.define('requests', BE.perCountry({
    uk: [
      R({ id: 'req-2', dir: 'in', from: 'Priya Shaw', kind: 'upload', status: 'open', created: '9 Oct', period: 'q2',
        title: 'Upload the September letting agent statement',
        body: 'For Flat 2, 18 Ash Grove. Attach the PDF to September’s rent so we can check the 10% fee and the boiler repair.',
        href: 'Properties.dc.html', cta: 'Open the flat' }),
      R({ id: 'req-1', dir: 'in', from: 'Priya Shaw', kind: 'gap', status: 'open', created: '8 Oct', period: 'q2', gap: '12–25 Sep',
        title: 'Add records for 12–25 September',
        body: 'Nothing is recorded for these two weeks. Add any income and expenses, or mark it done if there were none, so we can send Q2.',
        href: 'ThreeOut.dc.html#expense', cta: 'Add an expense' }),
      R({ id: 'req-0', dir: 'in', from: 'Priya Shaw', kind: 'upload', status: 'done', created: '14 Jul', doneOn: '16 Jul', period: 'q1',
        title: 'Send the laptop receipt', body: 'For the capital allowance in Q1.', href: 'ThreeOut.dc.html', cta: 'Going out' })
    ],
    lk: [
      R({ id: 'req-2', dir: 'in', from: 'Ruwan Jayasinghe', kind: 'confirm', status: 'open', created: '9 Oct', period: '2026-09', who: 'Galle Fort Boutique Hotel',
        title: 'Confirm the September cheque from Galle Fort Boutique Hotel',
        body: 'Has their cheque cleared? Record the cheque number and date on the payment so the September return is right.',
        href: 'SellCustomers.dc.html', cta: 'See their invoices' }),
      R({ id: 'req-1', dir: 'in', from: 'Ruwan Jayasinghe', kind: 'upload', status: 'open', created: '8 Oct', period: '2026-09',
        title: 'Upload the electricity bill for September',
        body: 'Ceylon Electricity Board, about Rs 48,000. Attach the PDF to the bill so September can be closed.',
        href: 'SpendBill.dc.html', cta: 'Open bills' }),
      R({ id: 'req-0', dir: 'in', from: 'Ruwan Jayasinghe', kind: 'question', status: 'done', created: '12 Sep', doneOn: '13 Sep', period: '2026-08',
        title: 'Which bank account did the August rent come from?', body: 'Commercial Bank current account', href: 'ThreeOut.dc.html', cta: 'Going out' })
    ]
  }), []);

  var ICON = {
    late: 'M12 8v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    request: 'M4 5h16v11H8l-4 4zM8 9h8M8 12h5',
    upload: 'M12 16V4M7 9l5-5 5 5M4 16v4h16v-4',
    gap: 'M4 5h16v15H4zM4 10h16M9 3v4M15 3v4M9 15h6',
    bill: 'M3 6h18v12H3zM3 10h18M7 15h3',
    deadline: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    payroll: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.8'
  };
  function first(name) { return String(name || '').split(/\s+/)[0]; }
  /** Monthly pay for an employee: basic plus fixed allowances. */
  function pay(e) { return (Number(e.basic || e.salary || e.monthly || 0) || 0) + (e.allowances || []).reduce(function (a, x) { return a + (Number(x.amount) || 0); }, 0); }
  BE.empMonthly = pay;
  /** A request is done when status is 'done' (or the older done: true). */
  function reqDone(r) { return r.status === 'done' || r.done === true; }
  BE.requestDone = reqDone;

  // ---- dates ("7 Nov 2026", "20 Oct") -----------------------------------------------------
  /** A day-first date like "7 Nov 2026" (or "7 Nov", this year) as a Date. */
  BE.parseDay = function (s) {
    var m = String(s || '').match(/(\d{1,2})\s+([A-Z][a-z]{2})[a-z]*\s*(\d{4})?/);
    if (!m) return null;
    var mi = MON.indexOf(m[2]);
    if (mi < 0) return null;
    return new Date(m[3] ? +m[3] : 2026, mi, +m[1]);
  };
  /** Days from today (Sun 11 Oct 2026) to a day-first date; negative if it has passed. */
  BE.daysUntil = function (s) {
    var d = BE.parseDay(s);
    return d ? Math.round((d - BE.todayDate) / 86400000) : null;
  };
  BE.inWords = function (days) {
    if (days == null) return '';
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    if (days < 0) return (-days) + ' day' + (days === -1 ? '' : 's') + ' ago';
    return 'in ' + days + ' days';
  };

  // ---- the practice / practitioner --------------------------------------------------------
  /** Your accountant (UK) or tax practitioner (Sri Lanka), from the profile. */
  BE.practice = function () {
    var p = (BE.get('profile') || {}).practice || null;
    var pk = BE.pack().practitioner || { noun: 'accountant', tool: '' };
    var name = p && p.name ? p.name : '';
    var short = name.replace(/,?\s*(Chartered\s+)?Accountants?$/i, '');
    return { has: !!name, name: name, short: short || ('your ' + pk.noun), contact: (p && p.contact) || '', first: first(p && p.contact), email: (p && p.email) || '', noun: pk.noun, tool: pk.tool };
  };

  BE.requestsOpen = function (dir) {
    return BE.all('requests').filter(function (r) { return !reqDone(r) && (!dir || (r.dir || 'in') === dir); });
  };
  /** Mark a request done. Optional note goes back to the practice with it. */
  BE.completeRequest = function (id, note) {
    var r = BE.find('requests', id);
    if (!r) return null;
    BE.change(function (s) {
      s.requests = (s.requests || []).map(function (x) { return x.id === id ? Object.assign({}, x, { status: 'done', done: true, doneOn: BE.today, doneNote: note || '' }) : x; });
      BE._log(s, 'You marked “' + r.title + '” done · ' + BE.practice().short + ' can see it');
    });
    return r;
  };
  BE.reopenRequest = function (id) {
    var r = BE.find('requests', id);
    if (!r) return null;
    BE.change(function (s) {
      s.requests = (s.requests || []).map(function (x) { return x.id === id ? Object.assign({}, x, { status: 'open', done: false, doneOn: '', doneNote: '' }) : x; });
      s.activity = (s.activity || []).filter(function (a) { return !(a.when === 'Just now' && a.t.indexOf('“' + r.title + '” done') >= 0); });
    });
    return r;
  };
  /** Send a question to your accountant or practitioner (from Ask or Help). Returns the request. */
  BE.askPractitioner = function (question, context) {
    var pr = BE.practice();
    var me = (BE.get('profile') || {}).owner || 'You';
    var r = { id: BE.id('req'), dir: 'out', from: me, to: pr.contact || pr.short, kind: 'question', status: 'open', done: false, created: BE.today, asked: BE.today,
      title: String(question || '').trim(), body: context || '', detail: context || '', href: 'Accountant.dc.html', cta: 'Your ' + pr.noun };
    BE.change(function (s) {
      s.requests = [r].concat(s.requests || []);
      BE._log(s, 'You asked ' + pr.short + ': “' + r.title + '”');
    });
    return r;
  };

  // ---- periods and the tax estimate ------------------------------------------------------
  /** The period Home and the numbers strip open on: UK this quarter, Sri Lanka this month. */
  BE.homePeriod = function () { return BE.is('lk') ? 'month' : 'quarter'; };
  /** The period switch on Home, per country. */
  BE.homePeriods = function () {
    return BE.is('lk') ? [['month', 'This month'], ['year', 'This year of assessment']] : [['quarter', 'This quarter'], ['year', 'This tax year']];
  };
  /** Short words for a period: 'Q3 so far', 'October', '2026/27 so far'. */
  BE.periodWords = function (period) {
    var pk = BE.pack();
    if (period === 'year') return (pk.taxYear ? pk.taxYear.label : '') + ' so far';
    if (period === 'quarter') { var q = (pk.quarters || []).filter(function (x) { return x.id === pk.currentQuarter; })[0]; return (q ? q.label : 'This quarter') + ' so far'; }
    return 'October';
  };
  function monthsIntoYear() {
    var ty = BE.pack().taxYear;
    var start = ty ? BE.parseDay(ty.start) : null;
    if (!start) return 6;
    return Math.max(1, (BE.todayDate - start) / 86400000 / 30.4375);
  }
  /**
   * BE.totals(period) with "Yours to keep" after the country's estimated tax: Income Tax and
   * Class 4 NI in the UK, income tax in Sri Lanka (BE.pack().estimate). The year's profit so far
   * is scaled to a full year (or this month's pace, if higher) to find the rate, and that rate
   * applies to the period's profit.
   */
  BE.keepTotals = function (period) {
    period = period || BE.homePeriod();
    var t = BE.totals(period);
    var y = period === 'year' ? t : BE.totals('year');
    var pk = BE.pack();
    // A full year's profit: the year so far scaled up, or this month's pace if that's higher.
    var annual = Math.max(0, y.profit * 12 / monthsIntoYear(), BE.totals('month').profit * 12);
    var est = typeof pk.estimate === 'function' ? pk.estimate(annual) : { total: Math.round(annual * (t.rate || 0.25)), lines: [], paymentsOnAccount: [], label: 'Tax' };
    var rate = annual > 0 ? est.total / annual : 0;
    var tax = Math.round(Math.max(t.profit, 0) * rate);
    var keep = Math.round(t.profit - tax);
    var cur = t.currency;
    var W = function (n) { return BE.money(n, cur, { whole: true }); };
    var pct = function (a, b) { return b > 0 ? Math.max(a > 0 ? 2 : 0, Math.min(100, Math.round(a / b * 100))) : 0; };
    return Object.assign({}, t, {
      tax: tax, keep: keep, rate: rate, taxLabel: est.label || 'Tax', estimate: est, annualProfit: Math.round(annual),
      keepPct: pct(keep, t.profit), words: BE.periodWords(period),
      fmt: Object.assign({}, t.fmt, { tax: W(tax), keep: W(keep) })
    });
  };

  /**
   * The quarter card on UK Home. Uses BE.quarterSummary(id) when the Quarters screen's data
   * provides it ({ income, expenses, uncategorised, status }); otherwise the sample's Q2 figures.
   */
  BE.homeQuarter = function () {
    var pk = BE.pack();
    var qs = pk.quarters || [];
    var last = qs.filter(function (q) { return q.id === pk.lastQuarter; })[0] || qs[1] || {};
    var cur = qs.filter(function (q) { return q.id === pk.currentQuarter; })[0] || qs[2] || {};
    var empty = BE.isEmpty();
    var sum = {};
    try {
      if (typeof BE.quarterSummary === 'function') sum = BE.quarterSummary(last.id) || {};
      else if (typeof BE.quarterTotals === 'function') sum = BE.quarterTotals(last.id) || {};
      else if (typeof BE.clientSummary === 'function') { var cs = BE.clientSummary(last.id) || {}; sum = { income: cs.income, expenses: cs.totalExpenses }; }
    } catch (e) { sum = {}; }
    var income = sum.income != null ? sum.income : (empty ? 0 : 17800);
    var expenses = sum.expenses != null ? sum.expenses : sum.totalExpenses != null ? sum.totalExpenses : (empty ? 0 : 3895);
    var uncat = sum.uncategorised != null ? sum.uncategorised : BE.all('expenses').filter(function (x) {
      return x.kind !== 'personal' && x.kind !== 'transfer' && (x.needsCat || x.uncategorised || !x.cat || /^(uncategori[sz]ed|needs a category)$/i.test(x.cat));
    }).length;
    var gapReq = BE.all('requests').filter(function (r) { return r.kind === 'gap' && r.period === last.id; })[0];
    var gapOpen = !!(gapReq && !reqDone(gapReq));
    var filed = sum.status === 'sent' || sum.status === 'filed' || (typeof BE.isFiled === 'function' && BE.isFiled(last.id));
    var checks = [];
    if (!empty) {
      checks.push(uncat ? { ok: false, text: uncat + ' item' + (uncat === 1 ? ' needs' : 's need') + ' a category', href: 'ThreeOut.dc.html', cta: 'Sort' }
        : { ok: true, text: 'Everything has an HMRC category' });
      checks.push(gapOpen ? { ok: false, text: 'No records for ' + (gapReq.gap || 'part of the quarter'), href: gapReq.href || 'ThreeOut.dc.html#expense', cta: 'Add' }
        : { ok: true, text: 'No gaps in your records' });
      checks.push({ ok: true, text: 'Income matches your invoices' });
    }
    var left = checks.filter(function (c) { return !c.ok; }).length;
    return {
      last: last, cur: cur, income: income, expenses: expenses, profit: Math.round((income - expenses) * 100) / 100,
      checks: checks, left: left, ready: !empty && left === 0, filed: filed, empty: empty,
      dueDays: BE.daysUntil(last.due)
    };
  };

  /** Invoices and bills dated in a month ('Sep'), counted from the data. */
  function inMonthName(list, key, mon) {
    return list.filter(function (x) { var d = String(x[key] || ''); return d.indexOf(mon) >= 0 && !x.draft && !x.void; });
  }
  /**
   * The "This month" card on Sri Lanka Home: the VAT and SSCL return that's due, and this
   * month's payroll. Uses BE.taxPeriodSummary(id) ({ vat, sscl, total }) when TaxPeriods provides it.
   */
  BE.homeMonth = function () {
    var pk = BE.pack();
    var per = (pk.periods || []).filter(function (p) { return p.status === 'due'; })[0] || (pk.periods || [])[1] || {};
    var mon = String(per.label || '').slice(0, 3);
    var sum = {};
    try {
      if (typeof BE.taxPeriodSummary === 'function') sum = BE.taxPeriodSummary(per.id) || {};
      else if (typeof BE.clientSummary === 'function') { var v = (BE.clientSummary(per.id) || {}).vat; if (v && v.registered) sum = { vat: v.net, sscl: v.sscl, output: v.output, input: v.input }; }
    } catch (e) { sum = {}; }
    var invs = inMonthName(BE.all('invoices'), 'issued', mon).length;
    var bills = inMonthName(BE.all('bills'), 'date', mon).length;
    var runs = BE.all('payroll').filter(function (r) { return r.kind !== 'due'; });
    var run = runs.filter(function (r) { return r.status !== 'paid' && (r.inMonth || /Oct/.test(r.label || r.date || '')); })[0] || null;
    var paidRun = runs.filter(function (r) { return r.status === 'paid' && (r.inMonth || /October/.test(r.label || '')); })[0] || null;
    var emps = BE.all('employees');
    var gross = emps.reduce(function (a, e) { return a + pay(e); }, 0);
    return {
      period: per, dueDays: BE.daysUntil(per.due), sum: sum, invoices: invs, bills: bills,
      filed: sum.status === 'filed' || (typeof BE.isFiled === 'function' ? BE.isFiled(per.id) : per.status === 'filed'),
      run: run, paidRun: paidRun, people: run && run.people && run.people.length ? run.people.length : emps.length,
      net: run ? run.net : 0, gross: run ? (run.gross || gross) : gross, payDue: '31 Oct', payDays: BE.daysUntil('31 Oct 2026'),
      hasPayroll: !!(run || paidRun || emps.length)
    };
  };

  // ---- Needs you ---------------------------------------------------------------------------
  /** Late invoices that are still open (oldest first). */
  BE.lateInvoices = function () {
    return BE.all('invoices').filter(function (i) { return BE.invStatus(i) === 'late'; })
      .sort(function (a, b) { return a.dueIn - b.dueIn; });
  };
  function remindedToday(inv) {
    return (inv.events || []).some(function (e) { return /^(Friendly nudge|Reminder sent)/.test(e.label) && e.date === BE.today; });
  }
  /** Send a personal reminder about a late invoice (email; email and WhatsApp in Sri Lanka). */
  BE.nudgeInvoice = function (num) {
    var inv = BE.find('invoices', num, 'num');
    if (!inv) return null;
    var cust = BE.find('customers', inv.who, 'name');
    var to = (cust && cust.contact) ? first(cust.contact) + ' at ' + inv.who : inv.who;
    var by = BE.is('lk') ? 'email and WhatsApp' : 'email';
    BE.change(function (s) {
      s.invoices = s.invoices.map(function (x) {
        if (x.num !== num) return x;
        return Object.assign({}, x, { nudged: BE.today, events: (x.events || []).concat([{ label: 'Reminder sent by ' + by, date: BE.today, todo: false }]) });
      });
      BE._log(s, 'You sent ' + to + ' a reminder about ' + num + ' by ' + by + ' · ' + BE.money(BE.invOpen(inv), inv.cur));
    });
    return { inv: inv, to: to, by: by };
  };

  // Approving payroll (BE.approvePayroll / BE.unapprovePayroll) lives in data-payroll.js.

  /** Payroll amounts due to HMRC, the IRD or the EPF/ETF funds, grouped by due date (from data-payroll.js). */
  function duesByDate(within) {
    if (typeof BE.payDues !== 'function') return [];
    var groups = {};
    BE.payDues().forEach(function (d) {
      var paidToday = d.status === 'paid' && d.paidOn === BE.today;
      if (d.status === 'paid' && !paidToday) return;
      var days = d.dueIn != null ? d.dueIn : BE.daysUntil(d.due + ' 2026');
      if (!paidToday && (days == null || days > within)) return;
      var g = groups[d.due] || (groups[d.due] = { due: d.due, days: days, ids: [], open: [], names: [], month: '', amount: 0, payTo: [] });
      g.ids.push(d.id);
      if (!paidToday) g.open.push(d.id);
      g.amount += Number(d.amount) || 0;
      var m = String(d.label || '').replace(/\s*\(.*\)\s*/, '').match(/^(.*) for (\w+)/);
      g.names.push(m ? m[1] : d.label); g.month = m ? m[2] : g.month;
      var to = /^Pension provider$/i.test(d.payTo || '') ? 'your pension provider' : d.payTo;
      if (g.payTo.indexOf(to) < 0) g.payTo.push(to);
    });
    return Object.keys(groups).map(function (k) {
      var g = groups[k];
      var names = g.names.map(function (n, i) { return i ? n.replace(/^([A-Z])([a-z])/, function (x, a, b2) { return a.toLowerCase() + b2; }) : n; });
      g.label = names.join(names.some(function (n) { return / and /.test(n); }) ? ' plus ' : ' and ') + (g.month ? ' for ' + g.month : '');
      g.done = g.open.length === 0;
      return g;
    });
  }

  /** Deadlines coming up that aren't already on the period card, with an amount where we know it. */
  BE.homeDeadlines = function (within) {
    within = within == null ? 40 : within;
    var pk = BE.pack();
    var out = [];
    var dues = duesByDate(within);
    dues.forEach(function (g) {
      out.push({ kind: 'dues', label: g.label, due: g.due, days: g.days, ids: g.open, done: g.done, href: 'SpendPayroll.dc.html', cta: 'Open payroll',
        body: BE.money(g.amount, null, { whole: true }) + ' to ' + g.payTo.join(' and ') + '. Pay it from your bank, then mark it paid here.' });
    });
    var list = (pk.deadlines || []).slice();
    if (!dues.length && typeof BE.payDues !== 'function' && BE.is('uk') && BE.all('employees').length) list.push({ label: 'PAYE for September', due: '22 Oct 2026', kind: 'paye' });
    var kt = null;
    list.forEach(function (d) {
      if (/Q\d update|VAT and SSCL return/.test(d.label)) return; // on the period card
      if (typeof BE.payDues === 'function' && /APIT|EPF|ETF|PAYE/.test(d.label)) return; // from the payroll dues above
      var days = BE.daysUntil(d.due);
      if (days == null || days < 0 || days > within) return;
      var o = { kind: 'date', label: d.label, due: d.due.replace(/ 2026$/, ''), days: days, href: 'ThreeKeep.dc.html', cta: 'See the estimate', body: '' };
      if (/instalment/i.test(d.label)) {
        kt = kt || BE.keepTotals('year');
        var poa = ((kt.estimate || {}).paymentsOnAccount || []).filter(function (p) { return p.due === d.due; })[0];
        o.body = (poa && poa.amount ? 'About ' + BE.money(poa.amount, null, { whole: true }) + ' from this year’s estimate. ' : '') + 'Pay it to the Inland Revenue Department; ' + BE.practice().short + ' can confirm the amount.';
      } else if (/APIT/.test(d.label)) {
        var ap = pk.payroll && pk.payroll.apit;
        var tot = ap ? BE.all('employees').reduce(function (a, e) { return a + ap(pay(e)); }, 0) : 0;
        o.body = (tot ? 'About ' + BE.money(tot, null, { whole: true }) + ' withheld from salaries. ' : '') + 'Pay it to the IRD by the 15th; the schedule is on Payroll.';
        o.href = 'SpendPayroll.dc.html'; o.cta = 'Open payroll';
      } else if (/EPF/.test(d.label)) {
        o.body = 'Pay EPF and ETF through the EPF and ETF channels. The schedules are on Payroll.';
        o.href = 'SpendPayroll.dc.html'; o.cta = 'Open payroll';
      } else if (d.kind === 'paye') {
        o.body = 'Pay HMRC from your bank. Your payroll records show what’s due; your payroll software reports it.';
        o.href = 'SpendPayroll.dc.html'; o.cta = 'Payroll records';
      } else {
        o.body = 'From your estimate on Yours to keep.';
      }
      out.push(o);
    });
    return out.sort(function (a, b) { return a.days - b.days; });
  };

  /**
   * What needs you on Home, worked out from the data. Each item:
   * { id, kind: 'request'|'late'|'bill'|'deadline', done, icon, tint, title, body, cta, alt, altHref, href, doneText }
   * kind 'request' → BE.completeRequest(reqId); 'late' → BE.nudgeInvoice(num); 'bill' → BE.payBill(billId);
   * 'dues' → BE.payHomeDues(dueIds) (payroll amounts to HMRC / IRD / EPF / ETF); 'deadline' is a link only.
   */
  BE.homeNeeds = function () {
    var out = [];
    var pr = BE.practice();
    BE.all('requests').forEach(function (r) {
      if ((r.dir || 'in') !== 'in') return;
      if (reqDone(r) && r.doneOn !== BE.today) return;
      var href = r.href || 'Accountant.dc.html';
      if (r.who) { var c = BE.find('customers', r.who, 'name'); if (c) href = 'SellCustomer.dc.html#' + c.id; }
      out.push({
        id: 'req-' + r.id, kind: 'request', reqId: r.id, done: reqDone(r),
        icon: r.kind === 'upload' ? ICON.upload : r.kind === 'gap' ? ICON.gap : ICON.request, tint: '#EEE8FF',
        title: r.title, body: (r.from ? r.from + (pr.short ? ' at ' + pr.short : '') + ': ' : '') + (r.body || r.detail || ''),
        badge: 'From ' + pr.short, cta: 'Mark done', ctaShort: 'Done', alt: r.cta || 'Open', altHref: href,
        doneText: '“' + r.title + '” is done. ' + pr.short + ' can see it.'
      });
    });
    BE.lateInvoices().forEach(function (inv) {
      var days = -inv.dueIn;
      var cust = BE.find('customers', inv.who, 'name');
      var who = cust && cust.contact ? first(cust.contact) + ' at ' + inv.who : inv.who;
      out.push({
        id: 'late-' + inv.num, kind: 'late', num: inv.num, done: remindedToday(inv), icon: ICON.late, tint: '#FBE3DF',
        title: inv.who + ' is ' + days + ' day' + (days === 1 ? '' : 's') + ' late',
        body: BE.money(BE.invOpen(inv), inv.cur) + ' for ' + (inv.what || inv.num) + ' (' + inv.num + '). A short personal reminder is often all it takes.',
        cta: 'Send a reminder', ctaShort: 'Remind', alt: 'See invoice', altHref: 'SellInvoices.dc.html#' + inv.num,
        doneText: 'Reminder sent to ' + who + ' about ' + inv.num + ' today'
      });
    });
    var left = function (b) { return typeof BE.billLeft === 'function' ? BE.billLeft(b) : (b.amount - (b.paid || 0)); };
    BE.all('bills').forEach(function (b) {
      var paidToday = b.status === 'paid' && b.paidOn === BE.today;
      if (!paidToday && (b.status === 'paid' || left(b) <= 0 || b.dueIn == null || b.dueIn > 7)) return;
      var when = b.dueIn < 0 ? (-b.dueIn) + ' day' + (b.dueIn === -1 ? '' : 's') + ' overdue' : b.dueIn === 0 ? 'due today' : 'due ' + b.due;
      out.push({
        id: 'bill-' + b.id, kind: 'bill', billId: b.id, done: paidToday, icon: ICON.bill, tint: '#FDE6D6',
        title: 'Bill from ' + b.who + ' ' + when,
        body: BE.money(left(b)) + (b.what ? ' for ' + b.what : '') + '. Pay it from your bank, then mark it paid here.',
        cta: 'Mark paid', ctaShort: 'Mark paid', alt: 'See bill', altHref: 'SpendBill.dc.html#' + b.id,
        doneText: 'Bill from ' + b.who + ' marked paid today'
      });
    });
    BE.homeDeadlines().forEach(function (d, i) {
      var when = d.days < 0 ? (-d.days) + ' day' + (d.days === -1 ? '' : 's') + ' overdue' : 'due ' + BE.inWords(d.days);
      if (d.kind === 'dues') {
        out.push({
          id: 'dues-' + d.due, kind: 'dues', dueIds: d.ids, done: d.done, icon: ICON.payroll, tint: '#FFF0B8',
          title: d.label + ' · due ' + d.due, body: d.body + ' It’s ' + when + '.',
          cta: 'Mark paid', ctaShort: 'Mark paid', alt: d.cta, altHref: d.href,
          doneText: d.label + ' marked paid today'
        });
        return;
      }
      out.push({
        id: 'dl-' + i, kind: 'deadline', done: false, icon: ICON.deadline, tint: '#FFF0B8',
        title: d.label + ' · due ' + d.due, body: d.body + ' Due ' + BE.inWords(d.days) + '.',
        cta: d.cta, ctaShort: d.cta, href: d.href, alt: false, altHref: ''
      });
    });
    return out;
  };

  /** Mark payroll dues paid (EPF, ETF, APIT or PAYE). Returns the total. */
  BE.payHomeDues = function (ids) {
    var total = 0;
    (ids || []).forEach(function (id) { var d = BE.find('payroll', id); if (d && typeof BE.payPayrollDue === 'function' && BE.payPayrollDue(id, 'Bank transfer')) total += Number(d.amount) || 0; });
    return total;
  };

  /** The "Get started" checklist for a brand new business, ticked from the data. */
  BE.homeChecklist = function () {
    var p = BE.get('profile') || {};
    var lk = BE.is('lk');
    var pr = BE.practice();
    var items = [
      lk ? { id: 'tin', label: 'Add your TIN and business details', hint: 'They go on every tax invoice', href: 'BizProfile.dc.html', done: !!p.tin }
         : { id: 'utr', label: 'Add your UTR and business details', hint: 'Your accountant needs them for MTD', href: 'BizProfile.dc.html', done: !!p.utr },
      { id: 'cust', label: 'Add a customer', hint: 'Who you work for and how to reach them', href: 'SellCustomers.dc.html', done: BE.all('customers').length > 0 },
      { id: 'inv', label: lk && p.vatRegistered ? 'Send your first tax invoice' : 'Send your first invoice', hint: 'One sentence is enough; it adds to Coming in', href: 'ThreeIn.dc.html#bill', done: BE.all('invoices').some(function (i) { return !i.draft; }) },
      { id: 'exp', label: 'Record an expense', hint: lk ? 'Something you already paid for, in the right category' : 'Something you already paid for, in an HMRC category', href: 'ThreeOut.dc.html#expense', done: BE.all('expenses').length > 0 || BE.all('bills').length > 0 }
    ];
    if (!lk && (p.kind === 'both' || p.kind === 'landlord')) items.push({ id: 'prop', label: 'Add your property', hint: 'Rent and costs kept apart from your trade', href: 'Properties.dc.html', done: BE.all('properties').length > 0 });
    if (lk) items.push({ id: 'emp', label: 'Add your employees', hint: 'Skip it if it’s just you. EPF, ETF and APIT are worked out for you', href: 'SpendPayroll.dc.html', done: BE.all('employees').length > 0 });
    items.push({ id: 'acct', label: lk ? 'Link your tax practitioner' : 'Link your accountant', hint: lk ? 'Or link your TaxWise.lk account' : 'They see your quarters and send you requests', href: 'Accountant.dc.html', done: pr.has });
    var done = items.filter(function (i) { return i.done; }).length;
    return { items: items, done: done, total: items.length, all: done === items.length };
  };

  /** Kept for older screens: there are no bank feeds, so this is whether a statement was checked. */
  BE.bankConnected = function () {
    var b = BE.get('bank');
    return !!(b && (b.done || (Array.isArray(b.lines) && b.lines.length)));
  };
})();
