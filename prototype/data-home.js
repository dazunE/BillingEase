/* Home: what BillingEase did for you, and notifications. */
(function () {
  BE.define('activity', [
    { id: 'act-1', t: 'Matched Atlas Freight’s $6,300 payment to invoice INV-0153', when: 'Today, 7:42 AM' },
    { id: 'act-2', t: 'Imported 23 transactions from Chase and Amex', when: 'Today, 6:00 AM' },
    { id: 'act-3', t: 'Sorted 19 expenses into the right categories', when: 'Yesterday' },
    { id: 'act-4', t: 'Moved $2,803 into your tax set-aside', when: 'Oct 1' },
    { id: 'act-5', t: 'Sent automatic reminders to Lumen Dental Group', when: 'Sep 30' },
    { id: 'act-6', t: 'Matched the Staples receipt to an Amex charge', when: 'Sep 29' },
    { id: 'act-7', t: 'Reconciled Chase Business Checking through Sep 30', when: 'Sep 30' },
    { id: 'act-8', t: 'Filed Q3 payroll tax deposit with the IRS', when: 'Sep 28' }
  ]);
  BE.define('notifications', [
    { id: 'ntf-1', title: 'Greenline Architects viewed quote Q-0031', body: 'Lobby wayfinding signage · $4,200 · expires Oct 30', href: 'SellQuotes.dc.html#Q-0031', when: 'Oct 3', read: false },
    { id: 'ntf-2', title: 'Ridge Outdoor Supply paid $3,960', body: 'INV-0162 is paid in full', href: 'SellInvoices.dc.html#INV-0162', when: 'Oct 3', read: false },
    { id: 'ntf-3', title: 'October payroll needs your approval', body: '$7,231 to 3 people on Oct 9', href: 'SpendPayroll.dc.html', when: 'Oct 2', read: false },
    { id: 'ntf-4', title: 'Letterpress card set is running low', body: '9 left; you usually reorder at 15', href: 'SellCatalog.dc.html', when: 'Oct 2', read: true },
    { id: 'ntf-5', title: 'NY sales tax is due Oct 20', body: '$412.63 for July to September', href: 'BooksTax.dc.html', when: 'Oct 1', read: true },
    { id: 'ntf-6', title: 'Sam Ortiz hasn’t accepted the team invite', body: 'Sent by Jordan Lee on Oct 2', href: 'BizTeam.dc.html', when: 'Oct 2', read: true }
  ]);
})();
