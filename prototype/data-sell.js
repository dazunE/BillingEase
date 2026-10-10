/* Coming in: quotes, repeating invoices, money back, products and services, time to bill.
   Owned by the Coming in tools (SellQuotes, SellQuote, SellRecurring, SellCatalog, SellCustomers, SellCustomer). */
(function () {
  var L = function (name, kind, unit, qty, rate) { return { name: name, kind: kind, unit: unit, qty: qty, rate: rate }; };

  // Quotes (estimates). state: draft | waiting | changes | accepted | declined. Quotes never count in the three numbers;
  // invoicing an accepted one (BE.quoteToInvoice) adds it to Coming in.
  BE.define('quotes', [
    { num: 'Q-0031', who: 'Greenline Architects', title: 'Lobby wayfinding signage', cur: 'USD', state: 'waiting', created: 'Sep 29', sent: 'Sep 30', viewed: 'Oct 3', expires: 'Oct 30', deposit: 30,
      note: 'Thanks for the walkthrough last week. Here’s the plan we talked about: a strategy session with your team, then design time for the lobby and floor signs.',
      lines: [L('Brand strategy workshop', 'service', 'jobs', 1, 1800), L('Design hours', 'service', 'hours', 20, 120)] },
    { num: 'Q-0032', who: 'Kaffeehaus Berlin GmbH', title: 'Café rebrand', cur: 'EUR', state: 'draft', created: 'Oct 2', expires: '', deposit: 50, note: '',
      lines: [L('Brand strategy workshop', 'service', 'jobs', 1, 1650), L('Design hours', 'service', 'hours', 35, 110), L('Website page design', 'service', 'pages', 1, 1000)] },
    { num: 'Q-0029', who: 'Lumen Dental Group', title: 'Patient brochure set', cur: 'USD', state: 'accepted', created: 'Sep 8', sent: 'Sep 8', viewed: 'Sep 9', accepted: 'Sep 12', invoice: 'INV-0163', invoices: ['INV-0163'], invoiceAmt: 3200, fullyBilled: true, deposit: 0, note: '',
      lines: [L('Design hours', 'service', 'hours', 20, 120), L('Brochure print proofs', 'service', 'jobs', 1, 800)] },
    { num: 'Q-0027', who: 'Harbor & Pine Café', title: 'Menu and window refresh', cur: 'USD', state: 'declined', created: 'Sep 15', sent: 'Sep 15', viewed: 'Sep 16', declined: 'Sep 22', reason: 'Going with a cheaper option', deposit: 0, note: '',
      lines: [L('Brand strategy workshop', 'service', 'jobs', 1, 1800), L('Menu photo touch-ups', 'service', 'jobs', 1, 100)] }
  ]);

  // Repeating invoices. Each run makes a normal invoice (repeat: true) through BE.createInvoice.
  BE.define('recurring', [
    { id: 'rec-bluebird', who: 'Bluebird Yoga', what: 'Monthly social retainer', cur: 'USD', amount: 540, day: 1, how: 'auto', card: 'Visa ••4242', ends: 'never', count: 14, paused: false, skip: false, last: 'INV-0164' },
    { id: 'rec-thistle', who: 'Thistle & Co. Ltd', what: 'Monthly design retainer', cur: 'GBP', amount: 1200, day: 15, how: 'email', ends: 'never', count: 7, paused: false, skip: false, last: 'INV-0159' }
  ]);

  // Money back. kind: apply (taken off an open invoice), refund (paid back; recorded in Going out under Refunds), credit (held for next time).
  BE.define('creditNotes', [
    { id: 'cn-4', num: 'CN-0004', who: 'Oak Street Bakery', inv: 'INV-0165', date: 'Oct 3', amount: 120, cur: 'USD', reason: 'Misprinted menu boards', kind: 'apply', how: 'Taken off INV-0165 ($1,535 → $1,415)' }
  ]);

  // Catalog.
  BE.define('services', [
    { id: 'svc-strategy', name: 'Brand strategy workshop', price: 1800, rt: 'flat', unit: 'workshop' },
    { id: 'svc-design', name: 'Design hours', price: 120, rt: 'hourly', unit: 'hour' },
    { id: 'svc-social', name: 'Monthly social retainer', price: 540, rt: 'monthly', unit: 'month' },
    { id: 'svc-web', name: 'Website page design', price: 950, rt: 'flat', unit: 'page' },
    { id: 'svc-photo', name: 'Photo editing', price: 85, rt: 'hourly', unit: 'hour' }
  ]);
  BE.define('products', [
    { id: 'prd-kit', name: 'Printed brand kit', price: 65, cost: 22, stock: 48, reorder: 15, unit: 'kits' },
    { id: 'prd-pin', name: 'Enamel logo pin', price: 8, cost: 2.1, stock: 310, reorder: 100, unit: 'pins' },
    { id: 'prd-cards', name: 'Letterpress card set', price: 24, cost: 7.5, stock: 9, reorder: 15, unit: 'sets' },
    { id: 'prd-tote', name: 'Tote bag', price: 28, cost: 9, stock: 0, reorder: 20, unit: 'bags' }
  ]);
  BE.define('stockLog', [
    { id: 'stk-1', name: 'Tote bag', reason: 'Counted stock, set to 0', who: 'Jordan Lee', date: 'Sep 30', change: '−6' }
  ]);
  // Time your team logged. inv: the invoice it was billed on (null = not billed yet).
  BE.define('time', [
    { id: 'tm-1', person: 'Priya Nair', who: 'Greenline Architects', svc: 'Design hours', rate: 120, date: 'Oct 2', hours: 3.5, inv: null },
    { id: 'tm-2', person: 'Priya Nair', who: 'Greenline Architects', svc: 'Design hours', rate: 120, date: 'Oct 3', hours: 3, inv: null },
    { id: 'tm-3', person: 'Maya Chen', who: 'Atlas Freight Co.', svc: 'Design hours', rate: 120, date: 'Sep 29', hours: 4, inv: 'INV-0156' }
  ]);

  // ---- helpers -------------------------------------------------------------
  var EU = ['Germany', 'France', 'Ireland', 'Netherlands', 'Spain', 'Italy', 'Austria', 'Belgium'];
  /** 'US' | 'EU' | 'UK' | 'other' for a customer name. Unknown customers count as home (US). */
  BE.regionOf = function (who) {
    var c = BE.find('customers', who, 'name');
    var country = c ? c.country : 'United States';
    if (!country || country === 'United States') return 'US';
    if (country === 'United Kingdom') return 'UK';
    return EU.indexOf(country) >= 0 ? 'EU' : 'other';
  };
  /** Lines, NY sales tax on product lines for US customers, and total, in the quote's currency. */
  BE.quoteTotals = function (q) {
    var lines = (q && q.lines) || [];
    var sub = 0, prod = 0;
    lines.forEach(function (l) { var a = (BE.num(l.qty)) * (BE.num(l.rate)); sub += a; if (l.kind === 'product') prod += a; });
    var tax = BE.regionOf(q.who) === 'US' ? Math.round(prod * 0.08875 * 100) / 100 : 0;
    sub = Math.round(sub * 100) / 100;
    return { sub: sub, tax: tax, total: Math.round((sub + tax) * 100) / 100 };
  };

  BE.acceptQuote = function (num, how) {
    var q = BE.update('quotes', num, { state: 'accepted', accepted: BE.today, acceptedHow: how || '' }, 'num');
    if (q) {
      BE.log(q.who + ' accepted quote ' + num + ' · ' + BE.money(BE.quoteTotals(q).total, q.cur));
      BE.notify(q.who + ' accepted ' + num, q.title + ' · ready to invoice', 'SellQuote.dc.html#' + num);
    }
    return q;
  };

  /** Turn an accepted quote into a sent invoice (all of it, or just the deposit). Returns the invoice. */
  BE.quoteToInvoice = function (num, opts) {
    opts = opts || {};
    var q = BE.find('quotes', num, 'num');
    if (!q) return null;
    var t = BE.quoteTotals(q);
    var depositOnly = !!opts.deposit && q.deposit > 0;
    var lines, tax = t.tax;
    if (opts.rest) {
      var billed = (q.invoices || []).reduce(function (a, n) { var i = BE.find('invoices', n, 'num'); return a + (i && !i.void ? BE.invTotal(i) : 0); }, 0);
      lines = [{ name: 'Balance for ' + q.title + ' (quote ' + num + ', after the deposit)', qty: 1, unit: 'job', rate: Math.round((t.total - billed) * 100) / 100 }];
      tax = 0;
    } else if (depositOnly) {
      var dep = Math.round(t.total * q.deposit) / 100;
      lines = [{ name: q.deposit + '% deposit for ' + q.title + ' (quote ' + num + ')', qty: 1, unit: 'job', rate: dep }];
      tax = 0;
    } else {
      lines = q.lines.map(function (l) { return { name: l.name, qty: BE.num(l.qty), unit: l.unit, rate: BE.num(l.rate), kind: l.kind }; });
    }
    var inv = BE.createInvoice({ from: num, who: q.who, what: q.title + (depositOnly ? ' (deposit)' : opts.rest ? ' (balance)' : ''), cur: q.cur, lines: lines, tax: tax, terms: opts.terms == null ? 30 : opts.terms,
      vat: BE.regionOf(q.who) === 'EU' ? 'VAT reverse charged to the customer' : '' });
    BE.update('invoices', inv.num, function (x) { return { events: [{ label: 'Made from accepted quote ' + num, date: BE.today, todo: false }].concat(x.events || []) }; }, 'num');
    var amt = BE.invTotal(inv);
    BE.update('quotes', num, function (x) {
      return { state: 'accepted', accepted: x.accepted || BE.today, invoice: x.invoice || inv.num, invoices: (x.invoices || []).concat([inv.num]),
        invoiceAmt: Math.round(((x.invoiceAmt && x.invoice ? x.invoiceAmt : 0) + BE.usd(amt, q.cur)) * 100) / 100, depositBilled: depositOnly || x.depositBilled || false, fullyBilled: !depositOnly || x.fullyBilled || false };
    }, 'num');
    return BE.find('invoices', inv.num, 'num');
  };

  /** Money back against an invoice. way: apply | refund | credit. Amount in the invoice currency. */
  BE.giveMoneyBack = function (o) {
    var inv = BE.find('invoices', o.inv, 'num');
    if (!inv) return null;
    var amt = Math.round((Number(o.amount) || 0) * 100) / 100;
    var cnNum = BE.nextNumber('CN');
    var before = BE.invTotal(inv);
    var how = o.way === 'apply' ? 'Taken off ' + inv.num + ' (' + BE.money(before, inv.cur) + ' → ' + BE.money(before - amt, inv.cur) + ')'
      : o.way === 'refund' ? 'Refunded on ' + inv.num + ' · recorded in Going out under Refunds'
      : 'Held as credit for their next invoice';
    var cn = { id: BE.id('cn'), num: cnNum, who: inv.who, inv: inv.num, date: BE.today, amount: amt, cur: inv.cur, reason: o.reason || 'Goodwill', kind: o.way, how: how, isNew: true };
    BE.change(function (s) {
      s.creditNotes = [cn].concat(s.creditNotes || []);
      if (o.way === 'apply') {
        s.invoices = s.invoices.map(function (x) {
          if (x.num !== inv.num) return x;
          return Object.assign({}, x, { credit: Math.round(((Number(x.credit) || 0) + amt) * 100) / 100,
            events: (x.events || []).filter(function (e) { return !e.todo; }).concat([{ label: 'Money back ' + cnNum + ' applied, ' + BE.money(amt, x.cur) + ' for ' + String(cn.reason).toLowerCase(), date: BE.today, todo: false }], (x.events || []).filter(function (e) { return e.todo; })) });
        });
      }
      BE._log(s, 'Issued ' + cnNum + ' to ' + inv.who + ' · ' + BE.money(amt, inv.cur) + ' (' + (o.way === 'apply' ? 'taken off ' + inv.num : o.way === 'refund' ? 'refund' : 'credit held') + ')');
    });
    if (o.way === 'refund') {
      BE.addExpense({ who: inv.who, cat: 'Refunds', amount: Math.round(BE.usd(amt, inv.cur) * 100) / 100, how: inv.paidHow && /card|apple/i.test(inv.paidHow) ? 'Card refund' : 'Chase ••4417', note: 'Refund ' + cnNum + ' on ' + inv.num + ': ' + cn.reason });
    }
    return cn;
  };

  /** Send this month's run of a repeating invoice now. */
  BE.runRecurring = function (id) {
    var p = BE.find('recurring', id);
    if (!p) return null;
    var inv = BE.createInvoice({ who: p.who, what: p.what, cur: p.cur, repeat: true, terms: 30,
      lines: [{ name: p.what, qty: 1, unit: 'month', rate: Number(p.amount) || 0 }] });
    BE.update('invoices', inv.num, function (x) { return { events: [{ label: 'Made from a repeating invoice (sent early by hand)', date: BE.today, todo: false }].concat(x.events || []) }; }, 'num');
    BE.update('recurring', id, function (x) { return { count: (x.count || 0) + 1, last: inv.num, skip: false }; });
    return inv;
  };

  /** Put a customer's unbilled hours on a new invoice and mark them billed. */
  BE.billTime = function (who, ids) {
    var entries = BE.all('time').filter(function (t) { return !t.inv && t.who === who && (!ids || ids.indexOf(t.id) >= 0); });
    if (!entries.length) return null;
    var bySvc = {};
    entries.forEach(function (t) { var k = t.svc + '|' + t.rate; bySvc[k] = bySvc[k] || { name: t.svc, qty: 0, unit: 'hours', rate: t.rate }; bySvc[k].qty += t.hours; });
    var lines = Object.keys(bySvc).map(function (k) { return bySvc[k]; });
    var inv = BE.createInvoice({ who: who, what: 'Logged hours, ' + entries.map(function (t) { return t.date; }).filter(function (d, i, a) { return a.indexOf(d) === i; }).join(', '), lines: lines, terms: 30 });
    var idset = entries.map(function (t) { return t.id; });
    BE.change(function (s) { s.time = s.time.map(function (t) { return idset.indexOf(t.id) >= 0 ? Object.assign({}, t, { inv: inv.num }) : t; }); });
    return inv;
  };

  /** Set a product's stock count and log why. */
  BE.adjustStock = function (id, count, reason, who) {
    var p = BE.find('products', id);
    if (!p) return null;
    var delta = count - p.stock;
    BE.change(function (s) {
      s.products = s.products.map(function (x) { return x.id === id ? Object.assign({}, x, { stock: count }) : x; });
      s.stockLog = [{ id: BE.id('stk'), name: p.name, reason: reason || 'Counted stock', who: who || (s.profile && s.profile.owner) || 'You', date: BE.today, change: (delta > 0 ? '+' : '−') + Math.abs(delta) }].concat(s.stockLog || []);
      BE._log(s, p.name + ' stock ' + p.stock + ' → ' + count + ' (' + String(reason || 'counted').toLowerCase() + ')');
    });
    return BE.find('products', id);
  };
})();
