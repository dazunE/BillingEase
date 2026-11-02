/*
 * BillingEase marketing site: Guides, Help centre answers and What's new.
 * Read by SiteGuides, SiteGuide, SiteHelp and SiteChangelog. Mirrors
 * apps/web/src/content/site (guides.ts, help.ts, changelog.ts). Prices and
 * links come from site.js (window.SITE) so the copy never disagrees with Pricing.
 * Everything here is general information for a prototype, not tax advice.
 * Rates are illustrative: check with your accountant or tax practitioner.
 */
(function () {
  'use strict';
  var S = window.SITE || { company: { support: 'help@billingease.app' } };

  // ---- block helpers (articles are lists of typed blocks) -----------------
  function P(x, lead) { return { t: 'p', x: x, lead: lead || '' }; }
  function H(x) { return { t: 'h', x: x }; }
  function Q(x, who) { return { t: 'quote', x: x, who: who }; }
  // A rule of thumb (shown as a pull-quote; not a quote from a person).
  function R(x) { return Q(x, 'Rule of thumb'); }
  function C(title, x, tone) { return { t: 'callout', title: title, x: x, tone: tone || 'tip' }; }
  function L(items) { return { t: 'list', items: items }; }
  function T(caption, head, rows) { return { t: 'table', caption: caption, head: head, rows: rows }; }
  function EX(title, rows, total, note) { return { t: 'example', title: title, rows: rows, total: total, note: note }; }

  // No named authors: guides are written by the BillingEase team.
  var AUTHORS = {
    team: { name: 'The BillingEase team', role: 'Guides team', initials: 'BE', bg: '#EEE8FF', bio: 'Written by the people who build BillingEase, and checked against HMRC and IRD guidance on the date shown. General information, not tax advice: check with your accountant or tax practitioner before you rely on a rate.' }
  };

  // ---- covers: small flat illustrations, drawn once as SVG ---------------
  var INK = '#18161F';
  function svg(bg, body) {
    return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="' + bg + '"/>' + body + '</svg>');
  }
  var st = ' stroke="' + INK + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  var F = 'font-family="Arial, Helvetica, sans-serif" font-weight="700"';
  var COVERS = {
    taxinv: svg('#E2F6D5',
      '<rect x="96" y="30" width="170" height="190" rx="8" fill="#FFFFFF"' + st + '/>' +
      '<text x="116" y="62" ' + F + ' font-size="16" fill="' + INK + '">TAX INVOICE</text>' +
      '<path d="M116 84 H240 M116 104 H220" stroke="#E2DFE8" stroke-width="6" stroke-linecap="round"/>' +
      '<rect x="116" y="124" width="130" height="24" rx="6" fill="#EEE8FF"/><text x="126" y="141" ' + F + ' font-size="12" fill="' + INK + '">SSCL 2.5%</text>' +
      '<rect x="116" y="154" width="130" height="24" rx="6" fill="#FDE6D6"/><text x="126" y="171" ' + F + ' font-size="12" fill="' + INK + '">VAT 18%</text>' +
      '<text x="246" y="204" text-anchor="end" ' + F + ' font-size="15" fill="' + INK + '">Rs 302,375</text>' +
      '<circle cx="306" cy="80" r="34" fill="#B9A3FF"' + st + '/><path d="M292 80 l10 10 l18 -20" fill="none"' + st + '/>'),
    cheque: svg('#FFF4E8',
      '<g transform="rotate(-6 200 120)"><rect x="60" y="60" width="280" height="120" rx="8" fill="#FFFFFF"' + st + '/>' +
      '<text x="80" y="92" ' + F + ' font-size="14" fill="' + INK + '">CHEQUE</text>' +
      '<path d="M80 120 H230 M80 146 H200" stroke="#E2DFE8" stroke-width="6" stroke-linecap="round"/>' +
      '<rect x="244" y="108" width="80" height="30" rx="6" fill="#FDE6D6"' + st + '/><text x="284" y="129" text-anchor="middle" ' + F + ' font-size="12" fill="' + INK + '">Rs 48,000</text></g>' +
      '<rect x="270" y="168" width="96" height="52" rx="12" fill="#18161F"/><text x="318" y="200" text-anchor="middle" ' + F + ' font-size="15" fill="#B9A3FF">LankaQR</text>'),
    tax: svg('#EEE8FF',
      '<circle cx="300" cy="60" r="70" fill="#FFFFFF" opacity="0.6"/>' +
      '<path d="M120 62 H200 V76 C200 84 226 90 226 118 V196 C226 214 212 226 194 226 H126 C108 226 94 214 94 196 V118 C94 90 120 84 120 76 Z" fill="#FFFFFF"' + st + '/>' +
      '<rect x="112" y="46" width="96" height="20" rx="6" fill="#B9A3FF"' + st + '/>' +
      '<rect x="104" y="150" width="112" height="66" rx="4" fill="#B6E0AE"' + st + '/>' +
      '<circle cx="160" cy="183" r="15" fill="#D3EDCE" stroke="#4F7F49" stroke-width="2"/>' +
      '<text x="160" y="190" text-anchor="middle" ' + F + ' font-size="20" fill="#2F5711">£</text>' +
      '<rect x="244" y="118" width="96" height="108" rx="10" fill="#18161F"/>' +
      '<path d="M244 138 H340" stroke="#B9A3FF" stroke-width="3"/>' +
      '<text x="292" y="190" text-anchor="middle" ' + F + ' font-size="34" fill="#B9A3FF">20%</text>' +
      '<text x="292" y="211" text-anchor="middle" ' + F + ' font-size="12" fill="#EEE8FF">VAT</text>' +
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
      '<text x="235" y="160" text-anchor="middle" ' + F + ' font-size="20" fill="' + INK + '">TO LET</text>'),
    clock: svg('#EEE8FF',
      '<rect x="54" y="46" width="150" height="170" rx="10" fill="#FFFFFF"' + st + '/>' +
      '<path d="M78 82 H180 M78 110 H180 M78 138 H180 M78 166 H150" stroke="#E2DFE8" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M76 80 l6 6 l10 -12 M76 108 l6 6 l10 -12 M76 136 l6 6 l10 -12" fill="none" stroke="#7A5AF8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="282" cy="132" r="66" fill="#18161F"/>' +
      '<rect x="270" y="52" width="24" height="16" rx="4" fill="#18161F"/>' +
      '<path d="M282 132 L282 132 L282 66 A66 66 0 0 1 339 165 Z" fill="#B9A3FF"/>' +
      '<circle cx="282" cy="132" r="44" fill="#18161F"/>' +
      '<text x="282" y="144" text-anchor="middle" ' + F + ' font-size="34" fill="#FFFFFF">Q2</text>' +
      '<text x="282" y="164" text-anchor="middle" ' + F + ' font-size="11" fill="#EEE8FF">MTD</text>'),
    hire: svg('#FDE6D6',
      '<circle cx="128" cy="96" r="34" fill="#C68B6E"' + st + '/>' +
      '<path d="M96 90 C94 64 112 54 130 54 C150 54 162 66 160 88 C150 76 134 72 118 76 C108 78 100 82 96 90 Z" fill="#2B2233"/>' +
      '<path d="M66 214 C66 160 92 140 128 140 C164 140 190 160 190 214 Z" fill="#7A5AF8"' + st + '/>' +
      '<rect x="112" y="160" width="32" height="40" rx="4" fill="#FFFFFF"' + st + '/>' +
      '<rect x="222" y="58" width="128" height="150" rx="8" fill="#FFFFFF"' + st + '/>' +
      '<text x="240" y="88" ' + F + ' font-size="13" fill="' + INK + '">PAYSLIP</text>' +
      '<path d="M240 108 H330 M240 128 H310 M240 148 H320" stroke="#F4C3A1" stroke-width="6" stroke-linecap="round"/>' +
      '<rect x="240" y="166" width="92" height="26" rx="13" fill="#B6E0AE" stroke="' + INK + '" stroke-width="2"/>' +
      '<text x="286" y="184" text-anchor="middle" ' + F + ' font-size="13" fill="' + INK + '">EPF 8%</text>'),
    globe: svg('#EEE8FF',
      '<circle cx="150" cy="122" r="80" fill="#FFFFFF"' + st + '/>' +
      '<path d="M70 122 H230 M150 42 C110 82 110 162 150 202 M150 42 C190 82 190 162 150 202" fill="none"' + st + '/>' +
      '<path d="M84 82 H216 M84 162 H216" fill="none" stroke="' + INK + '" stroke-width="2"/>' +
      '<circle cx="290" cy="76" r="32" fill="#B9A3FF"' + st + '/><text x="290" y="88" text-anchor="middle" ' + F + ' font-size="32" fill="' + INK + '">Rs</text>' +
      '<circle cx="324" cy="148" r="32" fill="#F4C3A1"' + st + '/><text x="324" y="160" text-anchor="middle" ' + F + ' font-size="32" fill="' + INK + '">£</text>' +
      '<circle cx="262" cy="196" r="28" fill="#B6E0AE"' + st + '/><text x="262" y="207" text-anchor="middle" ' + F + ' font-size="28" fill="' + INK + '">✓</text>'),
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


  var COVER_BG = { tax: '#EEE8FF', papers: '#FDE6D6', late: '#FFF4E8', maker: '#E2F6D5', clock: '#EEE8FF', hire: '#FDE6D6', globe: '#EEE8FF', sheet: '#E2F6D5', taxinv: '#E2F6D5', cheque: '#FFF4E8' };
  var WRITTEN = '14 Oct 2026';

  // ---- the guides (guides.ts) ----------------------------------------------
  var guides = [
    {
      slug: 'getting-ready-for-mtd-for-income-tax', country: 'uk', cover: 'clock', category: 'Making Tax Digital', author: 'team', date: WRITTEN, featured: true,
      title: 'Getting ready for Making Tax Digital for Income Tax',
      dek: 'Who has to join and when, what a quarterly update is, and the habits that make each quarter a ten-minute job instead of a weekend.',
      summary: ['If your self-employment and property income together are over £50,000, MTD starts in April 2026; over £30,000 in April 2027; over £20,000 in April 2028.', 'You keep digital records and send a short update to HMRC every quarter, then a final declaration after the tax year.', 'Your accountant can send the updates for you from the records you keep.'],
      app: { label: 'See how quarters work', href: 'SiteKeep.dc.html', line: 'Your records go into HMRC’s categories as you enter them, so each quarter is ready for your accountant to send.' },
      blocks: [
        P('Making Tax Digital for Income Tax (MTD) changes how sole traders and landlords report to HMRC. Instead of one Self Assessment return a year built from a year of paperwork, you keep your records digitally and send a summary every three months. It sounds like four times the work. Done steadily, it’s less: the year-end rush disappears because the year was never left to pile up.'),
        H('Who has to join, and when'),
        P('It depends on your qualifying income: your gross income from self-employment and from property, added together, before expenses. HMRC looks at the tax return from two years earlier to decide.'),
        T('When MTD for Income Tax starts', ['Qualifying income', 'MTD starts', 'Based on your return for'], [['Over £50,000', '6 April 2026', '2024 to 2025'], ['Over £30,000', '6 April 2027', '2025 to 2026'], ['Over £20,000', '6 April 2028', '2026 to 2027']]),
        P('Gross means turnover, not profit. A designer who invoices £34,000 a year and lets a flat for £9,600 has qualifying income of £43,600, even if the profit is far lower, so they join in April 2027.', 'Turnover, not profit.'),
        H('What you do each quarter'),
        P('You keep a digital record of every sale and every cost, in HMRC’s categories. Every quarter, totals for each category go to HMRC through MTD-compatible software. The standard quarters follow the tax year:'),
        T('Standard quarters and update deadlines', ['Quarter', 'Covers', 'Update due by'], [['1', '6 April to 5 July', '7 August'], ['2', '6 July to 5 October', '7 November'], ['3', '6 October to 5 January', '7 February'], ['4', '6 January to 5 April', '7 May']]),
        P('You can choose calendar quarters instead (1 April to 30 June, and so on), which many people find easier to remember. Ask your accountant which you use.'),
        P('After the year ends you, or your accountant, send a final declaration by 31 January. That’s where allowances, other income and adjustments go in, and where your tax bill is worked out. The quarterly updates themselves don’t create a bill.'),
        R('A quarterly update is a summary of records you already keep. If the records are there, the update takes minutes.'),
        H('Habits that make it easy'),
        L(['Record income and costs as they happen, or at least once a week. A week of receipts is ten minutes; a quarter of them is an afternoon.', 'Keep business and personal spending apart, ideally in a separate bank account.', 'Attach a photo or PDF of each receipt or bill to the record, so you and your accountant can check it later.', 'Split costs you use partly for yourself, like a phone or a car, by the share that’s for business.', 'If you’re a landlord too, keep each property’s rent and costs apart from your trade.']),
        C('Working with an accountant', 'Most people joining MTD will have their accountant send the quarterly updates and the final declaration. Your part is the records. Agree a date each quarter when the books should be up to date, a week or two before the deadline.', 'tip'),
        H('What to do this month'),
        P('Add up last tax year’s turnover and property income to see which wave you’re in. Then pick the day of the month you’ll keep your books up to date, and put it in your calendar. If your first quarter starts next April, a few months of practice before then makes it routine.')
      ]
    },
    {
      slug: 'allowable-expenses-for-sole-traders', country: 'uk', cover: 'sheet', category: 'Tax', author: 'team', date: WRITTEN,
      title: 'Allowable expenses for sole traders',
      dek: 'What you can take off your profit, what you can’t, and how to handle the things you use for both work and home.',
      summary: ['A cost is allowable when it’s wholly and exclusively for your business.', 'Costs used partly for yourself are split by the business share.', 'Flat rates for mileage and working from home save you adding up the real costs.'],
      app: { label: 'See how expenses work', href: 'SiteGoingOut.dc.html', line: 'Each expense goes into HMRC’s category as you enter it, with the business share and a photo or PDF attached.' },
      blocks: [
        P('You pay tax on profit: what came in, minus allowable expenses. Every allowable cost you record is profit you don’t pay tax on. Every personal cost you record by mistake is a question from HMRC waiting to happen. Here’s how to tell them apart.'),
        H('The test: wholly and exclusively'),
        P('A cost is allowable when you spent it only to run your business. Software you use for client work, materials for a job, your accountant’s fee: allowable. Your lunch on a normal working day, your everyday clothes, a parking fine: not allowable, even though you were working at the time.'),
        T('Common costs and HMRC’s categories', ['Cost', 'Usually', 'HMRC category'], [['Materials and stock you sell', 'Allowable', 'Cost of goods'], ['Phone, broadband, software, stationery', 'Allowable (business share)', 'Office costs'], ['Train fares and hotels for work trips', 'Allowable', 'Car, van and travel'], ['Advertising and your website', 'Allowable', 'Advertising'], ['Accountant’s fees', 'Allowable', 'Professional fees'], ['Bank charges on a business account', 'Allowable', 'Bank and finance charges'], ['Entertaining clients', 'Not allowable', 'Business entertainment'], ['Everyday clothes, commuting, fines', 'Not allowable', 'Not a business expense']]),
        H('Things you use for both'),
        P('A phone you use for work and home, a car, a room in your house: you can claim the business share. Pick a fair way to measure it (calls, miles, hours) and use it consistently. If 60% of your phone bill is work, record the whole bill and mark 60% as business.'),
        EX('A month of mixed costs', [['Phone contract, £36, 60% business', '£21.60'], ['Broadband, £30, 40% business', '£12.00'], ['Design software subscription', '£24.00'], ['Working from home, 60 hours this month (flat rate)', '£18.00']], ['Allowable this month', '£75.60'], 'Example figures. The business shares are your own judgement; keep a note of how you arrived at them.'),
        H('Flat rates instead of real costs'),
        P('For some costs you can use HMRC’s simplified expenses: a flat rate instead of working out the real figure.'),
        T('Simplified expenses', ['What', 'Flat rate'], [['Business miles in your own car or van', '45p a mile for the first 10,000 miles in the tax year, 25p after'], ['Working from home, 25 to 50 hours a month', '£10 a month'], ['Working from home, 51 to 100 hours a month', '£18 a month'], ['Working from home, 101 hours or more a month', '£26 a month']]),
        P('If you use mileage rates for a vehicle, you can’t also claim its fuel, insurance or repairs. Once you choose a method for a vehicle, you keep it for as long as you use that vehicle in the business.', 'One method per vehicle.'),
        H('The £1,000 trading allowance'),
        P('If your costs are very small, you can take £1,000 off your income instead of claiming actual expenses. It suits small side earnings. If your real allowable costs are more than £1,000, claim them instead.'),
        C('Keep the proof', 'Keep receipts, bills and invoices for at least five years after the 31 January deadline for that tax year. A photo or a PDF is fine, as long as you can read it.', 'note'),
        R('If you’d have bought it anyway, it probably isn’t a business expense. If you bought it only because of the work, it probably is.')
      ]
    },
    {
      slug: 'keeping-records-as-a-landlord', country: 'uk', cover: 'maker', category: 'Landlords', author: 'team', date: WRITTEN,
      title: 'Keeping records as a landlord',
      dek: 'Rent, costs and mortgage interest for each property, kept so your accountant can file without a single follow-up question.',
      summary: ['Keep each property’s rent and costs apart, and record your share if you own it jointly.', 'Mortgage interest isn’t an expense: it gives a 20% tax reduction instead, so keep it separate.', 'Property income counts towards the Making Tax Digital thresholds.'],
      app: { label: 'BillingEase for landlords', href: 'SiteTeams.dc.html', line: 'Properties with your share, rent and costs per property, and mortgage interest kept apart from the rest.' },
      blocks: [
        P('Letting a flat or a house is a business in HMRC’s eyes, with its own section of your tax return and, from 2026 onwards, its own quarterly updates under Making Tax Digital. The good news: a landlord’s books are simpler than most. A few records, kept the same way every month, do the job.'),
        H('One set of records per property'),
        L(['Rent received, with the date and the tenant.', 'Costs: letting agent fees, repairs, insurance, ground rent and service charges, safety certificates, cleaning between tenants.', 'Mortgage or loan interest, kept on its own.', 'Your share, if you own the property with someone else. You record your share of the rent and costs.']),
        P('Furnished holiday lettings used to have their own rules. They were abolished from April 2025, so those properties are now treated like any other let.', 'Holiday lets.'),
        H('Repairs or improvements?'),
        P('Repairing something back to how it was is an allowable cost: fixing a leaking roof, replacing a broken boiler with a similar one, repainting between tenants. Improving the property, like an extension or a loft conversion, isn’t; it’s a capital cost that may reduce tax when you sell. Replacing furniture, appliances and furnishings in a let home is usually allowable as replacement of domestic items.'),
        H('Mortgage interest works differently'),
        P('For residential lets you can’t deduct mortgage interest from your rent. Instead you get a tax reduction of 20% of the interest. That’s why it needs to be kept apart: it goes into a different box, and your accountant needs the full figure.'),
        EX('One flat in Leeds, a year', [['Rent received, 12 × £800', '£9,600'], ['Letting agent, insurance, repairs', '−£1,840'], ['Profit before mortgage interest', '£7,760'], ['Mortgage interest paid (kept apart)', '£3,000']], ['Tax reduction for the interest (20%)', '£600'], 'Illustrative figures. Income tax is charged on the £7,760 at your own rate, then £600 comes off the bill.'),
        H('The £1,000 property allowance'),
        P('If your property income is small, you can take £1,000 off it instead of claiming actual costs. You can’t use it together with the mortgage interest reduction, so it rarely suits a mortgaged let, but it can suit renting out a driveway or a room occasionally.'),
        C('Making Tax Digital', 'Your gross rent counts towards the MTD thresholds together with any self-employment income. If the two together are over £50,000 you join in April 2026; over £30,000 in April 2027; over £20,000 in April 2028.', 'note'),
        R('Same day, same way: record the rent when it lands and the cost when you pay it, and the quarter takes care of itself.')
      ]
    },
    {
      slug: 'vat-registration-in-the-uk', country: 'uk', cover: 'tax', category: 'VAT and SSCL', author: 'team', date: WRITTEN,
      title: 'VAT registration: when you have to, and when you might want to',
      dek: 'How the £90,000 threshold works, what changes on your invoices once you register, and why some people register early.',
      summary: ['You must register when your VAT-taxable turnover in the last 12 months goes over £90,000, or will in the next 30 days.', 'Once registered, you charge VAT on your sales, show it on your invoices and send a VAT return every quarter.', 'You can register voluntarily below the threshold, which suits businesses whose customers are mostly VAT registered.'],
      app: { label: 'See how invoices work', href: 'SiteComingIn.dc.html', line: 'Say you’re VAT registered and add your VAT number, and every invoice becomes a VAT invoice with the rate on each line.' },
      blocks: [
        P('VAT is the tax most small businesses meet first and understand last. The rules are mostly about one number, a threshold, and what happens to your invoices when you cross it.'),
        H('The threshold is a rolling 12 months'),
        P('Add up your VAT-taxable turnover (sales that aren’t exempt) for the last 12 months, at the end of every month. Not the tax year, not the calendar year: the last 12 months. If it goes over £90,000, you must register within 30 days of the end of that month. You must also register straight away if you expect to go over £90,000 in the next 30 days alone.'),
        T('VAT in the UK', ['What', 'Figure'], [['Registration threshold', '£90,000 in any rolling 12 months'], ['Deregistration threshold', '£88,000'], ['Standard rate', '20%'], ['Reduced rate (for example home energy)', '5%'], ['Zero rate (for example most food, books)', '0%']]),
        H('What changes once you’re registered'),
        L(['You add VAT to your prices for VAT-able sales, and pay it to HMRC.', 'You can reclaim the VAT on most of your business costs.', 'Your invoices must be VAT invoices: your VAT number, the date of supply, the rate and amount of VAT on each line, and the totals with and without VAT.', 'You send a VAT return, usually every quarter, through Making Tax Digital for VAT software. Your accountant usually does this.']),
        EX('A VAT invoice from a design studio', [['Brand guidelines, 1 × £1,800', '£1,800.00'], ['Website design, 1 × £1,200', '£1,200.00'], ['VAT at 20%', '£600.00']], ['Total due', '£3,600.00'], 'The £600 isn’t income. It goes to HMRC, less the VAT you paid on your own costs.'),
        H('Registering before you have to'),
        P('If most of your customers are VAT-registered businesses, registering early can make sense: they reclaim the VAT you charge, so it costs them nothing, and you reclaim VAT on your own costs. If most of your customers are the public, registering early usually means raising prices or earning less.'),
        C('VAT stays out of your three numbers', 'VAT you collect isn’t yours, so BillingEase leaves it out of Coming in, Going out and Yours to keep. You see the VAT separately, for your accountant’s return.', 'note'),
        R('Watch the rolling 12 months, not the tax year. The threshold doesn’t wait for April.')
      ]
    },
    {
      slug: 'writing-a-sri-lankan-tax-invoice', country: 'lk', cover: 'taxinv', category: 'VAT and SSCL', author: 'team', date: WRITTEN, featured: true,
      title: 'Writing a Sri Lankan Tax Invoice with VAT and SSCL',
      dek: 'What has to be on a Tax Invoice, how VAT at 18% and SSCL at 2.5% sit on it, and the mistakes that cause trouble at return time.',
      summary: ['VAT-registered businesses issue invoices titled “Tax Invoice”, with both parties’ details and VAT shown separately.', 'VAT is 18% for most supplies. SSCL at 2.5% is a separate levy and goes on its own line.', 'Keep invoice numbers in one unbroken series, and never edit an issued Tax Invoice: issue a credit note.'],
      app: { label: 'See how Tax Invoices work', href: 'SiteComingIn.dc.html', line: 'Add your TIN and VAT number once. Every invoice is then a Tax Invoice, with VAT and SSCL on their own lines.' },
      blocks: [
        P('If your business is registered for VAT in Sri Lanka, the invoices you issue are more than a request for payment: they’re the document your customer uses to claim back the VAT, and the one the Inland Revenue Department (IRD) checks against your return. Getting the format right once saves a lot of correcting later.'),
        H('What goes on a Tax Invoice'),
        L(['The words “Tax Invoice” at the top.', 'Your business name, address, TIN and VAT registration number.', 'Your customer’s name and address, and their VAT number if they’re registered.', 'The date of the invoice and the date of supply, and a serial number from one unbroken series.', 'A description of what you supplied, with quantity and value.', 'The VAT rate and the VAT amount, shown separately, and the total including VAT.']),
        P('The IRD revised the required Tax Invoice format from 1 July 2026, ahead of e-invoicing through RAMIS. Check the current field list with your tax practitioner or on ird.gov.lk before you design your own template.', 'A revised format.'),
        H('VAT and SSCL'),
        P('VAT is charged at 18% on most supplies, with some zero-rated and exempt. The Social Security Contribution Levy (SSCL) is a separate levy of 2.5% on turnover. Unlike VAT, there’s no credit for SSCL you pay on your own costs, so it needs its own line and its own summary.'),
        EX('A Tax Invoice from a design studio in Colombo', [['Design services', 'Rs 250,000.00'], ['SSCL 2.5%', 'Rs 6,250.00'], ['VAT 18% (on Rs 256,250)', 'Rs 46,125.00']], ['Total', 'Rs 302,375.00'], 'Layout only. Whether SSCL sits inside the VAT base like this is one of the details to confirm with your practitioner or the IRD before you rely on it.'),
        H('When you have to register'),
        P('You must register for VAT once your taxable supplies pass the registration threshold. Published figures for the current threshold differ, so confirm the figure that applies to you with your tax practitioner or the IRD. Below the threshold you issue ordinary invoices, without VAT.'),
        H('Mistakes that cause trouble'),
        L(['Gaps or repeats in invoice numbers. Use one series and never reuse a number, even for a cancelled invoice.', 'Editing an invoice after it’s issued. Issue a credit note for the difference instead, and a new invoice if needed.', 'Counting VAT and SSCL as income. They pass through your account on their way to the IRD.', 'Missing your customer’s VAT number when they’re registered. Without it they may not be able to claim the VAT back.']),
        C('Your three numbers leave them out', 'BillingEase keeps VAT and SSCL out of Coming in, Going out and Yours to keep, and shows them in their own summary for each period, ready for your return.', 'note'),
        R('A Tax Invoice is a tax document first and a bill second. Number it, date it, and don’t change it once it’s out.')
      ]
    },
    {
      slug: 'epf-etf-and-apit-basics', country: 'lk', cover: 'hire', category: 'Payroll', author: 'team', date: WRITTEN,
      title: 'EPF, ETF and APIT: payroll basics for your first employee',
      dek: 'What you take from each salary, what you add on top, and what goes where every month once someone is on your payroll.',
      summary: ['EPF: 8% from the employee and 12% from you. ETF: 3% from you. Both on EPF-liable earnings.', 'APIT is income tax taken from salaries using the IRD’s tables, and paid to the IRD monthly.', 'Each month: pay salaries, pay EPF and ETF, pay APIT, and keep the schedules.'],
      app: { label: 'See payroll in BillingEase', href: 'SiteGoingOut.dc.html', line: 'Payslips with EPF, ETF and APIT worked out, and the monthly schedules to pay and file yourself.' },
      blocks: [
        P('Hiring your first employee in Sri Lanka brings three new names into your books: EPF, ETF and APIT. Each is a percentage or a table, each has its own monthly payment, and each needs a record. Here’s what they are, in the order you’ll meet them.'),
        H('EPF: the Employees’ Provident Fund'),
        P('EPF is a retirement fund. Each month the employee contributes 8% of their EPF-liable earnings, taken from their pay, and you add 12% on top. Both go to the EPF, administered through the Central Bank of Sri Lanka. EPF-liable earnings are usually basic salary plus regular allowances; ask your practitioner which allowances count for your staff.'),
        H('ETF: the Employees’ Trust Fund'),
        P('ETF is paid by you alone: 3% of the same earnings. Nothing comes out of the employee’s pay for it.'),
        H('APIT: tax on salaries'),
        P('APIT (Advance Personal Income Tax) is income tax you deduct from salaries and pay to the IRD. The amount comes from the IRD’s tax tables, based on monthly pay. Since 1 April 2025, the first Rs 1.8 million a year (Rs 150,000 a month) is covered by the personal relief, so lower salaries have no APIT to deduct.'),
        EX('One monthly salary of Rs 200,000', [['Gross salary', 'Rs 200,000'], ['EPF, employee 8% (from pay)', '− Rs 16,000'], ['APIT (from the IRD tables)', '− from the tables'], ['EPF, employer 12% (on top)', 'Rs 24,000'], ['ETF, employer 3% (on top)', 'Rs 6,000']], ['Cost to you before APIT', 'Rs 230,000'], 'Layout only: the APIT figure depends on the current tables, and the contribution base on which allowances are EPF-liable.'),
        H('What happens every month'),
        T('A month of payroll', ['What', 'Who pays', 'When'], [['Net salaries', 'You, to each employee', 'Payday'], ['EPF (8% + 12%) with the contribution schedule', 'You', 'By the end of the following month'], ['ETF (3%) with its schedule', 'You', 'By the end of the following month'], ['APIT deducted', 'You, to the IRD', 'By the 15th of the following month']]),
        P('Late EPF and ETF payments attract surcharges, so set a reminder a few days before each date. Confirm the current deadlines and filing channels with your practitioner; they change from time to time.', 'Deadlines matter.'),
        H('At the end of the year'),
        P('You give each employee a certificate of the APIT deducted, and the totals go into your own return and to your practitioner. Keep payslips and schedules for at least five years.'),
        C('What BillingEase does, and doesn’t', 'BillingEase works out EPF, ETF and APIT, makes payslips and the monthly schedules, and posts the costs to your books. You pay and file through the EPF, ETF and IRD channels yourself.', 'note'),
        R('Two percentages and a table, every month, on time. Payroll is mostly about the calendar.')
      ]
    },
    {
      slug: 'cheques-lankaqr-and-getting-paid', country: 'lk', cover: 'cheque', category: 'Getting paid', author: 'team', date: WRITTEN,
      title: 'Cheques, LankaQR and bank transfers: recording how you get paid',
      dek: 'How to record each kind of payment so your books match your bank, including post-dated and returned cheques.',
      summary: ['Record every payment against its invoice on the day you receive it, with how it was paid.', 'For a cheque, note the number, the bank and the date written on it, and check it clears.', 'A returned cheque means the invoice is unpaid again: reverse the payment, don’t delete it.'],
      app: { label: 'See how payments work', href: 'SiteComingIn.dc.html', line: 'Record a payment on any invoice by bank transfer, cheque, cash or LankaQR, with the cheque number and bank kept on it.' },
      blocks: [
        P('In Sri Lanka a single month of payments can include a bank transfer, a stack of cheques, cash at the counter and a LankaQR scan. Each lands in your bank differently. Recording them the same way every time is what keeps your books and your bank statement in agreement.'),
        H('Bank transfers'),
        P('The simplest. Record the payment against the invoice on the date it reaches your account, and add the reference your customer used. Put your bank details on every invoice, so customers don’t have to ask.'),
        H('Cheques'),
        L(['Record the cheque number, the bank and branch, and the date written on the cheque.', 'Record the payment on the day you receive it, then check it clears a few days after you deposit it.', 'A post-dated cheque can’t be banked before its date. Keep the invoice open until then, with a note of the cheque.', 'Banks generally won’t accept a cheque that’s more than six months old, so bank cheques promptly.']),
        P('If a cheque is returned unpaid, reverse the payment rather than deleting it. The invoice is owed again, and the history shows what happened. Bank charges for the returned cheque are a cost of yours.', 'When a cheque bounces.'),
        H('LankaQR'),
        P('LankaQR is the Central Bank of Sri Lanka’s national QR standard: a customer scans your code in their banking or payment app, and the money comes to your account. Record it as a LankaQR payment with the date and the reference from your bank’s notification, the same as a transfer.'),
        H('Cash'),
        P('Give a receipt for every cash payment, record it the same day, and bank cash regularly. Cash that isn’t recorded is the hardest thing to explain to a tax practitioner later.'),
        T('Recording each kind of payment', ['How they paid', 'Record', 'Check'], [['Bank transfer', 'Date it arrived, reference', 'Matches your statement'], ['Cheque', 'Number, bank, date on the cheque', 'Cleared after deposit'], ['LankaQR', 'Date, reference', 'Matches your statement'], ['Cash', 'Date, your receipt number', 'Banked, or counted at month end']]),
        C('Send a reminder on WhatsApp', 'In BillingEase, a reminder for an unpaid invoice can go by email or open WhatsApp with the message ready, which is often how customers reply fastest.', 'tip'),
        R('Record the payment the day it happens, with how it was paid. The bank statement then becomes a check, not a puzzle.')
      ]
    },
    {
      slug: 'working-with-your-accountant', country: 'both', cover: 'globe', category: 'Working together', author: 'team', date: WRITTEN, featured: true,
      title: 'Working with your accountant or tax practitioner',
      dek: 'What they need from you, when they need it, and how to keep the books so their questions are few and their bill is smaller.',
      summary: ['Your job is the records: every sale and cost, in the right category, with the receipt attached.', 'Their job is the filing and the judgement calls. Ask before you guess.', 'Agree a date each month or quarter when your books are up to date, and keep to it.'],
      app: { label: 'BillingEase for accountants', href: 'SitePartners.dc.html', line: 'Your accountant sees the same books you do, so there’s nothing to send back and forth.' },
      blocks: [
        P('Most small businesses split the work: you keep the books, and an accountant or tax practitioner files the returns and handles the tricky parts. It works best when both sides know exactly where one job ends and the other begins.'),
        H('What they need from you'),
        L(['Every sale: invoices you issued, and payments you received.', 'Every cost, in the right category, with a photo or PDF of the receipt or bill.', 'Notes on anything unusual: a large purchase, a cost that’s partly personal, money you put in or took out.', 'Answers to their questions, before the deadline rather than on it.']),
        H('In the UK'),
        P('If you’re joining Making Tax Digital, your accountant will usually send the quarterly updates and the final declaration from your records. Agree a date each quarter, a week or two before the update deadline, when your books will be complete for that quarter. If you’re VAT registered they usually file your VAT return too.'),
        P('The accountant files; you keep the records. BillingEase doesn’t file to HMRC itself.', 'Who files what.'),
        H('In Sri Lanka'),
        P('Your tax practitioner usually prepares your income tax return, and, if you’re registered, your VAT and SSCL returns. If you run payroll they may also check your EPF, ETF and APIT schedules. Agree a date each month when the month’s books are done, especially if you file VAT monthly.'),
        P('At the end of the year of assessment, your books are handed to TaxWise.lk for the return, by you or by your practitioner. Neither BillingEase nor TaxWise.lk files to the IRD on your behalf.', 'The year-end hand-off.'),
        H('A monthly routine'),
        T('Twenty minutes, once a month', ['Step', 'What you do'], [['1. Sales', 'Check every invoice for the month is in, and record payments you’ve received.'], ['2. Costs', 'Enter expenses and bills you haven’t yet, and attach the receipts.'], ['3. Check', 'Compare your bank statement’s closing balance with your books, and find any difference.'], ['4. Chase', 'Send reminders for anything overdue.'], ['5. Look', 'Read your three numbers. Did anything surprise you?']]),
        R('Ask before you guess. A two-line question now is cheaper than an amended return later.'),
        H('Fixing mistakes'),
        P('If you find a mistake in a period your accountant has already filed, tell them rather than changing it quietly. In BillingEase, filed periods are locked and corrections are recorded as a new entry that reverses the old one, so both of you can see what changed and when.'),
        C('They see what you see', 'When your accountant works with you in BillingEase, they look at the same books, with the receipts attached. No exports, no spreadsheets by email.', 'tip')
      ]
    },
    {
      slug: 'invoice-quote-or-credit-note', country: 'both', cover: 'papers', category: 'Getting paid', author: 'team', date: WRITTEN,
      title: 'Invoice, quote or credit note?',
      dek: 'Three documents, three different jobs. Use the right one at the right moment and customers pay faster, with fewer questions.',
      summary: ['A quote is a price agreed before the work. Nothing is owed yet.', 'An invoice asks for money: what, how much and by when.', 'A credit note takes some or all of an invoice back. You never edit an invoice once it’s sent.'],
      app: { label: 'See quotes and invoices', href: 'SiteComingIn.dc.html', line: 'Write a quote, mark it accepted, and turn it into the invoice without typing it again.' },
      blocks: [
        P('They look alike: your name at the top, a list of things, a number at the bottom. But each tells your customer, and the tax office, something different about where you are in the job.'),
        H('A quote: “here’s what it would cost”'),
        P('A quote comes before any work. It tells the customer what you’ll do and what it will cost, so they can say yes. Nothing is owed yet, and it isn’t income. A good quote has a clear description, a price for each part, what’s not included, and an expiry date so old prices don’t come back to haunt you.'),
        H('An invoice: “please pay this”'),
        P('An invoice asks for payment for work done or goods delivered. It’s the moment money becomes owed. A useful invoice has a unique number, the date, a due date, what you did, the total, any tax, and how to pay: your bank details, written out.'),
        P('If you’re VAT registered in the UK, your invoices are VAT invoices. If you’re VAT registered in Sri Lanka, they’re Tax Invoices, with VAT and SSCL on their own lines.', 'With tax.'),
        H('A credit note: “we’re taking some of that back”'),
        P('Once an invoice is sent, don’t change it. If you need to reduce what’s owed, because of a mistake, a return or a discount agreed afterwards, issue a credit note for the difference. It has its own number and points to the original invoice, so both sets of books stay in step.'),
        T('Side by side', ['', 'Quote', 'Invoice', 'Credit note'], [['When', 'Before the work', 'After it', 'After an invoice'], ['Is money owed?', 'No', 'Yes', 'Less is owed'], ['Counts as income?', 'No', 'Yes', 'Reduces income'], ['Date that matters', 'Expiry date', 'Due date', 'Date issued']]),
        EX('One job from start to finish, in the UK', [['Quote sent to Kirkstall Brewing Co', '£2,400'], ['Quote accepted, invoice sent', '£2,400'], ['One label design dropped, credit note', '−£300'], ['Payment received by bank transfer', '£2,100']], ['Still owed', '£0'], 'The quote never counted as income. The invoice did, and the credit note took £300 of it back.'),
        EX('The same job in Sri Lanka', [['Quote sent to Ochre Café', 'Rs 180,000'], ['Quote accepted, invoice sent', 'Rs 180,000'], ['One menu design dropped, credit note', '− Rs 30,000'], ['Payment received by cheque', 'Rs 150,000']], ['Still owed', 'Rs 0'], 'Amounts before tax. The quote never counted as income. The invoice did, and the credit note took Rs 30,000 of it back.'),
        R('Quote to agree, invoice to ask, credit note to correct.')
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
  var COUNTRY_LABEL = { uk: 'UK', lk: 'Sri Lanka', both: 'UK and Sri Lanka' };
  guides.forEach(function (g) {
    g.words = words(g);
    g.minutes = Math.max(3, Math.ceil(g.words / 200));
    g.by = AUTHORS[g.author];
    g.countryLabel = COUNTRY_LABEL[g.country] || '';
    g.img = COVERS[g.cover];
    g.coverBg = COVER_BG[g.cover];
    g.bgImg = g.coverBg + ' url("' + g.img + '")';
  });

  // ---- help centre answers (help.ts) -----------------------------------------
  // `a` is the UK answer (or the answer for both). `lk` is the Sri Lanka answer when it differs.
  // `only: 'lk'` answers apply in Sri Lanka only; `only: 'uk'` in the UK only.
  var helpTopics = [
    { id: 'start', name: 'Getting started', line: 'Signing up, setup and your three numbers', icon: 'M5 12h14M13 6l6 6-6 6' },
    { id: 'invoices', name: 'Invoices and getting paid', line: 'Quotes, VAT invoices, Tax Invoices, payments', icon: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M8 13h8M8 17h5' },
    { id: 'expenses', name: 'Expenses and bills', line: 'Costs, attachments, suppliers, every month', icon: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6' },
    { id: 'tax', name: 'Tax and Ask', line: 'Yours to keep, VAT, MTD, SSCL and Ask', icon: 'M19 5 5 19M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M16.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3' },
    { id: 'accountant', name: 'Your accountant', line: 'Shared books, corrections and filing', icon: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.8' },
    { id: 'account', name: 'Account and data', line: 'Signing in, your data, closing', icon: 'M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6zM9 12l2 2 4-4' }
  ];
  var help = [
    { id: 'sign-up', topic: 'start', popular: true, q: 'What do I need to sign up?',
      a: 'An email address, a password and a few minutes. You choose the United Kingdom, then answer a few questions about your business: sole trader, landlord or both, whether you’re VAT registered, how your quarters run, and cash or invoice basis. Not sure of an answer? Pick the closest; you can change it later in Business profile. No card is needed.',
      lk: 'You choose Sri Lanka, then answer a few questions about your business: its type, your TIN, and whether you’re registered for VAT and SSCL.',
      link: { label: 'Create an account', href: 'AuthSignUp.dc.html' }, words: 'register create account start setup free card' },
    { id: 'country-fixed', topic: 'start', q: 'Can I change my country later?', a: 'No. Your country sets the currency, the tax year, the expense categories and the tax rules, so it stays fixed once your business is set up. Each account has one business. If you also have a business in the other country, sign up again with a different email address.', words: 'country uk sri lanka change move second business several' },
    { id: 'three-numbers', topic: 'start', popular: true, q: 'What do the three numbers on Home mean?',
      a: 'Coming in is what you’ve invoiced or been paid, Going out is what you’ve spent, and Yours to keep is what’s left after the tax we estimate you’ll owe (Income Tax and Class 4 National Insurance). VAT is left out of all three, because it isn’t yours. Use the period switch on Home to see this quarter, this tax year or another period.',
      lk: 'Yours to keep is what’s left after the income tax we estimate you’ll owe. VAT and SSCL are left out of all three. The period switch shows this month, this year of assessment or another period.',
      link: { label: 'See Home in the demo', href: 'ThreeHome.dc.html' }, words: 'home coming in going out yours to keep profit numbers dashboard period' },
    { id: 'bring-data', topic: 'start', q: 'Can I bring my customers and invoices over from a spreadsheet or another app?', a: 'Not yet: there’s no import, so you add customers and open invoices by hand. Pick a clean start date (the first day of a month or quarter), add the customers you invoice and any invoices still unpaid, and keep your old records as they are for your accountant.', link: { label: 'How switching works', href: 'SiteSwitch.dc.html' }, words: 'import csv spreadsheet migrate switch move quickbooks xero excel' },
    { id: 'first-invoice', topic: 'invoices', popular: true, q: 'How do I send my first invoice?', a: 'Press New, then New invoice, and pick what kind: time and materials, a fixed price, recurring, or items. Choose or add the customer, add a line for each thing you did, check the dates, and press Save and send. Your customer gets an email with the invoice as a PDF, and the amount shows in Coming in straight away. You can also download the PDF from the invoice page and send it yourself.', link: { label: 'See invoices in the demo', href: 'SellInvoices.dc.html' }, words: 'bill create send invoice new pdf email' },
    { id: 'vat-invoice', topic: 'invoices', only: 'uk', q: 'How do I send VAT invoices?', a: 'Say you’re VAT registered when you set up, or later in Business profile, and add your VAT number. From then on each invoice is a VAT invoice: every line has a VAT rate (20%, 5%, 0% or exempt), and the totals show the VAT separately.', link: { label: 'See Business profile in the demo', href: 'BizProfile.dc.html' }, words: 'vat invoice registered number rate 20%' },
    { id: 'tax-invoice', topic: 'invoices', only: 'lk', popular: true, q: 'How do I issue a Tax Invoice with VAT and SSCL?', a: 'Say you’re registered for VAT (and SSCL) when you set up, or later in Business profile, and add your TIN and VAT registration number. From then on each invoice is titled Tax Invoice, with VAT at 18% and SSCL at 2.5% on their own lines.', link: { label: 'Guide: writing a Sri Lankan Tax Invoice', href: 'SiteGuide.dc.html#writing-a-sri-lankan-tax-invoice' }, words: 'tax invoice vat sscl tin registration 18% 2.5% sri lanka' },
    { id: 'get-paid', topic: 'invoices', popular: true, q: 'How do customers pay me?',
      a: 'However you agree with them: bank transfer, your card machine or cash. Your bank details go on every invoice. When the money arrives, open the invoice and choose Record a payment. BillingEase doesn’t take card payments online.',
      lk: 'Bank transfer, cheque, cash or LankaQR. For a cheque, add its number and bank when you record the payment.',
      link: { label: 'See invoices in the demo', href: 'SellInvoices.dc.html' }, words: 'pay payment record bank transfer cheque cash lankaqr card machine paid' },
    { id: 'part-payment', topic: 'invoices', q: 'A customer paid part of an invoice. What do I do?', a: 'Record the payment for the amount you received. The invoice stays open with the rest still owed, and you can record the next payment when it arrives.', words: 'part partial payment instalment balance owed' },
    { id: 'reminders', topic: 'invoices', q: 'Can I send a reminder for an unpaid invoice?',
      a: 'Yes. Open the invoice and send a reminder by email; it goes with the PDF attached, and you can change the message first. Overdue invoices are listed on Coming in, so you can remind from there too.',
      lk: 'You can also choose WhatsApp, which opens it with the message ready to send.',
      link: { label: 'Guide: cheques, LankaQR and getting paid', href: 'SiteGuide.dc.html#cheques-lankaqr-and-getting-paid' }, words: 'reminder overdue late chase nudge whatsapp email' },
    { id: 'quotes', topic: 'invoices', q: 'How do quotes work?', a: 'Make a quote the same way as an invoice and send it. When your customer says yes, mark it accepted, then turn it into an invoice without typing anything again. A quote isn’t income until it becomes an invoice.', link: { label: 'See quotes in the demo', href: 'SellQuotes.dc.html' }, words: 'quote estimate accept accepted convert invoice' },
    { id: 'repeating', topic: 'invoices', q: 'Can an invoice repeat every month?', a: 'Yes. Set up a repeating invoice with the customer, the lines and how often it runs. By default each run makes a draft for you to check and send; you can choose to have it sent on the day instead.', link: { label: 'See repeating invoices in the demo', href: 'SellRecurring.dc.html' }, words: 'repeat recurring retainer monthly subscription schedule' },
    { id: 'credit-note', topic: 'invoices', q: 'I made a mistake on an invoice I’ve sent. How do I fix it?', a: 'Don’t change a sent invoice. Issue a credit note from it for the amount that’s wrong, then send a new invoice if needed. Your books keep both, so you and your accountant can see what happened.', link: { label: 'Guide: invoice, quote or credit note?', href: 'SiteGuide.dc.html#invoice-quote-or-credit-note' }, words: 'mistake wrong edit credit note refund money back cancel void' },
    { id: 'expense', topic: 'expenses', popular: true, q: 'How do I record an expense?', a: 'Press New, then Record an expense. Add the amount, the date, the supplier and the category (in HMRC’s categories in the UK), and the business share if you use it partly for yourself. Attach a photo or PDF of the receipt and BillingEase keeps the file with the expense. Or press New, then Snap a receipt or bill: BillingEase reads it and drafts the expense for you to check and approve.', link: { label: 'See Going out in the demo', href: 'ThreeOut.dc.html' }, words: 'expense receipt cost spend record photo pdf attach category' },
    { id: 'bills', topic: 'expenses', q: 'What’s the difference between an expense and a bill?', a: 'An expense is something you’ve already paid. A bill is something you owe a supplier and will pay later. Add a bill when it arrives, then mark it paid in full or in part when you pay it; it counts in Going out either way, and Going out shows what’s still to pay.', link: { label: 'See a bill in the demo', href: 'SpendBill.dc.html' }, words: 'bill supplier owe pay later due part paid' },
    { id: 'every-month', topic: 'expenses', q: 'Can BillingEase remember costs I pay every month?', a: 'Yes. Set up rent, software, insurance and anything else that repeats under Every month, with the amount and the day. They’re listed together, so you can see what your month costs before it starts.', link: { label: 'See Every month in the demo', href: 'SpendEveryMonth.dc.html' }, words: 'every month recurring rent subscription regular costs' },
    { id: 'bank-feeds', topic: 'expenses', q: 'Can I connect my bank or card?', a: 'No. BillingEase has no bank or card feeds: you enter sales and costs yourself, which is also what keeps each record checked by a person. Once a month, compare your bank statement’s closing balance with your books to make sure nothing is missing.', words: 'bank feed connect sync card open banking import statement' },
    { id: 'yours-to-keep', topic: 'tax', q: 'How is Yours to keep worked out?',
      a: 'It’s your profit (Coming in minus Going out) less an estimate of the Income Tax and Class 4 National Insurance you’ll owe on it. It’s an estimate from the rates for the tax year, not a tax bill. Your accountant works out the real figure.',
      lk: 'It’s your profit less an estimate of the income tax you’ll owe for the year of assessment. Your tax practitioner works out the real figure.',
      link: { label: 'How Yours to keep works', href: 'SiteKeep.dc.html' }, words: 'yours to keep tax estimate income tax national insurance profit set aside' },
    { id: 'filing', topic: 'tax', popular: true, q: 'Does BillingEase file my tax returns?',
      a: 'No. BillingEase keeps the records in HMRC’s categories, ready for each Making Tax Digital quarter. Your accountant sends the quarterly updates, the final declaration and any VAT return from their own software.',
      lk: 'BillingEase keeps the books and works out your VAT and SSCL for each period. You or your tax practitioner file with the IRD; at the end of the year of assessment, your books go to TaxWise.lk for your income tax return.',
      link: { label: 'Guide: working with your accountant', href: 'SiteGuide.dc.html#working-with-your-accountant' }, words: 'file filing return hmrc ird mtd submit vat return taxwise' },
    { id: 'mtd', topic: 'tax', only: 'uk', q: 'Am I ready for Making Tax Digital for Income Tax?', a: 'If you record your income and costs in BillingEase as they happen, your records are digital and already in HMRC’s categories, which is what MTD asks for. Whether you need to join, and when, depends on your income: the guide explains the dates.', link: { label: 'Guide: getting ready for MTD', href: 'SiteGuide.dc.html#getting-ready-for-mtd-for-income-tax' }, words: 'mtd making tax digital quarterly update ready' },
    { id: 'ask', topic: 'tax', q: 'What is Ask, and can I trust its answers?',
      a: 'Ask answers questions in plain words from your own books and from official sources such as gov.uk and HMRC’s manuals, and lists the sources it used. It’s AI, so it can be wrong, and it never files anything. When a question needs judgement, ask your accountant.',
      lk: 'In Sri Lanka its sources include the IRD’s guidance. When a question needs judgement, ask your tax practitioner.',
      link: { label: 'See Ask in the demo', href: 'Ask.dc.html' }, words: 'ask ai question answer sources chat' },
    { id: 'accountant-see', topic: 'accountant', popular: true, q: 'How does my accountant see my books?',
      a: 'Through the accountant link: your accountant’s practice sees the same books you do, from their TaxWise practice tool. The link is being built now and arrives with the practice tool; until then, your invoices and quotes download as PDFs to share.',
      lk: 'Your tax practitioner sees the same books from the TaxWise.lk practitioner tool, once the practitioner link arrives.',
      link: { label: 'BillingEase for accountants', href: 'SitePartners.dc.html' }, words: 'accountant practitioner invite access share books practice taxwise' },
    { id: 'corrections', topic: 'accountant', q: 'Can I change something from a period that’s already filed?', a: 'Filed periods are locked, so the numbers your accountant sent stay the same. Corrections are never made by quietly changing the past: they’re recorded as a new entry that reverses the old one, so both of you can see what changed and when. Tell your accountant when you need one.', words: 'change edit delete correction locked filed period reverse mistake' },
    { id: 'password', topic: 'account', q: 'I’ve forgotten my password.', a: 'On the sign-in page, choose Forgot your password and enter your email. We’ll send a link to set a new one.', link: { label: 'Reset your password', href: 'AuthRecover.dc.html' }, words: 'password forgot reset sign in login locked out' },
    { id: 'two-step', topic: 'account', q: 'Is there two-step sign-in?', a: 'Not yet. Until it arrives, use a long password you don’t use anywhere else, and sign out on shared computers.', words: '2fa two factor mfa authenticator security sign in' },
    { id: 'export', topic: 'account', popular: true, q: 'Can I export my data?', a: 'Your invoices and quotes download as PDFs from their pages. A full export of your books isn’t available yet. If you need a copy of your data before then, write to us and we’ll help.', words: 'export download backup data csv pdf leave copy' },
    { id: 'data-apart', topic: 'account', q: 'Who can see my books?', a: 'You, and, once the accountant link arrives, the accountant or practitioner you choose. Each business’s data is kept apart from every other business’s. Nobody at BillingEase looks at your books unless you ask us to help with something specific.', link: { label: 'Privacy policy', href: 'SiteLegal.dc.html#privacy' }, words: 'privacy who see data access staff secure' },
    { id: 'close', topic: 'account', q: 'How do I close my account?', a: 'Write to us from the email address you signed up with and we’ll close it. Some records may have to be kept for a period the law sets for tax records; the privacy policy explains what and for how long.', link: { label: 'Privacy policy', href: 'SiteLegal.dc.html#privacy' }, words: 'delete close remove account erase cancel' }
  ];
  help.forEach(function (h) {
    h.lkNote = h.lk ? 'In Sri Lanka: ' + h.lk : '';
    h.countryTag = h.only === 'lk' ? 'Sri Lanka only' : (h.only === 'uk' ? 'UK only' : '');
  });

  // ---- What's new (changelog.ts): real entries only, newest first -------------
  var changelog = [
    { id: 'apps-and-api', date: '31 Oct 2026', month: 'October', tag: 'New', title: 'Connect an AI assistant, or your own software', body: 'Add BillingEase to Claude, ChatGPT, Cursor or another assistant that takes MCP connectors, or call the API with a token you make in settings. They can read your books and suggest expenses, bills, payments and reminders; every suggestion waits in For you to check until you approve it. You see each connected app, every call it made, and can disconnect it any time.' },
    { id: 'capture-agent', date: '18 Oct 2026', month: 'October', tag: 'New', title: 'Snap a receipt or bill: BillingEase reads it for you to check', body: 'Send a photo or PDF of a receipt or a supplier’s bill and BillingEase reads it, checks that the amounts and the VAT (and SSCL in Sri Lanka) add up, and drafts the expense or bill. It waits in For you to check until you approve it, and you can change any detail first. Ask now runs on Google’s Gemini, and you can see what the AI costs your business each month.' },
    { id: 'site-two-countries', date: '14 Oct 2026', month: 'October', tag: 'New', title: 'This website, for the UK and Sri Lanka', body: 'The site now opens in your country, with prices in pounds or rupees and the parts that differ between the two (Making Tax Digital in the UK; Tax Invoices, SSCL and payroll in Sri Lanka).', link: { label: 'What changes with your country', href: 'SiteGlobal.dc.html' } },
    { id: 'repeating-bill-day', date: '11 Oct 2026', month: 'October', tag: 'Fixed', title: 'Repeating invoices keep their bill day', body: 'A monthly invoice due on the 31st now bills on the 28th in February and goes back to the 31st in March, instead of drifting to the 28th for good.' },
    { id: 'numbers-without-vat', date: '11 Oct 2026', month: 'October', tag: 'Improved', title: 'The three numbers leave out VAT and SSCL', body: 'VAT you charge, VAT you pay and SSCL aren’t yours to keep, so Coming in, Going out and Yours to keep now leave them out. They’re shown on their own, for your return.', link: { label: 'Guide: writing a Sri Lankan Tax Invoice', href: 'SiteGuide.dc.html#writing-a-sri-lankan-tax-invoice' } },
    { id: 'coming-in', date: '11 Oct 2026', month: 'October', tag: 'New', big: 'taxInvoice', title: 'Invoices, Tax Invoices and quotes', body: 'The first build of Coming in: invoices with a PDF and an email to your customer, quotes you mark accepted and turn into invoices, repeating invoices, credit notes, customers and a price list. Record payments yourself, and send reminders.', points: ['UK: VAT invoices when you’re VAT registered', 'Sri Lanka: Tax Invoices with VAT 18% and SSCL 2.5% on their own lines', 'Sri Lanka: payments by cheque, with its number and bank, and reminders on WhatsApp'], link: { label: 'More about Coming in', href: 'SiteComingIn.dc.html' } },
    { id: 'going-out', date: '11 Oct 2026', month: 'October', tag: 'New', big: 'goingOut', title: 'Expenses, bills and every-month costs', body: 'The first build of Going out: record an expense with a photo or PDF attached, add bills and mark them paid in full or in part, keep suppliers, and set up the costs you pay every month.', points: ['Categories for your country, HMRC’s in the UK', 'Business-use share for things you use partly yourself', 'What’s still to pay, in one list'], link: { label: 'More about Going out', href: 'SiteGoingOut.dc.html' } },
    { id: 'home-ask', date: '11 Oct 2026', month: 'October', tag: 'New', big: 'home', title: 'Home and Ask', body: 'Home shows your three numbers for the period you choose and what needs you next. Ask answers questions from your own books and official sources, lists the sources, and suggests your accountant when it needs judgement. Search and notifications arrived at the same time.', link: { label: 'More about Yours to keep', href: 'SiteKeep.dc.html' } },
    { id: 'sign-up-country', date: '11 Oct 2026', month: 'October', tag: 'New', big: 'countries', title: 'Sign up by country', body: 'Sign-up starts by choosing the United Kingdom or Sri Lanka. Setup then asks only what applies there, and your country sets the currency, the tax year and the rules from the first screen.', points: ['UK: sole trader, landlord or both; VAT; quarter dates; cash or invoice basis', 'Sri Lanka: business type, TIN, VAT and SSCL registration', 'One business per account, with its data kept apart'], link: { label: 'UK and Sri Lanka', href: 'SiteGlobal.dc.html' } },
    { id: 'spec', date: '11 Oct 2026', month: 'October', tag: 'New', title: 'The plan: one product, two countries', body: 'We wrote down what BillingEase is for: UK sole traders and landlords getting ready for Making Tax Digital, and small businesses in Sri Lanka, with entries you make by hand and an accountant who sees the same books. Bank feeds, card payments, receipt reading and the US are out.' },
    { id: 'prototype', date: '3 Oct 2026', month: 'October', tag: 'New', title: 'The clickable prototype', body: 'Every screen started as a clickable design, built around three numbers: Coming in, Going out and Yours to keep. In October it was redrawn for the UK and Sri Lanka, with country packs, two sample businesses, Sri Lankan payroll and UK payroll records.' }
  ];

  window.SITE_CONTENT = {
    authors: AUTHORS,
    guides: guides,
    guideCategories: ['Making Tax Digital', 'Tax', 'Landlords', 'VAT and SSCL', 'Payroll', 'Getting paid', 'Working together'],
    help: help,
    helpTopics: helpTopics,
    changelog: changelog,
    guide: function (slug) { for (var i = 0; i < guides.length; i++) if (guides[i].slug === slug) return guides[i]; return null; }
  };
})();
