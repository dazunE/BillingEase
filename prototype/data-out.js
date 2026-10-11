/* Going out: money already spent and bills to pay, per country (UK: Harper Studio, Leeds; Sri Lanka:
   Serendib Design Studio, Colombo). Everything is entered by hand: no bank or card feeds, no paying
   from the app. Screens: ThreeOut, SpendBill, SpendTransaction (payroll lives in data-payroll.js). */
(function () {
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var label = function (iso) { var p = iso.split('-'); return (+p[2]) + ' ' + MON[+p[1] - 1]; };
  var r2 = function (n) { return Math.round((Number(n) || 0) * 100) / 100; };
  var catName = function (country, id) {
    var P = (window.COUNTRY || {})[country] || {};
    var c = (P.categories || []).concat(P.propertyCategories || []).filter(function (x) { return x.id === id; })[0];
    return c ? c.name : 'Uncategorised';
  };

  /*
   * Expenses: money already paid. Fields:
   *   who, catId (the country pack category id, null = not categorised yet), cat (its plain name),
   *   how ('Bank transfer' | 'Card' | 'Cash' | 'Cheque'), cheque { no, date } when paid by cheque,
   *   date ('3 Sep'), iso ('2026-09-03'), inMonth (October 2026: counts in Going out this month),
   *   amount (what counts as a business cost), gross (what was paid) and bizPct (business-use %, UK),
   *   vat (input VAT on the supplier's tax invoice, inside amount; VAT-registered businesses only),
   *   attachment { name, kind: 'photo' | 'pdf' } and receipt (true when one is attached),
   *   property (UK landlord costs: the property id), bill (the bill it paid), monthly (the every-month
   *   template it came from), note, kind ('business'), events (what happened to it, newest first).
   */
  var X = function (country) {
    return function (id, iso, who, catId, amount, how, o) {
      o = o || {};
      var gross = o.gross != null ? o.gross : amount;
      var x = {
        id: id, who: who, catId: catId, cat: catId ? catName(country, catId) : 'Uncategorised', how: how,
        date: label(iso), iso: iso, inMonth: iso.indexOf('2026-10') === 0, amount: amount, gross: gross, bizPct: o.bizPct || 100,
        vat: o.vat || 0, attachment: o.file ? { name: o.file, kind: /\.pdf$/i.test(o.file) ? 'pdf' : 'photo' } : null, receipt: !!o.file,
        note: o.note || '', kind: 'business', events: []
      };
      ['cheque', 'property', 'bill', 'monthly', 'rentMonth'].forEach(function (k) { if (o[k]) x[k] = o[k]; });
      return x;
    };
  };
  var U = X('uk'), L = X('lk');
  var FLAT = 'ash';

  BE.define('expenses', BE.perCountry({
    // Harper Studio. October so far (paid £949.80), then Q2 (6 Jul – 5 Oct): about £3,940 of
    // self-employment costs with three uncategorised items and no records from 12 to 25 Sep,
    // plus the flat's mortgage interest, letting agent fee and a boiler repair.
    uk: [
      U('x-u31', '2026-10-09', 'Royal Mail', 'office', 12.6, 'Cash', { note: 'Posting proofs to Moor & Dale Outdoor', file: 'IMG_2291.jpg' }),
      U('x-u30', '2026-10-08', 'Kirkgate Kitchen', 'entertaining', 31.8, 'Card', { note: 'Lunch with Kirkstall Brewing Co about the spring labels' }),
      U('x-u29', '2026-10-07', 'Footprint Print', 'office', 86, 'Card', { note: 'Proof prints for Ochre Café menus', file: 'footprint-receipt-0710.pdf' }),
      U('x-u28', '2026-10-06', 'LNER', 'travel', 38.4, 'Card', { note: 'Leeds to York and back, Ochre Café meeting', file: 'lner-eticket-0610.pdf' }),
      U('x-u27', '2026-10-03', 'EE', 'office', 32, 'Bank transfer', { monthly: 'm-ee', note: 'Mobile phone, October' }),
      U('x-u26', '2026-10-02', 'Adobe Creative Cloud', 'office', 54, 'Card', { monthly: 'm-adobe', file: 'adobe-invoice-oct.pdf' }),
      U('x-u25', '2026-10-01', 'Northern Desk Co-working', 'premises', 180, 'Bank transfer', { monthly: 'm-desk', file: 'northern-desk-oct.pdf', note: 'Desk for October' }),
      U('x-u24', '2026-10-01', 'Leeds Building Society', 'p-finance', 410, 'Bank transfer', { property: FLAT, monthly: 'm-mortgage', note: 'Mortgage interest, Flat 2' }),
      U('x-u22', '2026-09-30', 'Leeds Kirkgate Market', null, 21.45, 'Cash'),
      U('x-u21', '2026-09-28', 'Krystal Hosting', 'office', 12, 'Card', { monthly: 'm-krystal' }),
      U('x-u20', '2026-09-26', 'Fontshop', null, 118, 'Card'),
      U('x-u19', '2026-09-11', 'Laynes Espresso', 'entertaining', 23.5, 'Card', { note: 'Coffee with Pennine Physio' }),
      U('x-u18', '2026-09-10', 'Northern Rail', 'travel', 9.8, 'Card', { note: 'Leeds to Huddersfield, Pennine Physio' }),
      U('x-u17', '2026-09-09', 'Footprint Print', 'office', 232, 'Card', { file: 'footprint-0909.pdf' }),
      U('x-u16', '2026-09-04', 'Amber Cars', 'travel', 14.5, 'Cash'),
      U('x-u15', '2026-09-04', 'Northern Rail', 'travel', 18.9, 'Card', { note: 'Leeds to York' }),
      U('x-u14', '2026-09-03', 'EE', 'office', 32, 'Bank transfer', { monthly: 'm-ee' }),
      U('x-u13', '2026-09-02', 'Adobe Creative Cloud', 'office', 54, 'Card', { monthly: 'm-adobe' }),
      U('x-u12', '2026-09-01', 'Northern Desk Co-working', 'premises', 180, 'Bank transfer', { monthly: 'm-desk' }),
      U('x-u11', '2026-09-01', 'Leeds Building Society', 'p-finance', 410, 'Bank transfer', { property: FLAT, monthly: 'm-mortgage' }),
      U('x-u10', '2026-09-07', 'Headingley Lettings', 'p-professional', 105, 'Deducted from rent', { property: FLAT, rentMonth: '2026-09', note: '10% of September’s rent' }),
      U('x-u09', '2026-08-28', 'Krystal Hosting', 'office', 12, 'Card', { monthly: 'm-krystal' }),
      U('x-u08', '2026-08-22', 'Northern Rail', 'travel', 12.4, 'Card', { note: 'Leeds to Harrogate, Moor & Dale Outdoor' }),
      U('x-u07', '2026-08-20', 'Meta (Instagram ads)', 'advertising', 60, 'Card'),
      U('x-u06', '2026-08-18', 'Kirkstall Heating', 'p-repairs', 340, 'Bank transfer', { property: FLAT, bill: 'b-kh', file: 'KH-0861.pdf', note: 'Boiler repair, Flat 2' }),
      U('x-u05', '2026-08-14', 'Google Workspace', 'office', 10.3, 'Card', { monthly: 'm-google' }),
      U('x-u04', '2026-08-12', 'Apple Store, Trinity Leeds', 'capital', 1299, 'Card', { file: 'apple-receipt-W5521.pdf', note: 'MacBook Air for design work' }),
      U('x-u03b', '2026-08-03', 'EE', 'office', 32, 'Bank transfer', { monthly: 'm-ee' }),
      U('x-u03a', '2026-08-02', 'Adobe Creative Cloud', 'office', 54, 'Card', { monthly: 'm-adobe' }),
      U('x-u03', '2026-08-01', 'Northern Desk Co-working', 'premises', 180, 'Bank transfer', { monthly: 'm-desk' }),
      U('x-u02b', '2026-08-01', 'Leeds Building Society', 'p-finance', 410, 'Bank transfer', { property: FLAT, monthly: 'm-mortgage' }),
      U('x-u02a', '2026-08-07', 'Headingley Lettings', 'p-professional', 105, 'Deducted from rent', { property: FLAT, rentMonth: '2026-08', note: '10% of August’s rent' }),
      U('x-u02', '2026-07-31', 'Dale & Shaw Accountants', 'professional', 600, 'Bank transfer', { file: 'DS-1094.pdf', note: '2025/26 accounts and tax return' }),
      U('x-u01d', '2026-07-29', 'Amazon', null, 64.2, 'Card'),
      U('x-u01c', '2026-07-28', 'Krystal Hosting', 'office', 12, 'Card', { monthly: 'm-krystal' }),
      U('x-u01b', '2026-07-19', 'Footprint Print', 'office', 148, 'Card'),
      U('x-u01a', '2026-07-15', 'Hiscox', 'premises', 186, 'Bank transfer', { file: 'hiscox-policy-2026.pdf', note: 'Professional and public liability insurance for the year' }),
      U('x-u01', '2026-07-14', 'LNER', 'travel', 86.2, 'Card', { note: 'Leeds to London, D&AD workshop' }),
      U('x-u00b', '2026-07-14', 'Google Workspace', 'office', 10.3, 'Card', { monthly: 'm-google' }),
      U('x-u00a', '2026-07-14', 'Premier Inn London', 'travel', 118, 'Card', { note: 'One night for the D&AD workshop' }),
      U('x-u00c', '2026-07-07', 'Headingley Lettings', 'p-professional', 105, 'Deducted from rent', { property: FLAT, rentMonth: '2026-07', note: '10% of July’s rent' }),
      U('x-u00', '2026-07-08', 'Creative Leeds', 'advertising', 75, 'Card', { note: 'Directory listing for a year' })
    ],
    // Serendib Design Studio. October so far (paid Rs 706,580) and September, with input VAT from
    // VAT-registered suppliers' tax invoices for the September VAT and SSCL return (due 20 Oct).
    lk: [
      L('x-l20', '2026-10-10', 'The Lagoon Café', 'entertaining', 14200, 'Cash', { note: 'Lunch with Galle Fort Boutique Hotel' }),
      L('x-l19', '2026-10-09', 'PickMe', 'travel', 2350, 'Cash', { note: 'Taxi to Colombo Dental Clinic' }),
      L('x-l18', '2026-10-08', 'Keells Super', 'office', 7450, 'Cash', { note: 'Tea, coffee and studio supplies', file: 'IMG_7710.jpg' }),
      L('x-l17', '2026-10-07', 'Colombo Print House (Pvt) Ltd', 'cogs', 101480, 'Bank transfer', { vat: 15480, file: 'CPH-2207.pdf', note: 'Brochure print run for Hill Country Tea Estates' }),
      L('x-l16', '2026-10-06', 'Ceypetco, Kollupitiya', 'travel', 18600, 'Cash', { note: 'Fuel for the studio van' }),
      L('x-l15', '2026-10-05', 'SLT-Mobitel', 'utilities', 12500, 'Bank transfer', { vat: 1906.78, monthly: 'm-slt', file: 'slt-oct.pdf', note: 'Fibre internet, October' }),
      L('x-l14', '2026-10-02', 'Studio Furnish (Pvt) Ltd', 'capital', 200000, 'Cheque', { vat: 30508.47, bill: 'b-sf', cheque: { no: '004513', date: '2 Oct' }, note: 'First payment on bill SF-1043' }),
      L('x-l13', '2026-10-01', 'Kollupitiya Estates (Pvt) Ltd', 'rent', 350000, 'Cheque', { monthly: 'm-rent', cheque: { no: '004512', date: '1 Oct' }, file: 'rent-receipt-oct.jpg', note: 'Studio rent, October' }),
      L('x-l12', '2026-09-29', 'Cargills Food City', null, 6350, 'Cash'),
      L('x-l11', '2026-09-27', 'The Lagoon Café', 'entertaining', 9800, 'Cash'),
      L('x-l10', '2026-09-26', 'Techzone Lanka (Pvt) Ltd', 'capital', 572300, 'Bank transfer', { vat: 87300, file: 'TZ-55031.pdf', note: 'Laptop for Dilini' }),
      L('x-l09', '2026-09-25', 'Sparkle Cleaners', 'other', 22000, 'Cash', { monthly: 'm-clean' }),
      L('x-l08', '2026-09-22', 'NWSDB water', 'utilities', 3800, 'Bank transfer', { monthly: 'm-water' }),
      L('x-l07', '2026-09-20', 'Ceypetco, Kollupitiya', 'travel', 21400, 'Cash'),
      L('x-l06', '2026-09-18', 'Adobe Creative Cloud', 'office', 28500, 'Bank transfer', { monthly: 'm-adobe' }),
      L('x-l05', '2026-09-15', 'Guardian Security Services', 'other', 65000, 'Bank transfer', { vat: 9915.25, monthly: 'm-security', file: 'GSS-0915.pdf' }),
      L('x-l04', '2026-09-12', 'Colombo Print House (Pvt) Ltd', 'cogs', 68440, 'Bank transfer', { vat: 10440, bill: 'b-cph-sep', file: 'CPH-2190.pdf' }),
      L('x-l03', '2026-09-08', 'Ceylon Electricity Board', 'utilities', 46200, 'Bank transfer', { note: 'Electricity, August' }),
      L('x-l02', '2026-09-05', 'SLT-Mobitel', 'utilities', 12500, 'Bank transfer', { vat: 1906.78, monthly: 'm-slt' }),
      L('x-l01', '2026-09-01', 'Kollupitiya Estates (Pvt) Ltd', 'rent', 350000, 'Cheque', { monthly: 'm-rent', cheque: { no: '004498', date: '1 Sep' } })
    ]
  }), BE.perCountry({ uk: [], lk: [] }));

  /*
   * Bills: what you owe and pay later. amount is the bill's total (VAT included), vat its input VAT,
   * paid what you've marked paid so far. lines: [{ desc, catId, cat, amt }]. attachment: a photo or PDF
   * of the bill. requested: your accountant asked for the bill's copy. property: UK landlord cost.
   * Open balances count in Going out as still to pay.
   */
  var B = function (country) {
    return function (id, num, who, what, catId, amount, dateIso, dueIso, o) {
      o = o || {};
      var d = new Date(dueIso), t = new Date('2026-10-11');
      var b = {
        id: id, num: num, who: who, what: what, catId: catId, cat: catName(country, catId), amount: amount, vat: o.vat || 0, paid: o.paid || 0,
        date: label(dateIso), due: label(dueIso), dueIn: Math.round((d - t) / 86400000), status: (o.paid || 0) >= amount ? 'paid' : 'open',
        inMonth: o.inMonth !== false, entered: o.entered || label(dateIso), attachment: o.file ? { name: o.file, kind: /\.pdf$/i.test(o.file) ? 'pdf' : 'photo' } : null,
        lines: [{ desc: what, catId: catId, cat: catName(country, catId), amt: amount }],
        history: o.history || [{ label: 'Entered', date: o.entered || label(dateIso) }]
      };
      ['property', 'requested', 'paidOn', 'note'].forEach(function (k) { if (o[k]) b[k] = o[k]; });
      return b;
    };
  };
  var UB = B('uk'), LB = B('lk');
  BE.define('bills', BE.perCountry({
    // Open: £685.
    uk: [
      UB('b-fp', 'FP-3318', 'Footprint Print', 'Posters and programmes for Leeds Print Festival', 'office', 420, '2026-10-02', '2026-10-16', { file: 'FP-3318.pdf', entered: '3 Oct' }),
      UB('b-ds', 'DS-1182', 'Dale & Shaw Accountants', 'Bookkeeping review and Q2 update', 'professional', 180, '2026-10-08', '2026-10-22', { file: 'DS-1182.pdf' }),
      UB('b-gas', 'KH-0907', 'Kirkstall Heating', 'Annual gas safety certificate, Flat 2', 'p-running', 85, '2026-10-09', '2026-10-23', { property: FLAT }),
      UB('b-kh', 'KH-0861', 'Kirkstall Heating', 'Boiler repair, Flat 2', 'p-repairs', 340, '2026-08-15', '2026-08-29', { property: FLAT, paid: 340, paidOn: '18 Aug', inMonth: false, file: 'KH-0861.pdf',
        history: [{ label: 'Entered', date: '15 Aug' }, { label: 'Marked paid £340 by bank transfer', date: '18 Aug' }] })
    ],
    // Open: Rs 768,400.
    lk: [
      LB('b-cph', 'CPH-2219', 'Colombo Print House (Pvt) Ltd', 'Packaging mock-ups for Kandyan Spice Co', 'cogs', 283200, '2026-10-06', '2026-10-16', { vat: 43200, file: 'CPH-2219.pdf' }),
      LB('b-ceb', '0417-2291-09', 'Ceylon Electricity Board', 'Electricity, September', 'utilities', 48000, '2026-10-03', '2026-10-18', { requested: true, entered: '6 Oct' }),
      LB('b-sf', 'SF-1043', 'Studio Furnish (Pvt) Ltd', 'Two designer desks and chairs', 'capital', 495600, '2026-09-25', '2026-10-30', { vat: 75600, paid: 200000, file: 'SF-1043.pdf',
        history: [{ label: 'Entered', date: '26 Sep' }, { label: 'Marked paid Rs 200,000 by cheque 004513', date: '2 Oct' }] }),
      LB('b-jco', 'JC-2026-118', 'Jayasinghe & Co, Chartered Accountants', 'Accounts and VAT returns, July to September', 'professional', 88500, '2026-10-01', '2026-10-31', { vat: 13500, file: 'JC-2026-118.pdf' }),
      LB('b-lwh', 'LWH-8812', 'Lanka Web Hosting (Pvt) Ltd', 'Hosting and domain renewal for a year', 'office', 53100, '2026-10-08', '2026-11-07', { vat: 8100, file: 'LWH-8812.pdf' }),
      LB('b-cph-sep', 'CPH-2190', 'Colombo Print House (Pvt) Ltd', 'Business cards and letterheads', 'cogs', 68440, '2026-09-02', '2026-09-12', { vat: 10440, paid: 68440, paidOn: '12 Sep', inMonth: false, file: 'CPH-2190.pdf',
        history: [{ label: 'Entered', date: '2 Sep' }, { label: 'Marked paid Rs 68,440 by bank transfer', date: '12 Sep' }] })
    ]
  }), BE.perCountry({ uk: [], lk: [] }));

  // Payroll runs and employees live in data-payroll.js (per country).

  // ---- helpers for the Going out screens ----------------------------------------------

  /** Business categories from the country pack ('property' for a UK landlord's flat). */
  BE.expenseCats = function (scope) {
    var p = BE.pack(), prof = BE.get('profile') || {};
    if (scope === 'property') return (p.propertyCategories || []).map(function (c) { return Object.assign({ allowable: c.id !== 'p-finance', property: true }, c); });
    return (p.categories || []).filter(function (c) { return !c.onlyFor || prof.trade === c.onlyFor; });
  };
  /** The pack category for an id (business or property), or null. */
  BE.catById = function (id) {
    if (!id) return null;
    var p = BE.pack();
    return (p.categories || []).concat((p.propertyCategories || []).map(function (c) { return Object.assign({ allowable: c.id !== 'p-finance', property: true }, c); }))
      .filter(function (c) { return c.id === id; })[0] || null;
  };
  /** The category of an expense or bill: its catId, or its plain name for older entries. */
  BE.catOf = function (x) {
    if (!x) return null;
    var c = BE.catById(x.catId);
    if (c) return c;
    var n = String(x.cat || '').toLowerCase();
    return BE.expenseCats().concat(BE.expenseCats('property')).filter(function (k) { return k.name.toLowerCase() === n; })[0] || null;
  };
  /** A short badge for categories that don't simply come off profit. '' when it's allowable. */
  BE.catBadge = function (c) {
    if (!c || c.allowable !== false) return '';
    if (c.id === 'p-finance') return '20% tax credit, not deducted';
    if (c.id === 'capital') return 'Capital allowances instead';
    return 'Not allowable';
  };
  /** How money can be paid out, per country. */
  BE.payMethods = function () {
    return BE.is('lk')
      ? [{ id: 'Bank transfer', label: 'Bank transfer' }, { id: 'Cheque', label: 'Cheque' }, { id: 'Cash', label: 'Cash' }]
      : [{ id: 'Bank transfer', label: 'Bank transfer or direct debit' }, { id: 'Card', label: 'Card' }, { id: 'Cash', label: 'Cash' }];
  };
  /** "Cheque 004512" or "Bank transfer". */
  BE.howText = function (x) { return x && x.how === 'Cheque' && x.cheque && x.cheque.no ? 'Cheque ' + x.cheque.no : (x && x.how) || ''; };
  /** Is the business VAT registered (input VAT is recorded on expenses and bills)? */
  BE.vatOn = function () { return !!(BE.get('profile') || {}).vatRegistered; };
  /** The standard VAT rate in the country pack (0.2 UK, 0.18 Sri Lanka). */
  BE.vatRate = function () { var v = (BE.pack().vatRates || [])[0]; return v ? v.rate : 0; };
  /** VAT inside a VAT-inclusive total at the standard rate. */
  BE.vatIn = function (total) { var r = BE.vatRate(); return r2((Number(total) || 0) * r / (1 + r)); };
  /** A date n days from today (11 Oct 2026) as { label: '9 Oct', iso: '2026-10-09' }. */
  BE.dayOf = function (n) {
    var d = new Date(2026, 9, 11 + (Number(n) || 0));
    return { label: d.getDate() + ' ' + MON[d.getMonth()], iso: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') };
  };

  /**
   * Record money already spent. o: { who, amount (what was paid), catId, bizPct, vat, how, cheque,
   * property, attachment, note, dayOffset (0 = today), monthly, bill }. Counts in Going out as paid.
   */
  BE.recordExpense = function (o) {
    var d = BE.dayOf(o.dayOffset || 0);
    var gross = r2(o.amount), pct = Math.max(0, Math.min(100, Number(o.bizPct) || 100));
    var c = BE.catById(o.catId);
    var x = {
      id: BE.id('exp'), who: o.who, catId: c ? c.id : null, cat: c ? c.name : 'Uncategorised', how: o.how || 'Bank transfer',
      date: d.label, iso: d.iso, inMonth: d.iso.indexOf('2026-10') === 0, gross: gross, bizPct: pct, amount: r2(gross * pct / 100),
      vat: r2(o.vat || 0), attachment: o.attachment || null, receipt: !!o.attachment, note: o.note || '', kind: 'business', events: [], isNew: true
    };
    ['cheque', 'property', 'monthly', 'bill'].forEach(function (k) { if (o[k]) x[k] = o[k]; });
    BE.change(function (s) {
      s.expenses = [x].concat(s.expenses || []);
      BE._log(s, 'Recorded ' + BE.money(gross) + ' to ' + x.who + ' under ' + x.cat + (pct < 100 ? ' (' + pct + '% business)' : ''));
    });
    return x;
  };

  /** Change how much of an expense is for the business (UK). The business share counts in Going out. */
  BE.setBizPct = function (id, pct) {
    pct = Math.max(1, Math.min(100, Math.round(Number(pct) || 100)));
    return BE.expenseEvent(id, 'Business use set to ' + pct + '%', null, function (x) {
      var gross = x.gross != null ? x.gross : x.amount;
      return { gross: gross, bizPct: pct, amount: r2(gross * pct / 100) };
    });
  };

  /** What's still owed on a bill. */
  BE.billLeft = function (b) {
    if (!b) return 0;
    return Math.max(0, r2((Number(b.amount) || 0) + (Number(b.stockAmt) || 0) - (Number(b.paid) || 0) - (Number(b.stockPaid) || 0)));
  };
  /** The whole bill. */
  BE.billTotal = function (b) { return b ? r2((Number(b.amount) || 0) + (Number(b.stockAmt) || 0)) : 0; };

  /**
   * Mark a bill paid in full (amount omitted) or in part, the way you paid it outside the app.
   * Adds the payment as an expense (with its share of the bill's input VAT) and moves it from
   * still to pay to paid in Going out. Returns { bill, expense }.
   */
  BE.markBillPaid = function (id, amount, how, cheque) {
    var b = BE.find('bills', id);
    if (!b) return { bill: null, expense: null };
    var left = BE.billLeft(b);
    var amt = amount == null ? left : Math.min(r2(amount), left);
    if (!(amt > 0)) return { bill: b, expense: null };
    how = how || 'Bank transfer';
    var d = BE.dayOf(0);
    var c = BE.catOf(b);
    var vat = b.vat ? r2(b.vat * amt / (b.amount || 1)) : 0;
    var x = { id: BE.id('exp'), who: b.who, catId: c ? c.id : null, cat: c ? c.name : (b.cat || 'Uncategorised'), how: how, date: d.label, iso: d.iso, inMonth: true,
      gross: amt, bizPct: 100, amount: amt, vat: vat, attachment: b.attachment || null, receipt: !!b.attachment, note: 'Payment on bill ' + (b.num || ''), kind: 'business', bill: id, events: [], isNew: true };
    if (b.property) x.property = b.property;
    if (how === 'Cheque' && cheque) x.cheque = cheque;
    var out = null;
    BE.change(function (s) {
      s.bills = (s.bills || []).map(function (y) {
        if (y.id !== id) return y;
        var paid = r2((y.paid || 0) + amt);
        out = Object.assign({}, y, { paid: paid, status: paid >= BE.billTotal(y) ? 'paid' : 'open', paidOn: d.label,
          history: (y.history || []).concat([{ label: 'Marked paid ' + BE.money(amt) + ' by ' + (how === 'Cheque' && cheque && cheque.no ? 'cheque ' + cheque.no : how.toLowerCase()), date: d.label }]) });
        return out;
      });
      s.expenses = [x].concat(s.expenses || []);
      BE._log(s, 'Marked ' + BE.money(amt) + ' paid to ' + b.who + (out && out.status === 'paid' ? ' · bill ' + (b.num || '') + ' is paid' : ' (part of bill ' + (b.num || '') + ')'));
    });
    return { bill: out, expense: x };
  };
  /** Older name, kept for other screens: mark a bill paid. Returns the bill. */
  BE.payBillAll = function (id, amount, how) { return BE.markBillPaid(id, amount, how).bill; };

  /** Add an event to an expense's history (newest first). fn(x) can compute more fields. */
  BE.expenseEvent = function (id, label, patch, fn) {
    return BE.update('expenses', id, function (x) {
      return Object.assign({}, patch || {}, fn ? fn(x) : {}, { events: [{ label: label, who: (BE.get('profile') || {}).owner || 'You', date: BE.today }].concat(x.events || []) });
    });
  };
})();
