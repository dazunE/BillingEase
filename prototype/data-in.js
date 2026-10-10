/* Coming in: invoices, payments received and customers (sample month: October 2026). */
(function () {
  var L = function (name, qty, unit, rate) { return { name: name, qty: qty, unit: unit, rate: rate }; };
  var E = function (label, date, todo) { return { label: label, date: date, todo: !!todo }; };
  var I = function (num, what, amt, status, sub, kind) { return { num: num, what: what, amt: amt, status: status, sub: sub, kind: kind }; };

  // Every invoice. Open ones with inMonth count toward this month's "expected" Coming in.
  BE.define('invoices', [
        { num: 'INV-0156', who: 'Atlas Freight Co.', what: 'Fleet rebrand, phase 2', cur: 'USD', lines: [L('Brand strategy workshop', 1, 'job', 1800), L('Design hours', 37.5, 'hours', 120)], tax: 0, credit: 0, paid: 0, issued: 'Sep 23', due: 'Oct 7', dueIn: 3, inMonth: true, viewed: true, email: 'ap@atlasfreight.co',
          events: [E('Sent to ap@atlasfreight.co', 'Sep 23'), E('Viewed by Marcus Bell', 'Oct 3'), E('Automatic reminder', 'Oct 4', true), E('Due', 'Oct 7', true)] },
        { num: 'INV-0157', who: 'Greenline Architects', what: 'Office signage', cur: 'USD', lines: [L('Design hours', 8, 'hours', 120), L('Signage proofs and install visit', 1, 'job', 915)], tax: 0, credit: 0, paid: 880, issued: 'Sep 28', due: 'Oct 12', dueIn: 8, inMonth: true, viewed: true, email: 'tom@greenlinearch.com',
          events: [E('Sent to tom@greenlinearch.com', 'Sep 28'), E('Viewed by Tom Reyes', 'Sep 29'), E('Deposit of $880 paid by bank transfer', 'Oct 2'), E('Automatic reminder', 'Oct 9', true), E('Balance due', 'Oct 12', true)] },
        { num: 'INV-0163', who: 'Lumen Dental Group', what: 'Patient brochure set', cur: 'USD', lines: [L('Design hours', 20, 'hours', 120), L('Brochure print proofs', 1, 'job', 800)], tax: 0, credit: 0, paid: 0, issued: 'Oct 1', due: 'Oct 20', dueIn: 16, inMonth: true, viewed: false, email: 'office@lumendental.com', from: 'Q-0029',
          events: [E('Made from accepted quote Q-0029', 'Oct 1'), E('Sent to office@lumendental.com', 'Oct 1'), E('Automatic reminder', 'Oct 17', true), E('Due', 'Oct 20', true)] },
        { num: 'INV-0165', who: 'Oak Street Bakery', what: 'Holiday menu and signage', cur: 'USD', lines: [L('Design hours', 10, 'hours', 120), L('Holiday menu layout', 1, 'job', 335)], tax: 0, credit: 120, paid: 0, issued: 'Sep 28', due: 'Oct 28', dueIn: 24, inMonth: true, viewed: true, email: 'rosa@oakstreetbakery.com',
          events: [E('Sent to rosa@oakstreetbakery.com', 'Sep 28'), E('Money back CN-0004 applied, $120 for misprinted menu boards', 'Oct 3'), E('Viewed by Rosa Medina', 'Oct 4'), E('Due', 'Oct 28', true)] },
        { num: 'INV-0164', who: 'Bluebird Yoga', what: 'Monthly social posts', cur: 'USD', lines: [L('Monthly social retainer', 1, 'month', 540)], tax: 0, credit: 0, paid: 0, issued: 'Oct 1', due: 'Oct 31', dueIn: 27, inMonth: true, viewed: false, email: 'anya@bluebirdyoga.com', repeat: true,
          events: [E('Made automatically (repeats monthly)', 'Oct 1'), E('Sent to anya@bluebirdyoga.com', 'Oct 1'), E('Card on file (Visa ••4242) charged', 'Oct 31', true)] },
        { num: 'INV-0158', who: 'Kaffeehaus Berlin GmbH', what: 'Café menu and signage design', cur: 'EUR', lines: [L('Brand strategy workshop', 1, 'job', 1650), L('Design hours', 30, 'hours', 105)], tax: 0, credit: 0, paid: 0, issued: 'Sep 8', due: 'Nov 7', dueIn: 34, inMonth: false, viewed: true, email: 'buchhaltung@kaffeehaus-berlin.de', rate0: 1.12, vat: 'VAT reverse charged to the customer (VAT ID DE 812 345 678)',
          events: [E('Sent to buchhaltung@kaffeehaus-berlin.de', 'Sep 8'), E('Viewed by Lena Vogel', 'Sep 9'), E('Automatic reminder', 'Nov 4', true), E('Due', 'Nov 7', true)] },
        { num: 'INV-0159', who: 'Thistle & Co. Ltd', what: 'September design retainer', cur: 'GBP', lines: [L('Monthly design retainer', 1, 'month', 1200)], tax: 0, credit: 0, paid: 0, issued: 'Sep 15', due: 'Nov 14', dueIn: 41, inMonth: false, viewed: true, email: 'accounts@thistleandco.co.uk', rate0: 1.24, vat: 'No UK VAT added: Northwind Studio isn’t VAT-registered in the UK',
          events: [E('Made automatically (repeats monthly)', 'Sep 15'), E('Sent to accounts@thistleandco.co.uk', 'Sep 15'), E('Viewed by Fiona Grant', 'Sep 16'), E('Due', 'Nov 14', true)] },
        { num: 'INV-0142', who: 'Harbor & Pine Café', what: 'August menu design', cur: 'USD', lines: [L('Design hours', 14, 'hours', 120), L('Menu photography day', 1, 'job', 800)], tax: 0, credit: 0, paid: 0, issued: 'Aug 3', due: 'Sep 2', dueIn: -32, inMonth: false, viewed: true, email: 'daniel@harborandpine.cafe',
          events: [E('Sent to daniel@harborandpine.cafe', 'Aug 3'), E('Viewed by Daniel Brooks', 'Aug 4'), E('Was due', 'Sep 2'), E('Automatic reminder, no answer', 'Sep 9'), E('Automatic reminder, no answer', 'Sep 23')] },
        { num: 'INV-0151', who: 'Lumen Dental Group', what: 'Website photo shoot', cur: 'USD', lines: [L('Photo shoot, half day', 1, 'job', 640), L('Photo editing', 6, 'hours', 85)], tax: 0, credit: 0, paid: 0, issued: 'Aug 29', due: 'Sep 28', dueIn: -6, inMonth: false, viewed: true, email: 'office@lumendental.com',
          events: [E('Sent to office@lumendental.com', 'Aug 29'), E('Viewed by Hannah Lowe', 'Aug 30'), E('Was due', 'Sep 28'), E('Automatic reminder', 'Oct 1')] },
        { num: 'INV-0162', who: 'Ridge Outdoor Supply', what: 'Fall product catalog', cur: 'USD', lines: [L('Design hours', 33, 'hours', 120)], tax: 0, credit: 0, paid: 3960, paidHow: 'card', paidOn: 'Oct 3', issued: 'Sep 19', due: 'Oct 19', dueIn: 15, inMonth: true, viewed: true, email: 'ken@ridgeoutdoor.com',
          events: [E('Sent to ken@ridgeoutdoor.com', 'Sep 19'), E('Viewed by Ken Park', 'Sep 21'), E('Paid $3,960 by card', 'Oct 3')] },
        { num: 'INV-0153', who: 'Atlas Freight Co.', what: 'Fleet rebrand, phase 1', cur: 'USD', lines: [L('Brand strategy workshop', 1, 'job', 1800), L('Design hours', 37.5, 'hours', 120)], tax: 0, credit: 0, paid: 6300, paidHow: 'bank transfer', paidOn: 'Oct 2', issued: 'Sep 2', due: 'Oct 2', dueIn: -2, inMonth: true, viewed: true, email: 'ap@atlasfreight.co',
          events: [E('Sent to ap@atlasfreight.co', 'Sep 2'), E('Viewed by Marcus Bell', 'Sep 3'), E('Paid $6,300 by bank transfer', 'Oct 2')] },
        { num: 'INV-0160', who: 'Oak Street Bakery', what: 'Menu photo layout', cur: 'USD', lines: [L('Design hours', 6, 'hours', 120)], tax: 0, credit: 0, paid: 720, paidHow: 'card', paidOn: 'Oct 1', issued: 'Sep 17', due: 'Oct 17', dueIn: 13, inMonth: true, viewed: true, email: 'rosa@oakstreetbakery.com',
          events: [E('Sent to rosa@oakstreetbakery.com', 'Sep 17'), E('Viewed by Rosa Medina', 'Sep 18'), E('Paid $720 by card', 'Oct 1')] },
        { num: 'INV-0161', who: 'Bluebird Yoga', what: 'Monthly social posts', cur: 'USD', lines: [L('Monthly social retainer', 1, 'month', 540)], tax: 0, credit: 0, paid: 540, paidHow: 'Apple Pay', paidOn: 'Oct 1', issued: 'Sep 1', due: 'Oct 1', dueIn: -3, inMonth: true, viewed: true, email: 'anya@bluebirdyoga.com', repeat: true,
          events: [E('Made automatically (repeats monthly)', 'Sep 1'), E('Sent to anya@bluebirdyoga.com', 'Sep 1'), E('Paid $540 with Apple Pay', 'Oct 1')] },
        { num: 'D-2', draft: true, who: 'Ridge Outdoor Supply', what: 'Printed brand kits for their stores', cur: 'USD', lines: [L('Printed brand kit', 12, 'kits', 65)], tax: 69.23, credit: 0, paid: 0, issued: 'Oct 3', due: '', dueIn: 99, inMonth: false, email: 'ken@ridgeoutdoor.com',
          events: [E('Started by Priya Nair', 'Oct 3')] },
        { num: 'D-1', draft: true, who: 'Bluebird Yoga', what: 'Studio photo editing', cur: 'USD', lines: [L('Photo editing', 6, 'hours', 85)], tax: 0, credit: 0, paid: 0, issued: 'Oct 2', due: '', dueIn: 99, inMonth: false, email: 'anya@bluebirdyoga.com',
          events: [E('Started by Maya Chen', 'Oct 2')] }
      ]);

  // Money received this month (USD). These make up "paid" in Coming in: $12,400.
  BE.define('payments', [
    { id: 'pay-1', inv: 'INV-0162', who: 'Ridge Outdoor Supply', amount: 3960, cur: 'USD', how: 'Card', date: 'Oct 3', inMonth: true },
    { id: 'pay-2', inv: 'INV-0153', who: 'Atlas Freight Co.', amount: 6300, cur: 'USD', how: 'Bank payment', date: 'Oct 2', inMonth: true },
    { id: 'pay-3', inv: 'INV-0157', who: 'Greenline Architects', amount: 880, cur: 'USD', how: 'Bank payment', date: 'Oct 2', inMonth: true, deposit: true },
    { id: 'pay-4', inv: 'INV-0160', who: 'Oak Street Bakery', amount: 720, cur: 'USD', how: 'Card', date: 'Oct 1', inMonth: true },
    { id: 'pay-5', inv: 'INV-0161', who: 'Bluebird Yoga', amount: 540, cur: 'USD', how: 'Apple Pay', date: 'Oct 1', inMonth: true }
  ]);

  // Customers. Their invoices, quotes, repeats and credits come from those collections (match on name);
  // the legacy summary arrays below are kept for reference only.
  BE.define('customers', [
        { id: 'atlas', name: 'Atlas Freight Co.', contact: 'Marcus Bell', email: 'ap@atlasfreight.co', phone: '(718) 555-0142', address: '410 Industrial Way, Newark, NJ 07105', country: 'United States', cur: 'USD', tax: '', since: 'Customer since March 2025', paid: 31500,
          note: 'Pays by bank transfer on the due date. Phase 3 (the trucks) is planned for January.',
          invoices: [I('INV-0156', 'Fleet rebrand, phase 2', 6300, 'Due in 3 days', 'Due Oct 7 · viewed Oct 3', 'soon')], quotes: [], recurring: [], credits: [] },
        { id: 'bluebird', name: 'Bluebird Yoga', contact: 'Anya Patel', email: 'anya@bluebirdyoga.com', phone: '(347) 555-0188', address: '88 Bergen St, Brooklyn, NY 11201', country: 'United States', cur: 'USD', tax: '', since: 'Customer since August 2025', paid: 5400,
          note: 'Card on file pays the retainer. Anya asked about studio photo editing for the new space.',
          invoices: [I('INV-0164', 'Monthly social posts', 540, 'Sent', 'Due Oct 31 · repeats monthly', 'sent')], quotes: [],
          recurring: [{ title: 'Monthly social retainer', sub: 'Every month on the 1st · charges Visa ••4242 · 14 sent so far', amt: 540, status: 'Active' }], credits: [] },
        { id: 'greenline', name: 'Greenline Architects', contact: 'Tom Reyes', email: 'tom@greenlinearch.com', phone: '(212) 555-0107', address: '250 Hudson St, New York, NY 10013', country: 'United States', cur: 'USD', tax: '', since: 'Customer since January 2026', paid: 7480,
          note: 'Tom approves; their office manager pays. Likes a deposit up front.',
          invoices: [I('INV-0157', 'Office signage, balance', 995, 'Part paid', '$880 deposit paid Oct 2 · due Oct 12', 'part')],
          quotes: [{ title: 'Q-0031 · Lobby wayfinding signage', sub: 'Sent Sep 30 · expires Oct 30', amt: 4200, status: 'Viewed Oct 3', kind: 'viewed' }], recurring: [], credits: [] },
        { id: 'harbor', name: 'Harbor & Pine Café', contact: 'Daniel Brooks', email: 'daniel@harborandpine.cafe', phone: '(718) 555-0163', address: '19 Water St, Brooklyn, NY 11201', country: 'United States', cur: 'USD', tax: '', since: 'Customer since May 2026', paid: 1200,
          note: 'Two automatic reminders went unanswered. Call Daniel before sending another.',
          invoices: [I('INV-0142', 'August menu design', 2480, '32 days late', 'Was due Sep 2', 'late')],
          quotes: [{ title: 'Q-0027 · Menu and window refresh', sub: 'Declined Sep 22: “Going with a cheaper option”', amt: 1900, status: 'Declined', kind: 'declined' }], recurring: [], credits: [] },
        { id: 'kaffee', name: 'Kaffeehaus Berlin GmbH', contact: 'Lena Vogel', email: 'buchhaltung@kaffeehaus-berlin.de', phone: '+49 30 5550 1820', address: 'Oranienstraße 24, 10999 Berlin', country: 'Germany', cur: 'EUR', tax: 'DE 812 345 678', since: 'Customer since February 2026', paid: 3520, paidCur: 3200,
          note: 'EU business, so VAT is reverse charged to them. Net 60 terms.',
          invoices: [I('INV-0158', 'Café menu and signage design', 4800, 'Viewed', 'Due Nov 7', 'viewed')],
          quotes: [{ title: 'Q-0032 · Café rebrand', sub: 'Draft, not sent yet', amt: 6500, status: 'Draft', kind: 'draft' }], recurring: [], credits: [] },
        { id: 'lumen', name: 'Lumen Dental Group', contact: 'Hannah Lowe', email: 'office@lumendental.com', phone: '(917) 555-0124', address: '1 Atlantic Ave, Brooklyn, NY 11201', country: 'United States', cur: 'USD', tax: '', since: 'Customer since November 2025', paid: 9600,
          note: 'Usually pays within two weeks of the due date.',
          invoices: [I('INV-0151', 'Website photo shoot', 1150, '6 days late', 'Was due Sep 28', 'late'), I('INV-0163', 'Patient brochure set', 3200, 'Sent', 'Due Oct 20 · from quote Q-0029', 'sent')],
          quotes: [{ title: 'Q-0029 · Patient brochure set', sub: 'Accepted Sep 12 · became INV-0163', amt: 3200, status: 'Accepted', kind: 'paid' }], recurring: [], credits: [] },
        { id: 'oak', name: 'Oak Street Bakery', contact: 'Rosa Medina', email: 'rosa@oakstreetbakery.com', phone: '(718) 555-0119', address: '312 Oak St, Brooklyn, NY 11222', country: 'United States', cur: 'USD', tax: '', since: 'Customer since April 2025', paid: 4260,
          note: '',
          invoices: [I('INV-0165', 'Holiday menu and signage', 1415, 'Viewed', 'Due Oct 28 · $120 taken off', 'viewed')], quotes: [], recurring: [],
          credits: [{ title: 'CN-0004 · Misprinted menu boards', sub: 'Oct 3 · taken off INV-0165 ($1,535 → $1,415)', amt: 120, status: 'Applied' }] },
        { id: 'ridge', name: 'Ridge Outdoor Supply', contact: 'Ken Park', email: 'ken@ridgeoutdoor.com', phone: '(845) 555-0176', address: '75 Main St, New Paltz, NY 12561', country: 'United States', cur: 'USD', tax: '', since: 'Customer since June 2025', paid: 12740,
          note: 'Pays by card the day the invoice arrives. Interested in brand kits for their stores.',
          invoices: [], quotes: [], recurring: [], credits: [], draft: 'A draft for 12 printed brand kits ($849.23) is waiting in All invoices.' },
        { id: 'thistle', name: 'Thistle & Co. Ltd', contact: 'Fiona Grant', email: 'accounts@thistleandco.co.uk', phone: '+44 131 555 0190', address: '12 Rose Street, Edinburgh EH2 2PR', country: 'United Kingdom', cur: 'GBP', tax: 'GB 284 991 763', since: 'Customer since March 2026', paid: 9150, paidCur: 7200,
          note: 'Pays by bank transfer in pounds. Retainer reviewed each March.',
          invoices: [I('INV-0159', 'September design retainer', 1200, 'Viewed', 'Due Nov 14', 'viewed')], quotes: [],
          recurring: [{ title: 'Monthly design retainer', sub: 'Every month on the 15th · emailed · 7 sent so far · next Oct 15', amt: 1200, status: 'Active' }], credits: [] }
      ]);

  // Getting paid online: which methods new invoices offer, payouts and the one open card dispute.
  BE.define('paySettings', {
    live: false, legal: 'Northwind Studio LLC', ein: '', payoutTo: 'Chase ••4417',
    methods: { card: true, bank: true, apple: true }, saveCards: true, passFee: false, sched: 'daily', day: 'Friday',
    dispute: { state: 'open', inv: 'INV-0160', who: 'Oak Street Bakery', contact: 'Rosa Medina', amount: 720, fee: 15, card: 'Visa ••8812', by: 'Oct 17' }
  }, {
    live: false, legal: '', ein: '', payoutTo: '',
    methods: { card: true, bank: true, apple: true }, saveCards: true, passFee: false, sched: 'daily', day: 'Friday',
    dispute: null
  });

  // ---- Coming in helpers (used by ThreeIn, SellInvoices, SellInvoice, SellPayments) ----
  var ONLINE = { 'Card': 1, 'Apple Pay': 1, 'Bank payment': 1 };
  /** The customer record for a name on an invoice (or null). */
  BE.customerOf = function (name) { return BE.find('customers', name, 'name'); };
  /** Where a customer's name should link. */
  BE.customerHref = function (name) { var c = BE.customerOf(name); return c ? 'SellCustomer.dc.html#' + c.id : 'SellCustomers.dc.html'; };
  /** Add a customer with just a name (and optionally email/currency). Returns it. */
  BE.addCustomer = function (o) {
    var name = String(o.name || '').trim();
    var base = name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'customer';
    var id = base, n = 2;
    while (BE.find('customers', id)) id = base + '-' + (n++);
    var p = BE.get('profile') || {};
    var c = { id: id, name: name, contact: o.contact || '', email: o.email || '', phone: '', address: '', country: o.country || p.country || 'United States', cur: o.cur || p.currency || 'USD', tax: '',
      since: 'Customer since ' + 'October 2026', paid: 0, note: '', invoices: [], quotes: [], recurring: [], credits: [], isNew: true };
    BE.change(function (s) {
      s.customers = [c].concat(s.customers || []);
      BE._log(s, 'Added ' + name + ' as a customer');
    });
    return c;
  };
  /** Online payments come in through the invoice link; the rest were recorded by hand. */
  BE.payIsOnline = function (p) { return !p.manual && !!ONLINE[p.how] && p.amount > 0; };
  /** What the payment company keeps from an online payment, in USD. */
  BE.payFee = function (p) {
    if (!BE.payIsOnline(p)) return 0;
    var a = Number(p.amount) || 0;
    return Math.round((p.how === 'Bank payment' ? a * 0.01 : a * 0.029 + 0.30) * 100) / 100;
  };
  /** A reminder or nudge you sent: adds it to the invoice's history and to "Handled for you". */
  BE.remindInvoice = function (num, label, logText) {
    return BE.change(function (s) {
      var out = null;
      s.invoices = (s.invoices || []).map(function (x) {
        if (x.num !== num) return x;
        out = Object.assign({}, x, { events: (x.events || []).concat([{ label: label, date: BE.today, todo: false, mine: true }]) });
        return out;
      });
      if (out) BE._log(s, logText || (label + ' · ' + num));
      return out;
    });
  };
  /** Take back the last event you added to an invoice with remindInvoice. */
  BE.undoReminder = function (num, label) {
    return BE.update('invoices', num, function (x) {
      var ev = (x.events || []).slice(), i;
      for (i = ev.length - 1; i >= 0; i--) if (ev[i].mine && ev[i].label === label) { ev.splice(i, 1); break; }
      return { events: ev };
    }, 'num');
  };
  /** Record money you got another way (check, cash, a transfer straight to your bank). */
  BE.recordPayment = function (num, amount, how, date) {
    var inv = BE.payInvoice(num, amount, how);
    if (!inv) return null;
    BE.change(function (s) {
      if (s.payments && s.payments[0] && s.payments[0].inv === num) s.payments[0] = Object.assign({}, s.payments[0], { manual: true, date: date || BE.today });
    });
    return inv;
  };
  /** Send a draft. Drafts numbered D-… get the next invoice number. Returns the invoice number. */
  BE.sendDraft = function (num, terms) {
    var n = num;
    if (/^D-/.test(num)) {
      n = BE.nextNumber('INV');
      BE.update('invoices', num, { num: n }, 'num');
    }
    BE.sendInvoice(n, terms);
    return n;
  };
  /** Selling stocked products lowers their stock (products collection, field `stock`). */
  BE.takeStock = function (lines) {
    var sold = {};
    (lines || []).forEach(function (l) { if (l.kind === 'product') sold[l.name] = (sold[l.name] || 0) + (Number(l.qty) || 0); });
    if (!Object.keys(sold).length || !BE.all('products').length) return [];
    var changed = [];
    BE.change(function (s) {
      s.products = (s.products || []).map(function (p) {
        if (!sold[p.name] || p.stock == null) return p;
        var left = Math.max(0, (Number(p.stock) || 0) - sold[p.name]);
        changed.push({ name: p.name, left: left });
        return Object.assign({}, p, { stock: left });
      });
    });
    return changed;
  };
  /** Settle the open card dispute: 'accepted' refunds it (comes off Coming in), 'sent' sends proof, 'open' undoes. */
  BE.settleDispute = function (state) {
    BE.change(function (s) {
      var ps = Object.assign({}, s.paySettings || {});
      var d = ps.dispute ? Object.assign({}, ps.dispute) : null;
      if (!d) return;
      s.payments = (s.payments || []).filter(function (p) { return !(p.refund && p.inv === d.inv); });
      if (state === 'accepted') {
        s.payments = [{ id: BE.id('pay'), inv: d.inv, who: d.who, amount: -d.amount, cur: 'USD', how: 'Refund after a dispute', date: BE.today, inMonth: true, refund: true, manual: true }].concat(s.payments);
        BE._log(s, 'Refunded ' + BE.money(d.amount) + ' to ' + d.who + ' after a card dispute on ' + d.inv);
      } else if (state === 'sent') {
        BE._log(s, 'Sent proof to ' + d.who + '’s bank for the ' + d.inv + ' dispute');
      }
      d.state = state;
      ps.dispute = d;
      s.paySettings = ps;
    });
  };
})();
