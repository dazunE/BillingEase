/* Going out: costs that repeat every month, receipts and vendors (October 2026). */
(function () {
  // paidDay > 0: already paid this month (it's in expenses). Active costs not yet paid with day > 4
  // count as "scheduled" in Going out ($782). active: false = cancelled.
  BE.define('monthly', [
    { id: 'wework', who: 'WeWork rent', cat: 'Rent', day: 1, card: 'Chase ••4417', amount: 1200, paidDay: 1, start: 'Oct', active: true },
    { id: 'gws', who: 'Google Workspace', cat: 'Software', day: 5, card: 'Amex ••1009', amount: 72, paidDay: 0, start: 'Oct', active: true },
    { id: 'adobe', who: 'Adobe Creative Cloud', cat: 'Software', day: 8, card: 'Amex ••1009', amount: 90, paidDay: 1, start: 'Oct', active: true },
    { id: 'notion', who: 'Notion', cat: 'Software', day: 9, card: 'Amex ••1009', amount: 40, paidDay: 0, start: 'Oct', active: true },
    { id: 'figma', who: 'Figma', cat: 'Software', day: 12, card: 'Amex ••1009', amount: 45, paidDay: 2, start: 'Oct', active: true },
    { id: 'comcast', who: 'Comcast Business', cat: 'Internet & phone', day: 15, card: 'Chase ••4417', amount: 129, paidDay: 3, start: 'Oct', active: true },
    { id: 'dropbox', who: 'Dropbox', cat: 'Software', day: 20, card: 'Amex ••1009', amount: 24, paidDay: 0, start: 'Oct', active: true, unused: 'No files changed in 60 days' },
    { id: 'ins', who: 'Business insurance', cat: 'Insurance', day: 28, card: 'Chase ••4417', amount: 646, paidDay: 0, start: 'Oct', active: true }
  ]);
})();
