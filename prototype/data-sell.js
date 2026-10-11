/* Coming in: quotes, repeating invoices, money back (credit notes), products and services, one seed per country.
   Owned by the Coming in tools (SellQuotes, SellQuote, SellRecurring, SellCatalog, SellCustomers, SellCustomer). */
(function () {
  var L = function (name, kind, unit, qty, rate) { return { name: name, kind: kind, unit: unit, qty: qty, rate: rate }; };

  // Quotes. state: draft | waiting (sent) | changes | accepted | declined. You mark a quote accepted or declined
  // yourself when the customer tells you. Quotes never count in the three numbers; invoicing an accepted one
  // (BE.quoteToInvoice) adds it to Coming in.
  BE.define('quotes', BE.perCountry({
    uk: [
      { num: 'Q-0013', who: 'Kirkstall Brewing Co', title: 'Brewery tour leaflet', cur: 'GBP', state: 'draft', created: '9 Oct', expires: '', note: '',
        lines: [L('Leaflet design', 'service', 'jobs', 1, 650), L('Design hours', 'service', 'hours', 4, 55)] },
      { num: 'Q-0012', who: 'Moor & Dale Outdoor', title: 'Spring 2027 catalogue', cur: 'GBP', state: 'waiting', created: '2 Oct', sent: '2 Oct', expires: '1 Nov',
        note: 'Thanks for the brief, Hannah. This covers layout for the full 56-page catalogue, with two rounds of changes.',
        lines: [L('Catalogue layout', 'service', 'pages', 56, 85)] },
      { num: 'Q-0011', who: 'Pennine Physio', title: 'Clinic signage', cur: 'GBP', state: 'accepted', created: '29 Sep', sent: '29 Sep', accepted: '9 Oct', acceptedHow: 'By email', expires: '29 Oct', note: '',
        lines: [L('Design days', 'service', 'days', 2, 450), L('Sign artwork', 'service', 'signs', 4, 95)] },
      { num: 'Q-0010', who: 'Leeds Print Festival', title: '2027 brand refresh, stage 1', cur: 'GBP', state: 'accepted', created: '22 Sep', sent: '22 Sep', accepted: '30 Sep', acceptedHow: 'By phone', invoice: 'HS-0049', invoices: ['HS-0049'], invoiceAmt: 2750, fullyBilled: true, note: '',
        lines: [L('Design days', 'service', 'days', 5, 450), L('Brand workshop', 'service', 'workshop', 1, 500)] },
      { num: 'Q-0009', who: 'Ochre Café', title: 'Loyalty cards and stamps', cur: 'GBP', state: 'declined', created: '10 Sep', sent: '10 Sep', declined: '18 Sep', reason: 'Holding off until spring', note: '',
        lines: [L('Loyalty card design', 'service', 'jobs', 1, 380), L('Business cards (250)', 'product', 'boxes', 4, 65)] }
    ],
    lk: [
      { num: 'Q-0023', who: 'Lanka Agri Exports (Pvt) Ltd', title: '2027 product catalogue', cur: 'LKR', state: 'accepted', created: '28 Sep', sent: '28 Sep', accepted: '8 Oct', acceptedHow: 'Signed copy by email', expires: '28 Oct', note: '',
        lines: [L('Catalogue layout', 'service', 'pages', 40, 9500), L('Cover design', 'service', 'job', 1, 90000)] },
      { num: 'Q-0022', who: 'Kandyan Spice Co (Pvt) Ltd', title: 'Spice gift set labels', cur: 'LKR', state: 'draft', created: '10 Oct', expires: '', note: '',
        lines: [L('Packaging design', 'service', 'SKUs', 3, 110000)] },
      { num: 'Q-0021', who: 'Galle Fort Boutique Hotel', title: 'Website photography and layout', cur: 'LKR', state: 'waiting', created: '6 Oct', sent: '6 Oct', expires: '5 Nov',
        note: 'Dinesh, here is the plan we discussed at the hotel: eight design days for the new pages, and editing for forty photographs.',
        lines: [L('Design days', 'service', 'days', 8, 45000), L('Photo editing', 'service', 'images', 40, 2500)] },
      { num: 'Q-0020', who: 'Hill Country Tea Estates', title: 'Visitor centre signage', cur: 'LKR', state: 'accepted', created: '18 Sep', sent: '18 Sep', accepted: '29 Sep', acceptedHow: 'Purchase order HCT-PO-2291', invoice: 'SDS-0218', invoices: ['SDS-0218'], invoiceAmt: 919220, fullyBilled: true, note: '',
        lines: [L('Signage design', 'service', 'signs', 8, 95000)] },
      { num: 'Q-0019', who: 'Colombo Dental Clinic', title: 'Patient app screens', cur: 'LKR', state: 'declined', created: '12 Sep', sent: '12 Sep', declined: '25 Sep', reason: 'Budget moved to next year', note: '',
        lines: [L('Design days', 'service', 'days', 12, 45000)] }
    ]
  }), BE.perCountry({ uk: [], lk: [] }));

  // Repeating invoices. Each run makes a normal invoice (repeat: true) with the country's tax. amount is before tax.
  BE.define('recurring', BE.perCountry({
    uk: [
      { id: 'rec-moordale', who: 'Moor & Dale Outdoor', what: 'Monthly social graphics', cur: 'GBP', amount: 1200, day: 1, how: 'email', ends: 'never', count: 6, paused: false, skip: false, last: 'HS-0048' },
      { id: 'rec-ochre', who: 'Ochre Café', what: 'Specials board artwork', cur: 'GBP', amount: 120, day: 15, how: 'email', ends: 'never', count: 3, paused: true, skip: false, last: '' }
    ],
    lk: [
      { id: 'rec-dental', who: 'Colombo Dental Clinic', what: 'Social media pack', cur: 'LKR', amount: 180000, day: 1, how: 'email', ends: 'never', count: 5, paused: false, skip: false, last: 'SDS-0217' },
      { id: 'rec-hill', who: 'Hill Country Tea Estates', what: 'Website upkeep', cur: 'LKR', amount: 60000, day: 15, how: 'email', ends: 'never', count: 2, paused: true, skip: false, last: '' }
    ]
  }), BE.perCountry({ uk: [], lk: [] }));

  // Money back (credit notes). kind: apply (taken off an open invoice), refund (paid back; recorded in Going out), credit (held for next time).
  // Sri Lanka: the credit note carries back its share of SSCL and VAT (net, sscl, vat).
  BE.define('creditNotes', BE.perCountry({
    uk: [
      { id: 'cn-1', num: 'CN-0001', who: 'Pennine Physio', inv: 'HS-0045', date: '3 Sep', amount: 120, cur: 'GBP', reason: 'Icon set arrived late', kind: 'apply', how: 'Taken off HS-0045 (£1,770 → £1,650)' }
    ],
    lk: [
      { id: 'cn-7', num: 'CN-0007', who: 'Galle Fort Boutique Hotel', inv: 'SDS-0219', date: '9 Oct', amount: 24190, net: 20000, sscl: 500, vat: 3690, cur: 'LKR', reason: 'Two menu pages dropped', kind: 'apply', how: 'Taken off SDS-0219 (Rs 411,230 → Rs 387,040)' }
    ]
  }), BE.perCountry({ uk: [], lk: [] }));

  // Products and services with prices. No stock, cost or time. vat: the VAT rate id from the pack (used when VAT registered).
  // sscl: Sri Lanka only, whether SSCL applies (it does to every taxable supply here).
  BE.define('services', BE.perCountry({
    uk: [
      { id: 'svc-day', name: 'Design days', price: 450, rt: 'daily', unit: 'day', vat: 'std' },
      { id: 'svc-hour', name: 'Design hours', price: 55, rt: 'hourly', unit: 'hour', vat: 'std' },
      { id: 'svc-label', name: 'Label design', price: 650, rt: 'flat', unit: 'label', vat: 'std' },
      { id: 'svc-page', name: 'Catalogue layout', price: 85, rt: 'flat', unit: 'page', vat: 'std' },
      { id: 'svc-workshop', name: 'Brand workshop', price: 500, rt: 'flat', unit: 'workshop', vat: 'std' },
      { id: 'svc-social', name: 'Monthly social graphics', price: 1200, rt: 'monthly', unit: 'month', vat: 'std' }
    ],
    lk: [
      { id: 'svc-day', name: 'Design days', price: 45000, rt: 'daily', unit: 'day', vat: 'std', sscl: true },
      { id: 'svc-pack', name: 'Packaging design', price: 150000, rt: 'flat', unit: 'SKU', vat: 'std', sscl: true },
      { id: 'svc-sign', name: 'Signage design', price: 95000, rt: 'flat', unit: 'sign', vat: 'std', sscl: true },
      { id: 'svc-page', name: 'Catalogue layout', price: 9500, rt: 'flat', unit: 'page', vat: 'std', sscl: true },
      { id: 'svc-social', name: 'Social media pack', price: 180000, rt: 'monthly', unit: 'month', vat: 'std', sscl: true },
      { id: 'svc-photo', name: 'Photo editing', price: 2500, rt: 'flat', unit: 'image', vat: 'std', sscl: true }
    ]
  }), BE.perCountry({ uk: [], lk: [] }));
  BE.define('products', BE.perCountry({
    uk: [
      { id: 'prd-cards', name: 'Business cards (250)', price: 65, unit: 'box', vat: 'std' },
      { id: 'prd-poster', name: 'A2 poster print run (50)', price: 180, unit: 'run', vat: 'std' }
    ],
    lk: [
      { id: 'prd-brochure', name: 'Printed brochures (500)', price: 85000, unit: 'box', vat: 'std', sscl: true },
      { id: 'prd-menu', name: 'Printed menus (100)', price: 42000, unit: 'set', vat: 'std', sscl: true }
    ]
  }), BE.perCountry({ uk: [], lk: [] }));

  // ---- helpers -------------------------------------------------------------
  /** Lines, tax (UK VAT when registered; Sri Lanka SSCL then VAT) and total, in the home currency. */
  BE.quoteTotals = function (q) {
    var lines = (q && q.lines) || [];
    var t = BE.calcTax(lines.map(function (l) { return { qty: BE.num(l.qty), rate: BE.num(l.rate), vat: l.vat }; }), 0);
    return { sub: t.net, tax: t.tax, sscl: t.sscl, vat: t.vat, total: t.total, calc: t };
  };

  /** You mark a quote accepted when the customer says yes (by email, phone or a signed copy). */
  BE.acceptQuote = function (num, how) {
    var q = BE.update('quotes', num, { state: 'accepted', accepted: BE.today, acceptedHow: how || '' }, 'num');
    if (q) BE.log('Marked quote ' + num + ' accepted for ' + q.who + ' · ' + BE.money(BE.quoteTotals(q).total));
    return q;
  };
  /** Mark a quote declined, with their reason. */
  BE.declineQuote = function (num, reason) {
    var q = BE.update('quotes', num, { state: 'declined', declined: BE.today, reason: reason || '' }, 'num');
    if (q) BE.log('Marked quote ' + num + ' declined for ' + q.who);
    return q;
  };

  /** Turn an accepted quote into a sent invoice (all of it, or the balance after earlier invoices). Returns the invoice. */
  BE.quoteToInvoice = function (num, opts) {
    opts = opts || {};
    var q = BE.find('quotes', num, 'num');
    if (!q) return null;
    var lines;
    if (opts.rest) {
      var billedNet = (q.invoices || []).reduce(function (a, n) { var i = BE.find('invoices', n, 'num'); return a + (i && !i.void ? BE.invSubtotal(i) : 0); }, 0);
      lines = [{ name: 'Balance for ' + q.title + ' (quote ' + num + ')', qty: 1, unit: 'job', rate: Math.max(0, Math.round((BE.quoteTotals(q).sub - billedNet) * 100) / 100) }];
    } else {
      lines = q.lines.map(function (l) { var o = { name: l.name, qty: BE.num(l.qty), unit: l.unit, rate: BE.num(l.rate) }; if (l.vat) o.vat = l.vat; return o; });
    }
    var inv = BE.makeInvoice({ from: num, who: q.who, what: q.title + (opts.rest ? ' (balance)' : ''), lines: lines, terms: opts.terms });
    BE.update('invoices', inv.num, function (x) { return { events: [{ label: 'Made from accepted quote ' + num, date: BE.today, todo: false }].concat(x.events || []) }; }, 'num');
    var amt = BE.invTotal(inv);
    BE.update('quotes', num, function (x) {
      return { state: 'accepted', accepted: x.accepted || BE.today, invoice: x.invoice || inv.num, invoices: (x.invoices || []).concat([inv.num]),
        invoiceAmt: Math.round(((x.invoiceAmt && x.invoice ? x.invoiceAmt : 0) + amt) * 100) / 100, fullyBilled: true };
    }, 'num');
    return BE.find('invoices', inv.num, 'num');
  };

  /** Money back against an invoice. way: apply | refund | credit. Amount includes tax; Sri Lanka keeps the SSCL and VAT share. */
  BE.giveMoneyBack = function (o) {
    var inv = BE.find('invoices', o.inv, 'num');
    if (!inv) return null;
    var amt = Math.round((Number(o.amount) || 0) * 100) / 100;
    var cnNum = BE.nextNumber('CN');
    var before = BE.invTotal(inv);
    var how = o.way === 'apply' ? 'Taken off ' + inv.num + ' (' + BE.money(before) + ' → ' + BE.money(before - amt) + ')'
      : o.way === 'refund' ? 'Refunded on ' + inv.num + ' · recorded in Going out'
      : 'Held as credit for their next invoice';
    var cn = { id: BE.id('cn'), num: cnNum, who: inv.who, inv: inv.num, date: BE.today, amount: amt, cur: inv.cur, reason: o.reason || 'Goodwill', kind: o.way, how: how, isNew: true };
    // The tax share of the credit, in the same proportion as on the invoice.
    var gross = BE.invSubtotal(inv) + (Number(inv.tax) || 0);
    if (gross > 0 && (inv.ssclAmt || inv.vatAmt)) {
      var share = amt / gross;
      cn.sscl = Math.round((inv.ssclAmt || 0) * share * 100) / 100;
      cn.vat = Math.round((inv.vatAmt || 0) * share * 100) / 100;
      cn.net = Math.round((amt - cn.sscl - cn.vat) * 100) / 100;
    }
    BE.change(function (s) {
      s.creditNotes = [cn].concat(s.creditNotes || []);
      if (o.way === 'apply') {
        s.invoices = s.invoices.map(function (x) {
          if (x.num !== inv.num) return x;
          return Object.assign({}, x, { credit: Math.round(((Number(x.credit) || 0) + amt) * 100) / 100,
            events: (x.events || []).filter(function (e) { return !e.todo; }).concat([{ label: (BE.is('lk') ? 'Credit note ' : 'Money back ') + cnNum + ' applied, ' + BE.money(amt) + ' for ' + String(cn.reason).toLowerCase(), date: BE.today, todo: false }], (x.events || []).filter(function (e) { return e.todo; })) });
        });
      }
      BE._log(s, 'Issued ' + cnNum + ' to ' + inv.who + ' · ' + BE.money(amt) + ' (' + (o.way === 'apply' ? 'taken off ' + inv.num : o.way === 'refund' ? 'refund' : 'credit held') + ')');
    });
    if (o.way === 'refund') {
      BE.addExpense({ who: inv.who, cat: 'other', amount: amt, how: 'Bank transfer', note: 'Refund ' + cnNum + ' on ' + inv.num + ': ' + cn.reason });
    }
    return cn;
  };

  /** Send this month's run of a repeating invoice now (with the country's tax). */
  BE.runRecurring = function (id) {
    var p = BE.find('recurring', id);
    if (!p) return null;
    var inv = BE.makeInvoice({ who: p.who, what: p.what, repeat: true,
      lines: [{ name: p.what, qty: 1, unit: 'month', rate: Number(p.amount) || 0 }] });
    BE.update('invoices', inv.num, function (x) { return { events: [{ label: 'Made from a repeating invoice (sent early by hand)', date: BE.today, todo: false }].concat(x.events || []) }; }, 'num');
    BE.update('recurring', id, function (x) { return { count: (x.count || 0) + 1, last: inv.num, skip: false }; });
    return inv;
  };

  /** Everything you sell, services first: [{ id, name, price, unit, kind: 'service' | 'product', vat }]. */
  BE.catalog = function () {
    return BE.all('services').map(function (s) { return Object.assign({ kind: 'service' }, s); })
      .concat(BE.all('products').map(function (p) { return Object.assign({ kind: 'product' }, p); }));
  };
})();
