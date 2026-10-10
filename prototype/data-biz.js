/* Your business: profile, team, the businesses you can switch between, sign-in security and devices. */
(function () {
  var COUNTRIES = {
    US: 'United States', DE: 'Germany', GB: 'United Kingdom', NL: 'Netherlands', FR: 'France', CA: 'Canada', AU: 'Australia'
  };

  BE.define('profile', {
    business: 'Northwind Studio', owner: 'Maya Chen', first: 'Maya', email: 'maya@northwind.studio', initials: 'MC', role: 'Owner',
    city: 'Brooklyn, NY', country: 'United States', currency: 'USD', sells: 'both', team: 'team', overseas: true, setAside: 0.25,
    taxLabel: 'NY sales tax 8.875% on products',
    // Invoice branding and formats (BizProfile)
    legal: 'Northwind Studio LLC', countryCode: 'US', phone: '(718) 555-0142', street: '145 Front Street, Suite 4', town: 'Brooklyn', region: 'NY', postal: '11201',
    logo: 1, accent: '#7A5AF8', prefix: 'INV-', terms: '14',
    note: 'Thank you for working with Northwind Studio. Pay by card or bank transfer from the link in this email.',
    fy: '1', lang: 'en', datef: 'mdy', numf: 'comma', ein: '47-2918364', vat: ''
  }, {
    business: 'Your business', owner: 'You', first: 'there', email: '', initials: 'YB', role: 'Owner',
    city: '', country: 'United States', currency: 'USD', sells: 'services', team: 'solo', overseas: false, setAside: 0.25, taxLabel: '',
    legal: '', countryCode: 'US', phone: '', street: '', town: '', region: '', postal: '',
    logo: 0, accent: '#7A5AF8', prefix: 'INV-', terms: '30', note: '',
    fy: '1', lang: 'en', datef: 'mdy', numf: 'comma', ein: '', vat: ''
  });

  BE.define('team', [
    { id: 'maya', name: 'Maya Chen', email: 'maya@northwind.studio', role: 'Owner', status: 'You', you: true },
    { id: 'jordan', name: 'Jordan Lee', email: 'jordan@northwind.studio', role: 'Admin', status: 'Active today, 9:12 AM' },
    { id: 'priya', name: 'Priya Nair', email: 'priya@northwind.studio', role: 'Staff', status: 'Active yesterday' },
    { id: 'sam', name: 'Sam Ortiz', email: 'sam@northwind.studio', role: 'Staff', status: 'Invited by Jordan Lee on Oct 2', pending: true },
    { id: 'dana', name: 'Dana Whitfield, CPA', email: 'dana@whitfieldcpa.com', role: 'Accountant', status: 'Active Sep 30' }
  ], []);

  BE.define('businesses', [
    { id: 'northwind', name: 'Northwind Studio', meta: 'Brooklyn, NY · USD · Owner', current: true },
    { id: 'photo', name: 'Maya Chen Photography', meta: 'Brooklyn, NY · USD · Owner', current: false,
      profile: { business: 'Maya Chen Photography', legal: 'Maya Chen', email: 'maya@mayachen.photo', sells: 'services', team: 'solo', overseas: false,
        logo: 0, accent: '#18161F', note: 'Thank you! Pay by card or bank transfer from the link in this email.', ein: '', phone: '', street: '', postal: '', terms: '14', taxLabel: '' } }
  ], []);

  // Sign-in settings for this account.
  BE.define('security', { twoStep: false, pwChanged: 'Last changed Mar 12, 2026', reviewed: false },
    { twoStep: false, pwChanged: 'Set when you signed up today', reviewed: true });

  // Devices signed in to this account.
  BE.define('sessions', [
    { id: 'mac', name: 'MacBook Pro · Chrome', where: 'Brooklyn, NY', when: 'Active now', here: true, kind: 'laptop' },
    { id: 'iphone', name: 'iPhone 15 · BillingEase app', where: 'Brooklyn, NY', when: 'Active 2 hours ago', kind: 'phone' },
    { id: 'ipad', name: 'iPad · Safari', where: 'Jersey City, NJ', when: 'Last active Sep 28', kind: 'tablet' },
    { id: 'win', name: 'Windows PC · Edge', where: 'Philadelphia, PA', when: 'Last active Sep 12', kind: 'desktop' }
  ], [
    { id: 'this', name: 'This browser', where: 'Signed in today', when: 'Active now', here: true, kind: 'laptop' }
  ]);

  BE.COUNTRIES = COUNTRIES;

  /** The profile with every field filled in (older saved data may miss the newer branding fields). */
  BE.profile = function () {
    var p = BE.get('profile') || {};
    var base = { legal: '', countryCode: 'US', phone: '', street: '', town: '', region: '', postal: '', logo: 0, accent: '#7A5AF8', prefix: 'INV-', terms: '30', note: '', fy: '1', lang: 'en', datef: 'mdy', numf: 'comma', ein: '', vat: '', sells: 'services', team: 'solo', overseas: false, setAside: 0.25 };
    var out = Object.assign({}, base, p);
    if (!p.countryCode) { for (var k in COUNTRIES) if (COUNTRIES[k] === p.country) out.countryCode = k; }
    if (!p.town && p.city) { var parts = String(p.city).split(','); out.town = parts[0].trim(); if (!p.region && parts[1]) out.region = parts[1].trim(); }
    return out;
  };

  /** Does BillingEase show this kind of feature? 'services' | 'products' | 'team' | 'overseas' */
  BE.shows = function (what) {
    var p = BE.get('profile') || {};
    if (what === 'services') return p.sells !== 'products';
    if (what === 'products') return p.sells === 'products' || p.sells === 'both';
    if (what === 'team') return p.team === 'team' || p.team === 'accountant';
    if (what === 'overseas') return !!p.overseas;
    return true;
  };

  /** Your businesses, always including the one you're in (a new account has a list of one). */
  BE.bizList = function () {
    var list = BE.all('businesses');
    var p = BE.get('profile') || {};
    var meta = [p.city, p.currency, 'Owner'].filter(Boolean).join(' · ');
    if (!list.length) return [{ id: 'mine', name: p.business || 'Your business', meta: meta, current: true }];
    return list.map(function (b) { return b.current ? Object.assign({}, b, { name: p.business || b.name, meta: meta }) : b; });
  };

  /** Open another business. Its books come back as you left them; a first visit starts empty. */
  BE.openBusiness = function (id) {
    if (!BE.all('businesses').length) BE.set('businesses', BE.bizList());
    var b = BE.find('businesses', id);
    var me = BE.get('profile') || {};
    // Sign-in settings and devices belong to you, not to a business: carry them across.
    var sec = BE.get('security'), ses = BE.get('sessions');
    BE.switchBusiness(id, Object.assign({ owner: me.owner, first: me.first, initials: me.initials }, (b && b.profile) || {}));
    BE.change(function (s) { s.security = JSON.parse(JSON.stringify(sec)); s.sessions = JSON.parse(JSON.stringify(ses)); });
  };

  /** Add a business you own and switch to it (it starts empty). */
  BE.addBusiness = function (o) {
    var id = BE.id('biz');
    var cur = o.currency || 'USD';
    var list = BE.bizList().map(function (b) { return Object.assign({}, b); });
    var code = o.countryCode || 'US';
    list.push({ id: id, name: o.name, meta: (COUNTRIES[code] || '') + ' · ' + cur + ' · Owner', current: false,
      profile: { business: o.name, legal: '', sells: o.sells || 'services', team: 'solo', overseas: false, country: COUNTRIES[code] || 'United States', countryCode: code, currency: cur,
        city: '', town: '', region: '', street: '', postal: '', phone: '', logo: 0, ein: '', vat: '', note: '', taxLabel: '' } });
    BE.set('businesses', list);
    BE.openBusiness(id);
    return id;
  };
})();
