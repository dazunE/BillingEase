/* Coming in: invoices, payments recorded by hand and customers, one seed per country.
   UK: Harper Studio (Leeds, not VAT registered, HS- invoices, 14-day terms).
   Sri Lanka: Serendib Design Studio (Colombo 03, VAT and SSCL registered, SDS- Tax Invoices, 30-day terms). */
(function () {
  var E = function (label, date, todo) { return { label: label, date: date, todo: !!todo }; };
  var PACKS = window.COUNTRY || {};

  // ---- tax on invoice lines -------------------------------------------------
  // A line: { name, qty, unit, rate, vat: 'std' | 'reduced' | 'zero' | 'exempt' | 'outside' | 'fin' }.
  // UK: VAT per line when the business is VAT registered. Sri Lanka: SSCL on the value of the supply as its
  // own line, then VAT on the value plus SSCL (how SSCL sits in the VAT base is to confirm with IRD).
  function r2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function calc(pack, lines, discount, vatOn, ssclOn) {
    lines = lines || [];
    var gross = lines.reduce(function (a, l) { return a + (Number(l.qty) || 0) * (Number(l.rate) || 0); }, 0);
    var disc = Math.min(Number(discount) || 0, gross);
    var f = gross > 0 ? (gross - disc) / gross : 0;
    var rates = {};
    (pack.vatRates || []).forEach(function (v) { rates[v.id] = v; });
    var ssclRate = ssclOn ? (pack.sscl || 0) : 0;
    var sscl = 0, groups = {};
    lines.forEach(function (l) {
      var net = (Number(l.qty) || 0) * (Number(l.rate) || 0) * f;
      var s = ssclRate && l.sscl !== false ? net * ssclRate : 0;
      sscl += s;
      if (!vatOn) return;
      var v = rates[l.vat] || rates.std || { id: 'std', label: '', rate: 0 };
      var g = groups[v.id] = groups[v.id] || { id: v.id, label: v.label, rate: v.rate, base: 0, amount: 0 };
      g.base += net + s;
      g.amount += (net + s) * v.rate;
    });
    sscl = r2(sscl);
    var vatRows = Object.keys(groups).map(function (k) { var g = groups[k]; return { id: g.id, label: g.label, rate: g.rate, base: r2(g.base), amount: r2(g.amount) }; });
    var vat = r2(vatRows.reduce(function (a, g) { return a + g.amount; }, 0));
    var net = r2(gross - disc);
    return { gross: r2(gross), discount: r2(disc), net: net, sscl: sscl, ssclRate: ssclRate, vat: vat, vatRows: vatRows, tax: r2(sscl + vat), total: r2(net + sscl + vat), vatOn: !!vatOn, ssclOn: !!ssclOn };
  }
  // Seed helper: an invoice with its tax worked out for the country.
  function seed(country, inv) {
    var pack = PACKS[country] || {};
    var vatOn = country === 'lk', ssclOn = country === 'lk';
    var t = calc(pack, inv.lines, inv.discount, vatOn, ssclOn);
    return Object.assign({ cur: country === 'lk' ? 'LKR' : 'GBP', tax: t.tax, vatAmt: t.vat, ssclAmt: t.sscl, vatOn: vatOn, ssclOn: ssclOn, credit: 0, paid: 0, viewed: false }, inv);
  }
  var L = function (name, qty, unit, rate, vat) { var l = { name: name, qty: qty, unit: unit, rate: rate }; if (vat) l.vat = vat; return l; };

  // ---- invoices --------------------------------------------------------------
  // inMonth: counts toward October's Coming in (open and not late = expected). iso: the issue date.
  var UK = [
    seed('uk', { num: 'HS-0049', who: 'Leeds Print Festival', what: '2027 brand refresh, stage 1', lines: [L('Design days', 5, 'days', 450), L('Brand workshop', 1, 'workshop', 500)], issued: '6 Oct', iso: '2026-10-06', due: '20 Oct', dueIn: 9, inMonth: true, email: 'hello@leedsprintfest.co.uk', from: 'Q-0010',
      events: [E('Made from accepted quote Q-0010', '6 Oct'), E('Emailed to hello@leedsprintfest.co.uk', '6 Oct'), E('Due', '20 Oct', true)] }),
    seed('uk', { num: 'HS-0048', who: 'Moor & Dale Outdoor', what: 'October social graphics', lines: [L('Monthly social graphics', 1, 'month', 1200)], issued: '1 Oct', iso: '2026-10-01', due: '15 Oct', dueIn: 4, inMonth: true, email: 'accounts@moorandale.co.uk', repeat: true,
      events: [E('Made from a repeating invoice (monthly)', '1 Oct'), E('Emailed to accounts@moorandale.co.uk', '1 Oct'), E('Due', '15 Oct', true)] }),
    seed('uk', { num: 'HS-0047', who: 'Kirkstall Brewing Co', what: 'Winter seasonal labels', lines: [L('Label design', 5, 'labels', 650), L('Print-ready artwork and proofs', 1, 'job', 700)], paid: 3950, paidHow: 'Bank transfer', paidOn: '2 Oct', issued: '18 Sep', iso: '2026-09-18', due: '2 Oct', dueIn: -9, inMonth: true, email: 'finance@kirkstallbrewing.co.uk',
      events: [E('Emailed to finance@kirkstallbrewing.co.uk', '18 Sep'), E('Paid £3,950 by bank transfer, recorded by you', '2 Oct')] }),
    seed('uk', { num: 'HS-0046', who: 'Ochre Café', what: 'Window and A-board graphics', lines: [L('Design hours', 6, 'hours', 55), L('A-board artwork', 1, 'job', 120)], issued: '8 Sep', iso: '2026-09-08', due: '22 Sep', dueIn: -19, inMonth: false, email: 'sam@ochrecafe.co.uk',
      events: [E('Emailed to sam@ochrecafe.co.uk', '8 Sep'), E('Was due', '22 Sep'), E('Reminder emailed by you', '29 Sep')] }),
    seed('uk', { num: 'HS-0045', who: 'Pennine Physio', what: 'Website graphics', lines: [L('Design days', 3, 'days', 450), L('Icon set', 1, 'set', 420)], credit: 120, paid: 1650, paidHow: 'Bank transfer', paidOn: '15 Sep', issued: '2 Sep', iso: '2026-09-02', due: '16 Sep', dueIn: -25, inMonth: false, email: 'admin@penninephysio.co.uk',
      events: [E('Emailed to admin@penninephysio.co.uk', '2 Sep'), E('Money back CN-0001 applied, £120 for the icon set arriving late', '3 Sep'), E('Paid £1,650 by bank transfer, recorded by you', '15 Sep')] }),
    seed('uk', { num: 'HS-0044', who: 'Ochre Café', what: 'Menu redesign', lines: [L('Menu design', 1, 'job', 850)], paid: 850, paidHow: 'Card machine', paidOn: '3 Sep', issued: '22 Aug', iso: '2026-08-22', due: '5 Sep', dueIn: -36, inMonth: false, email: 'sam@ochrecafe.co.uk',
      events: [E('Emailed to sam@ochrecafe.co.uk', '22 Aug'), E('Paid £850 by card machine, recorded by you', '3 Sep')] }),
    seed('uk', { num: 'HS-0043', who: 'Leeds Print Festival', what: 'Festival poster and wayfinding', lines: [L('Design days', 6, 'days', 450), L('Wayfinding sign set', 1, 'set', 900)], paid: 3600, paidHow: 'Bank transfer', paidOn: '26 Aug', issued: '12 Aug', iso: '2026-08-12', due: '26 Aug', dueIn: -46, inMonth: false, email: 'hello@leedsprintfest.co.uk',
      events: [E('Emailed to hello@leedsprintfest.co.uk', '12 Aug'), E('Paid £3,600 by bank transfer, recorded by you', '26 Aug')] }),
    seed('uk', { num: 'HS-0042', who: 'Moor & Dale Outdoor', what: 'Summer catalogue layout', lines: [L('Catalogue layout', 48, 'pages', 85), L('Product photo retouching', 1, 'job', 720)], paid: 4800, paidHow: 'Bank transfer', paidOn: '8 Aug', issued: '28 Jul', iso: '2026-07-28', due: '11 Aug', dueIn: -61, inMonth: false, email: 'accounts@moorandale.co.uk',
      events: [E('Emailed to accounts@moorandale.co.uk', '28 Jul'), E('Paid £4,800 by bank transfer, recorded by you', '8 Aug')] }),
    seed('uk', { num: 'HS-0041', who: 'Kirkstall Brewing Co', what: 'Summer beer label series', lines: [L('Label design', 3, 'labels', 650), L('Print-ready artwork and proofs', 1, 'job', 1000)], paid: 2950, paidHow: 'Bank transfer', paidOn: '25 Jul', issued: '14 Jul', iso: '2026-07-14', due: '28 Jul', dueIn: -75, inMonth: false, email: 'finance@kirkstallbrewing.co.uk',
      events: [E('Emailed to finance@kirkstallbrewing.co.uk', '14 Jul'), E('Paid £2,950 by bank transfer, recorded by you', '25 Jul')] }),
    seed('uk', { num: 'D-1', draft: true, who: 'Pennine Physio', what: 'Clinic leaflet', lines: [L('Design hours', 8, 'hours', 55)], issued: '9 Oct', iso: '2026-10-09', due: '', dueIn: 99, inMonth: false, email: 'admin@penninephysio.co.uk',
      events: [E('Started by Ellie Harper', '9 Oct')] })
  ];

  var LK = [
    seed('lk', { num: 'SDS-0219', who: 'Galle Fort Boutique Hotel', what: 'Menu and room collateral', lines: [L('Menu design', 6, 'pages', 35000), L('Room compendium layout', 1, 'job', 130000)], credit: 24190, issued: '7 Oct', iso: '2026-10-07', delivered: '7 Oct', due: '6 Nov', dueIn: 26, inMonth: true, email: 'gm@gallefortboutique.lk',
      events: [E('Emailed to gm@gallefortboutique.lk', '7 Oct'), E('Credit note CN-0007 applied, Rs 24,190 for two menu pages dropped', '9 Oct'), E('Due', '6 Nov', true)] }),
    seed('lk', { num: 'SDS-0218', who: 'Hill Country Tea Estates', what: 'Visitor centre signage', lines: [L('Signage design', 8, 'signs', 95000)], issued: '3 Oct', iso: '2026-10-03', delivered: '3 Oct', due: '2 Nov', dueIn: 22, inMonth: true, email: 'accounts@hillcountrytea.lk', from: 'Q-0020',
      events: [E('Made from accepted quote Q-0020', '3 Oct'), E('Emailed to accounts@hillcountrytea.lk', '3 Oct'), E('Due', '2 Nov', true)] }),
    seed('lk', { num: 'SDS-0217', who: 'Colombo Dental Clinic', what: 'Social media pack, October', lines: [L('Social media pack', 1, 'month', 180000)], issued: '1 Oct', iso: '2026-10-01', delivered: '1 Oct', due: '31 Oct', dueIn: 20, inMonth: true, email: 'office@colombodental.lk', repeat: true,
      events: [E('Made from a repeating invoice (monthly)', '1 Oct'), E('Emailed to office@colombodental.lk', '1 Oct'), E('Due', '31 Oct', true)] }),
    seed('lk', { num: 'SDS-0216', who: 'Kandyan Spice Co (Pvt) Ltd', what: 'Website banners', lines: [L('Banner design', 6, 'banners', 25000)], issued: '22 Sep', iso: '2026-09-22', delivered: '22 Sep', due: '22 Oct', dueIn: 11, inMonth: true, email: 'accounts@kandyanspice.lk',
      events: [E('Emailed to accounts@kandyanspice.lk', '22 Sep'), E('Due', '22 Oct', true)] }),
    seed('lk', { num: 'SDS-0215', who: 'Lanka Agri Exports (Pvt) Ltd', what: 'Trade fair stand graphics', lines: [L('Stand graphics', 1, 'job', 400000), L('Design days', 2, 'days', 60000)], paid: 300000, paidHow: 'Bank transfer', paidOn: '6 Oct', issued: '15 Sep', iso: '2026-09-15', delivered: '15 Sep', due: '15 Oct', dueIn: 4, inMonth: true, email: 'payables@lankaagri.lk',
      events: [E('Emailed to payables@lankaagri.lk', '15 Sep'), E('Part paid Rs 300,000 by bank transfer, recorded by you', '6 Oct'), E('Balance due', '15 Oct', true)] }),
    seed('lk', { num: 'SDS-0214', who: 'Galle Fort Boutique Hotel', what: 'Brand identity refresh', lines: [L('Brand identity package', 1, 'job', 650000)], paid: 786175, paidHow: 'Cheque', paidOn: '2 Oct', cheque: { no: '004512', date: '30 Sep', bank: 'Sampath Bank, Galle' }, issued: '5 Sep', iso: '2026-09-05', delivered: '5 Sep', due: '5 Oct', dueIn: -6, inMonth: true, email: 'gm@gallefortboutique.lk',
      events: [E('Emailed to gm@gallefortboutique.lk', '5 Sep'), E('Paid Rs 786,175 by cheque no. 004512 (Sampath Bank, dated 30 Sep), recorded by you', '2 Oct')] }),
    seed('lk', { num: 'SDS-0213', who: 'Hill Country Tea Estates', what: 'Tea tin artwork', lines: [L('Packaging design', 8, 'SKUs', 150000)], paid: 1451400, paidHow: 'Bank transfer', paidOn: '29 Sep', issued: '1 Sep', iso: '2026-09-01', delivered: '1 Sep', due: '1 Oct', dueIn: -10, inMonth: false, email: 'accounts@hillcountrytea.lk',
      events: [E('Emailed to accounts@hillcountrytea.lk', '1 Sep'), E('Paid Rs 1,451,400 by bank transfer, recorded by you', '29 Sep')] }),
    seed('lk', { num: 'SDS-0212', who: 'Colombo Dental Clinic', what: 'Clinic signage', lines: [L('Signage design', 2, 'signs', 95000), L('Design days', 2, 'days', 45000)], issued: '20 Aug', iso: '2026-08-20', delivered: '20 Aug', due: '19 Sep', dueIn: -22, inMonth: false, email: 'office@colombodental.lk',
      events: [E('Emailed to office@colombodental.lk', '20 Aug'), E('Was due', '19 Sep'), E('Reminder emailed by you', '26 Sep')] }),
    seed('lk', { num: 'SDS-0211', who: 'Lanka Agri Exports (Pvt) Ltd', what: 'Export catalogue 2026', lines: [L('Catalogue layout', 60, 'pages', 9500), L('Cover and photography direction', 1, 'job', 280000)], paid: 1028075, paidHow: 'Bank transfer', paidOn: '10 Sep', issued: '12 Aug', iso: '2026-08-12', delivered: '12 Aug', due: '11 Sep', dueIn: -30, inMonth: false, email: 'payables@lankaagri.lk',
      events: [E('Emailed to payables@lankaagri.lk', '12 Aug'), E('Paid Rs 1,028,075 by bank transfer, recorded by you', '10 Sep')] }),
    seed('lk', { num: 'SDS-0210', who: 'Kandyan Spice Co (Pvt) Ltd', what: 'Packaging design, pepper range', lines: [L('Packaging design', 3, 'SKUs', 150000)], paid: 544275, paidHow: 'Bank transfer', paidOn: '1 Sep', issued: '4 Aug', iso: '2026-08-04', delivered: '4 Aug', due: '3 Sep', dueIn: -38, inMonth: false, email: 'accounts@kandyanspice.lk',
      events: [E('Emailed to accounts@kandyanspice.lk', '4 Aug'), E('Paid Rs 544,275 by bank transfer, recorded by you', '1 Sep')] }),
    seed('lk', { num: 'D-1', draft: true, who: 'Kandyan Spice Co (Pvt) Ltd', what: 'Gift box sleeves', lines: [L('Packaging design', 2, 'SKUs', 110000)], issued: '9 Oct', iso: '2026-10-09', due: '', dueIn: 99, inMonth: false, email: 'accounts@kandyanspice.lk',
      events: [E('Started by Ayesha Fernando', '9 Oct')] })
  ];
  BE.define('invoices', BE.perCountry({ uk: UK, lk: LK }), BE.perCountry({ uk: [], lk: [] }));

  // Money received, recorded by hand. inMonth: received in October (counts as "paid" in Coming in).
  var P = function (id, inv, who, amount, how, date, iso, inMonth, extra) { return Object.assign({ id: id, inv: inv, who: who, amount: amount, orig: amount, how: how, date: date, iso: iso, inMonth: inMonth, manual: true }, extra || {}); };
  BE.define('payments', BE.perCountry({
    uk: [
      P('pay-7', 'HS-0047', 'Kirkstall Brewing Co', 3950, 'Bank transfer', '2 Oct', '2026-10-02', true, { cur: 'GBP' }),
      P('pay-6', 'HS-0045', 'Pennine Physio', 1650, 'Bank transfer', '15 Sep', '2026-09-15', false, { cur: 'GBP' }),
      P('pay-5', 'HS-0044', 'Ochre Café', 850, 'Card machine', '3 Sep', '2026-09-03', false, { cur: 'GBP' }),
      P('pay-4', 'HS-0043', 'Leeds Print Festival', 3600, 'Bank transfer', '26 Aug', '2026-08-26', false, { cur: 'GBP' }),
      P('pay-3', 'HS-0042', 'Moor & Dale Outdoor', 4800, 'Bank transfer', '8 Aug', '2026-08-08', false, { cur: 'GBP' }),
      P('pay-2', 'HS-0041', 'Kirkstall Brewing Co', 2950, 'Bank transfer', '25 Jul', '2026-07-25', false, { cur: 'GBP' })
    ],
    lk: [
      P('pay-16', 'SDS-0215', 'Lanka Agri Exports (Pvt) Ltd', 300000, 'Bank transfer', '6 Oct', '2026-10-06', true, { cur: 'LKR', ref: 'COMB 6610 2241' }),
      P('pay-15', 'SDS-0214', 'Galle Fort Boutique Hotel', 786175, 'Cheque', '2 Oct', '2026-10-02', true, { cur: 'LKR', chequeNo: '004512', chequeDate: '30 Sep', chequeBank: 'Sampath Bank, Galle', toConfirm: true }),
      P('pay-14', 'SDS-0213', 'Hill Country Tea Estates', 1451400, 'Bank transfer', '29 Sep', '2026-09-29', false, { cur: 'LKR' }),
      P('pay-13', 'SDS-0211', 'Lanka Agri Exports (Pvt) Ltd', 1028075, 'Bank transfer', '10 Sep', '2026-09-10', false, { cur: 'LKR' }),
      P('pay-12', 'SDS-0210', 'Kandyan Spice Co (Pvt) Ltd', 544275, 'Bank transfer', '1 Sep', '2026-09-01', false, { cur: 'LKR' })
    ]
  }), BE.perCountry({ uk: [], lk: [] }));

  // Customers. Their invoices, quotes, repeats and credit notes come from those collections (matched on name).
  // tax: their VAT number (UK) or VAT registration number (Sri Lanka); tin: Sri Lanka TIN.
  var C = function (o) { return Object.assign({ invoices: [], quotes: [], recurring: [], credits: [] }, o); };
  BE.define('customers', BE.perCountry({
    uk: [
      C({ id: 'kirkstall', name: 'Kirkstall Brewing Co', contact: 'Owen Baxter', email: 'finance@kirkstallbrewing.co.uk', phone: '0113 496 0734', address: 'Unit 4, Broad Lane, Kirkstall, Leeds LS5 3RE', country: 'United Kingdom', cur: 'GBP', tax: 'GB 318 4471 26', since: 'Customer since March 2025', paid: 14650,
        note: 'Pays by bank transfer within a week. Owen signs off artwork; finance pays.' }),
      C({ id: 'moordale', name: 'Moor & Dale Outdoor', contact: 'Hannah Moore', email: 'accounts@moorandale.co.uk', phone: '01423 555 210', address: '22 Parliament Street, Harrogate HG1 2QU', country: 'United Kingdom', cur: 'GBP', tax: 'GB 902 1187 40', since: 'Customer since January 2026', paid: 10800,
        note: 'Monthly social graphics on a repeating invoice. Spring catalogue quote is with Hannah.' }),
      C({ id: 'leedsprint', name: 'Leeds Print Festival', contact: 'Jas Kaur', email: 'hello@leedsprintfest.co.uk', phone: '0113 496 0921', address: 'Munro House, Duke Street, Leeds LS9 8AG', country: 'United Kingdom', cur: 'GBP', tax: '', since: 'Customer since May 2025', paid: 6100,
        note: 'Community interest company. Pays on the due date.' }),
      C({ id: 'ochre', name: 'Ochre Café', contact: 'Sam Okafor', email: 'sam@ochrecafe.co.uk', phone: '01904 555 418', address: '7 Fossgate, York YO1 9TA', country: 'United Kingdom', cur: 'GBP', tax: '', since: 'Customer since June 2026', paid: 850,
        note: 'HS-0046 is late. Sam prefers a phone call to an email.' }),
      C({ id: 'pennine', name: 'Pennine Physio', contact: 'Dr Rachel Lee', email: 'admin@penninephysio.co.uk', phone: '01484 555 307', address: '3 Westgate, Huddersfield HD1 1NS', country: 'United Kingdom', cur: 'GBP', tax: '', since: 'Customer since August 2026', paid: 1650,
        note: 'Accepted the clinic signage quote on 9 Oct. A leaflet invoice is in drafts.' })
    ],
    lk: [
      C({ id: 'kandyan', name: 'Kandyan Spice Co (Pvt) Ltd', contact: 'Nimal Rathnayake', email: 'accounts@kandyanspice.lk', phone: '081 222 4410', address: '14 Peradeniya Road, Kandy 20000', country: 'Sri Lanka', cur: 'LKR', tin: '114 728 365', tax: '114728365-7000', since: 'Customer since February 2025', paid: 2310000,
        note: 'Pays by bank transfer near the due date. Gift box sleeves are in drafts.' }),
      C({ id: 'gallefort', name: 'Galle Fort Boutique Hotel', contact: 'Dinesh Wijeratne', email: 'gm@gallefortboutique.lk', phone: '091 223 8811', address: '28 Church Street, Fort, Galle 80000', country: 'Sri Lanka', cur: 'LKR', tin: '409 115 732', tax: '409115732-7000', since: 'Customer since May 2026', paid: 786175,
        note: 'Pays by cheque. The September cheque (no. 004512) is waiting for Jayasinghe & Co to confirm.' }),
      C({ id: 'lankaagri', name: 'Lanka Agri Exports (Pvt) Ltd', contact: 'Shirani de Silva', email: 'payables@lankaagri.lk', phone: '011 233 5672', address: '120 Union Place, Colombo 02', country: 'Sri Lanka', cur: 'LKR', tin: '134 662 019', tax: '134662019-7000', since: 'Customer since October 2025', paid: 1328075,
        note: 'Paid part of SDS-0215 on 6 Oct; balance due 15 Oct. Accepted the 2027 catalogue quote.' }),
      C({ id: 'dental', name: 'Colombo Dental Clinic', contact: 'Dr Priyanka Gunasekara', email: 'office@colombodental.lk', phone: '011 269 4471', address: '18 Ward Place, Colombo 07', country: 'Sri Lanka', cur: 'LKR', tin: '217 390 554', tax: '', since: 'Customer since April 2026', paid: 870840,
        note: 'Not VAT registered. SDS-0212 is late; the office manager asked for a WhatsApp reminder.' }),
      C({ id: 'hillcountry', name: 'Hill Country Tea Estates', contact: 'Ravi Kumaran', email: 'accounts@hillcountrytea.lk', phone: '052 222 3390', address: 'Hawa Eliya Road, Nuwara Eliya 22200', country: 'Sri Lanka', cur: 'LKR', tin: '102 448 671', tax: '102448671-7000', since: 'Customer since July 2025', paid: 2902800,
        note: 'Large orders; pays by bank transfer. Visitor centre signage invoiced from quote Q-0020.' })
    ]
  }), BE.perCountry({ uk: [], lk: [] }));

  // ---- Coming in helpers (used by ThreeIn, SellInvoices, SellInvoice, SellQuote(s), SellRecurring) ----
  function pack() { return BE.pack ? BE.pack() : {}; }
  function prof() { return BE.get('profile') || {}; }
  /** Is VAT charged on new invoices? UK: when VAT registered. Sri Lanka: when VAT registered. */
  BE.vatOn = function () { return !!prof().vatRegistered; };
  /** Is SSCL charged on new invoices? Sri Lanka only, when SSCL registered. */
  BE.ssclOn = function () { return !!(pack().features && pack().features.sscl && prof().ssclRegistered); };
  /** Tax on a set of lines (uses the invoice's own vatOn/ssclOn when given, otherwise the business's). */
  BE.calcTax = function (lines, discount, o) {
    o = o || {};
    return calc(pack(), lines, discount, o.vatOn != null ? o.vatOn : BE.vatOn(), o.ssclOn != null ? o.ssclOn : BE.ssclOn());
  };
  /** The tax on an existing invoice, worked out from its lines with the registration it was issued under. */
  BE.invTax = function (inv) { return calc(pack(), inv.lines, inv.discount, !!inv.vatOn, !!inv.ssclOn); };
  /** Rows to print under the subtotal: SSCL first (Sri Lanka), then VAT per rate. */
  BE.taxRows = function (t, cur) {
    var rows = [];
    if (t.ssclOn && t.sscl) rows.push({ label: 'SSCL ' + (t.ssclRate * 100) + '%', sub: 'Social Security Contribution Levy', amount: BE.money(t.sscl, cur, { cents: true }) });
    (t.vatRows || []).forEach(function (g) {
      rows.push({ label: 'VAT ' + (g.id === 'exempt' ? 'exempt' : g.id === 'outside' ? 'outside scope' : g.label.replace(/ \(.*\)$/, '')), sub: 'on ' + BE.money(g.base, cur, { cents: true }) + (t.ssclOn && t.sscl ? ' (value plus SSCL)' : ''), amount: BE.money(g.amount, cur, { cents: true }) });
    });
    return rows;
  };
  /** The title on the invoice: "Tax Invoice" (Sri Lanka, VAT registered), "VAT invoice" (UK, VAT registered) or "Invoice". */
  BE.invTitle = function (inv) {
    var p = pack();
    var on = inv ? !!inv.vatOn : BE.vatOn();
    return on ? (p.vatInvoiceTitle || 'VAT invoice') : (p.invoiceTitle || 'Invoice');
  };
  /** Your legal fields printed on invoices and quotes. */
  BE.sellerFields = function () {
    var p = prof(), k = pack(), out = [];
    if (BE.is('lk')) {
      if (p.tin) out.push({ label: k.taxIdLabel || 'TIN', value: p.tin });
      if (p.vatRegistered && p.vatNo) out.push({ label: k.vatIdLabel || 'VAT registration number', value: p.vatNo });
      if (p.ssclRegistered) out.push({ label: 'SSCL', value: 'Registered' });
    } else if (p.vatRegistered && p.vatNo) out.push({ label: k.vatIdLabel || 'VAT number', value: p.vatNo });
    return out;
  };
  /** The customer's legal fields printed on invoices. */
  BE.buyerFields = function (c) {
    if (!c) return [];
    var k = pack(), out = [];
    if (BE.is('lk')) {
      if (c.tin) out.push({ label: 'Purchaser’s ' + (k.taxIdLabel || 'TIN'), value: c.tin });
      if (c.tax) out.push({ label: 'Purchaser’s VAT no.', value: c.tax });
    } else if (c.tax) out.push({ label: 'VAT number', value: c.tax });
    return out;
  };
  /** How customers pay you, recorded by hand. UK: bank transfer, card machine, cash, cheque. Sri Lanka: bank transfer, cheque, cash, LankaQR. */
  BE.receiveMethods = function () { return pack().payMethods || (BE.is('lk') ? ['Bank transfer', 'Cheque', 'Cash', 'LankaQR'] : ['Bank transfer', 'Card machine', 'Cash', 'Cheque']); };
  /** Payment terms in days for new invoices (from the business profile: 14 in the UK sample, 30 in Sri Lanka). */
  BE.terms = function () { var t = parseInt(prof().terms, 10); return isFinite(t) && t >= 0 ? t : (BE.is('lk') ? 30 : 14); };

  // Invoice numbers follow your prefix (HS-0050, SDS-0220); quotes Q- and credit notes CN- count from your own.
  var baseNext = BE.nextNumber;
  BE.nextNumber = function (prefix) {
    var list, pre;
    if (prefix === 'INV') { pre = prof().prefix || 'INV-'; list = BE.all('invoices'); }
    else if (prefix === 'Q') { pre = 'Q-'; list = BE.all('quotes'); }
    else if (prefix === 'CN') { pre = 'CN-'; list = BE.all('creditNotes'); }
    else return baseNext(prefix);
    var re = new RegExp('^' + pre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)$');
    var max = 0;
    list.forEach(function (x) { var m = String(x.num || '').match(re); if (m) max = Math.max(max, +m[1]); });
    return pre + String(max + 1).padStart(4, '0');
  };

  /**
   * Make (and by default send) an invoice with the country's tax: VAT per line (UK, VAT registered),
   * SSCL then VAT (Sri Lanka). o: { who, what, lines, discount, terms, draft, repeat, from, note, email }.
   */
  BE.makeInvoice = function (o) {
    var t = BE.calcTax(o.lines, o.discount);
    var inv = BE.createInvoice(Object.assign({}, o, { tax: t.tax, cur: o.cur || BE.get('profile').currency, terms: o.terms == null ? BE.terms() : o.terms }));
    var iso = '2026-10-11';
    return BE.update('invoices', inv.num, function (x) {
      var ev = (x.events || []).map(function (e) { return /^Sent to /.test(e.label) ? Object.assign({}, e, { label: e.label.replace(/^Sent to /, 'Emailed to ') }) : e; });
      return { vatOn: t.vatOn, ssclOn: t.ssclOn, vatAmt: t.vat, ssclAmt: t.sscl, tax: t.tax, iso: iso, delivered: BE.is('lk') ? BE.today : undefined, viewed: undefined, deposit: 0, events: ev };
    }, 'num');
  };
  /** Work an invoice's tax out again after its lines change (keeps the registration it was issued under, or takes today's for drafts). */
  BE.retaxInvoice = function (num) {
    return BE.update('invoices', num, function (x) {
      var on = x.draft ? { vatOn: BE.vatOn(), ssclOn: BE.ssclOn() } : { vatOn: !!x.vatOn, ssclOn: !!x.ssclOn };
      var t = calc(pack(), x.lines, x.discount, on.vatOn, on.ssclOn);
      return { vatOn: t.vatOn, ssclOn: t.ssclOn, vatAmt: t.vat, ssclAmt: t.sscl, tax: t.tax };
    }, 'num');
  };

  /** The customer record for a name on an invoice (or null). */
  BE.customerOf = function (name) { return BE.find('customers', name, 'name'); };
  /** Where a customer's name should link. */
  BE.customerHref = function (name) { var c = BE.customerOf(name); return c ? 'SellCustomer.dc.html#' + c.id : 'SellCustomers.dc.html'; };
  /** Add a customer with just a name (and optionally email, TIN, VAT number). Returns it. */
  BE.addCustomer = function (o) {
    var name = String(o.name || '').trim();
    var base = name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'customer';
    var id = base, n = 2;
    while (BE.find('customers', id)) id = base + '-' + (n++);
    var p = prof();
    var c = { id: id, name: name, contact: o.contact || '', email: o.email || '', phone: o.phone || '', address: o.address || '', country: p.country || (BE.is('lk') ? 'Sri Lanka' : 'United Kingdom'), cur: p.currency || (BE.is('lk') ? 'LKR' : 'GBP'),
      tin: o.tin || '', tax: o.tax || '', since: 'Customer since October 2026', paid: 0, note: '', invoices: [], quotes: [], recurring: [], credits: [], isNew: true };
    BE.change(function (s) {
      s.customers = [c].concat(s.customers || []);
      BE._log(s, 'Added ' + name + ' as a customer');
    });
    return c;
  };
  /** A reminder you sent (email, or WhatsApp in Sri Lanka): adds it to the invoice's history and the activity list. */
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
  /**
   * Record money you received (full or part). how: one of BE.receiveMethods(). d: { date, chequeNo, chequeDate, chequeBank, ref }.
   * A cheque's number, bank and date are kept on the payment and in the invoice's history.
   */
  BE.recordPayment = function (num, amount, how, d) {
    if (typeof d === 'string') d = { date: d };
    d = d || {};
    var inv = BE.payInvoice(num, amount, how);
    if (!inv) return null;
    BE.change(function (s) {
      var p0 = s.payments && s.payments[0];
      if (p0 && p0.inv === num) {
        var extra = { manual: true, date: d.date || BE.today, iso: '2026-10-11' };
        if (d.ref) extra.ref = d.ref;
        if (/cheque/i.test(how || '')) { extra.chequeNo = d.chequeNo || ''; extra.chequeDate = d.chequeDate || ''; extra.chequeBank = d.chequeBank || ''; }
        s.payments[0] = Object.assign({}, p0, extra);
        var amt = p0.amount;
        var detail = /cheque/i.test(how || '') && d.chequeNo ? ' no. ' + d.chequeNo + (d.chequeBank || d.chequeDate ? ' (' + [d.chequeBank, d.chequeDate ? 'dated ' + d.chequeDate : ''].filter(Boolean).join(', ') + ')' : '') : '';
        s.invoices = s.invoices.map(function (x) {
          if (x.num !== num) return x;
          var ev = (x.events || []).slice();
          var last = ev[ev.length - 1];
          if (last) ev[ev.length - 1] = Object.assign({}, last, { label: last.label + detail + ', recorded by you' });
          var patch = { events: ev };
          if (detail) patch.cheque = { no: d.chequeNo, date: d.chequeDate || '', bank: d.chequeBank || '' };
          return Object.assign({}, x, patch);
        });
        if (s.activity && s.activity[0]) s.activity[0] = Object.assign({}, s.activity[0], { t: 'Recorded ' + BE.money(amt) + ' from ' + inv.who + ' by ' + String(how || 'bank transfer').toLowerCase() + detail + ' against ' + num });
      }
    });
    return BE.find('invoices', num, 'num');
  };
  /** Send a draft. Drafts numbered D-… get the next invoice number. Returns the invoice number. */
  BE.sendDraft = function (num, terms) {
    var n = num;
    if (/^D-/.test(num)) {
      n = BE.nextNumber('INV');
      BE.update('invoices', num, { num: n }, 'num');
    }
    BE.retaxInvoice(n);
    BE.sendInvoice(n, terms == null ? BE.terms() : terms);
    BE.update('invoices', n, function (x) {
      return { iso: '2026-10-11', delivered: BE.is('lk') ? BE.today : undefined, events: (x.events || []).map(function (e) { return /^Sent to /.test(e.label) ? Object.assign({}, e, { label: e.label.replace(/^Sent to /, 'Emailed to ') }) : e; }) };
    }, 'num');
    return n;
  };
})();
