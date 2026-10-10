/* Your business: profile, team and the businesses you can switch between. */
(function () {
  BE.define('profile', {
    business: 'Northwind Studio', owner: 'Maya Chen', first: 'Maya', email: 'maya@northwind.studio', initials: 'MC', role: 'Owner',
    city: 'Brooklyn, NY', country: 'United States', currency: 'USD', sells: 'both', team: 'team', overseas: true, setAside: 0.25,
    taxLabel: 'NY sales tax 8.875% on products'
  }, {
    business: 'Your business', owner: 'You', first: 'there', email: '', initials: 'YB', role: 'Owner',
    city: '', country: 'United States', currency: 'USD', sells: 'services', team: 'solo', overseas: false, setAside: 0.25, taxLabel: ''
  });
  BE.define('team', [
    { id: 'maya', name: 'Maya Chen', email: 'maya@northwind.studio', role: 'Owner', status: 'You' },
    { id: 'jordan', name: 'Jordan Lee', email: 'jordan@northwind.studio', role: 'Admin', status: 'Active today, 9:12 AM' },
    { id: 'priya', name: 'Priya Nair', email: 'priya@northwind.studio', role: 'Staff', status: 'Active yesterday' },
    { id: 'sam', name: 'Sam Ortiz', email: 'sam@northwind.studio', role: 'Staff', status: 'Invited by Jordan Lee on Oct 2', pending: true },
    { id: 'dana', name: 'Dana Whitfield, CPA', email: 'dana@whitfieldcpa.com', role: 'Accountant', status: 'Active Sep 30' }
  ], []);
  BE.define('businesses', [
    { id: 'northwind', name: 'Northwind Studio', meta: 'Brooklyn, NY · USD · Owner', current: true },
    { id: 'photo', name: 'Maya Chen Photography', meta: 'Brooklyn, NY · USD · Owner', current: false }
  ], []);
})();
