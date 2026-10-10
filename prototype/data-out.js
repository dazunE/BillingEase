/* Going out: money already spent, bills to pay, payroll and card charges to sort (October 2026).
   Screens: ThreeOut, SpendBill, SpendTransaction, SpendPayroll. */
(function () {
  // Paid this month. These make up "paid" in Going out: $3,180.
  // kind: 'business' (counts), 'personal' or 'transfer' (don't count). receipt: a receipt is attached.
  // raw: the line as the bank/card shows it. split: [{ cat, amount }] when one charge covers several categories.
  // bill: the bill it paid. payroll: the payroll run it paid. events: what happened to it, newest first.
  BE.define('expenses', [
    { id: 'exp-1', who: 'Elena Rossi', cat: 'Contractors', how: 'Bank transfer', date: 'Oct 3', amount: 936, inMonth: true, receipt: true, kind: 'business', raw: 'ZELLE TO ELENA ROSSI', note: 'Invoice ER-013, August illustration' },
    { id: 'exp-2', who: 'Comcast Business', cat: 'Internet & phone', how: 'Chase ••4417', date: 'Oct 3', amount: 129, inMonth: true, receipt: true, kind: 'business', raw: 'COMCAST BUSINESS', monthly: 'comcast' },
    { id: 'exp-3', who: 'Shell', cat: 'Fuel', how: 'Amex ••1009', date: 'Oct 3', amount: 48, inMonth: true, receipt: true, kind: 'business', raw: 'SHELL OIL 57442' },
    { id: 'exp-4', who: 'Local Print Shop', cat: 'Printing', how: 'Amex ••1009', date: 'Oct 2', amount: 236, inMonth: true, receipt: true, kind: 'business', raw: 'LOCAL PRINT SHOP' },
    { id: 'exp-5', who: 'Delta Air Lines', cat: 'Travel', how: 'Amex ••1009', date: 'Oct 2', amount: 412, inMonth: true, receipt: false, kind: 'business', raw: 'DELTA AIR 0062371940123 ATLANTA GA' },
    { id: 'exp-6', who: 'Figma', cat: 'Software', how: 'Amex ••1009', date: 'Oct 2', amount: 45, inMonth: true, receipt: true, kind: 'business', raw: 'FIGMA MONTHLY', monthly: 'figma' },
    { id: 'exp-7', who: 'Staples', cat: 'Office supplies', how: 'Amex ••1009', date: 'Oct 1', amount: 84, inMonth: true, receipt: false, kind: 'business', raw: 'STAPLES 00123' },
    { id: 'exp-8', who: 'Adobe Creative Cloud', cat: 'Software', how: 'Amex ••1009', date: 'Oct 1', amount: 90, inMonth: true, receipt: true, kind: 'business', raw: 'ADOBE *CREATIVE CLD', monthly: 'adobe' },
    { id: 'exp-9', who: 'WeWork', cat: 'Rent', how: 'Chase ••4417', date: 'Oct 1', amount: 1200, inMonth: true, receipt: true, kind: 'business', raw: 'WEWORK 1460 BROADWAY', monthly: 'wework' }
  ]);

  // Bills still to pay. Open balances count as "scheduled" in Going out ($2,447).
  // amount: the costs on the bill (what counts in Going out). stockAmt: stock you bought on the same
  // bill; it's owed but isn't Going out until you sell it. paid / stockPaid: paid so far of each.
  // lines: [{ kind: 'cost', desc, cat, amt }] or [{ kind: 'stock', product, name, qty, cost }].
  // sched: [{ date, amt, dueIn }] planned payments. auto: pays itself on those dates. date: the bill's date.
  var C = function (desc, cat, amt) { return [{ kind: 'cost', desc: desc, cat: cat, amt: amt }]; };
  BE.define('bills', [
    { id: 'lps', num: 'LPS-2291', who: 'Local Print Shop', what: 'Brochure print run for Lumen Dental', amount: 640, paid: 0, stockAmt: 0, stockPaid: 0, date: 'Sep 28', due: 'Oct 12', dueIn: 8, cat: 'Printing', status: 'open', inMonth: true, entered: 'Oct 4', soon: true, pdf: 'LPS-2291.pdf', auto: false,
      lines: C('500 tri-fold brochures for Lumen Dental Group', 'Printing', 640), sched: [{ date: 'Oct 12', amt: 640, dueIn: 8 }], history: [{ label: 'Entered from emailed PDF', date: 'Oct 4' }] },
    { id: 'cc', num: 'CB-88213', who: 'Comcast Business', what: 'Fiber upgrade, one-time install', amount: 190, paid: 0, stockAmt: 0, stockPaid: 0, date: 'Oct 1', due: 'Oct 15', dueIn: 11, cat: 'Internet & phone', status: 'open', inMonth: true, entered: 'Oct 4', pdf: 'comcast-oct-install.pdf', auto: false,
      lines: C('Fiber upgrade, one-time install', 'Internet & phone', 190), sched: [{ date: 'Oct 15', amt: 190, dueIn: 11 }], history: [{ label: 'Entered', date: 'Oct 4' }] },
    { id: 'st', num: '7731-0922', who: 'Staples', what: 'Paper, ink and mailers', amount: 212, paid: 0, stockAmt: 0, stockPaid: 0, date: 'Sep 22', due: 'Oct 22', dueIn: 18, cat: 'Office supplies', status: 'open', inMonth: true, entered: 'Oct 4', pdf: 'staples-7731-0922.pdf', auto: false,
      lines: C('Paper, ink and mailers', 'Office supplies', 212), sched: [{ date: 'Oct 22', amt: 212, dueIn: 18 }], history: [{ label: 'Entered', date: 'Oct 4' }] },
    { id: 'ad', num: 'ADB-559201', who: 'Adobe Creative Cloud', what: 'Annual Stock add-on', amount: 360, paid: 0, stockAmt: 0, stockPaid: 0, date: 'Sep 28', due: 'Oct 28', dueIn: 24, cat: 'Software', status: 'open', inMonth: true, entered: 'Oct 4', pdf: 'adobe-invoice-559201.pdf', auto: true,
      lines: C('Adobe Stock, annual add-on', 'Software', 360), sched: [{ date: 'Oct 28', amt: 360, dueIn: 24 }], history: [{ label: 'Entered', date: 'Oct 4' }, { label: 'Set to pay itself from Amex ••1009 on Oct 28', date: 'Oct 4' }] },
    { id: 'er', num: 'ER-014', who: 'Elena Rossi', what: 'Contract illustration, September', amount: 1045, paid: 0, stockAmt: 0, stockPaid: 0, date: 'Sep 30', due: 'Oct 30', dueIn: 26, cat: 'Contractors', status: 'open', inMonth: true, entered: 'Oct 4', pdf: '', auto: false,
      lines: C('Contract illustration, September', 'Contractors', 1045), sched: [{ date: 'Oct 30', amt: 1045, dueIn: 26 }], history: [{ label: 'Entered', date: 'Oct 4' }] }
  ]);

  // Payroll runs. A run that isn't paid yet counts as "scheduled" in Going out ($7,231 take-home pay).
  // status: 'needs' (needs your approval) → 'approved' → 'paid'. Paying adds a 'Payroll' expense.
  BE.define('payroll', [
    { id: 'oct', date: 'Oct 9', day: 'Friday, Oct 9', label: 'October payroll', period: 'Sep 10 – Oct 9', status: 'needs', inMonth: true, net: 7231, gross: 9632, taxes: 2401,
      people: [
        { id: 'jordan', name: 'Jordan Lee', basis: 'Salary, monthly', gross: 4400, tax: 1160, net: 3240 },
        { id: 'priya', name: 'Priya Nair', basis: 'Salary, monthly', gross: 2800, tax: 714, net: 2086 },
        { id: 'sam', name: 'Sam Ortiz', basis: '76 hours × $32', gross: 2432, tax: 527, net: 1905 }
      ] },
    { id: 'sep', date: 'Sep 9', day: 'Wednesday, Sep 9', label: 'September payroll', period: 'Aug 10 – Sep 9', status: 'paid', inMonth: false, net: 7231, gross: 9632, taxes: 2401, note: '3 people · direct deposit', people: [] },
    { id: 'aug', date: 'Aug 7', day: 'Friday, Aug 7', label: 'August payroll', period: 'Jul 10 – Aug 9', status: 'paid', inMonth: false, net: 7180, gross: 9568, taxes: 2388, note: '3 people · Sam worked 74 hours', people: [] },
    { id: 'jul', date: 'Jul 9', day: 'Thursday, Jul 9', label: 'July payroll', period: 'Jun 10 – Jul 9', status: 'paid', inMonth: false, net: 7231, gross: 9632, taxes: 2401, note: '3 people · direct deposit', people: [] },
    { id: 'jun', date: 'Jun 9', day: 'Tuesday, Jun 9', label: 'June payroll', period: 'May 10 – Jun 9', status: 'paid', inMonth: false, net: 6950, gross: 9248, taxes: 2298, note: '3 people · Sam worked 66 hours', people: [] }
  ]);
  // type: 'salary' (rate = a year) or 'hourly' (rate = an hour, hours = this period).
  BE.define('employees', [
    { id: 'jordan', name: 'Jordan Lee', job: 'Senior designer', email: 'jordan@northwind.studio', deposit: '••2291', type: 'salary', amount: 52800, rate: '$52,800 a year', sched: 'Monthly, on the 9th' },
    { id: 'priya', name: 'Priya Nair', job: 'Designer', email: 'priya@northwind.studio', deposit: '••7340', type: 'salary', amount: 33600, rate: '$33,600 a year', sched: 'Monthly, on the 9th' },
    { id: 'sam', name: 'Sam Ortiz', job: 'Studio coordinator', email: 'sam@northwind.studio', deposit: '••0618', type: 'hourly', amount: 32, hours: 76, rate: '$32 an hour', sched: 'Monthly, on the 9th · hours from timesheets' }
  ]);

  // Card charges BillingEase couldn't sort. They join Going out once you give them a category.
  BE.define('charges', [
    { id: 'ch-1', raw: 'SQ *BLUE BOTTLE', nice: 'Blue Bottle Coffee', amount: 18.5, date: 'Oct 3', sug: 'Meals', others: ['Client gifts', 'Office supplies', 'Personal'], how: 'Amex ••1009' },
    { id: 'ch-2', raw: 'AMZN MKTP US', nice: 'Amazon', amount: 64.2, date: 'Oct 2', sug: 'Office supplies', others: ['Equipment', 'Software', 'Personal'], how: 'Amex ••1009' },
    { id: 'ch-3', raw: 'UBER *TRIP', nice: 'Uber', amount: 27.8, date: 'Oct 2', sug: 'Travel', others: ['Meals', 'Client meetings', 'Personal'], how: 'Amex ••1009' },
    { id: 'ch-4', raw: 'CANVA PRO', nice: 'Canva', amount: 14.99, date: 'Oct 1', sug: 'Software', others: ['Advertising', 'Office supplies', 'Personal'], how: 'Amex ••1009' }
  ]);

  // ---- helpers for the Going out screens ----------------------------------------------

  var r2 = function (n) { return Math.round((Number(n) || 0) * 100) / 100; };

  /** What's still owed on a bill, costs and stock together. */
  BE.billLeft = function (b) {
    if (!b) return 0;
    return Math.max(0, r2((Number(b.amount) || 0) + (Number(b.stockAmt) || 0) - (Number(b.paid) || 0) - (Number(b.stockPaid) || 0)));
  };
  /** The whole bill: costs plus stock. */
  BE.billTotal = function (b) { return b ? r2((Number(b.amount) || 0) + (Number(b.stockAmt) || 0)) : 0; };

  /**
   * Pay a bill in full (amount omitted) or in part, costs first. The cost part goes through
   * BE.payBill (it moves from scheduled to paid in Going out); a stock part is paid but
   * stays out of Going out until the stock sells.
   */
  BE.payBillAll = function (id, amount, how) {
    var b = BE.find('bills', id);
    if (!b) return null;
    var left = BE.billLeft(b);
    var amt = amount == null ? left : Math.min(r2(amount), left);
    if (!(amt > 0)) return b;
    how = how || 'Chase ••4417';
    var costLeft = Math.max(0, r2((b.amount || 0) - (b.paid || 0)));
    var costPart = Math.min(costLeft, amt);
    var stockPart = r2(amt - costPart);
    if (costPart > 0) BE.payBill(id, costPart, how);
    if (stockPart > 0 || (b.stockAmt || 0) > 0) {
      BE.update('bills', id, function (x) {
        var stockPaid = r2((x.stockPaid || 0) + stockPart);
        var done = r2((x.amount || 0) + (x.stockAmt || 0) - (x.paid || 0) - stockPaid) <= 0;
        return {
          stockPaid: stockPaid, status: done ? 'paid' : 'open', paidOn: BE.today,
          history: stockPart > 0 ? (x.history || []).concat([{ label: 'Paid ' + BE.money(stockPart) + ' for stock from ' + how, date: BE.today }]) : x.history
        };
      });
    }
    return BE.find('bills', id);
  };

  /** Add an event to an expense's history (newest first). */
  BE.expenseEvent = function (id, label, patch) {
    return BE.update('expenses', id, function (x) {
      return Object.assign({}, patch || {}, { events: [{ label: label, who: (BE.get('profile') || {}).owner || 'You', date: 'Just now' }].concat(x.events || []) });
    });
  };

  /** Pay a payroll run now: it moves from scheduled to paid in Going out. */
  BE.payPayroll = function (id) {
    var run = BE.find('payroll', id);
    if (!run || run.status === 'paid') return null;
    var x = BE.addExpense({ who: 'Payroll', cat: 'Payroll', how: 'Chase ••4417', amount: run.net, inMonth: true, receipt: true });
    BE.change(function (s) {
      s.expenses = s.expenses.map(function (e) { return e.id === x.id ? Object.assign({}, e, { payroll: id, raw: 'DIRECT DEP ' + String(run.label || 'PAYROLL').toUpperCase(), note: (run.people || []).length + ' people · take-home pay for ' + run.date }) : e; });
      s.payroll = s.payroll.map(function (r) { return r.id === id ? Object.assign({}, r, { status: 'paid', paidOn: BE.today, expense: x.id }) : r; });
    });
    return x;
  };
})();
