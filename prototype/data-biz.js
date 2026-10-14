/* Your business: profile, people with access, sign-in security and devices. One business per account. */
(function () {
  // The two sample businesses. UK: a sole trader designer who also lets one flat. Sri Lanka: a VAT-registered design studio with staff.
  BE.define('profile', BE.perCountry({
    uk: {
      business: 'Harper Studio', owner: 'Ellie Harper', first: 'Ellie', email: 'ellie@harperstudio.co.uk', initials: 'EH', role: 'Owner',
      city: 'Leeds', country: 'United Kingdom', countryId: 'uk', currency: 'GBP', kind: 'both', // sole trader + landlord
      vatRegistered: false, utr: '12345 67890', vatNo: '', basis: 'cash', quarterType: 'standard', scottish: false,
      practice: { name: 'Dale & Shaw Accountants', contact: 'Priya Shaw', email: 'priya@daleandshaw.co.uk' },
      legal: 'Ellie Harper trading as Harper Studio', countryCode: 'GB', phone: '0113 496 0182', street: '14 Call Lane', town: 'Leeds', region: 'West Yorkshire', postal: 'LS1 6DT',
      logo: 1, accent: '#7A5AF8', prefix: 'HS-', terms: '14', setAside: 0.25,
      note: 'Thank you for your business. Please pay by bank transfer to Harper Studio, sort code 20-45-77, account 41930268.',
      lang: 'en', datef: 'dmy', numf: 'comma', invLang: 'en', mileage: true, payroll: true
    },
    lk: {
      business: 'Serendib Design Studio', owner: 'Ayesha Fernando', first: 'Ayesha', email: 'ayesha@serendibstudio.lk', initials: 'AF', role: 'Owner',
      city: 'Colombo 03', country: 'Sri Lanka', countryId: 'lk', currency: 'LKR', kind: 'sole-proprietor',
      vatRegistered: true, ssclRegistered: true, tin: '104 563 218', vatNo: '104563218-7000', basis: 'accrual',
      practice: { name: 'Jayasinghe & Co, Chartered Accountants', contact: 'Ruwan Jayasinghe', email: 'ruwan@jayasinghe.lk' },
      taxwiseLinked: true,
      legal: 'Ayesha Fernando trading as Serendib Design Studio', countryCode: 'LK', phone: '011 257 4410', street: '42 Galle Road', town: 'Colombo 03', region: 'Western Province', postal: '00300',
      logo: 1, accent: '#7A5AF8', prefix: 'SDS-', terms: '30', setAside: 0.2,
      note: 'Thank you. Please pay by bank transfer to Serendib Design Studio, Commercial Bank, Kollupitiya, A/C 1004 5521 8830, or by cheque.',
      lang: 'en', datef: 'dmy', numf: 'comma', invLang: 'en', whatsapp: true, payroll: true
    }
  }), BE.perCountry({
    uk: { business: 'Your business', owner: 'You', first: 'there', email: '', initials: 'YB', role: 'Owner', city: '', country: 'United Kingdom', countryId: 'uk', currency: 'GBP', kind: 'sole-trader', vatRegistered: false, utr: '', vatNo: '', basis: 'cash', quarterType: 'standard', scottish: false, practice: null, legal: '', countryCode: 'GB', phone: '', street: '', town: '', region: '', postal: '', logo: 0, accent: '#7A5AF8', prefix: 'INV-', terms: '14', setAside: 0.25, note: '', lang: 'en', datef: 'dmy', numf: 'comma' },
    lk: { business: 'Your business', owner: 'You', first: 'there', email: '', initials: 'YB', role: 'Owner', city: '', country: 'Sri Lanka', countryId: 'lk', currency: 'LKR', kind: 'sole-proprietor', vatRegistered: false, ssclRegistered: false, tin: '', vatNo: '', basis: 'accrual', practice: null, taxwiseLinked: false, legal: '', countryCode: 'LK', phone: '', street: '', town: '', region: '', postal: '', logo: 0, accent: '#7A5AF8', prefix: 'INV-', terms: '30', setAside: 0.2, note: '', lang: 'en', datef: 'dmy', numf: 'comma' }
  }));

  // Who can open the books. One business per account: you, your accountant or practitioner, and (Sri Lanka) an office admin.
  // role: 'Owner' | 'Accountant' (the practice or practitioner) | 'Admin' (office admin, limited access)
  BE.define('team', BE.perCountry({
    uk: [
      { id: 'you', name: 'Ellie Harper', email: 'ellie@harperstudio.co.uk', role: 'Owner', status: 'You', you: true },
      { id: 'priya', name: 'Priya Shaw', email: 'priya@daleandshaw.co.uk', role: 'Accountant', org: 'Dale & Shaw Accountants', status: 'Active Fri 9 Oct', practice: true }
    ],
    lk: [
      { id: 'you', name: 'Ayesha Fernando', email: 'ayesha@serendibstudio.lk', role: 'Owner', status: 'You', you: true },
      { id: 'ruwan', name: 'Ruwan Jayasinghe', email: 'ruwan@jayasinghe.lk', role: 'Accountant', org: 'Jayasinghe & Co, Chartered Accountants', status: 'Active Thu 8 Oct', practice: true },
      { id: 'tharushi', name: 'Tharushi Silva', email: 'tharushi@serendibstudio.lk', role: 'Admin', org: 'Office administrator', status: 'Active today, 9:05' }
    ]
  }), BE.perCountry({ uk: [], lk: [] }));

  // Sign-in settings for this account, with the last 30 days of sign-ins.
  BE.define('security', BE.perCountry({
    uk: { twoStep: false, pwChanged: 'Last changed 12 Mar 2026', reviewed: false, recent: [
      { when: 'Today, 07:38', what: 'Chrome on Mac', where: 'Leeds', how: 'Password', result: 'Signed in', ok: 1 },
      { when: 'Today, 06:05', what: 'BillingEase app on iPhone', where: 'Leeds', how: 'Face ID', result: 'Signed in', ok: 1 },
      { when: '2 Oct, 23:14', what: 'Firefox on Windows', where: 'Birmingham', how: 'Wrong password 3 times', result: 'Blocked', ok: 0, ask: true },
      { when: '28 Sep, 20:50', what: 'Safari on iPad', where: 'Harrogate', how: 'Password', result: 'Signed in', ok: 1 }
    ] },
    lk: { twoStep: true, pwChanged: 'Last changed 3 Jun 2026', reviewed: false, recent: [
      { when: 'Today, 08:12', what: 'Chrome on Windows', where: 'Colombo 03', how: 'Password and code', result: 'Signed in', ok: 1 },
      { when: 'Today, 07:40', what: 'BillingEase app on Android', where: 'Colombo', how: 'Fingerprint', result: 'Signed in', ok: 1 },
      { when: '5 Oct, 22:31', what: 'Chrome on Android', where: 'Negombo', how: 'Wrong password 3 times', result: 'Blocked', ok: 0, ask: true },
      { when: '30 Sep, 18:02', what: 'Safari on MacBook', where: 'Kandy', how: 'Password and code', result: 'Signed in', ok: 1 }
    ] }
  }), BE.perCountry({
    uk: { twoStep: false, pwChanged: 'Set when you signed up today', reviewed: true, recent: [] },
    lk: { twoStep: false, pwChanged: 'Set when you signed up today', reviewed: true, recent: [] }
  }));

  // Devices signed in to this account.
  BE.define('sessions', BE.perCountry({
    uk: [
      { id: 'mac', name: 'MacBook Air · Chrome', where: 'Leeds', when: 'Active now', here: true, kind: 'laptop' },
      { id: 'iphone', name: 'iPhone 15 · BillingEase app', where: 'Leeds', when: 'Active 2 hours ago', kind: 'phone' },
      { id: 'ipad', name: 'iPad · Safari', where: 'Harrogate', when: 'Last active 28 Sep', kind: 'tablet' }
    ],
    lk: [
      { id: 'win', name: 'Windows laptop · Chrome', where: 'Colombo 03', when: 'Active now', here: true, kind: 'laptop' },
      { id: 'android', name: 'Samsung Galaxy · BillingEase app', where: 'Colombo', when: 'Active 3 hours ago', kind: 'phone' },
      { id: 'mac', name: 'MacBook · Safari', where: 'Kandy', when: 'Last active 30 Sep', kind: 'laptop' }
    ]
  }), BE.perCountry({
    uk: [{ id: 'this', name: 'This browser', where: 'Signed in today', when: 'Active now', here: true, kind: 'laptop' }],
    lk: [{ id: 'this', name: 'This browser', where: 'Signed in today', when: 'Active now', here: true, kind: 'laptop' }]
  }));

  /** The profile with every field filled in for its country (older saved data may miss newer fields). */
  BE.profile = function () {
    var p = BE.get('profile') || {};
    var lk = BE.is('lk');
    var base = lk
      ? { legal: '', countryCode: 'LK', country: 'Sri Lanka', currency: 'LKR', phone: '', street: '', town: '', region: '', postal: '', logo: 0, accent: '#7A5AF8', prefix: 'INV-', terms: '30', note: '', lang: 'en', invLang: 'en', setAside: 0.2,
          kind: 'sole-proprietor', vatRegistered: false, ssclRegistered: false, tin: '', vatNo: '', basis: 'accrual', whatsapp: false }
      : { legal: '', countryCode: 'GB', country: 'United Kingdom', currency: 'GBP', phone: '', street: '', town: '', region: '', postal: '', logo: 0, accent: '#7A5AF8', prefix: 'INV-', terms: '14', note: '', lang: 'en', invLang: 'en', setAside: 0.25,
          kind: 'sole-trader', vatRegistered: false, utr: '', vatNo: '', basis: 'cash', quarterType: 'standard', scottish: false, mileage: true };
    var out = Object.assign({}, base, p);
    if (!p.town && p.city) out.town = p.city;
    return out;
  };

  /**
   * Does BillingEase show this part of the app for this business? Driven by the
   * country pack's features and the business profile.
   * 'landlord' | 'mileage' | 'quarters' | 'taxPeriods' | 'payroll' | 'whatsapp' | 'sscl'
   */
  BE.shows = function (what) {
    var f = (BE.pack() || {}).features || {};
    var p = BE.profile();
    if (what === 'landlord') return !!f.landlord && (p.kind === 'landlord' || p.kind === 'both');
    if (what === 'mileage') return !!f.mileage && p.mileage !== false && p.kind !== 'landlord';
    if (what === 'quarters') return !!f.quarters;
    if (what === 'taxPeriods') return !!f.taxPeriods && (!!p.vatRegistered || (!!f.sscl && !!p.ssclRegistered));
    if (what === 'payroll') return !!f.payroll && (p.payroll != null ? !!p.payroll : (p.employees != null ? !!p.employees : true));
    if (what === 'whatsapp') return !!f.whatsapp && !!p.whatsapp;
    if (what === 'sscl') return !!f.sscl && !!p.ssclRegistered;
    if (what === 'products') return false; // no stock in the MVP
    return true;
  };
})();
