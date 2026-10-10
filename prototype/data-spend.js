/* Going out: costs that repeat every month, receipts and vendors (October 2026). */
(function () {
  // paidDay > 0: already paid this month (it's in expenses). Active costs not yet paid with day > 4
  // count as "scheduled" in Going out ($782). active: false = paused or cancelled (doesn't count).
  BE.define('monthly', [
    { id: 'wework', who: 'WeWork rent', vendor: 'wework', cat: 'Rent', day: 1, card: 'Chase ••4417', amount: 1200, paidDay: 1, start: 'Oct', active: true },
    { id: 'gws', who: 'Google Workspace', vendor: 'google', cat: 'Software', day: 5, card: 'Amex ••1009', amount: 72, paidDay: 0, start: 'Oct', active: true },
    { id: 'adobe', who: 'Adobe Creative Cloud', vendor: 'adobe', cat: 'Software', day: 8, card: 'Amex ••1009', amount: 90, paidDay: 1, start: 'Oct', active: true },
    { id: 'notion', who: 'Notion', vendor: 'notion', cat: 'Software', day: 9, card: 'Amex ••1009', amount: 40, paidDay: 0, start: 'Oct', active: true },
    { id: 'figma', who: 'Figma', vendor: 'figma', cat: 'Software', day: 12, card: 'Amex ••1009', amount: 45, paidDay: 2, start: 'Oct', active: true },
    { id: 'comcast', who: 'Comcast Business', vendor: 'comcast', cat: 'Internet & phone', day: 15, card: 'Chase ••4417', amount: 129, paidDay: 3, start: 'Oct', active: true },
    { id: 'dropbox', who: 'Dropbox', vendor: 'dropbox', cat: 'Software', day: 20, card: 'Amex ••1009', amount: 24, paidDay: 0, start: 'Oct', active: true, unused: 'No files changed in 60 days' },
    { id: 'ins', who: 'Business insurance', vendor: 'hiscox', cat: 'Insurance', day: 28, card: 'Chase ••4417', amount: 646, paidDay: 0, start: 'Oct', active: true }
  ]);

  // Small decisions on the Every month screen ("Canva looks like it repeats").
  BE.define('spendFlags', { canva: 'ask' }, { canva: 'none' });

  // Receipts. status: 'waiting' (read, not matched yet), 'blurry' (needs the total typed),
  // 'matched' (expenseId points at the expense it proves). readyAt: still being read until then.
  BE.define('receipts', [
    { id: 'rc-staples', merchant: 'Staples', date: 'Oct 3', total: 84, tax: 6.83, cat: 'Office supplies', file: 'IMG_4468.jpg', source: 'Snapped on Maya’s phone', added: 'Oct 3', month: 'Oct', status: 'waiting' },
    { id: 'rc-delta', merchant: 'Delta Air Lines', date: 'Oct 2', total: 412, tax: 38.12, cat: 'Travel', file: 'delta-eticket-HX7Q2L.pdf', source: 'Forwarded from maya@northwind.studio', added: 'Oct 3', month: 'Oct', status: 'waiting' },
    { id: 'rc-bluebottle', merchant: 'Blue Bottle Coffee', date: 'Oct 4', total: 18.5, tax: 1.51, cat: 'Meals', file: 'IMG_4473.jpg', source: 'Snapped on Jordan’s phone', added: 'Oct 4', month: 'Oct', status: 'waiting' },
    { id: 'rc-homedepot', merchant: 'The Home Depot', date: 'Oct 3', total: 0, tax: 0, cat: 'Office supplies', file: 'IMG_4471.jpg', source: 'Snapped on Maya’s phone', added: 'Oct 4', month: 'Oct', status: 'blurry' },
    { id: 'rc-elena', merchant: 'Elena Rossi', date: 'Oct 3', total: 936, tax: 0, cat: 'Contractors', file: 'ER-013.pdf', source: 'Emailed invoice', added: 'Oct 3', month: 'Oct', status: 'matched', expenseId: 'exp-1' },
    { id: 'rc-comcast', merchant: 'Comcast Business', date: 'Oct 3', total: 129, tax: 9.41, cat: 'Internet & phone', file: 'comcast-oct.pdf', source: 'Emailed', added: 'Oct 3', month: 'Oct', status: 'matched', expenseId: 'exp-2' },
    { id: 'rc-shell', merchant: 'Shell', date: 'Oct 3', total: 48, tax: 0, cat: 'Fuel', file: 'IMG_4466.jpg', source: 'Snapped on Maya’s phone', added: 'Oct 3', month: 'Oct', status: 'matched', expenseId: 'exp-3' },
    { id: 'rc-lps', merchant: 'Local Print Shop', date: 'Oct 2', total: 236, tax: 19.24, cat: 'Printing', file: 'LPS-2264.pdf', source: 'Uploaded', added: 'Oct 2', month: 'Oct', status: 'matched', expenseId: 'exp-4' },
    { id: 'rc-figma', merchant: 'Figma', date: 'Oct 2', total: 45, tax: 0, cat: 'Software', file: 'figma-invoice-oct.pdf', source: 'Emailed', added: 'Oct 2', month: 'Oct', status: 'matched', expenseId: 'exp-6' },
    { id: 'rc-adobe', merchant: 'Adobe Creative Cloud', date: 'Oct 1', total: 90, tax: 0, cat: 'Software', file: 'adobe-oct.pdf', source: 'Emailed', added: 'Oct 1', month: 'Oct', status: 'matched', expenseId: 'exp-8' },
    { id: 'rc-wework', merchant: 'WeWork', date: 'Oct 1', total: 1200, tax: 0, cat: 'Rent', file: 'wework-oct.pdf', source: 'Emailed invoice', added: 'Oct 1', month: 'Oct', status: 'matched', expenseId: 'exp-9' },
    { id: 'rc-s1', merchant: 'Blue Bottle Coffee', date: 'Sep 18', total: 22.4, tax: 1.83, cat: 'Meals', file: 'IMG_4310.jpg', source: 'Snapped', added: 'Sep 18', month: 'Sep', status: 'matched', charge: 'SQ *BLUE BOTTLE · Sep 18 · Amex ••1009' },
    { id: 'rc-s2', merchant: 'Staples', date: 'Sep 14', total: 46.3, tax: 3.77, cat: 'Office supplies', file: 'IMG_4288.jpg', source: 'Snapped', added: 'Sep 14', month: 'Sep', status: 'matched', charge: 'STAPLES 00123 · Sep 14 · Amex ••1009' },
    { id: 'rc-s3', merchant: 'Comcast Business', date: 'Sep 3', total: 129, tax: 9.41, cat: 'Internet & phone', file: 'comcast-sep.pdf', source: 'Emailed', added: 'Sep 3', month: 'Sep', status: 'matched', charge: 'COMCAST BUSINESS · Sep 3 · Chase ••4417' },
    { id: 'rc-s4', merchant: 'WeWork', date: 'Sep 1', total: 1200, tax: 0, cat: 'Rent', file: 'wework-sep.pdf', source: 'Emailed invoice', added: 'Sep 1', month: 'Sep', status: 'matched', charge: 'WEWORK 1460 BROADWAY · Sep 1 · Chase ••4417' },
    { id: 'rc-a1', merchant: 'B&H Photo', date: 'Aug 21', total: 389, tax: 34.52, cat: 'Equipment', file: 'bh-order-8812.pdf', source: 'Uploaded', added: 'Aug 21', month: 'Aug', status: 'matched', charge: 'B&H PHOTO 420 9TH AVE · Aug 21 · Amex ••1009' },
    { id: 'rc-a2', merchant: 'Lyft', date: 'Aug 9', total: 31.6, tax: 0, cat: 'Travel', file: 'lyft-aug-9.pdf', source: 'Emailed', added: 'Aug 9', month: 'Aug', status: 'matched', charge: 'LYFT *RIDE · Aug 9 · Amex ••1009' }
  ]);

  // Who the business pays. Bills and expenses link to a vendor by name (`who`), or any of `aka`.
  // paidBefore: paid to them in 2026 before October (October comes from expenses).
  BE.define('vendors', [
    { id: 'local-print-shop', name: 'Local Print Shop', cat: 'Printing', contact: 'Dan Ruiz', email: 'orders@localprintshop.nyc', phone: '(718) 555-0142', terms: 'Net 10', via: 'Amex ••1009', paidBefore: 3882,
      past: [{ date: 'Sep 9', what: 'Menu boards', amount: 418, how: 'Amex ••1009' }, { date: 'Aug 21', what: 'Trade show banners', amount: 1120, how: 'Chase ••4417' }] },
    { id: 'comcast', name: 'Comcast Business', cat: 'Internet & phone', contact: 'Business account ••8830', email: 'business@comcast.com', phone: '(800) 391-3000', terms: 'Autopay on the 15th', via: 'Chase ••4417', paidBefore: 1161, monthly: 'comcast',
      past: [{ date: 'Sep 3', what: 'Monthly service', amount: 129, how: 'Chase ••4417' }, { date: 'Aug 3', what: 'Monthly service', amount: 129, how: 'Chase ••4417' }] },
    { id: 'staples', name: 'Staples', cat: 'Office supplies', contact: 'Business account', email: 'business@staples.com', phone: '', terms: 'Net 30', via: 'Amex ••1009', paidBefore: 1062,
      past: [{ date: 'Aug 30', what: 'Shipping boxes', amount: 146, how: 'Amex ••1009' }, { date: 'Jul 12', what: 'Desk lamps', amount: 238, how: 'Amex ••1009' }] },
    { id: 'adobe', name: 'Adobe Creative Cloud', cat: 'Software', contact: 'Teams plan, 3 seats', email: 'billing@adobe.com', phone: '', terms: 'Card on file', via: 'Amex ••1009', paidBefore: 810, monthly: 'adobe',
      past: [{ date: 'Sep 1', what: 'Monthly plan', amount: 90, how: 'Amex ••1009' }, { date: 'Aug 1', what: 'Monthly plan', amount: 90, how: 'Amex ••1009' }] },
    { id: 'wework', name: 'WeWork', aka: ['WeWork rent'], cat: 'Rent', contact: 'Private office, Dumbo', email: 'dumbo@wework.com', phone: '', terms: 'Rent on the 1st', via: 'Chase ••4417', paidBefore: 10800, monthly: 'wework',
      past: [{ date: 'Sep 1', what: 'September rent', amount: 1200, how: 'Chase ••4417' }, { date: 'Aug 1', what: 'August rent', amount: 1200, how: 'Chase ••4417' }] },
    { id: 'elena-rossi', name: 'Elena Rossi', cat: 'Contractors', contact: 'Illustrator', email: 'elena@rossi.studio', phone: '(347) 555-0198', terms: 'Net 30', via: 'Bank transfer', paidBefore: 8924, contractor: true, w9: 'Feb 3, 2026',
      past: [{ date: 'Sep 4', what: 'Invoice ER-012', amount: 1210, how: 'Bank transfer' }, { date: 'Aug 5', what: 'Invoice ER-011', amount: 880, how: 'Bank transfer' }] },
    { id: 'figma', name: 'Figma', cat: 'Software', contact: 'Professional plan, 2 editors', email: 'billing@figma.com', phone: '', terms: 'Card on file', via: 'Amex ••1009', paidBefore: 405, monthly: 'figma',
      past: [{ date: 'Sep 2', what: 'Monthly plan', amount: 45, how: 'Amex ••1009' }] },
    { id: 'delta', name: 'Delta Air Lines', cat: 'Travel', contact: 'Card charges only', email: '', phone: '', terms: 'Paid by card', via: 'Amex ••1009', paidBefore: 1074,
      past: [{ date: 'Jun 14', what: 'JFK to Austin, conference', amount: 1074, how: 'Amex ••1009' }] },
    { id: 'shell', name: 'Shell', cat: 'Fuel', contact: 'Card charges only', email: '', phone: '', terms: 'Paid by card', via: 'Amex ••1009', paidBefore: 469,
      past: [{ date: 'Sep 18', what: 'Fuel', amount: 52, how: 'Amex ••1009' }, { date: 'Sep 2', what: 'Fuel', amount: 46, how: 'Amex ••1009' }] },
    { id: 'google', name: 'Google Workspace', cat: 'Software', contact: '6 users', email: '', phone: '', terms: 'Card on file', via: 'Amex ••1009', paidBefore: 648, monthly: 'gws',
      past: [{ date: 'Sep 5', what: 'Monthly plan', amount: 72, how: 'Amex ••1009' }] },
    { id: 'notion', name: 'Notion', cat: 'Software', contact: 'Plus plan', email: '', phone: '', terms: 'Card on file', via: 'Amex ••1009', paidBefore: 360, monthly: 'notion',
      past: [{ date: 'Sep 9', what: 'Monthly plan', amount: 40, how: 'Amex ••1009' }] },
    { id: 'dropbox', name: 'Dropbox', cat: 'Software', contact: 'Business plan', email: '', phone: '', terms: 'Card on file', via: 'Amex ••1009', paidBefore: 216, monthly: 'dropbox',
      past: [{ date: 'Sep 20', what: 'Monthly plan', amount: 24, how: 'Amex ••1009' }] },
    { id: 'hiscox', name: 'Hiscox', aka: ['Business insurance'], cat: 'Insurance', contact: 'General liability policy', email: 'service@hiscox.com', phone: '(866) 283-7545', terms: 'Monthly on the 28th', via: 'Chase ••4417', paidBefore: 5814, monthly: 'ins',
      past: [{ date: 'Sep 28', what: 'Monthly premium', amount: 646, how: 'Chase ••4417' }] }
  ]);

  // ---- helpers for receipts and vendors ----
  var r2 = function (n) { return Math.round((Number(n) || 0) * 100) / 100; };
  var lc = function (s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
  var first = function (s) { return lc(s).split(' ')[0] || ''; };

  /** Is this receipt still being read? (A fresh upload reads for a moment.) */
  BE.receiptReading = function (r) { return !!(r && r.readyAt && Date.now() < r.readyAt); };

  /** The receipt attached to an expense, if any. */
  BE.receiptFor = function (expenseId) {
    var x = BE.find('expenses', expenseId);
    if (x && x.receiptId) { var r = BE.find('receipts', x.receiptId); if (r) return r; }
    return BE.all('receipts').filter(function (r) { return r.expenseId === expenseId; })[0] || null;
  };

  /**
   * Charges a receipt could belong to: paid expenses with no receipt yet, and card charges
   * not sorted yet. Same amount; the same store or a date close by makes it a better guess.
   */
  BE.receiptCandidates = function (r) {
    if (!r || !(r.total > 0)) return [];
    var taken = {};
    BE.all('receipts').forEach(function (o) { if (o.expenseId && o.id !== r.id) taken[o.expenseId] = 1; });
    var out = [];
    var day = function (d) { var m = String(d || '').match(/(\d+)$/); return m ? +m[1] : 0; };
    var why = function (name, date) {
      var same = first(name) && (first(name) === first(r.merchant) || lc(name).indexOf(first(r.merchant)) >= 0);
      var gap = Math.abs(day(date) - day(r.date));
      return { score: (same ? 2 : 0) + (gap === 0 ? 1 : 0), reason: (same ? 'same store, ' : '') + 'same amount, ' + (gap === 0 ? 'same day' : gap === 1 ? 'a day apart' : gap + ' days apart') };
    };
    BE.all('expenses').forEach(function (x) {
      if (x.receipt || x.receiptId || taken[x.id] || Math.abs(x.amount - r.total) > 0.005) return;
      var w = why(x.who + ' ' + (x.raw || ''), x.date);
      out.push({ kind: 'expense', id: x.id, label: x.raw || x.who, who: x.who, date: x.date, how: x.how, amount: x.amount, score: w.score + 1, reason: w.reason });
    });
    BE.all('charges').forEach(function (c) {
      if (Math.abs(c.amount - r.total) > 0.005) return;
      var w = why(c.nice + ' ' + c.raw, c.date);
      out.push({ kind: 'charge', id: c.id, label: c.raw, who: c.nice, date: c.date, how: c.how, amount: c.amount, score: w.score, reason: w.reason + ', not sorted yet' });
    });
    return out.sort(function (a, b) { return b.score - a.score; });
  };

  /**
   * Match a receipt to a paid expense (no change to Going out) or to an unsorted card charge
   * (the charge is sorted under the receipt's category and joins Going out). Returns the expense.
   */
  BE.matchReceipt = function (rid, kind, id) {
    return BE.change(function (s) {
      var r = (s.receipts || []).filter(function (x) { return x.id === rid; })[0];
      if (!r) return null;
      var exp = null;
      if (kind === 'charge') {
        var c = (s.charges || []).filter(function (x) { return x.id === id; })[0];
        if (!c) return null;
        exp = { id: BE.id('exp'), who: r.merchant || c.nice, cat: r.cat || c.sug, how: c.how, date: c.date, amount: c.amount, inMonth: true, receipt: true, receiptId: rid, note: '', split: null, kind: 'business', raw: c.raw, isNew: true };
        s.charges = s.charges.filter(function (x) { return x.id !== id; });
        s.expenses = [exp].concat(s.expenses || []);
        BE._log(s, 'Sorted ' + c.raw + ' as ' + exp.cat + ' and attached the ' + r.merchant + ' receipt');
      } else {
        s.expenses = (s.expenses || []).map(function (x) {
          if (x.id !== id) return x;
          exp = Object.assign({}, x, { receipt: true, receiptId: rid });
          return exp;
        });
        if (!exp) return null;
        BE._log(s, 'Matched the ' + r.merchant + ' receipt to ' + (exp.raw || exp.who) + ' · ' + BE.money(exp.amount));
      }
      s.receipts = s.receipts.map(function (x) { return x.id === rid ? Object.assign({}, x, { status: 'matched', expenseId: exp.id, matchedOn: BE.today }) : x; });
      return exp;
    });
  };

  /** No charge will show up (cash, personal card): record the receipt as its own expense. Adds to Going out. */
  BE.receiptToExpense = function (rid, how) {
    return BE.change(function (s) {
      var r = (s.receipts || []).filter(function (x) { return x.id === rid; })[0];
      if (!r || !(r.total > 0)) return null;
      var exp = { id: BE.id('exp'), who: r.merchant, cat: r.cat || 'Other', how: how || 'Cash', date: r.date || BE.today, amount: r2(r.total), inMonth: true, receipt: true, receiptId: rid, note: r.note || '', split: null, kind: 'business', isNew: true };
      s.expenses = [exp].concat(s.expenses || []);
      s.receipts = s.receipts.map(function (x) { return x.id === rid ? Object.assign({}, x, { status: 'matched', expenseId: exp.id, matchedOn: BE.today, made: true }) : x; });
      BE._log(s, 'Recorded ' + BE.money(exp.amount) + ' to ' + exp.who + ' from a receipt (' + exp.how + ')');
      return exp;
    });
  };

  /** Take a receipt off its expense; it goes back to waiting. */
  BE.unmatchReceipt = function (rid) {
    return BE.change(function (s) {
      var r = (s.receipts || []).filter(function (x) { return x.id === rid; })[0];
      if (!r) return null;
      s.expenses = (s.expenses || []).map(function (x) { return x.id === r.expenseId || x.receiptId === rid ? Object.assign({}, x, { receipt: false, receiptId: null }) : x; });
      s.receipts = s.receipts.map(function (x) { return x.id === rid ? Object.assign({}, x, { status: x.total > 0 ? 'waiting' : 'blurry', expenseId: null, made: false }) : x; });
      return r;
    });
  };

  /** Delete a receipt (its expense stays, without the proof). */
  BE.deleteReceipt = function (rid) {
    return BE.change(function (s) {
      var r = (s.receipts || []).filter(function (x) { return x.id === rid; })[0];
      if (!r) return null;
      s.expenses = (s.expenses || []).map(function (x) { return (r.expenseId && x.id === r.expenseId) || x.receiptId === rid ? Object.assign({}, x, { receipt: false, receiptId: null }) : x; });
      s.receipts = s.receipts.filter(function (x) { return x.id !== rid; });
      BE._log(s, 'Deleted the ' + (r.merchant || 'unread') + ' receipt');
      return r;
    });
  };

  // What "reading" a new upload finds. Uploads are read in this order, so the first one
  // matches an unsorted card charge and a later one has no charge at all.
  var READS = [
    { merchant: 'Uber', date: 'Oct 2', total: 27.8, tax: 2.21, cat: 'Travel' },
    { merchant: 'Amazon', date: 'Oct 2', total: 64.2, tax: 5.24, cat: 'Office supplies' },
    { merchant: 'Joe’s Hardware', date: 'Oct 4', total: 37.45, tax: 3.05, cat: 'Office supplies' },
    { merchant: 'Canva', date: 'Oct 1', total: 14.99, tax: 0, cat: 'Software' },
    { merchant: 'Brooklyn Bagel', date: 'Oct 4', total: 23.6, tax: 1.92, cat: 'Meals' }
  ];
  /** Add a picked file as a receipt. It "reads" for a moment, then shows what it found. */
  BE.addReceipt = function (file, source) {
    var n = BE.all('receipts').filter(function (x) { return x.uploaded; }).length;
    var g = READS[n % READS.length];
    var r = { id: BE.id('rc'), merchant: g.merchant, date: g.date, total: g.total, tax: g.tax, cat: g.cat, file: file || 'receipt.jpg', source: source || 'Uploaded just now', added: BE.today, month: 'Oct', status: 'waiting', uploaded: true, readyAt: Date.now() + 1600, isNew: true };
    BE.change(function (s) { s.receipts = [r].concat(s.receipts || []); BE._log(s, 'Read a new receipt: ' + r.merchant + ' · ' + BE.money(r.total)); });
    return r;
  };

  /** The vendor someone is, by name or one of their other names. */
  BE.vendorFor = function (name) {
    var k = lc(name);
    if (!k) return null;
    return BE.all('vendors').filter(function (v) { return lc(v.name) === k || (v.aka || []).some(function (a) { return lc(a) === k; }); })[0] || null;
  };
  var isVendor = function (v, who) { var k = lc(who); return lc(v.name) === k || (v.aka || []).some(function (a) { return lc(a) === k; }); };
  /** Bills, October payments and the year so far for one vendor. */
  BE.vendorStats = function (v) {
    var bills = BE.all('bills').filter(function (b) { return isVendor(v, b.who); });
    var open = bills.filter(function (b) { return b.status !== 'paid'; });
    var pays = BE.all('expenses').filter(function (x) { return isVendor(v, x.who) && x.kind !== 'personal' && x.kind !== 'transfer'; });
    var oct = pays.reduce(function (a, x) { return a + (x.inMonth ? x.amount : 0); }, 0);
    return {
      bills: bills, open: open, openSum: r2(open.reduce(function (a, b) { return a + (BE.billLeft ? BE.billLeft(b) : b.amount - (b.paid || 0)); }, 0)),
      pays: pays, month: r2(oct), year: r2((Number(v.paidBefore) || 0) + oct)
    };
  };
})();
