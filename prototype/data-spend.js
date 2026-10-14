/* Going out: costs you pay every month (templates you set up) and who you pay (suppliers), per country. */
(function () {
  var r2 = function (n) { return Math.round((Number(n) || 0) * 100) / 100; };
  var name = function (country, id) {
    var P = (window.COUNTRY || {})[country] || {};
    var c = (P.categories || []).concat(P.propertyCategories || []).filter(function (x) { return x.id === id; })[0];
    return c ? c.name : 'Other';
  };
  var M = function (country) {
    return function (id, who, vendor, catId, day, how, amount, o) {
      o = o || {};
      var m = { id: id, who: who, vendor: vendor, catId: catId, cat: name(country, catId), day: day, how: how, amount: amount, vat: o.vat || 0, paidDay: o.paidDay || 0, start: 'Oct', active: true };
      if (o.property) m.property = o.property;
      if (o.expense) m.expense = o.expense;
      return m;
    };
  };
  var UM = M('uk'), LM = M('lk');

  /*
   * Every month: templates the business set up for costs that come back each month. BillingEase
   * pays nothing and reads nothing: on the day, you record the payment (one tap) and it moves to paid.
   * paidDay > 0: recorded for October (it's in expenses). Active, unrecorded templates after the 4th
   * count in Going out as still to pay. active: false = stopped (doesn't count).
   */
  BE.define('monthly', BE.perCountry({
    uk: [
      UM('m-desk', 'Desk at Northern Desk Co-working', 'northern-desk', 'premises', 1, 'Bank transfer', 180, { paidDay: 1, expense: 'x-u25' }),
      UM('m-mortgage', 'Mortgage interest, Flat 2', 'leeds-bs', 'p-finance', 1, 'Bank transfer', 410, { paidDay: 1, expense: 'x-u24', property: 'ash-grove' }),
      UM('m-adobe', 'Adobe Creative Cloud', 'adobe', 'office', 2, 'Card', 54, { paidDay: 2, expense: 'x-u26' }),
      UM('m-ee', 'EE mobile', 'ee', 'office', 3, 'Bank transfer', 32, { paidDay: 3, expense: 'x-u27' }),
      UM('m-google', 'Google Workspace', 'google', 'office', 14, 'Card', 10.3),
      UM('m-krystal', 'Krystal web hosting', 'krystal', 'office', 28, 'Card', 12)
    ],
    lk: [
      LM('m-rent', 'Studio rent', 'kollupitiya-estates', 'rent', 1, 'Cheque', 350000, { paidDay: 1, expense: 'x-l13' }),
      LM('m-slt', 'SLT-Mobitel fibre', 'slt', 'utilities', 5, 'Bank transfer', 12500, { vat: 1906.78, paidDay: 5, expense: 'x-l15' }),
      LM('m-security', 'Night security', 'guardian', 'other', 15, 'Bank transfer', 65000, { vat: 9915.25 }),
      LM('m-adobe', 'Adobe Creative Cloud', 'adobe', 'office', 18, 'Bank transfer', 28500),
      LM('m-water', 'NWSDB water', 'nwsdb', 'utilities', 22, 'Bank transfer', 3800),
      LM('m-clean', 'Studio cleaning', 'sparkle', 'other', 25, 'Cash', 22000)
    ]
  }), BE.perCountry({ uk: [], lk: [] }));

  /*
   * Suppliers: who the business pays. Bills and expenses link to a supplier by name (`who`), or any
   * of `aka`. paidBefore: paid to them this tax year before the entries kept here (UK from 6 Apr,
   * Sri Lanka from 1 Apr). vatNo: their VAT registration number (Sri Lanka: input VAT needs their
   * tax invoice). property: a UK landlord's supplier for the flat.
   */
  var V = function (country) {
    return function (id, nm, catId, o) {
      o = o || {};
      return Object.assign({ id: id, name: nm, catId: catId, cat: name(country, catId), contact: '', email: '', phone: '', terms: '', via: 'Bank transfer', paidBefore: 0, vatNo: '' }, o);
    };
  };
  var UV = V('uk'), LV = V('lk');
  BE.define('vendors', BE.perCountry({
    uk: [
      UV('northern-desk', 'Northern Desk Co-working', 'premises', { contact: 'Hannah Kerr, community manager', email: 'hello@northerndesk.co.uk', phone: '0113 496 0457', terms: 'Direct debit on the 1st', paidBefore: 540, monthly: 'm-desk' }),
      UV('footprint', 'Footprint Print', 'office', { contact: 'Sam Akhtar', email: 'orders@footprintprint.co.uk', phone: '0113 496 0221', terms: '14 days', via: 'Card', paidBefore: 310 }),
      UV('dale-shaw', 'Dale & Shaw Accountants', 'professional', { contact: 'Priya Shaw', email: 'priya@daleandshaw.co.uk', phone: '0113 496 0870', terms: '14 days' }),
      UV('adobe', 'Adobe Creative Cloud', 'office', { contact: 'Single app plan', email: '', terms: 'Card, monthly', via: 'Card', paidBefore: 162, monthly: 'm-adobe' }),
      UV('ee', 'EE', 'office', { contact: 'Business mobile ending 4410', terms: 'Direct debit on the 3rd', paidBefore: 96, monthly: 'm-ee' }),
      UV('leeds-bs', 'Leeds Building Society', 'p-finance', { contact: 'Buy-to-let mortgage ending 7731', phone: '0345 050 5075', terms: 'Direct debit on the 1st', paidBefore: 1230, monthly: 'm-mortgage', property: 'ash-grove' }),
      UV('headingley-lettings', 'Headingley Lettings', 'p-professional', { contact: 'Gemma Price', email: 'lettings@headingleylettings.co.uk', phone: '0113 496 0612', terms: '10% taken from the rent', paidBefore: 315, monthly: 'm-agent', property: 'ash-grove' }),
      UV('kirkstall-heating', 'Kirkstall Heating', 'p-repairs', { contact: 'Dave Morton, Gas Safe registered', email: 'dave@kirkstallheating.co.uk', phone: '0113 496 0399', terms: '14 days', property: 'ash-grove' }),
      UV('lner', 'LNER', 'travel', { contact: 'Tickets bought online', terms: 'Paid by card', via: 'Card', paidBefore: 124.6 }),
      UV('northern-rail', 'Northern Rail', 'travel', { contact: 'Tickets bought online', terms: 'Paid by card', via: 'Card', paidBefore: 22.8 }),
      UV('google', 'Google Workspace', 'office', { contact: 'One user', terms: 'Card, monthly', via: 'Card', paidBefore: 30.9, monthly: 'm-google' }),
      UV('krystal', 'Krystal Hosting', 'office', { contact: 'harperstudio.co.uk hosting', terms: 'Card, monthly', via: 'Card', paidBefore: 36, monthly: 'm-krystal' }),
      UV('hiscox', 'Hiscox', 'premises', { contact: 'Policy ending 2207', phone: '0800 840 2298', terms: 'Yearly, renews 15 Jul' }),
      UV('royal-mail', 'Royal Mail', 'office', { contact: 'Post Office counter', terms: 'Paid at the counter', via: 'Cash', paidBefore: 18.4 })
    ],
    lk: [
      LV('kollupitiya-estates', 'Kollupitiya Estates (Pvt) Ltd', 'rent', { contact: 'Mr. Nimal Perera', email: 'accounts@kollupitiyaestates.lk', phone: '011 257 3301', terms: 'Cheque on the 1st', via: 'Cheque', paidBefore: 1750000, monthly: 'm-rent' }),
      LV('cph', 'Colombo Print House (Pvt) Ltd', 'cogs', { contact: 'Ms. Shanika de Silva', email: 'orders@colomboprint.lk', phone: '011 243 8812', terms: '10 days', paidBefore: 412300, vatNo: '114228905-7000' }),
      LV('studio-furnish', 'Studio Furnish (Pvt) Ltd', 'capital', { contact: 'Mr. Ranjith Fonseka', email: 'sales@studiofurnish.lk', phone: '011 250 6627', terms: '30 days', via: 'Cheque', vatNo: '134552019-7000' }),
      LV('jco', 'Jayasinghe & Co, Chartered Accountants', 'professional', { contact: 'Ruwan Jayasinghe', email: 'ruwan@jayasinghe.lk', phone: '011 269 4520', terms: '30 days', paidBefore: 177000, vatNo: '104771360-7000' }),
      LV('ceb', 'Ceylon Electricity Board', 'utilities', { contact: 'Account 0417-2291', terms: '15 days', paidBefore: 231000 }),
      LV('slt', 'SLT-Mobitel', 'utilities', { contact: 'Fibre account 011 257 4410', terms: 'Monthly', paidBefore: 62500, monthly: 'm-slt', vatNo: '114038271-7000' }),
      LV('guardian', 'Guardian Security Services', 'other', { contact: 'Night guard for the studio', phone: '011 258 9940', terms: 'Monthly', paidBefore: 325000, monthly: 'm-security', vatNo: '124660218-7000' }),
      LV('lwh', 'Lanka Web Hosting (Pvt) Ltd', 'office', { contact: 'serendibstudio.lk hosting', email: 'billing@lankawebhosting.lk', terms: '30 days', vatNo: '114902337-7000' }),
      LV('techzone', 'Techzone Lanka (Pvt) Ltd', 'capital', { contact: 'Unity Plaza, Colombo 04', phone: '011 250 3318', terms: 'On receipt', vatNo: '114517803-7000' }),
      LV('adobe', 'Adobe Creative Cloud', 'office', { contact: 'Teams plan, 4 seats', terms: 'Monthly', paidBefore: 142500, monthly: 'm-adobe' }),
      LV('nwsdb', 'NWSDB water', 'utilities', { contact: 'Account 03/14/2207', terms: 'Monthly', paidBefore: 19000, monthly: 'm-water' }),
      LV('sparkle', 'Sparkle Cleaners', 'other', { contact: 'Mrs. Kumari', phone: '077 412 8830', terms: 'Cash, monthly', via: 'Cash', paidBefore: 110000, monthly: 'm-clean' }),
      LV('ceypetco', 'Ceypetco, Kollupitiya', 'travel', { contact: 'Fuel for the studio van', terms: 'Cash', via: 'Cash', paidBefore: 98000 })
    ]
  }), BE.perCountry({ uk: [], lk: [] }));

  // ---- helpers for every month and suppliers ----
  var lc = function (s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
  var TODAY = 11; // Sunday 11 October 2026

  /**
   * Where an every-month cost stands in October: 'paid' (recorded), 'due' (later this month),
   * 'late' (its day has passed, not recorded yet), 'missed' (1st–4th, not recorded; not counted in
   * still to pay) or 'stopped'. 'due' and 'late' count in Going out as still to pay, as in BE.totals().
   */
  BE.monthlyState = function (m) {
    if (!m || m.active === false) return 'stopped';
    if (m.paidDay) return 'paid';
    if (m.day > TODAY) return 'due';
    if (m.day > 4) return 'late';
    return 'missed';
  };
  /** Who an every-month cost is paid to: its supplier's name, or the template's name. */
  BE.monthlyPayee = function (m) { var v = m && m.vendor ? BE.find('vendors', m.vendor) : null; return v ? v.name : (m ? m.who : ''); };
  /** Record October's payment for an every-month cost. Adds the expense and marks it paid. */
  BE.recordMonthly = function (id, how, cheque) {
    var m = BE.find('monthly', id);
    if (!m || m.paidDay) return null;
    var x = BE.recordExpense({ who: BE.monthlyPayee(m), amount: m.amount, catId: m.catId, vat: m.vat || 0, how: how || m.how, cheque: cheque, property: m.property, monthly: m.id, note: m.who + ', October' });
    BE.update('monthly', id, { paidDay: TODAY, expense: x.id });
    return x;
  };

  /** The supplier someone is, by name or one of their other names. */
  BE.vendorFor = function (nm) {
    var k = lc(nm);
    if (!k) return null;
    return BE.all('vendors').filter(function (v) { return lc(v.name) === k || (v.aka || []).some(function (a) { return lc(a) === k; }); })[0] || null;
  };
  var isVendor = function (v, who) { var k = lc(who); return lc(v.name) === k || (v.aka || []).some(function (a) { return lc(a) === k; }); };
  /** Bills, payments this month and this tax year, and input VAT for one supplier. */
  BE.vendorStats = function (v) {
    var bills = BE.all('bills').filter(function (b) { return isVendor(v, b.who); });
    var open = bills.filter(function (b) { return BE.billLeft(b) > 0; });
    var pays = BE.all('expenses').filter(function (x) { return isVendor(v, x.who) && x.kind !== 'personal' && x.kind !== 'transfer'; });
    var sum = function (f) { return r2(pays.reduce(function (a, x) { return a + (f(x) || 0); }, 0)); };
    return {
      bills: bills, open: open, openSum: r2(open.reduce(function (a, b) { return a + BE.billLeft(b); }, 0)),
      pays: pays, month: sum(function (x) { return x.inMonth ? x.amount : 0; }), year: r2((Number(v.paidBefore) || 0) + sum(function (x) { return x.amount; })),
      vat: sum(function (x) { return x.vat; })
    };
  };
})();
