/*
 * BillingEase marketing site: Guides, Help center answers and the changelog.
 * Read by SiteGuides, SiteGuide, SiteHelp and SiteChangelog. Prices and links
 * come from site.js (window.SITE) so the copy never disagrees with Pricing.
 * Everything here is general information for a prototype, not tax advice.
 */
(function () {
  'use strict';
  var S = window.SITE || { plans: [{}, { month: 16, year: 13 }, { month: 39, year: 32 }], addons: [{ price: '$20 a month + $6 per person' }, { price: '2.9% + 30¢ per payment' }, { price: '1% per payment, $10 max' }], company: { support: 'help@billingease.app' } };
  var PRO = S.plans[1], TEAM = S.plans[2], PAYROLL = S.addons[0], CARD = S.addons[1], BANK = S.addons[2];

  // ---- block helpers (articles are lists of typed blocks) -----------------
  function P(x, lead) { return { t: 'p', x: x, lead: lead || '' }; }
  function H(x) { return { t: 'h', x: x }; }
  function Q(x, who) { return { t: 'quote', x: x, who: who }; }
  function C(title, x, tone) { return { t: 'callout', title: title, x: x, tone: tone || 'tip' }; }
  function L(items) { return { t: 'list', items: items }; }
  function T(caption, head, rows) { return { t: 'table', caption: caption, head: head, rows: rows }; }
  function EX(title, rows, total, note) { return { t: 'example', title: title, rows: rows, total: total, note: note }; }

  var AUTHORS = {
    ines: { name: 'Lucía Ferrer, EA', role: 'Tax lead', initials: 'LF', bg: '#FDE6D6', bio: 'Enrolled agent. Spent eleven years doing tax returns for freelancers in Queens before joining BillingEase.' },
    theo: { name: 'Owen Pritchard', role: 'Product writer', initials: 'OP', bg: '#EEE8FF', bio: 'Writes every word you read in the app, and rewrites them when customers tell us they’re confusing.' },
    hana: { name: 'Hana Sato', role: 'Customer success lead', initials: 'HS', bg: '#E2F6D5', bio: 'Ran a stationery shop in Portland for six years. Now helps new customers get set up.' },
    renata: { name: 'Renata Okafor, CPA', role: 'Head of accounting education', initials: 'RO', bg: '#EEE8FF', bio: 'Accountant to small businesses for fifteen years. Believes nobody should need a dictionary to read their own books.' },
    kofi: { name: 'Kofi Mensah', role: 'Payroll specialist', initials: 'KM', bg: '#FDE6D6', bio: 'Has run payroll for businesses with one employee and with four hundred. Prefers the first kind.' }
  };

  // ---- covers: small flat illustrations, drawn once as SVG ---------------
  var INK = '#18161F';
  function svg(bg, body) {
    return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="' + bg + '"/>' + body + '</svg>');
  }
  var st = ' stroke="' + INK + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  var F = 'font-family="Arial, Helvetica, sans-serif" font-weight="700"';
  var COVERS = {
    tax: svg('#EEE8FF',
      '<circle cx="300" cy="60" r="70" fill="#FFFFFF" opacity="0.6"/>' +
      '<path d="M120 62 H200 V76 C200 84 226 90 226 118 V196 C226 214 212 226 194 226 H126 C108 226 94 214 94 196 V118 C94 90 120 84 120 76 Z" fill="#FFFFFF"' + st + '/>' +
      '<rect x="112" y="46" width="96" height="20" rx="6" fill="#B9A3FF"' + st + '/>' +
      '<rect x="104" y="150" width="112" height="66" rx="4" fill="#B6E0AE"' + st + '/>' +
      '<circle cx="160" cy="183" r="15" fill="#D3EDCE" stroke="#4F7F49" stroke-width="2"/>' +
      '<text x="160" y="190" text-anchor="middle" ' + F + ' font-size="20" fill="#2F5711">$</text>' +
      '<rect x="244" y="118" width="96" height="108" rx="10" fill="#18161F"/>' +
      '<path d="M244 138 H340" stroke="#B9A3FF" stroke-width="3"/>' +
      '<text x="292" y="190" text-anchor="middle" ' + F + ' font-size="34" fill="#B9A3FF">25%</text>' +
      '<text x="292" y="211" text-anchor="middle" ' + F + ' font-size="12" fill="#EEE8FF">FOR TAX</text>' +
      '<path d="M226 150 C236 140 240 136 244 132" fill="none"' + st + ' stroke-dasharray="2 7"/>'),
    papers: svg('#FDE6D6',
      '<g transform="rotate(-8 120 130)"><rect x="60" y="40" width="120" height="160" rx="8" fill="#FFFFFF"' + st + '/><path d="M80 70 H140 M80 92 H160 M80 110 H150" stroke="#C9BCFB" stroke-width="6" stroke-linecap="round"/><text x="80" y="176" ' + F + ' font-size="16" fill="' + INK + '">QUOTE</text></g>' +
      '<rect x="140" y="30" width="124" height="170" rx="8" fill="#FFFFFF"' + st + '/><path d="M160 60 H220 M160 84 H244 M160 104 H236 M160 124 H230" stroke="#F4C3A1" stroke-width="6" stroke-linecap="round"/><text x="160" y="182" ' + F + ' font-size="16" fill="' + INK + '">INVOICE</text>' +
      '<g transform="rotate(7 300 140)"><path d="M260 60 H340 V214 L326 204 L312 214 L298 204 L284 214 L270 204 L260 214 Z" fill="#FFFFFF"' + st + '/><path d="M276 86 H324 M276 106 H316" stroke="#B6E0AE" stroke-width="6" stroke-linecap="round"/><circle cx="300" cy="158" r="22" fill="#B9A3FF"' + st + '/><path d="M290 158 l7 7 l13 -14" fill="none"' + st + '/></g>'),
    late: svg('#FFF4E8',
      '<circle cx="140" cy="122" r="74" fill="#FFFFFF"' + st + '/>' +
      '<circle cx="140" cy="122" r="60" fill="#FDE6D6"/>' +
      '<path d="M140 78 V122 L172 140" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="140" cy="122" r="6" fill="' + INK + '"/>' +
      '<path d="M96 52 L80 38 M184 52 L200 38" ' + st + '/>' +
      '<g transform="rotate(-6 300 140)"><rect x="236" y="96" width="132" height="88" rx="8" fill="#FFFFFF"' + st + '/><path d="M236 104 L302 148 L368 104" fill="none"' + st + '/></g>' +
      '<rect x="262" y="58" width="92" height="30" rx="15" fill="#E0752D"' + st + '/>' +
      '<text x="308" y="79" text-anchor="middle" ' + F + ' font-size="14" fill="#FFFFFF">7 DAYS</text>'),
    maker: svg('#E2F6D5',
      '<rect x="74" y="110" width="66" height="96" rx="8" fill="#FFFFFF"' + st + '/>' +
      '<rect x="74" y="126" width="66" height="30" fill="#B9A3FF" stroke="' + INK + '" stroke-width="3"/>' +
      '<path d="M107 110 V92" ' + st + '/><path d="M107 92 C96 78 104 64 107 54 C112 66 120 78 107 92 Z" fill="#E0752D"' + st + '/>' +
      '<path d="M170 96 H300 L290 206 H180 Z" fill="#FDE6D6"' + st + '/>' +
      '<path d="M206 96 C206 66 264 66 264 96" fill="none"' + st + '/>' +
      '<g transform="rotate(12 320 80)"><path d="M292 52 H350 V108 H292 L276 80 Z" fill="#FFFFFF"' + st + '/><circle cx="290" cy="80" r="5" fill="' + INK + '"/><text x="322" y="88" text-anchor="middle" ' + F + ' font-size="22" fill="' + INK + '">%</text></g>' +
      '<text x="235" y="160" text-anchor="middle" ' + F + ' font-size="20" fill="' + INK + '">SHOP</text>'),
    clock: svg('#EEE8FF',
      '<rect x="54" y="46" width="150" height="170" rx="10" fill="#FFFFFF"' + st + '/>' +
      '<path d="M78 82 H180 M78 110 H180 M78 138 H180 M78 166 H150" stroke="#E2DFE8" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M76 80 l6 6 l10 -12 M76 108 l6 6 l10 -12 M76 136 l6 6 l10 -12" fill="none" stroke="#7A5AF8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="282" cy="132" r="66" fill="#18161F"/>' +
      '<rect x="270" y="52" width="24" height="16" rx="4" fill="#18161F"/>' +
      '<path d="M282 132 L282 132 L282 66 A66 66 0 0 1 339 165 Z" fill="#B9A3FF"/>' +
      '<circle cx="282" cy="132" r="44" fill="#18161F"/>' +
      '<text x="282" y="144" text-anchor="middle" ' + F + ' font-size="34" fill="#FFFFFF">20</text>' +
      '<text x="282" y="164" text-anchor="middle" ' + F + ' font-size="11" fill="#EEE8FF">MIN</text>'),
    hire: svg('#FDE6D6',
      '<circle cx="128" cy="96" r="34" fill="#C68B6E"' + st + '/>' +
      '<path d="M96 90 C94 64 112 54 130 54 C150 54 162 66 160 88 C150 76 134 72 118 76 C108 78 100 82 96 90 Z" fill="#2B2233"/>' +
      '<path d="M66 214 C66 160 92 140 128 140 C164 140 190 160 190 214 Z" fill="#7A5AF8"' + st + '/>' +
      '<rect x="112" y="160" width="32" height="40" rx="4" fill="#FFFFFF"' + st + '/>' +
      '<rect x="222" y="58" width="128" height="150" rx="8" fill="#FFFFFF"' + st + '/>' +
      '<text x="240" y="88" ' + F + ' font-size="13" fill="' + INK + '">PAY STUB</text>' +
      '<path d="M240 108 H330 M240 128 H310 M240 148 H320" stroke="#F4C3A1" stroke-width="6" stroke-linecap="round"/>' +
      '<rect x="240" y="166" width="92" height="26" rx="13" fill="#B6E0AE" stroke="' + INK + '" stroke-width="2"/>' +
      '<text x="286" y="184" text-anchor="middle" ' + F + ' font-size="13" fill="' + INK + '">$1,602</text>'),
    globe: svg('#EEE8FF',
      '<circle cx="150" cy="122" r="80" fill="#FFFFFF"' + st + '/>' +
      '<path d="M70 122 H230 M150 42 C110 82 110 162 150 202 M150 42 C190 82 190 162 150 202" fill="none"' + st + '/>' +
      '<path d="M84 82 H216 M84 162 H216" fill="none" stroke="' + INK + '" stroke-width="2"/>' +
      '<circle cx="290" cy="76" r="32" fill="#B9A3FF"' + st + '/><text x="290" y="88" text-anchor="middle" ' + F + ' font-size="32" fill="' + INK + '">€</text>' +
      '<circle cx="324" cy="148" r="32" fill="#F4C3A1"' + st + '/><text x="324" y="160" text-anchor="middle" ' + F + ' font-size="32" fill="' + INK + '">£</text>' +
      '<circle cx="262" cy="196" r="28" fill="#B6E0AE"' + st + '/><text x="262" y="207" text-anchor="middle" ' + F + ' font-size="28" fill="' + INK + '">$</text>'),
    sheet: svg('#E2F6D5',
      '<rect x="40" y="52" width="170" height="140" rx="8" fill="#FFFFFF"' + st + '/>' +
      '<path d="M40 84 H210 M40 112 H210 M40 140 H210 M40 168 H210 M96 52 V192 M152 52 V192" stroke="#B5B0BF" stroke-width="2"/>' +
      '<rect x="41" y="53" width="168" height="30" fill="#D3EDCE"/>' +
      '<path d="M222 122 H262 M250 108 L264 122 L250 136" fill="none"' + st + '/>' +
      '<rect x="276" y="56" width="98" height="136" rx="16" fill="#18161F"/>' +
      '<rect x="288" y="72" width="74" height="26" rx="8" fill="#7A5AF8"/>' +
      '<rect x="288" y="106" width="74" height="26" rx="8" fill="#E0752D"/>' +
      '<rect x="288" y="140" width="74" height="36" rx="8" fill="#B9A3FF"/>')
  };

  var COVER_BG = { tax: '#EEE8FF', papers: '#FDE6D6', late: '#FFF4E8', maker: '#E2F6D5', clock: '#EEE8FF', hire: '#FDE6D6', globe: '#EEE8FF', sheet: '#E2F6D5' };

  // ---- the eight guides ----------------------------------------------------
  var guides = [
    {
      slug: 'how-much-to-set-aside-for-tax', cover: 'tax', category: 'Tax', author: 'ines', date: 'Sep 15, 2026', featured: true,
      title: 'How much should I set aside for tax?',
      dek: 'For most US sole owners the answer is 25 to 30 percent of profit. Here’s where that number comes from, and when yours should be different.',
      summary: ['Set aside a share of profit, not of sales. Start at 25%, or 30% if you earn more or live in a high-tax state.', 'Pay the IRS four times a year: April 15, June 15, September 15 and January 15.', 'Paying at least what you owed last year keeps you clear of underpayment penalties.'],
      app: { label: 'See your tax set-aside', href: 'ThreeKeep.dc.html', line: 'Yours to keep shows your profit, the 25% we put aside for tax, and what’s left. Change the percentage any time.' },
      blocks: [
        P('If you work for yourself, nobody withholds tax from what you earn. The money lands in your account whole, and it is very easy to treat all of it as yours. Then April comes. This guide gives you a number to start with, shows where it comes from, and explains how to make setting it aside automatic, so you don’t have to think about it again.'),
        H('Set aside from profit, not from sales'),
        P('Tax is charged on profit: what came in, minus what it cost you to earn it. If a customer pays you $5,000 and you spent $1,200 on materials and software to do the job, you are taxed on $3,800. Setting aside 25% of the $5,000 would lock up money you don’t owe. Setting aside 25% of the $3,800 is about right.'),
        P('In BillingEase terms: Coming in, minus Going out, is your profit. The set-aside comes off that, and what’s left is Yours to keep.'),
        H('Where 25 to 30 percent comes from'),
        P('For a sole owner in the US, three taxes stack up on the same profit:'),
        L(['Self-employment tax: 15.3% on about 92% of your profit. It pays for Social Security and Medicare, the part an employer would normally share with you.', 'Federal income tax: on what’s left after the standard deduction, at 10%, then 12%, then 22% and up as profit rises.', 'State income tax: from nothing in states like Texas and Florida to 5–7% in many others, and more in a few.']),
        P('Added together, most people with $40,000 to $120,000 of profit pay somewhere between 22% and 32% of it. That’s why 25% is our default, and why 30% is the safer choice if you earn more or live somewhere with a high state tax.'),
        EX('A worked example: $60,000 of profit, single filer', [['Profit for the year', '$60,000'], ['Self-employment tax (15.3% × 92.35%)', '$8,478'], ['Federal income tax, after deductions', '$3,560'], ['State income tax (a 5% state, roughly)', '$2,300']], ['Total tax', '$14,338'], 'That’s 23.9% of profit. A 25% set-aside ($15,000) covers it with $662 to spare.'),
        Q('The set-aside isn’t money you lose. It’s money that was never yours, parked where you can’t spend it by accident.', 'Lucía Ferrer, EA'),
        H('Pay four times a year, not once'),
        P('The IRS expects tax as you earn it, through quarterly estimated payments. Miss them and you pay a small penalty, a bit like interest, on top of the tax itself. The quarters aren’t quite even:'),
        T('Estimated tax dates for 2026 income', ['Income earned', 'Payment due'], [['Jan 1 – Mar 31', 'Apr 15, 2026'], ['Apr 1 – May 31', 'Jun 15, 2026'], ['Jun 1 – Aug 31', 'Sep 15, 2026'], ['Sep 1 – Dec 31', 'Jan 15, 2027']]),
        P('You avoid the penalty if your four payments add up to at least what your total tax was last year (110% of it if last year’s income was over $150,000). That gives you a simple fallback in a lumpy year: divide last year’s tax by four and pay that each quarter.', 'The safe harbor.'),
        H('When your number should be different'),
        L(['Your first year: there’s no last year to lean on, so use 30% until you’ve seen twelve months of numbers.', 'You’re an S corporation: your salary has tax withheld through payroll, so the set-aside only covers tax on the profit left over. Ask your accountant for your percentage.', 'A big deduction is coming: buying equipment or opening a retirement account can lower the bill. Don’t cut the set-aside until the deduction is real.', 'You sell products: sales tax you collect is a separate pile. It was never income, so don’t count it here.']),
        C('Make it automatic', 'Open a second savings account just for tax. Every time a customer pays, move your percentage across the same day. BillingEase shows the amount on each payment, so the move takes ten seconds.', 'tip'),
        H('What to do this week'),
        P('Look at your profit so far this year, multiply it by your percentage, and compare that with what’s sitting in your tax account. If you’re short, top it up a little each week before the next quarterly date, rather than all at once in April.')
      ]
    },
    {
      slug: 'invoice-vs-quote-vs-receipt', cover: 'papers', category: 'Getting paid', author: 'theo', date: 'Aug 27, 2026',
      title: 'Invoice vs quote vs receipt',
      dek: 'Three pieces of paper, three different jobs. Use the right one at the right moment and customers pay faster, with fewer questions.',
      summary: ['A quote is a price agreed before the work. Nothing is owed yet.', 'An invoice asks for money: what, how much and by when.', 'A receipt proves the money arrived.'],
      app: { label: 'Send a quote', href: 'SellQuotes.dc.html', line: 'Write a quote, let the customer accept it online, and turn it into the invoice in one click.' },
      blocks: [
        P('They look alike: your name at the top, a list of things, a number at the bottom. But each one tells your customer, and the tax office, something different about where you are in the job. Mixing them up is one of the most common reasons an invoice sits unpaid.'),
        H('A quote: “here’s what it would cost”'),
        P('A quote comes before any work. It tells the customer what you’ll do and what it will cost, so they can say yes. Nothing is owed yet, and it doesn’t count as income. A good quote has a clear description of the work, a price for each part, what’s not included, and an expiry date (30 days is common) so last spring’s prices don’t come back to haunt you.'),
        P('Some people use “estimate” for a best guess that may change and “quote” for a fixed price. Customers don’t always know the difference, so if you mean fixed, write “fixed price” on the page.', 'Quote or estimate?'),
        H('An invoice: “please pay this”'),
        P('An invoice asks for payment for work done or goods delivered, or, with a deposit, about to be. It’s the moment money becomes owed, and in BillingEase it’s the moment the amount shows in Coming in. A useful invoice has a unique number, the date, a due date, what you did, the total, any tax, and how to pay.'),
        C('Due dates beat payment terms', '“Net 30” makes your customer do arithmetic. “Due November 3” doesn’t. Write the date.', 'note'),
        H('A receipt: “thanks, you’ve paid”'),
        P('A receipt confirms that money changed hands. Your customer needs it for their own books and expense claims, and you keep a copy to prove what came in. You rarely need to make one by hand: when an invoice is paid online, the receipt goes out automatically.'),
        P('Receipts you get from others matter just as much. They’re your proof for every expense, which is why it’s worth snapping them the moment they arrive.'),
        T('Side by side', ['', 'Quote', 'Invoice', 'Receipt'], [['When', 'Before the work', 'After it, or for a deposit', 'After payment'], ['Is money owed?', 'No', 'Yes', 'No, it’s paid'], ['In Coming in?', 'No', 'Yes, as expected', 'Yes, as received'], ['Has a date that matters', 'Expiry date', 'Due date', 'Date paid'], ['Typical number', 'Q-0031', 'INV-0156', 'Sent with payment']]),
        H('How they connect: a worked example'),
        P('Here’s one job from start to finish, for a design studio making lobby signs for an architecture firm.'),
        EX('Greenline Architects: lobby signage', [['Quote Q-0031 sent Sep 30', '$4,200'], ['Accepted Oct 6, deposit invoice (50%)', '$2,100'], ['Deposit paid Oct 8, receipt sent', '$2,100'], ['Final invoice after install, Oct 27', '$2,100']], ['Total billed', '$4,200'], 'The quote itself never counted as income. Coming in grew by $2,100 with each invoice, and when the second receipt went out the whole $4,200 was paid.'),
        Q('When a customer says yes to a quote, turn it into the invoice in one step. Retyping is where the mistakes come from.', 'Owen Pritchard'),
        H('Common mix-ups'),
        L(['Sending an invoice when you meant a quote: the customer may pay it, or their accounts team may log it as a debt. Send a quote first for anything not yet agreed.', 'Changing an invoice after sending it: don’t edit it quietly. Void it and send a corrected one, or give money back to the customer (a credit note) for the difference.', 'Treating a “pro forma” as an invoice: it’s a quote dressed up as an invoice, often for customs or a purchase order. Nothing is owed until the real invoice.']),
        P('If you remember one thing: quote to agree, invoice to ask, receipt to confirm.')
      ]
    },
    {
      slug: 'when-a-customer-pays-late', cover: 'late', category: 'Getting paid', author: 'hana', date: 'Sep 29, 2026',
      title: 'What to do when a customer pays late',
      dek: 'A calm, step-by-step plan from the first friendly nudge to the last resort, with the exact words to use.',
      summary: ['Most late invoices are forgotten, not refused. Start friendly.', 'Remind on a schedule: before, on and after the due date.', 'A late fee only works if it was in your terms from the start.'],
      app: { label: 'See overdue invoices', href: 'SellInvoices.dc.html', line: 'Every invoice shows when it was opened and which reminders went out. Overdue ones float to the top.' },
      blocks: [
        P('Ask any group of small business owners and most will have an invoice that’s late right now. Almost always the reason is dull: the invoice went to the wrong inbox, the person who approves payments was away, or it simply slipped. That’s good news, because dull problems have simple fixes.'),
        H('Before it’s late'),
        L(['Send the invoice to the person who pays, not only the person who hired you. Ask “who handles invoices on your side?” at the start of every job.', 'Put a real due date on it, and say how to pay. Every extra step (log in, find your bank details, type them in) adds days.', 'Let them pay from a link, by card or bank transfer. Invoices with a pay button get paid noticeably faster than ones without.']),
        H('A reminder schedule that works'),
        P('Reminders feel awkward to send, so people put them off. Decide the schedule once, and stop deciding each time.'),
        T('Reminders we suggest', ['When', 'Tone', 'What to say'], [['3 days before', 'Friendly', '“A heads-up that INV-0158 for $3,200 is due on Friday. Here’s the link to pay.”'], ['On the due date', 'Plain', '“INV-0158 is due today. You can pay here in a minute.”'], ['7 days late', 'Direct', '“INV-0158 is now a week overdue. When can I expect it?”'], ['14 days late', 'Firm', '“This is two weeks overdue. As in our terms, a late fee applies from day 30.”'], ['30 days late', 'A phone call', 'Ask what’s in the way, and agree a date.']]),
        P('In BillingEase, Pro sends the first four for you, at times you choose, and stops the moment the customer pays.'),
        Q('Ask a question, not for a favor. “When can I expect this?” gets an answer. “Sorry to bother you” gets ignored.', 'Hana Sato'),
        H('When it’s 30 days late'),
        P('Call. An email is easy to leave unread; a polite phone call rarely is. Ask whether there’s a problem with the work, and agree a date. If they can’t pay it all at once, offer a plan of two or three payments, each with its own due date. Something now is worth more than everything someday.'),
        P('You don’t have to stop a job halfway, but don’t start the next one until the overdue invoice is settled. Say so kindly, and in writing.', 'Pause new work.'),
        H('Late fees, done right'),
        P('A late fee only holds up if it was in your terms before the work started, ideally on the quote the customer accepted. A common choice is 1.5% a month on the overdue amount. Some states cap what you can charge, so check yours before you pick a number.'),
        EX('Lumen Dental Group, INV-0158', [['Invoice amount, due Sep 4', '$3,200'], ['30 days late: one month at 1.5%', '$48'], ['60 days late: two months at 1.5%', '$96']], ['Owed at 60 days', '$3,296'], 'A $48 fee won’t make you rich. What it does is move your invoice to the top of their pile.'),
        H('The last resort'),
        P('If 60 to 90 days pass and calls go nowhere, send a formal letter saying what you’ll do, and by which date. After that, small claims court handles most small business debts without a lawyer (the limit is between about $5,000 and $25,000 depending on the state), or a collection agency will chase the debt for a share of it, often 25 to 50%. Very few invoices get this far. The letter alone usually does it.'),
        C('If you have to give up', 'Mark the invoice as bad debt rather than deleting it. It comes off Coming in, the history stays, and your accountant can treat it properly at tax time.', 'note'),
        P('And next time, ask for a deposit before you start. A customer who has paid half up front almost always pays the rest.')
      ]
    },
    {
      slug: 'sales-tax-for-makers-selling-online', cover: 'maker', category: 'Tax', author: 'ines', date: 'Jul 21, 2026',
      title: 'Sales tax for makers selling online',
      dek: 'Marketplaces collect it for you; your own website might not. A plain map of who collects what, and when you need to register.',
      summary: ['Craftmarket, Parcelhub and other marketplaces collect and pay sales tax for you in every US state that has it.', 'On your own website you collect for your home state, plus any state where you pass its threshold.', 'Keep collected sales tax apart from your money. It was never yours.'],
      app: { label: 'See sales tax you collected', href: 'BooksTax.dc.html', line: 'Sales tax is tracked per sale and per state, with the amount and the filing date ready before it’s due.' },
      blocks: [
        P('If you make things and sell them online, sales tax probably sounds like a maze of 45 states and thousands of local rates. In practice, for most small makers, it comes down to three questions: where are you, where do your buyers live, and how much do you sell to each place.'),
        H('It depends on where the buyer is'),
        P('Since a 2018 Supreme Court case, South Dakota v. Wayfair, states can require sales tax on sales into the state even if you have no shop or staff there. Each state set a threshold: once your sales into it pass the line in a year, you register and start collecting. For most states the line is $100,000 of sales; a few also count the number of orders.'),
        P('Below every other state’s threshold, you only deal with your home state. That describes most makers.'),
        H('Marketplaces handle their own sales'),
        P('Craftmarket, Parcelhub, eBay and similar sites are “marketplace facilitators”. They charge the buyer sales tax, file it and pay it, in every state that has one. You don’t collect anything extra on those orders, and in most states those sales don’t count toward your own threshold. A handful of states do count them, so check any state where you’re getting close.'),
        H('Your own website is your job'),
        P('On your own shop (your website, a pay link on an invoice, a market stall), you collect tax from buyers in your home state, and from buyers in any other state where you’ve passed its threshold.'),
        EX('Juniper & Wick, candles, Columbus, Ohio · 2026 so far', [['Craftmarket sales (Craftmarket collects the tax)', '$38,200'], ['Website sales, all states', '$21,400'], ['Website sales to Ohio buyers', '$6,200'], ['Ohio rate in Franklin County', '7.5%']], ['Sales tax to collect and file', '$465'], 'Website sales into every other state are far below that state’s threshold, so no other state is involved yet. The Craftmarket orders are already taken care of.'),
        H('What’s taxable'),
        P('Most physical goods are. Some states treat clothing, food or handmade art differently, and shipping you charge the buyer is taxed in some states and not others. Services like design or repairs usually aren’t taxed, though a few states tax some of them.'),
        T('What usually applies (always check your state)', ['Item', 'Usually taxed?'], [['Candles, jewelry, prints, ceramics', 'Yes'], ['Clothing', 'In most states; a few exempt basics'], ['Shipping charged to the buyer', 'Depends on the state'], ['Digital downloads and patterns', 'In about half of states'], ['Design or consulting services', 'Rarely']]),
        H('Registering and filing'),
        L(['Register with your home state before your first taxable sale. It’s usually free and online.', 'Your state tells you how often to file (monthly, quarterly or yearly), based on how much you collect.', 'File even when you owe nothing. A “zero return” still counts, and skipping it can mean a fine.', 'Keep a record of the tax on each sale, by state. That’s the first thing an audit asks for.']),
        Q('Sales tax you collect isn’t income. It passes through your account on its way to the state, so treat it like someone else’s money.', 'Lucía Ferrer, EA'),
        C('How BillingEase keeps it apart', 'Tax you collect on product sales is held out of Yours to keep and shown as “Sales tax you collected”, so you never spend it by mistake.', 'note'),
        P('If you start selling at wholesale, ask each shop for its resale certificate. With one on file, you don’t charge them sales tax; the shop collects it when it sells to the final buyer.')
      ]
    },
    {
      slug: 'bookkeeping-in-20-minutes-a-month', cover: 'clock', category: 'Bookkeeping', author: 'renata', date: 'Jun 30, 2026',
      title: 'Bookkeeping in 20 minutes a month',
      dek: 'A once-a-month routine that keeps your books ready for your accountant, with a timer on each step.',
      summary: ['Pick one day a month and protect 20 minutes for it.', 'Sort, match, check against the bank, chase, look: in that order.', 'Little and often beats a weekend of shoeboxes in March.'],
      app: { label: 'Check against your bank statement', href: 'BooksReconcile.dc.html', line: 'Type the balance from your statement. BillingEase lines it up and shows exactly what’s different, if anything.' },
      blocks: [
        P('Bookkeeping has a reputation for eating weekends. That happens when it’s left for a year. Done once a month, with a connected bank, it’s small: about a cup of coffee’s worth of work. This is the routine I give every new client.'),
        H('Before you start'),
        P('Connect your business bank account and cards so transactions arrive on their own, and keep business and personal spending in separate accounts. Those two decisions do more than any routine. If you mix them, every month starts with untangling.'),
        P('If you have an accountant, ask them one question before your first month: “Which categories do you want me to use?” Ten minutes of their time now saves an hour of re-sorting at year-end, and the reports they pull from your books will look the way they expect.'),
        H('The routine'),
        T('Your monthly 20 minutes', ['Step', 'Time', 'What you do'], [['1. Sort', '5 min', 'Give every new transaction a category. Most are sorted already; you only do the leftovers.'], ['2. Match receipts', '4 min', 'Snap or forward receipts still in your bag or inbox, and check they matched.'], ['3. Check against the bank', '5 min', 'Compare the month-end balance with your bank statement. They should agree.'], ['4. Harborline', '3 min', 'Look at overdue invoices. Nudge anyone more than a week late.'], ['5. Look', '3 min', 'Read your three numbers. Did anything surprise you?']]),
        H('Step 3 is the one people skip'),
        P('Checking against your bank statement, which accountants call reconciling, is how you know nothing is missing or counted twice. You take the closing balance on the statement, compare it with what your books say, and explain any difference. Most months there isn’t one. When there is, it’s nearly always one of three things: a bank fee you haven’t recorded, a payment that hasn’t cleared yet, or something entered twice.'),
        EX('A September check, start to finish', [['Bank statement closing balance', '$18,437.10'], ['Your books say', '$18,379.10'], ['Difference to explain', '$58.00'], ['Check #1042, written Sep 28, not cashed yet', '+$73.00'], ['Monthly bank fee, not recorded yet', '−$15.00']], ['Left to explain', '$0.00'], 'Record the $15 fee and leave the check alone: it will clear next month. Done in four minutes.'),
        Q('A difference of a few dollars is a clue, not a disaster. It’s nearly always a fee, a refund, or something that hasn’t cleared.', 'Renata Okafor, CPA'),
        H('Three habits that keep it to 20 minutes'),
        L(['Snap receipts when you get them. A receipt photographed at the counter takes five seconds; one found in March takes five minutes, if you find it at all.', 'Add a note to anything odd. “Lunch with Greenline about the signage job” is enough to turn a mystery into a business meal.', 'Never fix a past month quietly. If you find a mistake after your accountant has closed a month, tell them, so their numbers and yours stay the same.']),
        H('Once a quarter, add ten minutes'),
        P('Every three months, also compare your tax set-aside with what you’ll owe, make your quarterly estimated tax payment if you’re in the US, and file sales tax if you collect it. Put those dates in your calendar today, while you’re thinking about it.'),
        H('Once a year, hand it over'),
        P('If you’ve done the monthly routine, year-end is a short email: give your accountant access, and they’ll find the books already sorted, matched and checked. That alone can take hours off their bill.'),
        C('Pick your day', 'The 3rd of the month works well. Your bank statement is out, and most every-month costs have already gone through.', 'tip')
      ]
    },
    {
      slug: 'hiring-your-first-employee', cover: 'hire', category: 'Team', author: 'kofi', date: 'May 12, 2026',
      title: 'Hiring your first employee: payroll basics',
      dek: 'What a hire really costs, the forms you need before day one, and what payroll does every payday.',
      summary: ['Budget about 10% on top of salary for taxes and insurance, more with benefits.', 'Before day one: an EIN, state registration, I-9, W-4, a new-hire report and workers’ comp.', 'Every payday: withhold, pay and deposit. Every quarter and year: file.'],
      app: { label: 'See payroll in the demo', href: 'SpendPayroll.dc.html', line: 'Run payroll in two clicks: pay stubs, direct deposit and payroll tax are handled, and each run lands in Going out.' },
      blocks: [
        P('Your first hire is a big step, and the paperwork has a reputation for being worse than it is. Here’s what changes when someone goes from “helping out” to being on payroll, in the order you’ll meet it.'),
        H('Employee or contractor?'),
        P('First, check you need an employee at all. If you set their hours, provide their tools and direct how the work is done, they’re probably an employee in the eyes of the IRS and your state, whatever your agreement calls them. Contractors run their own business, choose how to do the work and usually have other clients. Getting this wrong is expensive: back taxes plus penalties.'),
        H('Before their first day'),
        L(['An Employer Identification Number (EIN) from the IRS. It’s free and takes about ten minutes online.', 'Registration with your state for payroll tax and unemployment insurance.', 'Form I-9, which confirms they can work in the US, completed within three business days of their start date.', 'Form W-4, so you know how much federal income tax to withhold. Most states have their own version too.', 'A new-hire report to your state, usually within 20 days.', 'Workers’ compensation insurance, required in almost every state once you have an employee.']),
        H('What a hire really costs'),
        P('Salary is only part of it. On top, you pay the employer’s half of Social Security and Medicare, federal and state unemployment tax, and insurance.'),
        EX('A designer on $52,000, paid every two weeks', [['Salary: 26 paychecks of $2,000', '$52,000'], ['Social Security and Medicare (7.65%)', '$3,978'], ['Federal unemployment (0.6% of the first $7,000)', '$42'], ['State unemployment (about 3% of the first $12,000)', '$360'], ['Workers’ comp insurance, office work', '$300']], ['Total cost for the year', '$56,680'], 'About 9% on top of salary before benefits. Add health insurance or a retirement match and 15 to 25% is common.'),
        P('Benefits are optional for a business your size in most states, but they matter when you’re competing for good people. Even a simple retirement plan with a small match, or a fixed monthly amount toward health insurance, can make a modest salary more attractive.'),
        H('What happens every payday'),
        P('For each paycheck you work out gross pay, take out the employee’s share of taxes, pay them the rest, and deposit the withheld tax together with your own share with the IRS, usually monthly when you’re small.'),
        T('One $2,000 paycheck (single, standard W-4, rough)', ['', 'Amount'], [['Gross pay', '$2,000.00'], ['Social Security (6.2%)', '−$124.00'], ['Medicare (1.45%)', '−$29.00'], ['Federal income tax', '−$165.00'], ['State income tax', '−$80.00'], ['Take-home pay', '$1,602.00']]),
        P('The $153 for Social Security and Medicare comes out of their pay, and you add another $153 of your own. Both go to the IRS.'),
        H('Quarterly and yearly filings'),
        P('Every quarter you file Form 941 for federal withholding, plus your state’s returns. Every January you file Form 940 for federal unemployment and give each employee a W-2 by January 31. Contractors you paid over the yearly threshold get a 1099-NEC instead.'),
        Q('Run your first payroll a few days early. The first one always raises a question, and you want time to answer it before payday.', 'Kofi Mensah'),
        C('Let software do the arithmetic', 'Payroll software works out withholding, deposits the tax and files the forms for you. In BillingEase it’s the Payroll add-on, ' + PAYROLL.price + ', and every run lands in Going out on its own.', 'tip'),
        P('One last thing: write down what you agreed (pay, hours, start date, time off) in a short offer letter. It saves both of you from misremembering later.')
      ]
    },
    {
      slug: 'charging-customers-abroad', cover: 'globe', category: 'Going global', author: 'renata', date: 'Apr 21, 2026',
      title: 'Charging customers abroad: currencies and VAT',
      dek: 'Which currency to bill in, how not to lose money on the exchange, and when VAT is, and isn’t, your problem.',
      summary: ['Bill in the customer’s currency when it helps win or keep the work, with a small buffer built in.', 'Exchange rates move: the dollars you receive can differ from the dollars you invoiced.', 'Selling services from the US to a business in the EU or UK usually means no VAT from you: the customer reverse-charges it.'],
      app: { label: 'See currencies in the demo', href: 'BooksCurrencies.dc.html', line: 'Invoice in euros or pounds, see the rate on the day you sent it and the day you were paid, and the gain or loss in between.' },
      blocks: [
        P('Overseas customers are usually a sign things are going well. They also bring two new questions: which currency to use, and whether you need to charge VAT. Here’s how to answer both without hiring a specialist.'),
        H('Choosing a currency'),
        P('Billing in dollars puts the exchange risk on your customer; billing in theirs puts it on you. Larger companies often insist on paying in their own currency, and a small customer is more likely to say yes to a price they understand at a glance. If you do bill in their currency, quote with a small buffer of 2 to 3% to cover rate swings and conversion fees.'),
        H('Why the dollars don’t always match'),
        P('An invoice in euros is worth one number of dollars on the day you send it and another on the day it’s paid. The difference is a real gain or loss, and it belongs in your books like any other.'),
        EX('Kaffeehaus Berlin GmbH: café rebrand', [['Invoice €6,500 at 1 EUR = 1.09 USD', '$7,085'], ['Paid 30 days later at 1 EUR = 1.07 USD', '$6,955'], ['Exchange loss', '−$130'], ['Bank’s conversion fee (0.5%)', '−$35']], ['Dollars you actually keep', '$6,920'], 'Quoting €6,700 instead, a 3% buffer, would have covered both the rate change and the fee.'),
        H('Getting paid without losing 4%'),
        L(['Ask to be paid into a multi-currency account, so euros arrive as euros and you convert when the rate suits you.', 'Avoid international wires where you can: both banks may take $15 to $45 each.', 'Cards work everywhere but cost more. For large invoices, a local bank transfer (SEPA in Europe) is usually cheapest.']),
        H('VAT, in plain words'),
        P('VAT is the European and British cousin of sales tax. It’s charged at each step of a sale, and businesses claim back the VAT they pay. Whether you charge it depends mostly on who your customer is and what you sell them.'),
        T('If you’re a US business selling services', ['Your customer', 'Do you charge VAT?'], [['A business in the EU with a VAT number', 'No. Write “VAT reverse charged to the customer” and their VAT number on the invoice.'], ['A business in the UK', 'No. The UK business accounts for it under the reverse charge.'], ['Consumers in the EU buying digital services', 'Yes, at their country’s rate, usually through the EU’s One Stop Shop.'], ['Consumers in the EU, services done in person', 'Usually no, but check the rule for your service.']]),
        Q('Check the customer’s VAT number before the first invoice. The EU has a free online checker, and a valid number is what makes the reverse charge stand up.', 'Renata Okafor, CPA'),
        H('Physical products are different'),
        P('Shipping goods abroad brings import VAT and customs duty, usually paid by the buyer on delivery. Say so clearly at checkout so a parcel isn’t refused at the door. For EU consumers, lower-value parcels can use a scheme called IOSS to collect VAT up front, so the buyer pays nothing extra on arrival.'),
        C('In BillingEase', 'Each invoice can have its own currency. We record the rate on the day you send it and on the day you’re paid, and show any gain or loss under Yours to keep.', 'note'),
        P('Write your bank details for international payments (SWIFT/BIC and IBAN, or the local details your multi-currency account gives you) on the invoice itself. A customer who has to ask is a customer who pays next week.')
      ]
    },
    {
      slug: 'switching-from-a-spreadsheet', cover: 'sheet', category: 'Bookkeeping', author: 'hana', date: 'Mar 17, 2026',
      title: 'Switching from a spreadsheet',
      dek: 'The signs you’ve outgrown it, the five things to bring over, and a one-afternoon plan to move without losing a number.',
      summary: ['Switch on the first day of a month or quarter, never midway.', 'Bring over five things: opening balances, customers, open invoices, unpaid bills and every-month costs.', 'Keep both going for one month, compare, then retire the spreadsheet.'],
      app: { label: 'How switching works', href: 'SiteSwitch.dc.html', line: 'Bring your customers, open invoices and balances across from a spreadsheet, Wave or QuickBooks, with a person to help.' },
      blocks: [
        P('Spreadsheets are a fine way to start. They’re free, flexible and familiar. But at some point you’re spending Sunday evenings copying bank lines into rows, and you still can’t say what you can pay yourself this month. That’s the point to switch, and it’s less work than it sounds.'),
        H('Signs you’ve outgrown it'),
        L(['You copy transactions from your bank by hand, every month.', 'You’ve sent an invoice twice, or not at all, because the list was out of date.', 'Your accountant asks for “the books” and you send three files and an apology.', 'You can’t say what you made last month without an hour of formulas.', 'Someone else needs to help, and the spreadsheet only makes sense to you.']),
        P('None of these mean you did anything wrong. A spreadsheet is built for one person asking one kind of question. A growing business asks lots of questions, of lots of people, at once, and wants the answers to agree.'),
        H('Pick a clean start date'),
        P('Choose the first day of a month, ideally the first day of a quarter. Everything before that date stays in the spreadsheet (keep it; your accountant may want it). Everything from that date lives in your new books. Starting midway means splitting a month across two systems, which is exactly where numbers get lost.'),
        H('The five things to bring over'),
        T('What to move, and where to find it', ['What', 'Where it is now', 'Time'], [['Opening bank balances', 'Your bank statement, on your start date', '5 min'], ['Customers', 'Your client list: names, emails, addresses', '15 min'], ['Open invoices', 'Anything sent but not paid yet', '15 min'], ['Unpaid bills', 'What you still owe suppliers', '10 min'], ['Every-month costs', 'Rent, software, insurance', '10 min']]),
        P('That’s about an hour. Past transactions don’t need to come over line by line: a connected bank usually pulls in the last 90 days or more, and your accountant only needs the old years as they are.'),
        EX('A florist’s opening balances on July 1', [['Business checking, statement balance', '$12,840.55'], ['Business credit card, owed', '−$1,206.30'], ['Open invoices to customers (4)', '$3,975.00'], ['Unpaid bills to suppliers (2)', '−$1,140.00']], ['Where you start', '$14,469.25'], 'If your spreadsheet’s own total for that day is different, find out why before going further. It’s the last time it will be easy.'),
        H('Keep both going for one month'),
        P('For your first month, keep updating the spreadsheet too. At the end of the month, compare the totals: money in, money out, and what customers still owe you. If they agree, rename the spreadsheet clearly (“Books to June 30, 2026 – final”), make it read-only and stop touching it.'),
        Q('The goal isn’t a perfect history. It’s a clean start you trust, from a date you can name.', 'Hana Sato'),
        H('What not to bring'),
        L(['Old paid invoices: save them as a PDF archive instead.', 'Categories you never used: start with the standard set and add your own as you go.', 'Formulas: the point is that you don’t need them any more.']),
        P('Do bring your notes, though. If a customer always pays late, or a supplier gives you a discount for paying early, add that to their record in the new books on day one, while you still remember it.'),
        C('A person to help you move', 'Send us your spreadsheet and we’ll set up your opening balances, customers and open invoices with you, on a 30-minute call. It’s free on every plan.', 'tip'),
        P('After the first month, the new habit is the monthly 20 minutes: sort, match, check, chase, look. The spreadsheet can finally retire.')
      ]
    }
  ];

  function words(g) {
    var n = (g.dek + ' ' + g.summary.join(' ')).split(/\s+/).length;
    g.blocks.forEach(function (b) {
      var s = [b.x, b.lead, b.title, b.note, b.caption].concat(b.items || []).join(' ');
      (b.rows || []).forEach(function (r) { s += ' ' + r.join(' '); });
      if (b.total) s += ' ' + b.total.join(' ');
      n += s.split(/\s+/).filter(Boolean).length;
    });
    return n;
  }
  guides.forEach(function (g) {
    g.words = words(g);
    g.minutes = Math.max(3, Math.ceil(g.words / 200));
    g.by = AUTHORS[g.author];
    g.img = COVERS[g.cover];
    g.coverBg = COVER_BG[g.cover];
    g.bgImg = g.coverBg + ' url("' + g.img + '")';
  });

  // ---- help center answers ---------------------------------------------------
  var helpTopics = [
    { id: 'start', name: 'Getting started', line: 'Signing up, setup and your first week', icon: 'M5 12h14M13 6l6 6-6 6' },
    { id: 'invoices', name: 'Invoices and getting paid', line: 'Quotes, invoices, reminders, payments', icon: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M8 13h8M8 17h5' },
    { id: 'expenses', name: 'Expenses and receipts', line: 'Snapping, sorting and splitting', icon: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6' },
    { id: 'bank', name: 'Bank and reports', line: 'Connecting, syncing and checking', icon: 'M3 10 12 4l9 6M5 10v8M19 10v8M9.5 10v8M14.5 10v8M3 20h18' },
    { id: 'tax', name: 'Tax', line: 'Set-aside, sales tax and VAT', icon: 'M19 5 5 19M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M16.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3' },
    { id: 'team', name: 'Team', line: 'People, roles, your accountant, payroll', icon: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.8' },
    { id: 'account', name: 'Account and billing', line: 'Plans, receipts, exporting, closing', icon: 'M3 6h18v12H3zM3 10h18M7 15h3' },
    { id: 'security', name: 'Security', line: 'Sign-in, access and your data', icon: 'M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6zM9 12l2 2 4-4' }
  ];
  var help = [
    { id: 'what-do-i-need', topic: 'start', popular: true, q: 'What do I need to sign up?', a: 'An email address and about three minutes. We ask what you sell, where you are and who works with you, so the app only shows what applies to your business. No card is needed for the Free plan.', link: { label: 'Create an account', href: 'AuthSignUp.dc.html' }, words: 'register create account start setup' },
    { id: 'try-pro', topic: 'start', q: 'Can I try Pro before paying?', a: 'Yes. Pro and Team are free for 30 days, with no card needed to start. When the trial ends you choose a plan, or you drop back to Free and keep everything you made.', link: { label: 'Compare plans', href: 'SitePricing.dc.html' }, words: 'trial free pro team cost' },
    { id: 'bring-data', topic: 'start', q: 'How do I bring over my customers and invoices?', a: 'Upload a spreadsheet (CSV) of customers, or connect Wave or QuickBooks and we copy them across. Open invoices and your opening balances come over too. If you’d rather not do it alone, book a free 30-minute call and we’ll do it with you.', link: { label: 'How switching works', href: 'SiteSwitch.dc.html' }, words: 'import migrate spreadsheet csv wave quickbooks move' },
    { id: 'first-invoice', topic: 'invoices', popular: true, q: 'How do I send my first invoice?', a: 'Press New, then Invoice. Type what you did in plain words (“Bill Atlas Freight $6,300 for October”), check the details, and send. Your customer gets an email with a link to pay, and the amount shows in Coming in straight away.', link: { label: 'See it in the demo', href: 'ThreeIn.dc.html' }, words: 'bill create send invoice new' },
    { id: 'online-payments', topic: 'invoices', popular: true, q: 'How do customers pay me online, and what does it cost?', a: 'Every invoice has a pay button. Cards cost ' + CARD.price + ' and bank payments cost ' + BANK.price + '. There’s nothing to pay if your customer pays you another way, like a check.', link: { label: 'See pricing', href: 'SitePricing.dc.html' }, words: 'card bank ach fees stripe apple pay payment' },
    { id: 'reminders', topic: 'invoices', q: 'Can BillingEase remind customers for me?', a: 'On Pro, yes. Reminders go out before the due date, on the day and after it, at times you choose, and stop the moment the customer pays. You can also send one by hand from any invoice.', link: { label: 'Guide: when a customer pays late', href: 'SiteGuide.dc.html#when-a-customer-pays-late' }, words: 'reminder overdue late chase nudge' },
    { id: 'refund', topic: 'invoices', q: 'How do I give money back to a customer?', a: 'Open the invoice and choose “Money back to a customer”. You can refund to their card or take it off a future invoice (accountants call that a credit note). The amount comes off Coming in either way.', words: 'refund credit note return money back' },
    { id: 'snap-receipt', topic: 'expenses', popular: true, q: 'How do I snap a receipt?', a: 'In the phone app, press the camera button and take a photo. You can also forward receipts by email to your own BillingEase address. We read the shop, date and total, and match the receipt to the charge from your bank.', link: { label: 'See receipts in the demo', href: 'SpendReceipts.dc.html' }, words: 'receipt photo scan camera ocr email forward' },
    { id: 'blurry', topic: 'expenses', q: 'A receipt couldn’t be read. What now?', a: 'It’s kept safe and marked “Type the total”. Open it, type the amount and date, and it matches like any other. Taking the photo flat, in good light, avoids it next time.', words: 'blurry unreadable receipt failed scan' },
    { id: 'personal', topic: 'expenses', q: 'I paid for something personal with the business card. How do I fix it?', a: 'Open the transaction and mark it as personal. It comes out of Going out and is recorded as money you took from the business, which is exactly how your accountant wants it.', link: { label: 'See a transaction', href: 'SpendTransaction.dc.html' }, words: 'personal mistake owner draw split transaction' },
    { id: 'bank-safe', topic: 'bank', popular: true, q: 'Is it safe to connect my bank?', a: 'Yes. The connection is read-only, through a trusted bank connection provider. We never see or store your bank password, and nobody at BillingEase can move money out of your account.', link: { label: 'How we keep your books safe', href: 'SiteSecurity.dc.html' }, words: 'bank connect plaid safe secure password' },
    { id: 'sync-stopped', topic: 'bank', q: 'My bank stopped syncing. What should I do?', a: 'Banks ask you to sign in again every so often, usually every 90 days. Go to Your business, then Bank connections, and press Reconnect. Anything missed while it was paused comes in by itself.', words: 'sync stopped broken disconnected reconnect bank' },
    { id: 'reconcile', topic: 'bank', q: 'What does “Check against your bank statement” do?', a: 'It compares your books with your bank statement at the end of a month (accountants call it reconciling). Type the statement’s closing balance and we show any difference and the likely cause, like a fee you haven’t recorded.', link: { label: 'Guide: bookkeeping in 20 minutes', href: 'SiteGuide.dc.html#bookkeeping-in-20-minutes-a-month' }, words: 'reconcile reconciliation statement balance difference' },
    { id: 'reports', topic: 'bank', q: 'Which reports will my accountant want?', a: 'Usually profit and loss, a balance sheet, and the general ledger for the year. All three are under Yours to keep, then Reports. Easier still, invite your accountant and they can look themselves.', words: 'report profit loss balance sheet ledger accountant year end' },
    { id: 'set-aside', topic: 'tax', popular: true, q: 'How does the tax set-aside work?', a: 'We set aside a share of your profit for tax, 25% unless you change it, and show what’s left as Yours to keep. It’s a number we keep for you, not a separate account; many people move the same amount to a savings account.', link: { label: 'Guide: how much to set aside', href: 'SiteGuide.dc.html#how-much-to-set-aside-for-tax' }, words: 'tax set aside percentage income self employment quarterly' },
    { id: 'sales-tax-file', topic: 'tax', q: 'Does BillingEase file my sales tax?', a: 'We work out what you collected per state and period, remind you before it’s due, and give you the exact numbers to enter on your state’s site. Filing on your behalf isn’t available yet.', link: { label: 'Guide: sales tax for makers', href: 'SiteGuide.dc.html#sales-tax-for-makers-selling-online' }, words: 'sales tax file return state nexus' },
    { id: 'vat', topic: 'tax', q: 'Can I charge VAT or GST?', a: 'Yes, on Pro. Set your country and VAT number under Your business, and invoices show VAT correctly, including “VAT reverse charged to the customer” for business customers in another country.', link: { label: 'Outside the US', href: 'SiteGlobal.dc.html' }, words: 'vat gst reverse charge europe uk canada australia' },
    { id: 'invite-accountant', topic: 'team', popular: true, q: 'How do I invite my accountant?', a: 'Go to Your business, then Team, and invite them as Accountant. They can read your books, add adjustments and download reports, but can’t send invoices or touch payroll. Accountants are free on Pro and Team.', link: { label: 'For accountants', href: 'SitePartners.dc.html' }, words: 'accountant cpa bookkeeper invite access' },
    { id: 'staff-see', topic: 'team', q: 'What can Staff see?', a: 'Staff can make quotes and invoices and log time. They can’t see payroll, the bank or your three numbers. Admins can do everything except delete the business. Roles are on the Team plan.', link: { label: 'BillingEase for teams', href: 'SiteTeams.dc.html' }, words: 'roles permissions staff admin employee access' },
    { id: 'payroll-where', topic: 'team', q: 'Where is payroll available?', a: 'Payroll is a US-only add-on for now, ' + PAYROLL.price + '. It covers direct deposit, pay stubs and payroll tax filings in all 50 states. Contractors can be paid in any country.', link: { label: 'Guide: hiring your first employee', href: 'SiteGuide.dc.html#hiring-your-first-employee' }, words: 'payroll employees w2 1099 contractors states' },
    { id: 'change-plan', topic: 'account', q: 'How do I change or cancel my plan?', a: 'Go to Your business, then Plan. Upgrades start straight away; downgrades and cancellations take effect at the end of the period you’ve paid for. Pro is $' + PRO.month + ' a month, or $' + PRO.year + ' a month paid yearly.', link: { label: 'See pricing', href: 'SitePricing.dc.html' }, words: 'upgrade downgrade cancel plan subscription price' },
    { id: 'refund-plan', topic: 'account', q: 'Can I get a refund?', a: 'If you paid for a year and cancel within 30 days, we refund the whole year. After that, you keep your plan until the year ends. Write to ' + S.company.support + ' and a person will sort it out.', words: 'refund money back subscription annual' },
    { id: 'export', topic: 'account', popular: true, q: 'How do I export everything?', a: 'Go to Your business, then Security and data, and choose Export. You get your invoices as PDFs and every transaction, customer and report as spreadsheets. It’s your data, on every plan, at any time.', link: { label: 'See it in the demo', href: 'BizSecurity.dc.html' }, words: 'export download backup data csv leave' },
    { id: 'delete-account', topic: 'account', q: 'How do I delete my account?', a: 'Go to Your business, then Security and data, and choose Delete. We ask you to export first, then everything is erased within 30 days, apart from what the law says we must keep for tax records.', words: 'delete close remove account erase' },
    { id: 'two-step', topic: 'security', q: 'Do you have two-step sign-in?', a: 'Yes. Turn it on under Your business, then Security, with an authenticator app or a text message. On Team, an Admin can require it for everyone.', words: '2fa two factor mfa authenticator sign in' },
    { id: 'who-sees', topic: 'security', q: 'Who at BillingEase can see my books?', a: 'Nobody, unless you ask us to help and give permission from the chat. That access lasts 24 hours, is logged, and you can end it at any time.', words: 'privacy staff access support see data' },
    { id: 'data-stored', topic: 'security', q: 'Where is my data kept?', a: 'In encrypted data centers in the US, with a copy in a second region in case of trouble. Everything is encrypted when it’s sent and when it’s stored.', link: { label: 'Security in detail', href: 'SiteSecurity.dc.html' }, words: 'encryption data center storage backup region' }
  ];

  // ---- changelog ---------------------------------------------------------
  var changelog = [
    { id: 'quotes-online', date: 'Oct 6, 2026', month: 'October', tag: 'New', big: 'quote', title: 'Customers can accept quotes online', body: 'Send a quote and your customer gets a page where they can accept it, ask a question or decline with a reason. When they accept, the invoice is ready to send in one click, deposit included.', points: ['See when a quote was opened', 'Expiry dates with a gentle reminder three days before', 'Accepted quotes show in Coming in as expected, once invoiced'], link: { label: 'Try quotes in the demo', href: 'SellQuotes.dc.html' } },
    { id: 'chase-reconnect', date: 'Sep 22, 2026', month: 'September', tag: 'Fixed', title: 'Harborline business accounts reconnect on their own', body: 'Some Harborline business accounts stopped syncing after Harborline changed its sign-in. They now reconnect without you doing anything, and any missed transactions came in the same morning.' },
    { id: 'receipts-faster', date: 'Sep 8, 2026', month: 'September', tag: 'Improved', title: 'Receipts read in under two seconds, even crumpled ones', body: 'Reading a receipt used to take up to ten seconds. It now takes under two, and we get the total right far more often on folded, faded and long supermarket receipts.' },
    { id: 'many-businesses', date: 'Aug 18, 2026', month: 'August', tag: 'New', big: 'biz', title: 'Several businesses under one sign-in', body: 'Run a studio and a side business? Switch between them from the account menu. Each keeps its own three numbers, bank, team and tax settings, and nothing ever mixes.', points: ['One sign-in, separate books', 'Different currencies and countries per business', 'On the Team plan'], link: { label: 'BillingEase for teams', href: 'SiteTeams.dc.html' } },
    { id: 'state-set-aside', date: 'Jul 28, 2026', month: 'July', tag: 'Improved', title: 'The tax set-aside knows your state', body: 'Tell us your state and we suggest a set-aside percentage that includes state income tax, instead of one number for everyone. You can still choose your own.', link: { label: 'Guide: how much to set aside', href: 'SiteGuide.dc.html#how-much-to-set-aside-for-tax' } },
    { id: 'short-months', date: 'Jul 7, 2026', month: 'July', tag: 'Fixed', title: 'Repeating invoices on the 31st go out in short months', body: 'Invoices set to repeat on the 31st skipped months with 30 days or fewer. They now go out on the last day of the month instead.' },
    { id: 'currencies-vat', date: 'Jun 16, 2026', month: 'June', tag: 'New', big: 'fx', title: 'Multiple currencies and VAT', body: 'Bill customers in euros, pounds and 30 other currencies. We record the rate when you send and when you’re paid, show any gain or loss, and handle VAT, including the reverse charge for business customers abroad.', points: ['32 currencies', 'VAT and GST on invoices, with the right wording', 'Gains and losses under Yours to keep'], link: { label: 'Outside the US', href: 'SiteGlobal.dc.html' } },
    { id: 'reconcile-one', date: 'May 19, 2026', month: 'May', tag: 'Improved', title: 'Check against your bank statement on one screen', body: 'Type your statement’s closing balance and see the difference straight away, with the likely cause listed first: a fee you haven’t recorded, or a check that hasn’t cleared.', link: { label: 'Guide: bookkeeping in 20 minutes', href: 'SiteGuide.dc.html#bookkeeping-in-20-minutes-a-month' } },
    { id: 'due-dates-tz', date: 'Apr 14, 2026', month: 'April', tag: 'Fixed', title: 'Due dates stay put for customers in other time zones', body: 'Customers far east of you sometimes saw a due date one day earlier than the one you set. Due dates now show the same everywhere.' },
    { id: 'payroll', date: 'Mar 10, 2026', month: 'March', tag: 'New', big: 'pay', title: 'Payroll for your first employees', body: 'Pay your team by direct deposit, with pay stubs and payroll taxes worked out and filed for you in all 50 states. Each run lands in Going out on its own.', points: [PAYROLL.price, 'Contractors paid too, with 1099s in January', 'Approvals for payroll on the Team plan'], link: { label: 'Guide: hiring your first employee', href: 'SiteGuide.dc.html#hiring-your-first-employee' } },
    { id: 'every-month', date: 'Feb 3, 2026', month: 'February', tag: 'Improved', title: 'Every-month costs spotted for you', body: 'Rent, software and insurance that repeat are now found automatically and gathered under “Every month”. We also tell you when something looks unused, like “Cloudbox: no files changed in 60 days”.' },
    { id: 'phone-receipts', date: 'Jan 13, 2026', month: 'January', tag: 'New', title: 'Snap receipts from your phone’s lock screen', body: 'Add the BillingEase camera to your lock screen or home screen and photograph a receipt in one tap, before it goes in your pocket.' }
  ];

  window.SITE_CONTENT = {
    authors: AUTHORS,
    guides: guides,
    guideCategories: ['Tax', 'Getting paid', 'Bookkeeping', 'Team', 'Going global'],
    help: help,
    helpTopics: helpTopics,
    changelog: changelog,
    guide: function (slug) { for (var i = 0; i < guides.length; i++) if (guides[i].slug === slug) return guides[i]; return null; }
  };
})();
