/* Yours to keep: earlier months, the books behind the reports, sales tax, bank checks,
   categories, entries by hand and currencies (2026). Owned by the Yours to keep screens. */
(function () {
  // Money in and out before October. Added to this month's numbers for the longer periods.
  BE.define('history', {
    month: { inPaid: 0, outPaid: 0 },
    quarter: { inPaid: 0, outPaid: 0 },
    year: { inPaid: 182300, outPaid: 140960 }
  }, { month: { inPaid: 0, outPaid: 0 }, quarter: { inPaid: 0, outPaid: 0 }, year: { inPaid: 0, outPaid: 0 } });

  // Yours to keep in earlier months (after tax), for the month-by-month chart, and September's
  // profit & loss by category, for "Compare with September" in Reports.
  BE.define('pastMonths', [
    { m: 'Apr', keep: 3120 }, { m: 'May', keep: 4480 }, { m: 'Jun', keep: 2960 },
    { m: 'Jul', keep: 3850 }, { m: 'Aug', keep: 4210 }, { m: 'Sep', keep: 3740 }
  ], []);
  BE.define('plSep', {
    income: { 'Design services': 16890, 'Retainers': 1080, 'Product sales': 1450 },
    costs: { 'Payroll': 7231, 'Contractors': 1620, 'Rent': 1200, 'Printing': 540, 'Software': 631, 'Insurance': 646, 'Internet & phone': 129, 'Travel': 707, 'Office supplies': 188, 'Fuel': 61, 'Equipment': 1480 }
  }, { income: {}, costs: {} });

  // Balances that don't come from invoices, bills or expenses (as of Oct 1).
  BE.define('balances', {
    cashOct1: 33698, bankName: 'Chase Business Checking ••4417',
    fixedAssets: 6240, inventory: 1774.5, card: 1384, cardName: 'Amex Business ••1009',
    draws: -16000, nextTax: { amount: 6950, due: 'Jan 15, 2027' }
  }, { cashOct1: 0, bankName: '', fixedAssets: 0, inventory: 0, card: 0, cardName: '', draws: 0, nextTax: { amount: 0, due: '' } });

  // How the books count: 'accrual' (when you bill or get billed) or 'cash' (when money moves).
  BE.define('bookSettings', { method: 'accrual', shortRule: '', fxReval: false }, { method: 'accrual', shortRule: '', fxReval: false });

  // Categories (chart of accounts). match: the category names expenses, bills and costs use.
  var C = function (id, group, name, formal, match, extra) { return Object.assign({ id: id, group: group, name: name, formal: formal, match: match || [name], archived: false }, extra || {}); };
  var CATS = [
    C('svc', 'in', 'Design services', 'Service revenue', ['Design services']),
    C('ret', 'in', 'Retainers', 'Recurring service revenue', ['Retainers']),
    C('prod', 'in', 'Product sales', 'Sales revenue', ['Product sales']),
    C('fxg', 'in', 'Exchange gains and losses', 'Realized FX gain/loss', ['Exchange gains and losses']),
    C('refund', 'in', 'Money back to customers', 'Sales returns', ['Money back to customers']),
    C('pay', 'out', 'Payroll', 'Wages and salaries', ['Payroll', 'Wages']),
    C('contr', 'out', 'Contractors', 'Contract labor'),
    C('rent', 'out', 'Rent', 'Rent expense'),
    C('print', 'out', 'Printing', 'Printing and reproduction'),
    C('soft', 'out', 'Software', 'Software subscriptions', ['Software', 'Software & subscriptions']),
    C('ins', 'out', 'Insurance', 'Insurance expense'),
    C('net', 'out', 'Internet & phone', 'Utilities', ['Internet & phone', 'Internet and phone']),
    C('travel', 'out', 'Travel', 'Travel expense'),
    C('office', 'out', 'Office supplies', 'Supplies expense'),
    C('fuel', 'out', 'Fuel', 'Vehicle expense'),
    C('meals', 'out', 'Meals', 'Meals (50% deductible)'),
    C('fees', 'out', 'Bank fees', 'Bank service charges'),
    C('equip', 'out', 'Equipment wear', 'Depreciation expense'),
    C('cogs', 'out', 'What products cost you', 'Cost of goods sold'),
    C('ads', 'out', 'Advertising', 'Advertising and marketing'),
    C('cash', 'own', 'Chase Business Checking ••4417', 'Cash and bank', [], { bal: 'cash' }),
    C('ar', 'own', 'Money customers owe you', 'Accounts receivable', [], { bal: 'ar' }),
    C('stock', 'own', 'Stock on hand', 'Inventory, at cost', [], { bal: 'inventory' }),
    C('fixed', 'own', 'Studio equipment, after wear', 'Fixed assets, net', [], { bal: 'fixed' }),
    C('amex', 'owe', 'Amex Business ••1009', 'Credit card', [], { bal: 'card' }),
    C('ap', 'owe', 'Bills to pay', 'Accounts payable', [], { bal: 'ap' }),
    C('wages', 'owe', 'Payroll to pay', 'Wages payable', [], { bal: 'wages' }),
    C('subs', 'owe', 'Subscriptions due this month', 'Accrued expenses', [], { bal: 'subs' }),
    C('stax', 'owe', 'Sales tax collected', 'Sales tax payable', ['Sales tax'], { bal: 'stax' }),
    C('earn', 'eq', 'Profit so far this year', 'Net income', [], { bal: 'profit' }),
    C('kept', 'eq', 'Kept from earlier years', 'Retained earnings', [], { bal: 'kept' }),
    C('draw', 'eq', 'Money you took out', 'Owner draws', [], { bal: 'draws' })
  ];
  var archived = C('cowork', 'out', 'Coworking day passes', 'Rent expense'); archived.archived = true;
  // A new business starts with a short, sensible list.
  var EMPTY_CATS = CATS.filter(function (c) { return ['svc', 'prod', 'contr', 'rent', 'soft', 'travel', 'office', 'meals', 'fees', 'cash', 'ar', 'ap', 'stax', 'earn', 'kept', 'draw'].indexOf(c.id) >= 0; })
    .map(function (c) { return c.id === 'cash' ? Object.assign({}, c, { name: 'Business bank account' }) : c; });
  BE.define('categories', CATS.concat([archived]), EMPTY_CATS);

  // Entries made by hand (journal entries). lines: side 'from' (credit) / 'to' (debit), cat = category id.
  var L = function (side, cat, amt) { return { side: side, cat: cat, amt: amt }; };
  BE.define('journal', [
    { id: 'je-1', date: 'Sep 30, 2026', note: 'Q3 equipment wear', who: 'Dana Whitfield, CPA', cpa: true, lines: [L('from', 'fixed', 250), L('to', 'equip', 250)] },
    { id: 'je-2', date: 'Aug 14, 2026', note: 'Studio insurance paid from my personal card', who: 'Maya Chen', cpa: false, lines: [L('from', 'draw', 646), L('to', 'ins', 646)] },
    { id: 'je-3', date: 'Jun 30, 2026', note: 'Q2 equipment wear', who: 'Dana Whitfield, CPA', cpa: true, lines: [L('from', 'fixed', 250), L('to', 'equip', 250)] }
  ], []);

  // Sales tax: the quarter waiting to be filed, and past filings.
  BE.define('salesTax', {
    state: 'New York State', county: 'Kings County', rate: 0.08875, form: 'Form ST-100',
    open: { label: 'Jul – Sep 2026', due: 'Oct 20', dueIn: 16, sales: 4649.38, tax: 412.63,
      months: [{ label: 'July', sales: 1402.00, tax: 124.43 }, { label: 'August', sales: 1688.50, tax: 149.85 }, { label: 'September', sales: 1558.88, tax: 138.35 }] },
    next: { label: 'Oct – Dec 2026', due: 'Jan 20, 2027' }
  }, { state: '', county: '', rate: 0, form: '', open: null, next: { label: 'Oct – Dec 2026', due: 'Jan 20, 2027' } });
  BE.define('taxFilings', [
    { id: 'tf-2', q: 'Apr – Jun 2026', amount: 388.14, when: 'Jul 17', from: 'Chase ••4417' },
    { id: 'tf-1', q: 'Jan – Mar 2026', amount: 301.77, when: 'Apr 16', from: 'Chase ••4417' }
  ], []);

  // Year-end close checklist for 2025.
  BE.define('yearEnd', { year: 2025, receiptsOk: false, closed: false, closedOn: '', sent: false }, { year: 2025, receiptsOk: false, closed: false, closedOn: '', sent: false, fresh: true });

  // Bank statement being checked (reconcile). amount: + money in, − money out. cleared = ticked.
  var T = function (id, date, name, sub, amount, cleared, extra) { return Object.assign({ id: id, date: date, name: name, sub: sub, amount: amount, cleared: cleared }, extra || {}); };
  BE.define('bank', {
    connected: true, acct: 'Chase Business Checking ••4417', month: 'September 2026', short: 'September', opening: 38267.40, ending: 41286.40,
    feeAdded: false, feeExp: '', done: false, doneOn: '',
    lines: [
      T('t1', 'Sep 1', 'WeWork', 'Rent', -1200, true),
      T('t2', 'Sep 1', 'Bluebird Yoga', 'Paid INV-0150', 540, true),
      T('t3', 'Sep 5', 'Google Workspace', 'Software', -72, true),
      T('t4', 'Sep 8', 'Adobe Creative Cloud', 'Software', -90, true),
      T('t5', 'Sep 10', 'Atlas Freight Co.', 'Paid INV-0148', 6300, true),
      T('t6', 'Sep 12', 'Figma', 'Software', -45, true),
      T('t7', 'Sep 15', 'Comcast Business', 'Internet & phone', -129, true),
      T('t8', 'Sep 15', 'Payroll', 'Jordan, Priya and Sam', -7231, true),
      T('t9', 'Sep 18', 'Ridge Outdoor Supply', 'Paid INV-0154', 2480, true),
      T('t10', 'Sep 22', 'Check #1042', 'Local Print Shop · Printing', -73, false, { check: true }),
      T('t11', 'Sep 25', 'Lumen Dental Group', 'Paid INV-0149', 3200, true),
      T('t12', 'Sep 28', 'Business insurance', 'Insurance', -646, true)
    ]
  }, null);
  BE.define('reconciles', [
    { id: 'rc-3', month: 'August 2026', acct: 'Chase Business Checking ••4417', when: 'Sep 6', who: 'Maya Chen', bal: '$38,267.40' },
    { id: 'rc-2', month: 'September 2026', acct: 'Amex Business ••1009', when: 'Oct 2', who: 'Jordan Lee', bal: '$2,318.55 owed' },
    { id: 'rc-1', month: 'July 2026', acct: 'Chase Business Checking ••4417', when: 'Aug 4', who: 'Maya Chen', bal: '$35,904.12' }
  ], []);

  // Currencies you use besides your home currency. own: your own display rate ($ per 1), or null for the daily rate.
  BE.define('currencies', [
    { code: 'EUR', name: 'Euro', own: null },
    { code: 'GBP', name: 'Pound sterling', own: null }
  ], []);
  // Foreign invoices already paid this year: what they were billed as and what landed (USD).
  BE.define('fxRealized', [
    { id: 'fx-1', who: 'Kaffeehaus Berlin GmbH', inv: 'INV-0139', cur: 'EUR', orig: 3200, d0: 'Mar 2', r0: 1.08, d1: 'Apr 1', r1: 1.10 },
    { id: 'fx-2', who: 'Thistle & Co. Ltd', inv: 'INV-0146', cur: 'GBP', orig: 1200, d0: 'Jun 15', r0: 1.27, d1: 'Jul 14', r1: 1.29 },
    { id: 'fx-3', who: 'Thistle & Co. Ltd', inv: 'INV-0152', cur: 'GBP', orig: 1200, d0: 'Aug 15', r0: 1.28, d1: 'Sep 12', r1: 1.25 }
  ], []);

  // ---------------------------------------------------------------------------
  // The books: one set of helpers so Reports, Categories, Tax and Yours to keep agree
  // with each other and with BE.totals().
  // ---------------------------------------------------------------------------
  var r2 = function (n) { return Math.round(n * 100) / 100; };
  var PRODUCT_NAMES = ['Printed brand kit', 'Enamel logo pin', 'Letterpress card set', 'Tote bag'];
  function isProduct(name) {
    var names = BE.all('products').map(function (p) { return p.name; });
    if (!names.length) names = PRODUCT_NAMES;
    return names.indexOf(name) >= 0;
  }
  function invByNum(num) { return BE.find('invoices', num, 'num'); }
  // How an invoice's money splits between income categories (and sales tax), as fractions of its total.
  function invSplit(inv) {
    if (!inv) return { 'Design services': 1 };
    var total = BE.invSubtotal(inv) + (Number(inv.tax) || 0);
    if (total <= 0) return { 'Design services': 1 };
    var out = {};
    var sub = BE.invSubtotal(inv);
    var lines = inv.lines || [];
    var gross = lines.reduce(function (a, l) { return a + (Number(l.qty) || 0) * (Number(l.rate) || 0); }, 0) || 1;
    lines.forEach(function (l) {
      var v = (Number(l.qty) || 0) * (Number(l.rate) || 0) / gross * sub;
      var k = isProduct(l.name) ? 'Product sales' : (inv.repeat ? 'Retainers' : 'Design services');
      out[k] = (out[k] || 0) + v / total;
    });
    if (inv.tax) out['Sales tax on product invoices'] = (Number(inv.tax) || 0) / total;
    return out;
  }
  function catFor(name) {
    var n = String(name || 'Other').toLowerCase();
    var list = BE.all('categories');
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.name.toLowerCase() === n) return c;
      if ((c.match || []).some(function (m) { return String(m).toLowerCase() === n; })) return c;
    }
    return null;
  }
  function label(name) { var c = catFor(name); return c ? c.name : (name || 'Other'); }

  var books = {
    label: label,
    catFor: catFor,
    invSplit: invSplit,
    isProduct: isProduct,
    /** Profit & loss for 'month' | 'quarter' | 'year', counted 'accrual' (default) or 'cash'. */
    pl: function (period, method) {
      period = period || 'month';
      var cash = method === 'cash';
      var t = BE.totals(period);
      var income = {}, costs = {};
      var addTo = function (bag, k, v, src) { if (!v) return; bag[k] = bag[k] || { amount: 0, src: {} }; bag[k].amount += v; bag[k].src[src] = (bag[k].src[src] || 0) + v; };
      BE.all('payments').forEach(function (p) {
        if (!p.inMonth) return;
        var sp = invSplit(invByNum(p.inv));
        Object.keys(sp).forEach(function (k) { addTo(income, k, p.amount * sp[k], 'paid'); });
      });
      if (!cash) BE.all('invoices').forEach(function (i) {
        if (!(i.inMonth && !i.draft && !i.void && i.dueIn >= 0)) return;
        var open = BE.usd(BE.invOpen(i), i.cur);
        if (!open) return;
        var sp = invSplit(i);
        Object.keys(sp).forEach(function (k) { addTo(income, k, open * sp[k], 'expected'); });
      });
      BE.all('expenses').forEach(function (x) {
        if (!x.inMonth || x.kind === 'personal' || x.kind === 'transfer') return;
        addTo(costs, label(x.cat), x.amount, 'paid');
      });
      if (!cash) {
        BE.all('bills').forEach(function (b) { if (b.status !== 'paid' && b.inMonth !== false) addTo(costs, label(b.cat), b.amount - (b.paid || 0), 'bills'); });
        BE.all('payroll').forEach(function (r) { if (r.status !== 'paid' && r.inMonth) addTo(costs, label('Payroll'), r.net, 'payroll'); });
        BE.all('monthly').forEach(function (m) { if (m.active !== false && !m.paidDay && m.day > 4) addTo(costs, label(m.cat), m.amount, 'monthly'); });
      }
      var h = (BE.get('history') || {})[period] || {};
      var earlier = period === 'year' ? 'January to September' : 'Earlier this quarter';
      if (h.inPaid) addTo(income, earlier, h.inPaid, 'history');
      if (h.outPaid) addTo(costs, earlier, h.outPaid, 'history');
      var toRows = function (bag) {
        return Object.keys(bag).map(function (k) { return { label: k, amount: r2(bag[k].amount), src: bag[k].src, cat: catFor(k), earlier: k === earlier }; })
          .sort(function (a, b) { return (a.earlier - b.earlier) || (b.amount - a.amount); });
      };
      var inRows = toRows(income), outRows = toRows(costs);
      var tIn = r2(inRows.reduce(function (a, r) { return a + r.amount; }, 0));
      var tOut = r2(outRows.reduce(function (a, r) { return a + r.amount; }, 0));
      var profit = r2(tIn - tOut), rate = t.rate;
      var tax = Math.round(Math.max(profit, 0) * rate);
      return { period: period, method: cash ? 'cash' : 'accrual', income: inRows, costs: outRows, tIn: tIn, tOut: tOut, profit: profit, tax: tax, keep: Math.round(profit - tax), rate: rate };
    },
    /** Sales tax: the quarter to file, what's been collected since, and what's owed. */
    salesTax: function () {
      var s = BE.get('salesTax') || {};
      var open = s.open || null;
      var filings = BE.all('taxFilings');
      var filed = open ? filings.filter(function (f) { return f.q === open.label; })[0] || null : null;
      var newInv = BE.all('invoices').filter(function (i) { return !i.draft && !i.void && (Number(i.tax) || 0) > 0 && (i.isNew || /^Oct/.test(i.issued || '')); });
      var q4sales = 0, q4tax = 0;
      newInv.forEach(function (i) {
        q4tax += BE.usd(Number(i.tax) || 0, i.cur);
        (i.lines || []).forEach(function (l) { if (isProduct(l.name)) q4sales += BE.usd((Number(l.qty) || 0) * (Number(l.rate) || 0), i.cur); });
      });
      q4tax = r2(q4tax); q4sales = r2(q4sales);
      var owed = r2((open && !filed ? open.tax : 0) + q4tax);
      return { s: s, open: open, filed: filed, filings: filings, q4: { invoices: newInv, sales: q4sales, tax: q4tax }, owed: owed };
    },
    /** What the business owns and owes today, and what's yours. Always balances. */
    balance: function () {
      var b = BE.get('balances') || {};
      var t = BE.totals('month'), y = BE.totals('year');
      var payIn = BE.all('payments').reduce(function (a, p) { return a + (p.inMonth ? p.amount : 0); }, 0);
      var paidOut = BE.all('expenses').reduce(function (a, x) { return a + (x.inMonth && x.kind !== 'personal' ? x.amount : 0); }, 0);
      var cash = r2((b.cashOct1 || 0) + payIn - paidOut);
      var ar = r2(BE.all('invoices').reduce(function (a, i) { return a + (i.draft || i.void ? 0 : BE.usd(BE.invOpen(i), i.cur)); }, 0));
      var prods = BE.all('products');
      var inventory = BE.isEmpty() ? 0 : (prods.length && prods.some(function (p) { return p.cost != null; }) ? r2(prods.reduce(function (a, p) { return a + (Number(p.stock) || 0) * (Number(p.cost) || 0); }, 0)) : (b.inventory || 0));
      var st = books.salesTax();
      var own = [
        { key: 'cash', label: 'Cash in ' + (b.bankName || 'your bank'), formal: 'Cash · includes ' + BE.money(t.tax, 'USD', { whole: true }) + ' set aside for tax', amount: cash },
        { key: 'ar', label: 'Money customers owe you', formal: 'Accounts receivable', amount: ar },
        { key: 'inventory', label: 'Stock on the shelf, at cost', formal: 'Inventory', amount: inventory },
        { key: 'fixed', label: 'Computers and printer, after wear', formal: 'Fixed assets, net', amount: b.fixedAssets || 0 }
      ];
      var owe = [
        { key: 'ap', label: 'Bills to pay', formal: 'Accounts payable', amount: t.outBills },
        { key: 'wages', label: 'Payroll still to pay', formal: 'Wages payable', amount: t.outPayroll },
        { key: 'subs', label: 'Subscriptions due this month', formal: 'Accrued expenses', amount: t.outMonthly },
        { key: 'stax', label: 'Sales tax collected for ' + (st.s.state || 'the state'), formal: 'Sales tax payable', amount: st.owed },
        { key: 'card', label: b.cardName || 'Business card', formal: 'Credit card', amount: b.card || 0 }
      ];
      var tOwn = r2(own.reduce(function (a, r) { return a + r.amount; }, 0));
      var tOwe = r2(owe.reduce(function (a, r) { return a + r.amount; }, 0));
      var kept = r2(tOwn - tOwe - y.profit - (b.draws || 0));
      var eq = [
        { key: 'profit', label: 'Profit so far this year', formal: 'Net income', amount: y.profit },
        { key: 'kept', label: 'Kept from earlier years', formal: 'Retained earnings', amount: kept },
        { key: 'draws', label: 'Money you paid yourself', formal: 'Owner’s draws', amount: b.draws || 0 }
      ];
      return { own: own, owe: owe, eq: eq, tOwn: tOwn, tOwe: tOwe, tEq: r2(tOwn - tOwe), cash: cash, ar: ar };
    },
    /** Cash in and out this month (so far, and expected by month end). */
    cash: function () {
      var b = BE.get('balances') || {};
      var t = BE.totals('month');
      var open = b.cashOct1 || 0;
      var payIn = r2(BE.all('payments').reduce(function (a, p) { return a + (p.inMonth ? p.amount : 0); }, 0));
      var ex = BE.all('expenses').filter(function (x) { return x.inMonth && x.kind !== 'personal'; });
      var run = r2(ex.filter(function (x) { return x.kind !== 'transfer'; }).reduce(function (a, x) { return a + x.amount; }, 0));
      var passOn = r2(ex.filter(function (x) { return x.kind === 'transfer'; }).reduce(function (a, x) { return a + x.amount; }, 0));
      var bycat = {};
      ex.forEach(function (x) { var k = x.kind === 'transfer' ? 'Sales tax paid on' : label(x.cat); bycat[k] = r2((bycat[k] || 0) + x.amount); });
      var spend = Object.keys(bycat).map(function (k) { return { label: k, amount: bycat[k] }; }).sort(function (a, c) { return c.amount - a.amount; });
      var now = r2(open + payIn - run - passOn);
      return { open: open, payIn: payIn, run: run, passOn: passOn, change: r2(payIn - run - passOn), now: now,
        expIn: r2(payIn + t.inExp), expOut: r2(run + t.outSch), expEnd: r2(open + payIn + t.inExp - run - t.outSch - passOn), spend: spend, paidOut: r2(run + passOn) };
    },
    /** A CSV text from rows of cells. */
    csv: function (rows) {
      return rows.map(function (r) { return r.map(function (c) { var s = String(c == null ? '' : c); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(','); }).join('\n');
    },
    /** Save text as a file (where the browser allows it). Returns true if it started. */
    download: function (name, text) {
      try {
        var blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name; a.style.display = 'none';
        document.body.appendChild(a); a.click();
        setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) { /* ignore */ } }, 500);
        return true;
      } catch (e) { return false; }
    },
    /** Copy text to the clipboard (where the browser allows it). */
    copy: function (text) {
      try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).catch(function () {}); return true; } } catch (e) { /* blocked */ }
      return false;
    }
  };
  BE.books = books;
})();
