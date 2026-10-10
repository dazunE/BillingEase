/*
 * BillingEase prototype store.
 *
 * One shared copy of the business's data for every screen, kept in this
 * browser's localStorage so what you do on one screen shows up on the others.
 * Data files (data-*.js) describe the sample month with BE.define(); the
 * runtime (support.js) loads them before any screen renders and re-renders
 * the screen whenever the data changes.
 *
 * Screens read with BE.all/BE.get/BE.find and BE.totals(), and write with
 * BE.add/BE.update/BE.remove/BE.change or the domain helpers (createInvoice,
 * payInvoice, addExpense, payBill...). Never mutate what BE returns directly.
 */
(function () {
  'use strict';

  var KEY = 'billingease.prototype.v2';
  var defs = {};      // collection name -> { sample, empty }
  var order = [];
  var state = null;
  var mem = null;     // fallback when storage is blocked

  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }

  function readStorage() {
    try { var raw = window.localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return mem; }
  }
  function writeStorage(s) {
    mem = s;
    try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private window: keep it in memory */ }
  }

  function fresh(mode) {
    var s = { _mode: mode, _seq: 100 };
    order.forEach(function (k) {
      var d = defs[k];
      s[k] = mode === 'empty' ? clone(d.empty) : clone(d.sample);
    });
    return s;
  }

  function load() {
    if (state) return state;
    var s = readStorage();
    if (!s || typeof s !== 'object' || !s._mode) s = fresh('sample');
    // Collections added since this browser last saved come in from the seed.
    order.forEach(function (k) {
      if (!(k in s)) s[k] = s._mode === 'empty' ? clone(defs[k].empty) : clone(defs[k].sample);
    });
    state = s;
    return state;
  }

  function emit() {
    try { window.dispatchEvent(new CustomEvent('be:change')); } catch (e) { /* old browser */ }
  }

  function save() { writeStorage(state); emit(); }

  // ---- dates: "today" in the sample month is Sunday, Oct 4, 2026 ----------
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var TODAY = new Date(2026, 9, 4);
  function dayLabel(d) { return MON[d.getMonth()] + ' ' + d.getDate(); }
  function inDays(n) { return dayLabel(new Date(2026, 9, 4 + (Number(n) || 0))); }

  // ---- money -------------------------------------------------------------
  var SYM = { USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$', INR: '₹', LKR: 'Rs ', JPY: '¥' };
  var FX = { USD: 1, EUR: 1.09, GBP: 1.27, CAD: 0.73, AUD: 0.66, INR: 0.012, LKR: 0.0033, JPY: 0.0067 };
  function money(n, cur, opts) {
    n = Number(n) || 0;
    var neg = n < 0;
    n = Math.abs(Math.round(n * 100) / 100);
    var cents = opts && opts.cents ? 2 : (n % 1 ? 2 : 0);
    if (opts && opts.whole) { n = Math.round(n); cents = 0; }
    return (neg ? '−' : '') + (SYM[cur || 'USD'] || ((cur || '') + ' ')) + n.toLocaleString('en-US', { minimumFractionDigits: cents, maximumFractionDigits: cents });
  }
  function num(s) { var v = parseFloat(String(s == null ? '' : s).replace(/[^0-9.\-]/g, '')); return isFinite(v) ? v : 0; }
  function usd(amount, cur) { return (Number(amount) || 0) * (FX[cur || 'USD'] || 1); }

  // ---- invoices ------------------------------------------------------------
  function invSubtotal(inv) { return (inv.lines || []).reduce(function (a, l) { return a + (Number(l.qty) || 0) * (Number(l.rate) || 0); }, 0) - (Number(inv.discount) || 0); }
  function invTotal(inv) { return Math.round((invSubtotal(inv) + (Number(inv.tax) || 0) - (Number(inv.credit) || 0)) * 100) / 100; }
  function invOpen(inv) { return inv.draft || inv.void ? 0 : Math.max(0, Math.round((invTotal(inv) - (Number(inv.paid) || 0)) * 100) / 100); }
  function invStatus(inv) {
    if (inv.void) return 'void';
    if (inv.draft) return 'draft';
    if (invOpen(inv) <= 0) return 'paid';
    if (inv.dueIn < 0) return 'late';
    if (inv.paid > 0) return 'part';
    return 'open';
  }

  function ensure() { return load(); }

  var BE = {
    KEY: KEY,
    today: dayLabel(TODAY),
    MON: MON,
    FX: FX,
    SYM: SYM,

    /** Data files call this to describe a collection's sample and empty values. */
    define: function (name, sample, empty) {
      if (!defs[name]) order.push(name);
      defs[name] = { sample: sample, empty: empty !== undefined ? empty : (Array.isArray(sample) ? [] : clone(sample)) };
      if (state && !(name in state)) state[name] = clone(state._mode === 'empty' ? defs[name].empty : defs[name].sample);
    },

    /** 'sample' (Northwind Studio's October) or 'empty' (a brand new business). */
    mode: function () { return ensure()._mode; },
    isEmpty: function () { return ensure()._mode === 'empty'; },

    all: function (name) { var v = ensure()[name]; return Array.isArray(v) ? v : []; },
    get: function (name) { return ensure()[name]; },
    find: function (name, value, key) {
      key = key || 'id';
      var list = BE.all(name);
      for (var i = 0; i < list.length; i++) if (list[i][key] === value) return list[i];
      return null;
    },

    /** Change anything: fn gets the live data, then it's saved and every screen re-renders. */
    change: function (fn) {
      ensure();
      var r = fn(state);
      save();
      return r;
    },
    set: function (name, value) { return BE.change(function (s) { s[name] = clone(value); }); },
    patch: function (name, patch) { return BE.change(function (s) { s[name] = Object.assign({}, s[name], clone(patch)); }); },
    add: function (name, item, opts) {
      return BE.change(function (s) {
        var it = clone(item);
        if (!it.id) it.id = BE.id(name);
        s[name] = (s[name] || []).slice();
        if (opts && opts.end) s[name].push(it); else s[name].unshift(it);
        return it;
      });
    },
    update: function (name, value, patch, key) {
      key = key || 'id';
      return BE.change(function (s) {
        var out = null;
        s[name] = (s[name] || []).map(function (x) {
          if (x[key] !== value) return x;
          out = Object.assign({}, x, typeof patch === 'function' ? patch(clone(x)) : clone(patch));
          return out;
        });
        return out;
      });
    },
    remove: function (name, value, key) {
      key = key || 'id';
      return BE.change(function (s) { s[name] = (s[name] || []).filter(function (x) { return x[key] !== value; }); });
    },
    id: function (prefix) { var s = ensure(); s._seq = (s._seq || 100) + 1; return (prefix || 'x') + '-' + s._seq; },

    /** Next document number, e.g. BE.nextNumber('INV') -> 'INV-0166'. */
    nextNumber: function (prefix) {
      var list = prefix === 'INV' ? BE.all('invoices') : prefix === 'Q' ? BE.all('quotes') : prefix === 'CN' ? BE.all('creditNotes') : prefix === 'B' ? BE.all('bills') : [];
      var key = prefix === 'B' ? 'num' : 'num';
      var max = { INV: 165, Q: 32, CN: 4, B: 0 }[prefix] || 0;
      if (BE.isEmpty()) max = 0;
      list.forEach(function (x) { var m = String(x[key] || '').match(new RegExp('^' + prefix + '-(\\d+)$')); if (m) max = Math.max(max, +m[1]); });
      return prefix + '-' + String(max + 1).padStart(4, '0');
    },

    // ---- formatting & dates ----
    money: money,
    num: num,
    usd: usd,
    inDays: inDays,
    initials: function (s) { return String(s || '').replace(/&/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); },
    hash: function () { try { return decodeURIComponent((location.hash || '').slice(1)); } catch (e) { return ''; } },

    // ---- invoices ----
    invSubtotal: invSubtotal,
    invTotal: invTotal,
    invOpen: invOpen,
    invStatus: invStatus,

    /** Make (and by default send) an invoice. Returns it. */
    createInvoice: function (o) {
      var num = o.num || BE.nextNumber('INV');
      var terms = o.terms == null ? 30 : Number(o.terms);
      var draft = !!o.draft;
      var cust = BE.find('customers', o.who, 'name');
      var inv = {
        num: num, who: o.who, what: o.what || '', cur: o.cur || (cust && cust.cur) || BE.get('profile').currency || 'USD',
        lines: o.lines && o.lines.length ? o.lines : [{ name: o.what || 'Work', qty: 1, unit: 'job', rate: Number(o.amount) || 0 }],
        tax: Number(o.tax) || 0, discount: Number(o.discount) || 0, credit: 0, paid: 0, deposit: Number(o.deposit) || 0,
        issued: BE.today, due: draft ? '' : inDays(terms), dueIn: draft ? 99 : terms, inMonth: !draft, viewed: false,
        email: o.email || (cust && cust.email) || '', repeat: !!o.repeat, from: o.from || '', draft: draft, note: o.note || '',
        events: [{ label: draft ? 'Started by ' + BE.get('profile').owner : 'Sent to ' + (o.email || (cust && cust.email) || o.who), date: BE.today, todo: false }]
          .concat(draft ? [] : [{ label: 'Due', date: inDays(terms), todo: true }]),
        isNew: true
      };
      BE.change(function (s) {
        s.invoices = [inv].concat(s.invoices || []);
        if (!draft) BE._log(s, 'Sent ' + num + ' to ' + o.who + ' · ' + money(invTotal(inv), inv.cur));
      });
      return inv;
    },
    /** Send a draft invoice. */
    sendInvoice: function (num, terms) {
      return BE.change(function (s) {
        var out = null;
        terms = terms == null ? 30 : Number(terms);
        s.invoices = s.invoices.map(function (x) {
          if (x.num !== num) return x;
          out = Object.assign({}, x, { draft: false, issued: BE.today, due: inDays(terms), dueIn: terms, inMonth: true,
            events: (x.events || []).concat([{ label: 'Sent to ' + (x.email || x.who), date: BE.today }, { label: 'Due', date: inDays(terms), todo: true }]) });
          return out;
        });
        if (out) BE._log(s, 'Sent ' + num + ' to ' + out.who + ' · ' + money(invTotal(out), out.cur));
        return out;
      });
    },
    /** Record money received against an invoice (amount in the invoice currency). */
    payInvoice: function (num, amount, how) {
      return BE.change(function (s) {
        var inv = null;
        s.invoices = s.invoices.map(function (x) {
          if (x.num !== num) return x;
          var amt = amount == null ? invOpen(x) : Math.min(Number(amount) || 0, invOpen(x));
          inv = Object.assign({}, x, { paid: Math.round(((Number(x.paid) || 0) + amt) * 100) / 100, paidHow: how || 'Bank transfer', paidOn: BE.today,
            events: (x.events || []).filter(function (e) { return !e.todo; }).concat([{ label: (invOpen(x) - amt <= 0 ? 'Paid ' : 'Part paid ') + money(amt, x.cur) + ' by ' + String(how || 'bank transfer').toLowerCase(), date: BE.today }]) });
          inv._amt = amt;
          return inv;
        });
        if (!inv) return null;
        var amt = inv._amt; delete inv._amt;
        s.payments = [{ id: BE.id('pay'), inv: num, who: inv.who, amount: Math.round(usd(amt, inv.cur) * 100) / 100, cur: inv.cur, orig: amt, how: how || 'Bank transfer', date: BE.today, inMonth: true }].concat(s.payments || []);
        BE._log(s, 'Matched ' + inv.who + '’s ' + money(amt, inv.cur) + ' payment to ' + num);
        BE._notify(s, inv.who + ' paid ' + money(amt, inv.cur), num + (invOpen(inv) > 0 ? ' · ' + money(invOpen(inv), inv.cur) + ' still open' : ' is paid in full'), 'SellInvoices.dc.html#' + num);
        return inv;
      });
    },
    voidInvoice: function (num) {
      return BE.update('invoices', num, function (x) { return { void: true, events: (x.events || []).filter(function (e) { return !e.todo; }).concat([{ label: 'Voided', date: BE.today }]) }; }, 'num');
    },

    // ---- going out ----
    /** Record money already spent (cash or card). Adds to Going out now. */
    addExpense: function (o) {
      var x = { id: BE.id('exp'), who: o.who, cat: o.cat || 'Other', how: o.how || 'Amex ••1009', date: o.date || BE.today, amount: Math.round((Number(o.amount) || 0) * 100) / 100, inMonth: o.inMonth !== false, receipt: !!o.receipt, note: o.note || '', split: o.split || null, kind: o.kind || 'business', isNew: true };
      BE.change(function (s) {
        s.expenses = [x].concat(s.expenses || []);
        BE._log(s, 'Recorded ' + money(x.amount) + ' to ' + x.who + ' under ' + x.cat);
      });
      return x;
    },
    /** Pay a bill in full or in part. Moves it from scheduled to paid in Going out. */
    payBill: function (id, amount, how) {
      return BE.change(function (s) {
        var bill = null, amt = 0;
        s.bills = s.bills.map(function (b) {
          if (b.id !== id) return b;
          var open = Math.round((b.amount - (b.paid || 0)) * 100) / 100;
          amt = amount == null ? open : Math.min(Number(amount) || 0, open);
          var paid = Math.round(((b.paid || 0) + amt) * 100) / 100;
          bill = Object.assign({}, b, { paid: paid, status: paid >= b.amount ? 'paid' : 'open', paidOn: BE.today,
            history: (b.history || []).concat([{ label: 'Paid ' + money(amt) + ' from ' + (how || 'Chase ••4417'), date: BE.today }]) });
          return bill;
        });
        if (!bill) return null;
        s.expenses = [{ id: BE.id('exp'), who: bill.who, cat: bill.cat || 'Other', how: how || 'Chase ••4417', date: BE.today, amount: amt, inMonth: true, bill: bill.id, isNew: true }].concat(s.expenses || []);
        BE._log(s, 'Paid ' + bill.who + ' ' + money(amt) + (bill.status === 'paid' ? '' : ' (part of the bill)'));
        return bill;
      });
    },
    addBill: function (o) {
      var b = Object.assign({ id: BE.id('bill'), num: '', who: '', what: '', amount: 0, paid: 0, due: inDays(30), dueIn: 30, cat: 'Other', status: 'open', inMonth: true, entered: BE.today, history: [{ label: 'Entered', date: BE.today }], isNew: true }, clone(o));
      BE.change(function (s) {
        s.bills = [b].concat(s.bills || []);
        BE._log(s, 'Entered a bill from ' + b.who + ' · ' + money(b.amount) + ', due ' + b.due);
      });
      return b;
    },

    // ---- activity & notifications ----
    log: function (text) { BE.change(function (s) { BE._log(s, text); }); },
    _log: function (s, text) { s.activity = [{ id: BE.id('act'), t: text, when: 'Just now' }].concat(s.activity || []).slice(0, 60); },
    notify: function (title, body, href) { BE.change(function (s) { BE._notify(s, title, body, href); }); },
    _notify: function (s, title, body, href) { s.notifications = [{ id: BE.id('ntf'), title: title, body: body || '', href: href || '', when: 'Just now', read: false }].concat(s.notifications || []).slice(0, 60); },
    unread: function () { return BE.all('notifications').filter(function (n) { return !n.read; }).length; },

    // ---- the three numbers ----
    /**
     * Coming in − Going out = Yours to keep, for 'month' (October), 'quarter'
     * (Q4 so far) or 'year' (2026 so far). Earlier months come from `history`.
     */
    totals: function (period) {
      period = period || 'month';
      var s = ensure();
      var sum = function (list, f) { return (list || []).reduce(function (a, x) { return a + (f(x) || 0); }, 0); };
      var inPaid = sum(s.payments, function (p) { return p.inMonth ? p.amount : 0; });
      var inExp = sum(s.invoices, function (i) { return i.inMonth && !i.draft && !i.void && i.dueIn >= 0 ? usd(invOpen(i), i.cur) : 0; });
      var outPaid = sum(s.expenses, function (x) { return x.inMonth && x.kind !== 'personal' && x.kind !== 'transfer' ? x.amount : 0; });
      var bills = sum(s.bills, function (b) { return b.status !== 'paid' && b.inMonth !== false ? b.amount - (b.paid || 0) : 0; });
      var pay = sum(s.payroll, function (r) { return r.status !== 'paid' && r.inMonth ? r.net : 0; });
      var monthly = sum(s.monthly, function (m) { return m.active !== false && !m.paidDay && m.day > 4 ? m.amount : 0; });
      var outSch = bills + pay + monthly;
      var h = (s.history || {})[period] || { inPaid: 0, outPaid: 0 };
      inPaid += h.inPaid || 0;
      outPaid += h.outPaid || 0;
      var r2 = function (n) { return Math.round(n * 100) / 100; };
      var tIn = r2(inPaid + inExp), tOut = r2(outPaid + outSch), profit = r2(tIn - tOut);
      var rate = (s.profile && s.profile.setAside != null) ? s.profile.setAside : 0.25;
      var tax = Math.round(Math.max(profit, 0) * rate);
      var keep = Math.round(profit - tax);
      var pct = function (a, b) { return b > 0 ? Math.max(a > 0 ? 2 : 0, Math.min(100, Math.round(a / b * 100))) : 0; };
      return {
        period: period, inPaid: r2(inPaid), inExp: r2(inExp), in: tIn, outPaid: r2(outPaid), outSch: r2(outSch), out: tOut,
        outBills: r2(bills), outPayroll: r2(pay), outMonthly: r2(monthly),
        profit: profit, tax: tax, keep: keep, rate: rate,
        inPaidPct: pct(inPaid, tIn), outPaidPct: pct(outPaid, tOut), keepPct: pct(keep, profit),
        fmt: { in: money(tIn, 'USD', { whole: true }), out: money(tOut, 'USD', { whole: true }), keep: money(keep, 'USD', { whole: true }), tax: money(tax, 'USD', { whole: true }),
          inPaid: money(inPaid, 'USD', { whole: true }), inExp: money(inExp, 'USD', { whole: true }), outPaid: money(outPaid, 'USD', { whole: true }), outSch: money(outSch, 'USD', { whole: true }), profit: money(profit, 'USD', { whole: true }) }
      };
    },

    // ---- starting over ----
    /** Back to Northwind Studio's sample October. */
    reset: function () { state = fresh('sample'); save(); },
    /** A brand new, empty business (from sign up → "Start empty"). */
    startEmpty: function (profile) {
      state = fresh('empty');
      if (profile) state.profile = Object.assign({}, state.profile, clone(profile));
      save();
    },
    startSample: function () { state = fresh('sample'); save(); },
    /**
     * Open another business you own. Each business keeps its own books: the
     * current one is put aside and the other comes back as you left it (a
     * business opened for the first time starts empty, with its profile).
     */
    switchBusiness: function (id, profile) {
      var s = ensure();
      var list = s.businesses || [];
      var cur = list.filter(function (b) { return b.current; })[0];
      if (!cur || cur.id === id) return;
      var keepOut = { _stash: 1, businesses: 1, _seq: 1 };
      var stash = s._stash || {};
      var mine = {};
      Object.keys(s).forEach(function (k) { if (!keepOut[k]) mine[k] = s[k]; });
      stash[cur.id] = mine;
      var next = stash[id];
      delete stash[id];
      if (!next) {
        next = fresh('empty');
        delete next.businesses; delete next._seq;
        var target = list.filter(function (b) { return b.id === id; })[0] || {};
        next.profile = Object.assign({}, s.profile, { business: target.name || 'New business', sells: 'services', team: 'solo', overseas: false }, clone(profile || {}));
      }
      var seq = s._seq;
      state = Object.assign({}, next, { _stash: stash, _seq: seq, businesses: list.map(function (b) { return Object.assign({}, b, { current: b.id === id }); }) });
      save();
    },
    /** Re-read storage (another tab changed it). */
    reload: function () { state = null; load(); emit(); }
  };

  window.BE = BE;

  // Another tab changed the data: show it here too.
  window.addEventListener('storage', function (e) { if (e.key === KEY) BE.reload(); });
})();
