/* Going out: money already spent, bills to pay, payroll and card charges to sort (October 2026). */
(function () {
  // Paid this month. These make up "paid" in Going out: $3,180.
  // kind: 'business' (counts), 'personal' or 'transfer' (don't count). receipt: a receipt is attached.
  BE.define('expenses', [
    { id: 'exp-1', who: 'Elena Rossi', cat: 'Contractors', how: 'Bank transfer', date: 'Oct 3', amount: 936, inMonth: true, receipt: true, kind: 'business', raw: 'ZELLE TO ELENA ROSSI' },
    { id: 'exp-2', who: 'Comcast Business', cat: 'Internet & phone', how: 'Chase ••4417', date: 'Oct 3', amount: 129, inMonth: true, receipt: true, kind: 'business', raw: 'COMCAST BUSINESS', monthly: 'comcast' },
    { id: 'exp-3', who: 'Shell', cat: 'Fuel', how: 'Amex ••1009', date: 'Oct 3', amount: 48, inMonth: true, receipt: true, kind: 'business', raw: 'SHELL OIL 57442' },
    { id: 'exp-4', who: 'Local Print Shop', cat: 'Printing', how: 'Amex ••1009', date: 'Oct 2', amount: 236, inMonth: true, receipt: true, kind: 'business', raw: 'LOCAL PRINT SHOP' },
    { id: 'exp-5', who: 'Delta Air Lines', cat: 'Travel', how: 'Amex ••1009', date: 'Oct 2', amount: 412, inMonth: true, receipt: false, kind: 'business', raw: 'DELTA AIR 0062' },
    { id: 'exp-6', who: 'Figma', cat: 'Software', how: 'Amex ••1009', date: 'Oct 2', amount: 45, inMonth: true, receipt: true, kind: 'business', raw: 'FIGMA MONTHLY', monthly: 'figma' },
    { id: 'exp-7', who: 'Staples', cat: 'Office supplies', how: 'Amex ••1009', date: 'Oct 1', amount: 84, inMonth: true, receipt: false, kind: 'business', raw: 'STAPLES 00123' },
    { id: 'exp-8', who: 'Adobe Creative Cloud', cat: 'Software', how: 'Amex ••1009', date: 'Oct 1', amount: 90, inMonth: true, receipt: true, kind: 'business', raw: 'ADOBE *CREATIVE CLD', monthly: 'adobe' },
    { id: 'exp-9', who: 'WeWork', cat: 'Rent', how: 'Chase ••4417', date: 'Oct 1', amount: 1200, inMonth: true, receipt: true, kind: 'business', raw: 'WEWORK 1460 BROADWAY', monthly: 'wework' }
  ]);

  // Bills still to pay. Open balances count as "scheduled" in Going out ($2,447).
  BE.define('bills', [
    { id: 'lps', num: 'LPS-2291', who: 'Local Print Shop', what: 'Brochure print run for Lumen Dental', amount: 640, paid: 0, due: 'Oct 12', dueIn: 8, cat: 'Printing', status: 'open', inMonth: true, entered: 'Oct 4', soon: true, history: [{ label: 'Entered from emailed PDF', date: 'Oct 4' }] },
    { id: 'cc', num: 'CB-88213', who: 'Comcast Business', what: 'Fiber upgrade, one-time install', amount: 190, paid: 0, due: 'Oct 15', dueIn: 11, cat: 'Internet & phone', status: 'open', inMonth: true, entered: 'Oct 4', history: [{ label: 'Entered', date: 'Oct 4' }] },
    { id: 'st', num: '7731-0922', who: 'Staples', what: 'Paper, ink and mailers', amount: 212, paid: 0, due: 'Oct 22', dueIn: 18, cat: 'Office supplies', status: 'open', inMonth: true, entered: 'Oct 4', history: [{ label: 'Entered', date: 'Oct 4' }] },
    { id: 'ad', num: 'ADB-559201', who: 'Adobe Creative Cloud', what: 'Annual Stock add-on', amount: 360, paid: 0, due: 'Oct 28', dueIn: 24, cat: 'Software', status: 'open', inMonth: true, entered: 'Oct 4', history: [{ label: 'Entered', date: 'Oct 4' }] },
    { id: 'er', num: 'ER-014', who: 'Elena Rossi', what: 'Contract illustration, September', amount: 1045, paid: 0, due: 'Oct 30', dueIn: 26, cat: 'Contractors', status: 'open', inMonth: true, entered: 'Oct 4', history: [{ label: 'Entered', date: 'Oct 4' }] }
  ]);

  // Payroll runs. A run that isn't paid yet counts as "scheduled" in Going out ($7,231 take-home pay).
  BE.define('payroll', [
    { id: 'oct', date: 'Oct 9', label: 'October payroll', status: 'needs', inMonth: true, net: 7231, gross: 9632, taxes: 2401,
      people: [
        { name: 'Jordan Lee', basis: 'Salary, monthly', gross: 4400, tax: 1160, net: 3240 },
        { name: 'Priya Nair', basis: 'Salary, monthly', gross: 2800, tax: 714, net: 2086 },
        { name: 'Sam Ortiz', basis: '76 hours × $32', gross: 2432, tax: 527, net: 1905 }
      ] },
    { id: 'sep', date: 'Sep 9', label: 'September payroll', status: 'paid', inMonth: false, net: 7180, gross: 9560, taxes: 2380, people: [] }
  ]);
  BE.define('employees', [
    { id: 'jordan', name: 'Jordan Lee', job: 'Senior designer', deposit: '••2291', rate: '$52,800 a year', sched: 'Monthly, on the 9th' },
    { id: 'priya', name: 'Priya Nair', job: 'Designer', deposit: '••7340', rate: '$33,600 a year', sched: 'Monthly, on the 9th' },
    { id: 'sam', name: 'Sam Ortiz', job: 'Studio coordinator', deposit: '••0618', rate: '$32 an hour', sched: 'Monthly, on the 9th · hours from timesheets' }
  ]);

  // Card charges BillingEase couldn't sort. They join Going out once you give them a category.
  BE.define('charges', [
    { id: 'ch-1', raw: 'SQ *BLUE BOTTLE', nice: 'Blue Bottle Coffee', amount: 18.5, date: 'Oct 3', sug: 'Meals', others: ['Client gifts', 'Office supplies', 'Personal'], how: 'Amex ••1009' },
    { id: 'ch-2', raw: 'AMZN MKTP US', nice: 'Amazon', amount: 64.2, date: 'Oct 2', sug: 'Office supplies', others: ['Equipment', 'Software', 'Personal'], how: 'Amex ••1009' },
    { id: 'ch-3', raw: 'UBER *TRIP', nice: 'Uber', amount: 27.8, date: 'Oct 2', sug: 'Travel', others: ['Meals', 'Client meetings', 'Personal'], how: 'Amex ••1009' },
    { id: 'ch-4', raw: 'CANVA PRO', nice: 'Canva', amount: 14.99, date: 'Oct 1', sug: 'Software', others: ['Advertising', 'Office supplies', 'Personal'], how: 'Amex ••1009' }
  ]);
})();
