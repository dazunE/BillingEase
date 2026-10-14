/* Payroll, per country. Screens: SpendPayroll, Payslip (also read by Home, Going out and the books).
 *
 * UK (records only): the practice's payroll software runs payroll and reports to HMRC (RTI). Here you
 * keep the records: each pay run is entered from the software's summary (or a CSV), its net pay and the
 * HMRC and pension amounts post to the books, and PAYE is due on the 22nd.
 * Sri Lanka (full calculation, no e-filing): BillingEase works out earnings, EPF 8% + 12%, ETF 3%, APIT
 * from the pack's tables and net pay; approving a run posts the EPF, ETF and APIT owed; you pay and file
 * them yourself from the schedules.
 *
 * The `payroll` collection holds two kinds of item, runs first:
 *   kind 'run': { id, label, month, date (pay day), status: 'needs' | 'entered' | 'approved' | 'paid', inMonth, net, gross, people: [...] }
 *   kind 'due': money owed because of a run (HMRC, pension, EPF, ETF, APIT): { id, run, what, label, payTo, due, status: 'due' | 'paid', inMonth, net }
 * BE.totals() counts every unpaid item's `net` with inMonth as Going out "still to pay".
 * inMonth follows the business's basis: cash (UK) counts what is paid or due in October; accrual (Sri Lanka)
 * counts the cost in the month of the run.
 */
(function () {
  var r2 = function (n) { return Math.round((Number(n) || 0) * 100) / 100; };
  var MON = BE.MON;
  var FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var KEYS = ['', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  var pk = function (c) { return ((window.COUNTRY || {})[c] || {}).payroll || {}; };

  function lastWorkingDay(y, m) { // m: 1-12
    var d = new Date(y, m, 0);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
    return d;
  }
  var label = function (d) { return d.getDate() + ' ' + MON[d.getMonth()]; };
  var dayName = function (d) { return DOW[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()]; };
  var daysFromToday = function (d) { return Math.round((d - BE.todayDate) / 86400000); };

  // ---- Sri Lanka: the calculation --------------------------------------------------------

  /** One person's month: earnings, EPF/ETF on EPF-liable earnings, APIT from the pack, net pay. */
  function lkPay(e, ot) {
    var P = pk('lk');
    ot = r2(ot || 0);
    var allow = (e.allowances || []).reduce(function (a, x) { return a + (Number(x.amount) || 0); }, 0);
    var epfAllow = (e.allowances || []).reduce(function (a, x) { return a + (x.epf === false ? 0 : (Number(x.amount) || 0)); }, 0);
    var basic = Number(e.basic) || 0;
    var epfBase = basic + epfAllow + (P.overtimeInEpf ? ot : 0);
    var gross = r2(basic + allow + ot);
    var epfEe = r2(epfBase * (P.epfEmployee || 0.08));
    var epfEr = r2(epfBase * (P.epfEmployer || 0.12));
    var etf = r2(epfBase * (P.etf || 0.03));
    var apit = typeof P.apit === 'function' ? P.apit(gross) : 0;
    return { id: e.id, name: e.name, job: e.job || '', basic: basic, allow: r2(allow), ot: ot, gross: gross, epfBase: r2(epfBase), epfEe: epfEe, epfEr: epfEr, etf: etf, apit: apit, net: r2(gross - epfEe - apit) };
  }

  function sumRun(run) {
    var add = function (k) { return r2((run.people || []).reduce(function (a, p) { return a + (Number(p[k]) || 0); }, 0)); };
    var o = { gross: add('gross'), epfBase: add('epfBase'), epfEe: add('epfEe'), epfEr: add('epfEr'), etf: add('etf'), apit: add('apit'), net: add('net'), ot: add('ot') };
    o.taxes = r2(o.epfEe + o.apit);
    o.employer = r2(o.epfEr + o.etf);
    o.cost = r2(o.gross + o.employer);
    return Object.assign({}, run, o);
  }

  /** A Sri Lanka run for month m (1-12) of 2026, from the employees given. */
  function lkRun(m, emps, opts) {
    opts = opts || {};
    var pay = lastWorkingDay(2026, m);
    var people = emps.map(function (e) { return lkPay(e, (opts.ot || {})[e.id] || 0); });
    return sumRun({
      id: KEYS[m] + '26', kind: 'run', country: 'lk', m: m, label: FULL[m - 1] + ' 2026 payroll', month: FULL[m - 1] + ' 2026', mon: MON[m - 1],
      date: label(pay), day: dayName(pay), period: '1–' + new Date(2026, m, 0).getDate() + ' ' + MON[m - 1], runBy: new Date(2026, m, 0).getDate() + ' ' + MON[m - 1],
      status: opts.status || 'needs', paidOn: opts.status === 'paid' ? label(pay) : '', approvedOn: opts.status === 'paid' ? label(new Date(2026, m - 1, pay.getDate() - 2)) : '',
      inMonth: m === 10, duesPaid: !!opts.duesPaid, people: people
    });
  }

  /** What a Sri Lanka run owes once approved: EPF (8% + 12%), ETF 3%, APIT. */
  function lkDues(run, status) {
    var P = pk('lk');
    var m = run.m || (MON.indexOf(run.mon) + 1);
    var apitDue = new Date(2026, m, P.apitDueDay || 15);
    var epfDue = lastWorkingDay(2026, m + 1);
    var name = FULL[m - 1];
    var mk = function (what, lbl, amt, d, payTo) {
      return { id: run.id + '-' + what, kind: 'due', country: 'lk', run: run.id, what: what, label: lbl, payTo: payTo, amount: amt, net: amt, due: label(d), date: label(d), dueIn: daysFromToday(d), status: status || 'due', inMonth: !!run.inMonth };
    };
    return [
      mk('apit', 'APIT for ' + name, run.apit, apitDue, (P.payTo || {}).apit || 'Inland Revenue Department'),
      mk('epf', 'EPF for ' + name + ' (8% + 12%)', r2(run.epfEe + run.epfEr), epfDue, (P.payTo || {}).epf || 'EPF'),
      mk('etf', 'ETF for ' + name + ' (3%)', run.etf, epfDue, (P.payTo || {}).etf || 'ETF Board')
    ].filter(function (d) { return d.amount > 0; });
  }

  // ---- UK: the "check the figures" calculator (a sense check only) ----------------------

  function codeAllowance(code) {
    var m = String(code || '').toUpperCase().match(/^(\d+)L$/);
    var c = pk('uk').check || {};
    return m ? Number(m[1]) * 10 + 9 : (c.personalAllowance || 12570);
  }
  /** Rough monthly PAYE, NI and pension for a gross amount. Not a payroll calculation. */
  function ukCheck(gross, code, pensionOn) {
    var c = pk('uk').check || {};
    gross = Number(gross) || 0;
    var pa = String(code || '').toUpperCase() === 'BR' ? 0 : codeAllowance(code || c.taxCode) / 12;
    var taxable = Math.max(0, gross - pa);
    var band = (c.basicBand || 37700) / 12;
    var paye = r2(Math.min(taxable, band) * (c.basicRate || 0.2) + Math.max(0, taxable - band) * (c.higherRate || 0.4));
    var pt = (c.eeNIThreshold || 12570) / 12, uel = (c.eeNIUpper || 50270) / 12;
    var eeNI = r2(Math.max(0, Math.min(gross, uel) - pt) * (c.eeNIRate || 0.08) + Math.max(0, gross - uel) * (c.eeNIUpperRate || 0.02));
    var erNI = r2(Math.max(0, gross - (c.erNIThreshold || 5000) / 12) * (c.erNIRate || 0.15));
    var qe = pensionOn === false ? 0 : Math.max(0, Math.min(gross, (c.pensionUpper || 50270) / 12) - (c.pensionLower || 6240) / 12);
    var pension = r2(qe * (c.pensionEe || 0.05)), erPension = r2(qe * (c.pensionEr || 0.03));
    return { gross: r2(gross), paye: paye, eeNI: eeNI, erNI: erNI, pension: pension, erPension: erPension, net: r2(gross - paye - eeNI - pension), hmrc: r2(paye + eeNI + erNI) };
  }

  function ukSum(run) {
    var add = function (k) { return r2((run.people || []).reduce(function (a, p) { return a + (Number(p[k]) || 0); }, 0)); };
    var o = { gross: add('gross'), paye: add('paye'), eeNI: add('eeNI'), erNI: add('erNI'), pension: add('pension'), erPension: add('erPension'), net: add('net') };
    o.hmrc = r2(o.paye + o.eeNI + o.erNI);
    o.pensionTotal = r2(o.pension + o.erPension);
    o.taxes = r2(o.paye + o.eeNI);
    o.cost = r2(o.gross + o.erNI + o.erPension);
    return Object.assign({}, run, o);
  }

  /** UK tax month for a pay date and the 22nd it's due to HMRC by. */
  function ukTaxMonth(d) {
    var y = d.getFullYear(), m = d.getMonth();
    var end = d.getDate() >= 6 ? new Date(y, m + 1, 5) : new Date(y, m, 5);
    var start = new Date(end.getFullYear(), end.getMonth() - 1, 6);
    var n = ((start.getMonth() - 3 + 12) % 12) + 1; // tax month 1 starts 6 April
    var due = new Date(end.getFullYear(), end.getMonth(), pk('uk').payeDueDay || 22);
    return { n: n, label: 'Tax month ' + n + ' (' + label(start) + '–' + label(end) + ')', due: due };
  }

  function ukRun(id, d, people, opts) {
    opts = opts || {};
    var tm = ukTaxMonth(d);
    return ukSum({
      id: id, kind: 'run', country: 'uk', label: FULL[d.getMonth()] + ' ' + d.getFullYear() + ' pay run', month: FULL[d.getMonth()] + ' ' + d.getFullYear(), mon: MON[d.getMonth()],
      date: label(d), day: dayName(d), year: d.getFullYear(), taxMonth: tm.label, hmrcDue: label(tm.due), period: tm.label,
      status: opts.status || 'entered', paidOn: opts.status === 'paid' ? label(d) : '', inMonth: d.getMonth() === 9 && d.getFullYear() === 2026,
      source: opts.source || 'Entered from the payroll software summary', duesPaid: !!opts.duesPaid, people: people
    });
  }
  function ukDues(run, status) {
    var tm = ukTaxMonth(new Date(run.year || 2026, MON.indexOf(run.mon), Number(String(run.date).split(' ')[0])));
    var inMonth = tm.due.getMonth() === 9 && tm.due.getFullYear() === 2026; // cash basis: counts when it's paid
    var out = [{ id: run.id + '-hmrc', kind: 'due', country: 'uk', run: run.id, what: 'hmrc', label: 'PAYE and NI for ' + run.month.split(' ')[0], payTo: 'HMRC', amount: run.hmrc, net: run.hmrc, due: label(tm.due), date: label(tm.due), dueIn: daysFromToday(tm.due), status: status || 'due', inMonth: inMonth }];
    if (run.pensionTotal > 0) out.push({ id: run.id + '-pension', kind: 'due', country: 'uk', run: run.id, what: 'pension', label: 'Workplace pension for ' + run.month.split(' ')[0], payTo: 'Pension provider', amount: run.pensionTotal, net: run.pensionTotal, due: label(tm.due), date: label(tm.due), dueIn: daysFromToday(tm.due), status: status || 'due', inMonth: inMonth });
    return out.filter(function (x) { return x.amount > 0; });
  }

  // ---- the sample people and runs ---------------------------------------------------------

  var LK_EMPS = [
    { id: 'kasun', name: 'Kasun Perera', job: 'Senior designer', email: 'kasun@serendibstudio.lk', nic: '199012304567', epfNo: '1042', start: '1 Feb 2021', basic: 320000,
      allowances: [{ name: 'Transport allowance', amount: 20000 }], bank: { name: 'Commercial Bank', branch: 'Kollupitiya', acct: '8001 2245 7781' } },
    { id: 'dilini', name: 'Dilini Wickramasinghe', job: 'Designer', email: 'dilini@serendibstudio.lk', nic: '199556701234', epfNo: '1057', start: '15 Jun 2022', basic: 185000,
      allowances: [{ name: 'Transport allowance', amount: 10000 }], bank: { name: 'Sampath Bank', branch: 'Bambalapitiya', acct: '1029 5730 0418' } },
    { id: 'rizwan', name: 'Mohamed Rizwan', job: 'Designer', email: 'rizwan@serendibstudio.lk', nic: '199731209876', epfNo: '1063', start: '1 Mar 2023', basic: 165000,
      allowances: [{ name: 'Transport allowance', amount: 10000 }], bank: { name: 'Hatton National Bank', branch: 'Wellawatte', acct: '0410 2066 5512' } },
    { id: 'tharushi', name: 'Tharushi Silva', job: 'Office administrator', email: 'tharushi@serendibstudio.lk', nic: '200061204321', epfNo: '1071', start: '2 Jan 2024', basic: 95000,
      allowances: [{ name: 'Meal allowance', amount: 7500 }], bank: { name: 'Bank of Ceylon', branch: 'Kollupitiya', acct: '7731 0094 26' } },
    { id: 'nuwan', name: 'Nuwan Bandara', job: 'Driver', email: '', nic: '852341567V', epfNo: '1029', start: '1 Aug 2019', basic: 85000,
      allowances: [], bank: { name: "People's Bank", branch: 'Borella', acct: '1840 0127 5563' } }
  ];
  var NUWAN_OT = { 4: 6200, 5: 8400, 6: 5100, 7: 7600, 8: 9800, 9: 7800, 10: 9500 };
  var lkRuns = [];
  for (var m = 10; m >= 4; m--) lkRuns.push(lkRun(m, LK_EMPS, { status: m === 10 ? 'needs' : 'paid', ot: { nuwan: NUWAN_OT[m] }, duesPaid: m < 9 }));
  var lkSample = lkRuns.slice(0, 1).concat(lkRuns.slice(1));
  // September's EPF, ETF and APIT were posted when it was approved and are still to pay (October run is waiting).
  lkSample = lkSample.concat(lkDues(lkRuns[1], 'due'));

  var UK_EMPS = [
    { id: 'tom', name: 'Tom Whitaker', job: 'Design assistant (part-time)', email: 'tom.whitaker@example.co.uk', niNo: 'QQ •• •• 56 C', taxCode: '1257L', start: '3 Mar 2025', freq: 'Monthly', payDay: 'Last working day', pension: true }
  ];
  var TOM_GROSS = { 4: 1120, 5: 1120, 6: 1155, 7: 1120, 8: 1085, 9: 1120 };
  var ukRuns = [];
  for (var u = 9; u >= 4; u--) {
    var c = ukCheck(TOM_GROSS[u], '1257L', true);
    ukRuns.push(ukRun(KEYS[u] + '26', lastWorkingDay(2026, u), [Object.assign({ id: 'tom', name: 'Tom Whitaker' }, c)], { status: 'paid', duesPaid: u < 9 }));
  }
  var ukSample = ukRuns.concat(ukDues(ukRuns[0], 'due'));

  BE.define('employees', BE.perCountry({ uk: UK_EMPS, lk: LK_EMPS }), BE.perCountry({ uk: [], lk: [] }));
  BE.define('payroll', BE.perCountry({ uk: ukSample, lk: lkSample }), BE.perCountry({ uk: [], lk: [] }));
  // Employer references used on the schedules and payslips.
  BE.define('payrollSettings', BE.perCountry({
    uk: { payeRef: '120/HS48211', accountsRef: '120PX00482113', runBy: 'Dale & Shaw Accountants', pensionProvider: 'Workplace pension scheme' },
    lk: { epfReg: 'C/45821', etfReg: 'C/45821', payBank: 'Commercial Bank, Kollupitiya', payAcct: '1004 5521 8830' }
  }), BE.perCountry({
    uk: { payeRef: '', accountsRef: '', runBy: '', pensionProvider: '' },
    lk: { epfReg: '', etfReg: '', payBank: '', payAcct: '' }
  }));

  // ---- reading -----------------------------------------------------------------------------

  BE.payRuns = function () { return BE.all('payroll').filter(function (r) { return r.kind !== 'due'; }); };
  BE.payDues = function (runId) { return BE.all('payroll').filter(function (r) { return r.kind === 'due' && (!runId || r.run === runId); }); };
  BE.lkPay = lkPay;
  BE.ukCheck = ukCheck;
  BE.ukTaxMonth = ukTaxMonth;
  BE.staffCategory = function () {
    var c = (BE.pack().categories || []).filter(function (x) { return x.id === 'staff'; })[0];
    return c ? c.name : 'Staff costs';
  };

  /** Sri Lanka year of assessment so far (from 1 April): totals per employee for TaxWise.lk. */
  BE.payrollYtd = function (opts) {
    var rows = {};
    BE.payRuns().forEach(function (r) {
      if (r.country !== 'lk') return;
      if (!(opts && opts.drafts) && (r.status === 'needs')) return;
      (r.people || []).forEach(function (p) {
        var x = rows[p.id] || (rows[p.id] = { id: p.id, name: p.name, gross: 0, epfEe: 0, epfEr: 0, etf: 0, apit: 0, net: 0, months: 0 });
        ['gross', 'epfEe', 'epfEr', 'etf', 'apit', 'net'].forEach(function (k) { x[k] = r2(x[k] + (Number(p[k]) || 0)); });
        x.months++;
      });
    });
    return Object.keys(rows).map(function (k) { return rows[k]; });
  };

  /** One payslip: `<run>-<employee>`. */
  BE.payslip = function (key) {
    var i = String(key || '').indexOf('-');
    if (i < 0) return null;
    var run = BE.find('payroll', key.slice(0, i));
    if (!run || run.kind === 'due') return null;
    var p = (run.people || []).filter(function (x) { return x.id === key.slice(i + 1); })[0];
    if (!p) return null;
    var e = BE.find('employees', p.id) || {};
    var ytd = { gross: 0, apit: 0, epfEe: 0 };
    var runs = BE.payRuns().filter(function (r) { return r.country === run.country; });
    var at = runs.indexOf(run);
    runs.slice(at).forEach(function (r) {
      if (r !== run && r.status === 'needs') return;
      (r.people || []).forEach(function (q) { if (q.id === p.id) { ytd.gross += q.gross; ytd.apit += q.apit || 0; ytd.epfEe += q.epfEe || 0; } });
    });
    return { run: run, person: p, emp: e, ytd: { gross: r2(ytd.gross), apit: r2(ytd.apit), epfEe: r2(ytd.epfEe) } };
  };

  // ---- writing -----------------------------------------------------------------------------

  function putFirst(s, items) {
    var ids = items.map(function (x) { return x.id; });
    var rest = (s.payroll || []).filter(function (x) { return ids.indexOf(x.id) < 0; });
    var runs = items.filter(function (x) { return x.kind !== 'due'; }).concat(rest.filter(function (x) { return x.kind !== 'due'; }));
    var dues = items.filter(function (x) { return x.kind === 'due'; }).concat(rest.filter(function (x) { return x.kind === 'due'; }));
    // Newest run first; the money owed follows the runs.
    runs.sort(function (a, b) { return (b.year || 2026) * 100 + (MON.indexOf(b.mon)) - ((a.year || 2026) * 100 + MON.indexOf(a.mon)); });
    s.payroll = runs.concat(dues);
  }

  /** Approve a run. In Sri Lanka this posts the EPF, ETF and APIT it owes. Keeps Home's approve working too. */
  var homeApprove = BE.approvePayroll;
  BE.approvePayroll = function (id) {
    var run = BE.find('payroll', id);
    if (!run || run.kind === 'due') return null;
    if (homeApprove) homeApprove(id);
    else BE.update('payroll', id, { status: 'approved', approvedOn: BE.today });
    if (run.country === 'lk') {
      var fresh = BE.find('payroll', id);
      BE.change(function (s) {
        putFirst(s, lkDues(fresh, 'due'));
        s.payroll = s.payroll.map(function (r) { return r.id === id ? Object.assign({}, r, { status: 'approved', approvedOn: BE.today, posted: true }) : r; });
        BE._log(s, 'Posted ' + fresh.month + ' payroll to the books · EPF ' + BE.money(r2(fresh.epfEe + fresh.epfEr)) + ', ETF ' + BE.money(fresh.etf) + ', APIT ' + BE.money(fresh.apit) + ' owed');
      });
    }
    return BE.find('payroll', id);
  };
  var homeUnapprove = BE.unapprovePayroll;
  BE.unapprovePayroll = function (id) {
    var run = BE.find('payroll', id);
    if (!run) return null;
    if (homeUnapprove) homeUnapprove(id);
    BE.change(function (s) {
      s.payroll = (s.payroll || []).filter(function (r) { return !(r.kind === 'due' && r.run === id && r.status !== 'paid'); })
        .map(function (r) { return r.id === id ? Object.assign({}, r, { status: 'needs', approvedOn: '', posted: false }) : r; });
    });
    return BE.find('payroll', id);
  };

  /** Net pay sent: the run moves from still to pay to paid, as a staff-costs expense. */
  BE.payPayroll = function (id, how) {
    var run = BE.find('payroll', id);
    if (!run || run.status === 'paid' || run.kind === 'due') return null;
    var uk = run.country === 'uk';
    var who = uk ? (run.people.length === 1 ? run.people[0].name : 'Staff net pay') : 'Salaries · ' + run.month;
    var x = BE.addExpense({ who: who, cat: BE.staffCategory(), how: how || 'Bank transfer', amount: run.net, inMonth: !!run.inMonth, receipt: false,
      note: (uk ? 'Net pay for ' + run.month + ' (from the payroll software)' : run.people.length + ' people · net pay for ' + run.month) });
    BE.change(function (s) {
      s.expenses = s.expenses.map(function (e) { return e.id === x.id ? Object.assign({}, e, { payroll: id }) : e; });
      s.payroll = s.payroll.map(function (r) {
        if (r.id !== id) return r;
        return Object.assign({}, r, { status: 'paid', paidOn: BE.today, expense: x.id, approvedOn: r.approvedOn || BE.today });
      });
      if (!uk && !run.posted && !BE.payDues(id).length) putFirst(s, lkDues(run, 'due'));
    });
    return x;
  };

  /** Pay something a run owes (HMRC, pension, EPF, ETF, APIT). */
  BE.payPayrollDue = function (id, how) {
    var d = BE.find('payroll', id);
    if (!d || d.kind !== 'due' || d.status === 'paid') return null;
    var x = BE.addExpense({ who: d.payTo, cat: BE.staffCategory(), how: how || 'Bank transfer', amount: d.amount, inMonth: !!d.inMonth, receipt: false, note: d.label });
    BE.change(function (s) {
      s.expenses = s.expenses.map(function (e) { return e.id === x.id ? Object.assign({}, e, { payroll: d.run }) : e; });
      s.payroll = s.payroll.map(function (r) { return r.id === id ? Object.assign({}, r, { status: 'paid', paidOn: BE.today, expense: x.id }) : r; });
    });
    return x;
  };

  /** Sri Lanka: work out a month's run from the people on payroll. */
  BE.startLkRun = function (m) {
    var emps = BE.all('employees');
    if (!emps.length) return null;
    var run = lkRun(m, emps, { status: 'needs' });
    run.year = 2026;
    if (BE.find('payroll', run.id)) return BE.find('payroll', run.id);
    BE.change(function (s) {
      putFirst(s, [run]);
      BE._log(s, 'Worked out ' + run.month + ' payroll · ' + BE.money(run.net) + ' net pay for ' + run.people.length + (run.people.length === 1 ? ' person' : ' people'));
    });
    return run;
  };
  /** Sri Lanka: change one person's overtime on a run that isn't approved yet. */
  BE.setOvertime = function (runId, empId, amount) {
    var run = BE.find('payroll', runId);
    if (!run || run.status !== 'needs') return null;
    var people = run.people.map(function (p) {
      if (p.id !== empId) return p;
      var e = BE.find('employees', p.id) || { id: p.id, name: p.name, basic: p.basic, allowances: [{ name: 'Allowances', amount: p.allow }] };
      return lkPay(e, Math.max(0, Number(amount) || 0));
    });
    return BE.update('payroll', runId, sumRun(Object.assign({}, run, { people: people })));
  };
  /** Sri Lanka: add someone who joined to a run that isn't approved yet. */
  BE.addToRun = function (runId, emp) {
    var run = BE.find('payroll', runId);
    if (!run || run.status !== 'needs') return null;
    return BE.update('payroll', runId, sumRun(Object.assign({}, run, { people: run.people.concat([lkPay(emp, 0)]) })));
  };

  /**
   * UK: record a pay run from the payroll software's summary.
   * o: { date: Date, people: [{ id, name, gross, paye, eeNI, erNI, pension, erPension, net }], source }
   * Net pay already sent (pay day today or earlier) posts as paid; HMRC and pension post as owed by the 22nd.
   */
  BE.addUkPayRun = function (o) {
    var d = o.date;
    var id = KEYS[d.getMonth() + 1] + String(d.getFullYear()).slice(2);
    if (BE.find('payroll', id)) id = id + '-' + BE.id('r').split('-')[1];
    var sent = d <= BE.todayDate;
    var run = ukRun(id, d, o.people.map(function (p) { return Object.assign({}, p); }), { status: 'entered', source: o.source });
    run.year = d.getFullYear();
    BE.change(function (s) {
      putFirst(s, [run].concat(ukDues(run, 'due')));
      BE._log(s, 'Recorded the ' + run.month + ' pay run · ' + BE.money(run.gross) + ' gross, ' + BE.money(run.hmrc) + ' to HMRC by ' + run.hmrcDue);
    });
    if (sent) BE.payPayroll(id);
    return BE.find('payroll', id);
  };
  /** UK: remove a pay run record you entered by mistake, with what it owes (not what's paid). */
  BE.removePayRun = function (id) {
    var run = BE.find('payroll', id);
    if (!run) return null;
    BE.change(function (s) {
      var exp = (s.payroll || []).filter(function (r) { return (r.id === id || r.run === id) && r.expense; }).map(function (r) { return r.expense; });
      s.payroll = (s.payroll || []).filter(function (r) { return r.id !== id && r.run !== id; });
      s.expenses = (s.expenses || []).filter(function (e) { return exp.indexOf(e.id) < 0; });
      BE._log(s, 'Removed the ' + (run.month || run.label) + ' pay run record');
    });
    return run;
  };

  /** Sri Lanka schedules for a run, ready to show and copy as CSV. */
  BE.payrollSchedules = function (runId) {
    var run = BE.find('payroll', runId);
    if (!run) return null;
    var st = BE.get('payrollSettings') || {};
    var prof = BE.get('profile') || {};
    var emp = function (id) { return BE.find('employees', id) || {}; };
    var n = function (x) { return (Number(x) || 0).toFixed(2); };
    var ytd = {};
    BE.payrollYtd({ drafts: true }).forEach(function (y) { ytd[y.id] = y; });
    var P = pk('lk');
    var dues = lkDues(run);
    var dueOf = function (w) { var d = dues.filter(function (x) { return x.what === w; })[0]; return d ? d.due : ''; };
    return {
      epf: {
        title: 'EPF contributions (C form style)', due: dueOf('epf'), payTo: (P.payTo || {}).epf,
        head: 'Employer EPF no ' + (st.epfReg || 'not added') + ' · ' + run.month,
        cols: ['Name', 'NIC', 'Member no', 'Total earnings', 'Employer 12%', 'Employee 8%', 'Total'],
        rows: run.people.map(function (p) { var e = emp(p.id); return [p.name, e.nic || '', e.epfNo || '', n(p.epfBase), n(p.epfEr), n(p.epfEe), n(p.epfEr + p.epfEe)]; }),
        total: ['Total', '', '', n(run.epfBase), n(run.epfEr), n(run.epfEe), n(run.epfEr + run.epfEe)]
      },
      etf: {
        title: 'ETF contributions', due: dueOf('etf'), payTo: (P.payTo || {}).etf,
        head: 'Employer ETF no ' + (st.etfReg || 'not added') + ' · ' + run.month,
        cols: ['Name', 'NIC', 'Member no', 'Total earnings', 'ETF 3%'],
        rows: run.people.map(function (p) { var e = emp(p.id); return [p.name, e.nic || '', e.epfNo || '', n(p.epfBase), n(p.etf)]; }),
        total: ['Total', '', '', n(run.epfBase), n(run.etf)]
      },
      apit: {
        title: 'APIT deducted', due: dueOf('apit'), payTo: (P.payTo || {}).apit,
        head: 'Employer TIN ' + (prof.tin || 'not added') + ' · ' + run.month,
        cols: ['Name', 'NIC', 'Gross pay', 'APIT this month', 'APIT this year'],
        rows: run.people.map(function (p) { var e = emp(p.id); return [p.name, e.nic || '', n(p.gross), n(p.apit), n((ytd[p.id] || {}).apit || p.apit)]; }),
        total: ['Total', '', n(run.gross), n(run.apit), '']
      },
      bank: {
        title: 'Bank transfer list', due: run.date, payTo: 'Your bank (' + (st.payBank || 'business account') + ')',
        head: 'From ' + (st.payBank || 'your business account') + (st.payAcct ? ' · A/C ' + st.payAcct : '') + ' · pay day ' + run.date,
        cols: ['Name', 'Bank', 'Branch', 'Account no', 'Net pay'],
        rows: run.people.map(function (p) { var b = emp(p.id).bank || {}; return [p.name, b.name || '', b.branch || '', b.acct || '', n(p.net)]; }),
        total: ['Total', '', '', '', n(run.net)]
      }
    };
  };
  /** Rows to CSV text. */
  BE.toCsv = function (cols, rows) {
    var q = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    return [cols].concat(rows).map(function (r) { return r.map(q).join(','); }).join('\n');
  };
})();
