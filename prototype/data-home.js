/* Home: what BillingEase did for you, notifications, and the helpers Home uses
   to work out what needs you (shared by ThreeHome and ThreeMobile). */
(function () {
  BE.define('activity', [
    { id: 'act-1', t: 'Matched Atlas Freight’s $6,300 payment to invoice INV-0153', when: 'Today, 7:42 AM' },
    { id: 'act-2', t: 'Imported 23 transactions from Chase and Amex', when: 'Today, 6:00 AM' },
    { id: 'act-3', t: 'Sorted 19 expenses into the right categories', when: 'Yesterday' },
    { id: 'act-4', t: 'Moved $2,803 into your tax set-aside', when: 'Oct 1' },
    { id: 'act-5', t: 'Sent automatic reminders to Lumen Dental Group', when: 'Sep 30' },
    { id: 'act-6', t: 'Matched the Staples receipt to an Amex charge', when: 'Sep 29' },
    { id: 'act-7', t: 'Reconciled Chase Business Checking through Sep 30', when: 'Sep 30' },
    { id: 'act-8', t: 'Filed Q3 payroll tax deposit with the IRS', when: 'Sep 28' }
  ]);
  BE.define('notifications', [
    { id: 'ntf-1', title: 'Greenline Architects viewed quote Q-0031', body: 'Lobby wayfinding signage · $4,200 · expires Oct 30', href: 'SellQuote.dc.html#Q-0031', when: 'Oct 3', read: false },
    { id: 'ntf-2', title: 'Ridge Outdoor Supply paid $3,960', body: 'INV-0162 is paid in full', href: 'SellInvoices.dc.html#INV-0162', when: 'Oct 3', read: false },
    { id: 'ntf-3', title: 'October payroll needs your approval', body: '$7,231 to 3 people on Oct 9', href: 'SpendPayroll.dc.html', when: 'Oct 2', read: false },
    { id: 'ntf-4', title: 'Letterpress card set is running low', body: '9 left; you usually reorder at 15', href: 'SellCatalog.dc.html', when: 'Oct 2', read: true },
    { id: 'ntf-5', title: 'NY sales tax is due Oct 20', body: '$412.63 for July to September', href: 'BooksTax.dc.html', when: 'Oct 1', read: true },
    { id: 'ntf-6', title: 'Sam Ortiz hasn’t accepted the team invite', body: 'Sent by Jordan Lee on Oct 2', href: 'BizTeam.dc.html', when: 'Oct 2', read: true }
  ]);

  var ICON = {
    late: 'M12 8v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    sort: 'M4 6h16M4 12h10M4 18h6',
    payroll: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.8'
  };
  var WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
  function nudgedToday(inv) {
    return (inv.events || []).some(function (e) { return /^Friendly nudge/.test(e.label) && e.date === BE.today; });
  }
  function first(name) { return String(name || '').split(/\s+/)[0]; }

  /** Late invoices that are still open (oldest first). */
  BE.lateInvoices = function () {
    return BE.all('invoices').filter(function (i) { return BE.invStatus(i) === 'late'; })
      .sort(function (a, b) { return a.dueIn - b.dueIn; });
  };

  /** Send a personal nudge about a late invoice: adds an event, logs it, returns the invoice. */
  BE.nudgeInvoice = function (num) {
    var inv = BE.find('invoices', num, 'num');
    if (!inv) return null;
    var cust = BE.find('customers', inv.who, 'name');
    var to = (cust && cust.contact) ? first(cust.contact) + ' at ' + inv.who : inv.who;
    var owner = (BE.get('profile') || {}).owner || 'you';
    BE.change(function (s) {
      s.invoices = s.invoices.map(function (x) {
        if (x.num !== num) return x;
        return Object.assign({}, x, { nudged: BE.today, events: (x.events || []).concat([{ label: 'Friendly nudge sent by ' + owner, date: BE.today, todo: false }]) });
      });
      BE._log(s, 'Sent a friendly nudge to ' + to + ' about ' + num + ' · ' + BE.money(BE.invOpen(inv), inv.cur));
    });
    return { inv: inv, to: to };
  };

  /** Approve a payroll run (it still counts as "still to pay" until payday). */
  BE.approvePayroll = function (id) {
    var run = BE.find('payroll', id);
    if (!run) return null;
    BE.change(function (s) {
      s.payroll = s.payroll.map(function (r) {
        if (r.id !== id) return r;
        return Object.assign({}, r, { status: 'approved', approvedOn: BE.today, approvedBy: (s.profile || {}).owner || '' });
      });
      s.notifications = (s.notifications || []).map(function (n) { return n.href === 'SpendPayroll.dc.html' && !n.read ? Object.assign({}, n, { read: true }) : n; });
      BE._log(s, 'Approved ' + (run.label || 'payroll') + ' · ' + BE.money(run.net) + ' to ' + ((run.people || []).length || 'your') + ' people on ' + run.date);
    });
    return run;
  };
  /** Put an approval back (Undo on Home). */
  BE.unapprovePayroll = function (id) {
    var run = BE.find('payroll', id);
    if (!run) return null;
    BE.change(function (s) {
      s.payroll = s.payroll.map(function (r) { return r.id === id ? Object.assign({}, r, { status: 'needs', approvedOn: '', approvedBy: '' }) : r; });
      s.activity = (s.activity || []).filter(function (a) { return !(a.when === 'Just now' && a.t.indexOf('Approved ' + (run.label || 'payroll')) === 0); });
    });
    return run;
  };

  /**
   * What needs you on Home, worked out from the data. Each item:
   * { id, kind: 'late'|'sort'|'payroll', done, icon, tint, title, body, doneText, ... }
   */
  BE.homeNeeds = function () {
    var out = [];
    BE.lateInvoices().forEach(function (inv) {
      var days = -inv.dueIn;
      var cust = BE.find('customers', inv.who, 'name');
      var who = cust && cust.contact ? first(cust.contact) + ' at ' + inv.who : inv.who;
      var reminders = (inv.events || []).filter(function (e) { return /reminder/i.test(e.label) && !e.todo; }).length;
      var why = reminders >= 2 ? WORDS[Math.min(reminders, 6)] + ' automatic reminders didn’t work, so a personal note might.'
        : reminders === 1 ? 'One automatic reminder went out. A personal note usually does it.'
        : 'A short personal note is often all it takes.';
      out.push({
        id: 'late-' + inv.num, kind: 'late', num: inv.num, done: nudgedToday(inv), icon: ICON.late, tint: '#FBE3DF',
        title: inv.who + ' is ' + days + ' day' + (days === 1 ? '' : 's') + ' late',
        body: BE.money(BE.invOpen(inv), inv.cur) + ' for ' + (inv.what || inv.num) + ' (' + inv.num + '). ' + why,
        cta: 'Send a friendly nudge', ctaShort: 'Send a nudge', alt: 'See invoice', altHref: 'SellInvoices.dc.html#' + inv.num,
        doneText: 'Nudge sent to ' + who + ' about ' + inv.num + ' today'
      });
    });
    var ch = BE.all('charges');
    if (ch.length) {
      var total = ch.reduce(function (a, c) { return a + (Number(c.amount) || 0); }, 0);
      var n = ch.length;
      out.push({
        id: 'sort', kind: 'sort', done: false, icon: ICON.sort, tint: '#FFF0B8',
        title: n + ' card charge' + (n === 1 ? '' : 's') + ' need' + (n === 1 ? 's' : '') + ' a category',
        body: (n === 1 ? 'It’s new to us' : 'They’re new to us') + ' (' + BE.money(total, 'USD', { cents: true }) + ' in all). We suggest one for each, so it takes about 20 seconds.',
        cta: 'Sort ' + (n === 1 ? 'it' : 'them'), ctaShort: 'Sort ' + (n === 1 ? 'it' : 'them'), href: 'ThreeOut.dc.html', alt: false, altHref: ''
      });
    }
    BE.all('payroll').forEach(function (r) {
      if (r.status !== 'needs' && r.status !== 'approved') return;
      if (r.status === 'approved' && r.approvedOn !== BE.today) return;
      var ppl = (r.people || []).map(function (p) { return first(p.name); });
      var names = ppl.length > 1 ? ppl.slice(0, -1).join(', ') + ' and ' + ppl[ppl.length - 1] : (ppl[0] || 'Your team');
      out.push({
        id: 'pay-' + r.id, kind: 'payroll', runId: r.id, done: r.status === 'approved', icon: ICON.payroll, tint: '#EEE8FF',
        title: 'Approve ' + (r.label || 'payroll') + ' · ' + BE.money(r.net),
        body: (ppl.length || 'Your') + ' ' + (ppl.length === 1 ? 'person' : 'people') + ', paid ' + r.date + ' by direct deposit. Payroll taxes are filed for you.',
        cta: 'Approve', ctaShort: 'Approve', alt: 'Review', altHref: 'SpendPayroll.dc.html',
        doneText: 'Payroll approved. ' + names + ' get' + (ppl.length === 1 ? 's' : '') + ' paid ' + r.date + '.'
      });
    });
    return out;
  };

  /** Is a bank connected? Reads whatever the books screens keep. */
  BE.bankConnected = function () {
    var p = BE.get('profile') || {};
    if (p.bankConnected) return true;
    var b = BE.get('bank');
    if (b && (b.connected || (Array.isArray(b) && b.length))) return true;
    var a = BE.all('bankAccounts').concat(BE.all('accounts')).concat(BE.all('banks'));
    return a.some(function (x) { return x && x.connected !== false; });
  };

  /** The "Get started" checklist for a brand new business, ticked from the data. */
  BE.homeChecklist = function () {
    var items = [
      { id: 'cust', label: 'Add a customer', hint: 'Who you work for and how to reach them', href: 'SellCustomers.dc.html', done: BE.all('customers').length > 0 },
      { id: 'inv', label: 'Send your first invoice', hint: 'One sentence is enough; it adds to Coming in', href: 'ThreeIn.dc.html#bill', done: BE.all('invoices').some(function (i) { return !i.draft; }) },
      { id: 'exp', label: 'Record an expense', hint: 'Something you already paid for; it adds to Going out', href: 'ThreeOut.dc.html#expense', done: BE.all('expenses').length > 0 || BE.all('bills').length > 0 },
      { id: 'bank', label: 'Connect your bank', hint: 'So we can bring in charges and check your books', href: 'BooksReconcile.dc.html', done: BE.bankConnected() },
      { id: 'team', label: 'Invite your team', hint: 'Or your accountant. Skip it if it’s just you', href: 'BizTeam.dc.html', done: BE.all('team').some(function (t) { return t.role !== 'Owner'; }) }
    ];
    var done = items.filter(function (i) { return i.done; }).length;
    return { items: items, done: done, total: items.length, all: done === items.length };
  };
})();
