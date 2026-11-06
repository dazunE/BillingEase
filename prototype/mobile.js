/*
 * BillingEase mobile app: phone-only state for the Mobile*.dc.html screens.
 *
 * The books themselves live in store.js (shared with every web screen). This file
 * keeps what only the phone knows: whether it's unlocked, Face ID and notification
 * settings, the offline queue, and the push banner / Face ID sheet on screen now.
 * In the real app these map to expo-local-authentication, expo-notifications and
 * an on-device SQLite outbox (see docs/MOBILE.md).
 */
(function () {
  'use strict';
  var BE = window.BE;
  if (!BE) return;

  var KEY = 'billingease.mobile.v1';
  var DEFAULTS = {
    onboarded: false,
    faceId: true,
    lockAfter: 'now',
    offline: false,
    queue: [],
    notif: { paid: true, late: true, payroll: true, accountant: true, deadlines: true, drafts: true, budgets: true },
    budgetWarn: true,
    budgetWeekly: true,
    pushShown: false,
    reviewed: []
  };
  var st;
  function load() {
    try { st = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { st = Object.assign({}, DEFAULTS); }
    st.notif = Object.assign({}, DEFAULTS.notif, st.notif || {});
    return st;
  }
  load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* private mode */ }
    ping();
  }
  function ping() { try { window.dispatchEvent(new CustomEvent('be:change')); } catch (e) { /* old browser */ } }
  window.addEventListener('storage', function (e) { if (e.key === KEY) { load(); ping(); } });

  var live = { push: null, faceid: null, toast: null };
  var timers = {};
  // A toast raised just before moving to another screen carries over to it.
  try {
    var carried = JSON.parse(sessionStorage.getItem('be.mobile.toast') || 'null');
    if (carried && Date.now() - carried.at < 2500) {
      live.toast = { text: carried.text, kind: carried.kind };
      timers.toast = setTimeout(function () { live.toast = null; ping(); }, 2600);
    }
    var carriedPush = JSON.parse(sessionStorage.getItem('be.mobile.push') || 'null');
    if (carriedPush && Date.now() - carriedPush.at < 3000) {
      live.push = carriedPush.p;
      timers.push = setTimeout(function () { live.push = null; ping(); }, 5000);
    }
  } catch (e) { /* ignore */ }

  // Icons: 24×24 stroke paths, shared by every mobile screen.
  var I = {
    home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4z',
    in: 'M12 19V5M5 12l7 7 7-7',
    out: 'M12 5v14M5 12l7-7 7 7',
    inbox: 'M4 13h4l2 3h4l2-3h4M5 5h14l2 8v6H3v-6z',
    plus: 'M12 5v14M5 12h14',
    close: 'M6 6l12 12M18 6 6 18',
    back: 'M15 6l-6 6 6 6',
    chev: 'm9 6 6 6-6 6',
    budget: 'M12 21a9 9 0 1 0-9-9M12 3v9l6.4 6.4M21 12h-9',
    target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
    down: 'm6 9 6 6 6-6',
    check: 'm5 12 5 5 9-10',
    camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    invoice: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M8 13h8M8 17h5',
    expense: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
    record: 'M7 17 17 7M9 7h8v8',
    import: 'M12 3v12M7 10l5 5 5-5M4 17v3h16v-3',
    people: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.8',
    bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
    spark: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
    bill: 'M3 6h18v12H3zM3 10h18M7 15h3',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    send: 'M4 12 20 4l-6 16-3-7z',
    share: 'M12 3v12M7 8l5-5 5 5M5 13v7h14v-7',
    wifiOff: 'M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.2-2.8M19 13a10 10 0 0 0-2.1-1.6M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 10.7 5M12 20h.01',
    sync: 'M21 12a9 9 0 0 1-15.5 6.3L3 16M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M3 21v-5h5',
    lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
    face: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M9 9v1.5M15 9v1.5M12 9v4h-1M9 16c1.7 1.3 4.3 1.3 6 0',
    flash: 'M13 2 4 14h7l-1 8 9-12h-7z',
    image: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01',
    file: 'M14 3H6v18h12V7zM14 3v4h4',
    mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
    chat: 'M21 12a8 8 0 0 1-11.8 7L4 20l1-4.6A8 8 0 1 1 21 12z',
    edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
    car: 'M5 16h14v-4l-2-5H7l-2 5zM5 16v2M19 16v2M7.5 13h.01M16.5 13h.01',
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    web: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18'
  };

  // Where a web screen's link should go on the phone.
  var MAP = [
    [/^Sell(Invoices|Invoice|Customer|Customers)\.dc\.html/, 'MobileIn.dc.html'],
    [/^ThreeIn\.dc\.html/, 'MobileIn.dc.html'],
    [/^(ThreeOut|SpendBill|SpendTransaction|SpendVendors?)\.dc\.html/, 'MobileOut.dc.html'],
    [/^(SpendPayroll|Payslip)\.dc\.html/, 'MobilePayroll.dc.html'],
    [/^(Notifications|Accountant)\.dc\.html/, 'MobileInbox.dc.html'],
    [/^MobileBudgets/, 'MobileBudgets.dc.html'],
    [/^(ThreeHome|ThreeMobile)\.dc\.html/, 'MobileHome.dc.html']
  ];

  BE.mobile = {
    I: I,
    get: function () { return st; },
    set: function (patch) { st = Object.assign({}, st, patch); save(); },
    setNotif: function (k, v) { st.notif = Object.assign({}, st.notif); st.notif[k] = v; save(); },

    // ---- lock ----
    isUnlocked: function () { try { return sessionStorage.getItem('be.mobile.unlocked') === '1'; } catch (e) { return true; } },
    unlock: function () { try { sessionStorage.setItem('be.mobile.unlocked', '1'); } catch (e) { /* ignore */ } },
    lock: function () { try { sessionStorage.removeItem('be.mobile.unlocked'); } catch (e) { /* ignore */ } },
    /** Send a locked phone to the unlock screen first (called by every app screen). */
    guard: function () {
      if (!BE.mobile.isUnlocked() && !/MobileUnlock/.test(location.pathname)) {
        location.replace('MobileUnlock.dc.html#' + encodeURIComponent(location.pathname.split('/').pop() + location.hash));
        return false;
      }
      return true;
    },

    // ---- offline ----
    offline: function () { return !!st.offline; },
    queued: function () { return st.queue || []; },
    /** Go offline or back online. Back online syncs the queue and returns how many went. */
    setOffline: function (on) {
      var n = (st.queue || []).length;
      st = Object.assign({}, st, { offline: !!on, queue: on ? st.queue : [] });
      save();
      if (!on && n) BE.mobile.toast('Synced ' + n + (n === 1 ? ' change' : ' changes') + ' to BillingEase');
      return n;
    },
    /**
     * Every write on the phone goes through here. Online it's saved straight away;
     * offline it's kept on the phone (and shown as waiting) until there's signal.
     * The books still update at once, so the numbers on screen are never stale.
     */
    did: function (label) {
      if (st.offline) {
        st = Object.assign({}, st, { queue: [{ label: label, at: 'Just now' }].concat(st.queue || []) });
        save();
        BE.mobile.toast(label + ' · saved on this phone', 'queued');
      } else {
        BE.mobile.toast(label);
      }
    },

    // ---- toast ----
    toast: function (text, kind) {
      live.toast = { text: text, kind: kind || '' };
      try { sessionStorage.setItem('be.mobile.toast', JSON.stringify({ text: text, kind: kind || '', at: Date.now() })); } catch (e) { /* ignore */ }
      clearTimeout(timers.toast);
      timers.toast = setTimeout(function () { live.toast = null; ping(); }, 3000);
      ping();
    },

    // ---- push notifications (a banner like the one iOS and Android show) ----
    push: function (title, body, href, kind) {
      if (kind && st.notif[kind] === false) return;
      live.push = { title: title, body: body || '', href: BE.mobile.href(href || 'MobileInbox.dc.html') };
      try { sessionStorage.setItem('be.mobile.push', JSON.stringify({ p: live.push, at: Date.now() })); } catch (e) { /* ignore */ }
      clearTimeout(timers.push);
      timers.push = setTimeout(function () { live.push = null; ping(); }, 6000);
      ping();
    },
    dismissPush: function () { live.push = null; ping(); },

    // ---- Face ID (a confirm step for money that leaves the business) ----
    /** Ask for Face ID, then run done(). With Face ID off it runs at once. */
    confirm: function (reason, done) {
      if (!st.faceId) { done(); return; }
      live.faceid = { stage: 'scan', reason: reason || '' };
      ping();
      clearTimeout(timers.face);
      timers.face = setTimeout(function () {
        live.faceid = { stage: 'ok', reason: reason || '' };
        ping();
        timers.face = setTimeout(function () { live.faceid = null; ping(); done(); }, 650);
      }, 1100);
    },

    live: function () { return live; },

    /** A web link turned into the matching mobile screen, if there is one. */
    href: function (h) {
      h = String(h || '');
      for (var i = 0; i < MAP.length; i++) if (MAP[i][0].test(h)) return MAP[i][1];
      return h;
    },

    // ---- money in that isn't against an invoice ----
    recordIncome: function (o) {
      var amt = Math.round((Number(o.amount) || 0) * 100) / 100;
      var d = BE.dayOf ? BE.dayOf(o.dayOffset || 0) : { label: BE.today };
      BE.change(function (s) {
        s.payments = [{ id: BE.id('pay'), inv: null, who: o.who || 'Other income', amount: amt, cur: (s.profile || {}).currency, orig: amt, how: o.how || 'Bank transfer', date: d.label, inMonth: true, cat: o.cat || 'Other income', manual: true, isNew: true }].concat(s.payments || []);
        BE._log(s, 'Recorded ' + BE.money(amt) + ' from ' + (o.who || 'other income') + (o.cat ? ' under ' + o.cat : ''));
      });
      return amt;
    },

    greeting: function () { return 'Good morning'; },
    /** Short money for small tiles: £3,950 stays, Rs 2,034,335 becomes Rs 2.03m. */
    short: function (n, cur) {
      n = Number(n) || 0;
      var a = Math.abs(n);
      if (a < 100000) return BE.money(n, cur, { whole: true });
      var sym = BE.mobile.sym(cur);
      var v = a >= 1e6 ? (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'm' : Math.round(a / 1000) + 'k';
      return (n < 0 ? '−' : '') + sym + v;
    },
    /** The currency symbol as it's written before a number: '£' or 'Rs '. */
    sym: function (cur) { var s = BE.money(0, cur).replace(/[0-9.,]/g, ''); return /[A-Za-z]/.test(s) ? s.trim() + ' ' : s.trim(); },
    /** A font size (px) that keeps a figure on one line in a box of about `room` characters. */
    fit: function (text, base, room) { var n = String(text).length; return n <= room ? base : Math.max(14, Math.floor(base * room / n)); },
    W: function (n) { return BE.money(n, null, { whole: true }); }
  };
  // ---- budgets ---------------------------------------------------------------------------
  // Monthly budgets that repeat every month. Kept with the books (so a second phone sees the
  // same ones), seeded for both samples. kind: 'cat' (spending in one category), 'total' (all
  // spending), 'income' (a Coming in target) or 'keep' (a Yours to keep goal).
  BE.define('budgets', BE.perCountry({
    uk: [
      { id: 'bud-keep', kind: 'keep', amount: 4000 },
      { id: 'bud-income', kind: 'income', amount: 8000 },
      { id: 'bud-total', kind: 'total', amount: 1800 },
      { id: 'bud-premises', kind: 'cat', catId: 'premises', amount: 200 },
      { id: 'bud-office', kind: 'cat', catId: 'office', amount: 250 },
      { id: 'bud-entertaining', kind: 'cat', catId: 'entertaining', amount: 30 },
      { id: 'bud-travel', kind: 'cat', catId: 'travel', amount: 150 },
      { id: 'bud-advertising', kind: 'cat', catId: 'advertising', amount: 100 }
    ],
    lk: [
      { id: 'bud-keep', kind: 'keep', amount: 600000 },
      { id: 'bud-income', kind: 'income', amount: 3000000 },
      { id: 'bud-total', kind: 'total', amount: 900000 },
      { id: 'bud-entertaining', kind: 'cat', catId: 'entertaining', amount: 12000 },
      { id: 'bud-travel', kind: 'cat', catId: 'travel', amount: 25000 },
      { id: 'bud-cogs', kind: 'cat', catId: 'cogs', amount: 150000 },
      { id: 'bud-utilities', kind: 'cat', catId: 'utilities', amount: 30000 },
      { id: 'bud-office', kind: 'cat', catId: 'office', amount: 15000 }
    ]
  }), []);

  var MONTH_DAY = 11, MONTH_DAYS = 31; // the samples are on 11 October 2026
  function inCat(x, c) { return x.catId ? x.catId === c.id : x.cat === c.name; }
  function counts(x) { return x.kind !== 'personal' && x.kind !== 'transfer'; }
  function catSpend(c, month) {
    return BE.all('expenses').filter(function (x) {
      if (!counts(x) || !inCat(x, c)) return false;
      return month === 'last' ? / Sep$/.test(x.date || '') : !!x.inMonth;
    }).reduce(function (a, x) { return a + (Number(x.amount) || 0); }, 0);
  }
  var BUDGET_NAMES = { total: 'All spending', income: 'Coming in target', keep: 'Yours to keep goal' };

  /** How one budget is doing this month. */
  function budgetStatus(b) {
    var t = BE.totals('month');
    var c = b.kind === 'cat' ? BE.catById(b.catId) : null;
    var spent = 0, extra = 0, last = null, isGoal = b.kind === 'income' || b.kind === 'keep';
    if (b.kind === 'cat') { spent = c ? catSpend(c) : 0; last = c ? catSpend(c, 'last') : null; }
    if (b.kind === 'total') { spent = t.outPaid; extra = t.outSch; }
    if (b.kind === 'income') { spent = t.inPaid; extra = t.inExp; }
    if (b.kind === 'keep') { spent = Math.max(0, BE.keepTotals('month').keep); }
    var amt = Number(b.amount) || 0;
    var pct = amt > 0 ? Math.round(spent / amt * 100) : 0;
    var withExtra = amt > 0 ? Math.round((spent + extra) / amt * 100) : 0;
    var pace = Math.round(MONTH_DAY / MONTH_DAYS * 100);
    var state;
    if (isGoal) state = pct >= 100 ? 'met' : withExtra >= 100 ? 'onway' : pct >= pace ? 'ontrack' : 'behind';
    else state = pct >= 100 ? 'over' : pct >= 80 ? 'nearly' : pct > pace + 20 ? 'fast' : 'ok';
    var W = function (n) { return BE.money(n, null, { whole: true }); };
    var words = {
      over: W(spent - amt) + ' over', nearly: W(amt - spent) + ' left', fast: W(amt - spent) + ' left · spending fast', ok: W(amt - spent) + ' left',
      met: 'Reached, ' + W(spent - amt) + ' above the goal', onway: 'On course with what’s on the way', ontrack: W(amt - spent) + ' to go · on track', behind: W(amt - spent) + ' to go'
    }[state];
    var tone = { over: 'late', nearly: 'warn', fast: 'warn', ok: 'ok', met: 'ok', onway: 'ok', ontrack: 'ok', behind: 'plain' }[state];
    var tag = { over: 'Over', nearly: 'Nearly used', fast: 'Ahead of pace', ok: 'On track', met: 'Reached', onway: 'On course', ontrack: 'On track', behind: 'Behind' }[state];
    return {
      id: b.id, kind: b.kind, catId: b.catId || null, name: c ? c.name : BUDGET_NAMES[b.kind] || 'Budget', official: c ? (c.official || '') : '',
      amount: amt, spent: Math.round(spent * 100) / 100, extra: Math.round(extra * 100) / 100, last: last, pct: pct, withExtra: withExtra,
      pace: pace, state: state, tone: tone, tag: tag, words: words, isGoal: isGoal, left: amt - spent
    };
  }
  var ORDER = { keep: 0, income: 1, total: 2, cat: 3 };

  BE.mobile.budgets = {
    day: MONTH_DAY, days: MONTH_DAYS,
    names: BUDGET_NAMES,
    all: function () { return BE.all('budgets').slice().sort(function (a, b) { return ORDER[a.kind] - ORDER[b.kind]; }); },
    status: budgetStatus,
    statuses: function () { return BE.mobile.budgets.all().map(budgetStatus); },
    forCat: function (catId) { var b = BE.all('budgets').filter(function (x) { return x.kind === 'cat' && x.catId === catId; })[0]; return b ? budgetStatus(b) : null; },
    find: function (kind, catId) { return BE.all('budgets').filter(function (x) { return x.kind === kind && (kind !== 'cat' || x.catId === catId); })[0] || null; },
    /** A category's spending last month and this month, to suggest a sensible limit. */
    history: function (catId) { var c = BE.catById(catId); return c ? { last: catSpend(c, 'last'), now: catSpend(c) } : { last: 0, now: 0 }; },
    save: function (o) {
      var have = o.id ? BE.find('budgets', o.id) : BE.mobile.budgets.find(o.kind, o.catId);
      if (have) return BE.update('budgets', have.id, { amount: Number(o.amount) || 0 });
      return BE.add('budgets', { id: 'bud-' + (o.kind === 'cat' ? o.catId : o.kind), kind: o.kind, catId: o.catId || null, amount: Number(o.amount) || 0 }, { end: true });
    },
    remove: function (id) { BE.remove('budgets', id); },
    /**
     * What saving `amount` under a category would do to its budget, for the line shown while
     * recording. Null when the category has no budget or warnings are off.
     */
    preview: function (catId, amount) {
      if (!st.budgetWarn || !catId) return null;
      var s = BE.mobile.budgets.forCat(catId);
      if (!s) return null;
      var W = function (n) { return BE.money(n, null, { whole: true }); };
      var after = s.spent + (Number(amount) || 0);
      var pct = s.amount > 0 ? Math.round(after / s.amount * 100) : 0;
      var text = !(amount > 0) ? s.name + ': ' + (s.left >= 0 ? W(s.left) + ' left of ' + W(s.amount) : W(-s.left) + ' over ' + W(s.amount)) + ' this month'
        : after > s.amount ? 'This takes ' + s.name + ' to ' + W(after) + ', ' + W(after - s.amount) + ' over its ' + W(s.amount) + ' budget'
        : 'After this, ' + W(s.amount - after) + ' left of ' + W(s.amount) + ' for ' + s.name;
      return { text: text, pct: Math.min(100, pct), tone: pct >= 100 ? 'late' : pct >= 80 ? 'warn' : 'ok', before: Math.min(100, s.pct) };
    },
    /** Run a change to the books, then send a push for any budget it took past 80% or 100%. */
    watch: function (fn) {
      var before = {};
      BE.mobile.budgets.statuses().forEach(function (s) { before[s.id] = s.pct; });
      var out = fn();
      BE.mobile.budgets.statuses().forEach(function (s) {
        if (s.isGoal || before[s.id] == null) return;
        var was = before[s.id], now = s.pct;
        var W = function (n) { return BE.money(n, null, { whole: true }); };
        if (was < 100 && now >= 100) BE.mobile.push(s.name + ' is over budget', W(s.spent) + ' of ' + W(s.amount) + ' this month, with ' + (MONTH_DAYS - MONTH_DAY) + ' days to go.', 'MobileBudgets.dc.html#' + s.id, 'budgets');
        else if (was < 80 && now >= 80) BE.mobile.push(s.name + ': ' + now + '% used', W(s.amount - s.spent) + ' left of ' + W(s.amount) + ' for the rest of October.', 'MobileBudgets.dc.html#' + s.id, 'budgets');
      });
      return out;
    },
    /** The Monday summary, as one notification. */
    weekly: function () {
      var S = BE.mobile.budgets.statuses();
      var spend = S.filter(function (s) { return !s.isGoal; });
      var over = spend.filter(function (s) { return s.state === 'over'; }), near = spend.filter(function (s) { return s.state === 'nearly' || s.state === 'fast'; });
      var keep = S.filter(function (s) { return s.kind === 'keep'; })[0];
      var body = (over.length ? over.map(function (s) { return s.name; }).join(', ') + ' over. ' : '') + (near.length ? near.length + ' close to the limit. ' : '') +
        (spend.length - over.length - near.length) + ' on track.' + (keep ? ' Yours to keep: ' + keep.pct + '% of your goal.' : '');
      BE.mobile.push('Your budgets this week', body, 'MobileBudgets.dc.html', 'budgets');
    }
  };
})();
