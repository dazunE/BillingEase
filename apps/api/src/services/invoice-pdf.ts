import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { currencyDigits, describeRate, formatDate, formatMoney, parseRate, rulesFor, type CountryCode, type Currency } from "@billingease/core";
import type { Exec } from "@billingease/db";
import { businesses, customers, invoiceLines, invoices, outboxEmails, quoteLines, quotes, receipts } from "@billingease/db/schema";
import fontkit from "@pdf-lib/fontkit";
import { and, asc, eq, isNull } from "drizzle-orm";
import { PDFDocument, PDFName, PDFString, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Attachment } from "./email";
import { snapshotFor } from "./invoice-core";

/**
 * Invoices, credit notes and quotes as PDFs (A4). Three layouts from one renderer:
 * - UK "Invoice" (not VAT registered): description, quantity, price, amount.
 * - UK "VAT invoice": the seller's VAT number, VAT rate and VAT per line, and a VAT summary by rate.
 * - Sri Lanka "Tax Invoice": seller and buyer TIN and VAT registration numbers, invoice date and
 *   date of delivery, value of supply, SSCL as its own line, VAT, total and mode of payment.
 */

export type DocLine = { description: string; quantityMilli: number; unitPrice: number; discount: number; vatRateId: string | null; vatBps: number; net: number; vat: number; sscl: number };
export type Party = { name: string; legalName?: string | null; address?: string | null; taxId?: string | null; vatNumber?: string | null; email?: string | null; phone?: string | null };

export type DocData = {
  kind: "invoice" | "credit_note" | "quote";
  country: CountryCode;
  /** The document's currency; amounts are in it. */
  currency: string;
  /**
   * For a document in another currency: the same totals in the business's home currency and the
   * rate used, printed under the totals (UK VAT invoices must show the VAT in sterling).
   */
  home?: { currency: Currency; rateLabel: string; net: number; vat: number; sscl: number; total: number; indicative?: boolean } | null;
  title: string;
  number: string | null;
  status: string;
  seller: Party;
  buyer: Party;
  dates: [string, string][];
  vatRegistered: boolean;
  lines: DocLine[];
  net: number; vat: number; sscl: number; total: number; paid: number; credited: number;
  paymentDetails?: string | null;
  note?: string | null;
  notes?: string | null;
  modeOfPayment?: string | null;
  accent?: string;
};

// Brand colours (see apps/web globals.css)
const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const INK = hex("#18161f");
const INK2 = hex("#47444f");
const MUTED = hex("#5f5b68");
const LINE = hex("#e2dfe8");
const DIVIDER = hex("#efedf2");
const VIOLET = hex("#b9a3ff");
const ORANGE = hex("#e0752d");
const TINT = hex("#eee8ff");
const SURFACE = hex("#efedf3");
const POS = hex("#2f5711");
const POS_BG = hex("#e2f6d5");

const roundRect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;

/** The BillingEase mark ("The Equation"). (x, y) is the top-left corner. */
function drawMark(page: PDFPage, x: number, y: number, size: number) {
  const k = size / 48;
  page.drawSvgPath(roundRect(0, 0, 48, 48, 13), { x, y, scale: k, color: INK });
  page.drawSvgPath(roundRect(9, 11, 30, 7, 3.5), { x, y, scale: k, color: VIOLET });
  page.drawSvgPath(roundRect(22, 20.5, 17, 7, 3.5), { x, y, scale: k, color: ORANGE });
  page.drawSvgPath(roundRect(9, 30, 13, 7, 3.5), { x, y, scale: k, color: rgb(1, 1, 1) });
}

const require = createRequire(import.meta.url);
function fontFile(pkg: string, file: string) {
  // The packages only export CSS, so find the package folder from its LICENSE.
  return path.join(path.dirname(require.resolve(`${pkg}/LICENSE`)), "files", file);
}
const FONT_FILES = {
  regular: ["@fontsource/dm-sans", "dm-sans-latin-400-normal.woff"],
  bold: ["@fontsource/dm-sans", "dm-sans-latin-700-normal.woff"],
  display: ["@fontsource/sora", "sora-latin-700-normal.woff"],
  regularExt: ["@fontsource/dm-sans", "dm-sans-latin-ext-400-normal.woff"],
  boldExt: ["@fontsource/dm-sans", "dm-sans-latin-ext-700-normal.woff"],
} as const;

let fontBytes: Promise<Record<keyof typeof FONT_FILES, Uint8Array>> | null = null;
function loadFonts() {
  fontBytes ??= Promise.all(
    Object.entries(FONT_FILES).map(async ([k, [pkg, f]]) => [k, new Uint8Array(await readFile(fontFile(pkg, f)))] as const),
  ).then((e) => Object.fromEntries(e) as Record<keyof typeof FONT_FILES, Uint8Array>);
  return fontBytes.catch((err) => {
    fontBytes = null;
    throw err;
  });
}

/** A font plus a fallback for accented letters outside basic Latin. */
type Face = { main: PDFFont; ext: PDFFont | null; mainSet: Set<number>; extSet: Set<number> };
function face(main: PDFFont, ext: PDFFont | null): Face {
  return { main, ext, mainSet: new Set(main.getCharacterSet()), extSet: new Set(ext?.getCharacterSet() ?? []) };
}

const SUBSTITUTE: Record<string, string> = { "−": "-", "–": "-", "—": "-", "’": "'", "‘": "'", "“": '"', "”": '"', "…": "...", "→": "->", "×": "x" };

/** Splits text into runs drawable by one font. Characters neither font has are replaced. */
function runs(f: Face, text: string) {
  const out: { font: PDFFont; text: string }[] = [];
  for (const raw of text) {
    let ch = raw;
    let cp = ch.codePointAt(0)!;
    let font = f.main;
    if (!f.mainSet.has(cp) && !(f.ext && f.extSet.has(cp)) && SUBSTITUTE[ch]) {
      ch = SUBSTITUTE[ch];
      cp = ch.codePointAt(0)!;
    }
    if (!f.mainSet.has(cp)) {
      if (f.ext && f.extSet.has(cp)) font = f.ext;
      else if (/\s/.test(ch)) ch = " ";
      else ch = "?";
    }
    const last = out[out.length - 1];
    if (last && last.font === font) last.text += ch;
    else out.push({ font, text: ch });
  }
  return out;
}

function width(f: Face, text: string, size: number) {
  return runs(f, text).reduce((w, r) => w + r.font.widthOfTextAtSize(r.text, size), 0);
}

function draw(page: PDFPage, f: Face, text: string, x: number, y: number, size: number, color = INK) {
  for (const r of runs(f, text)) {
    page.drawText(r.text, { x, y, size, font: r.font, color });
    x += r.font.widthOfTextAtSize(r.text, size);
  }
}

function drawRight(page: PDFPage, f: Face, text: string, right: number, y: number, size: number, color = INK) {
  draw(page, f, text, right - width(f, text, size), y, size, color);
}

/** Word-wraps text to a width, breaking long words if needed. Keeps line breaks. */
function wrap(f: Face, text: string, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\r?\n/)) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (width(f, next, size) <= maxWidth) {
        line = next;
        continue;
      }
      if (line) out.push(line);
      let w = word;
      while (width(f, w, size) > maxWidth) {
        let i = w.length - 1;
        while (i > 1 && width(f, w.slice(0, i), size) > maxWidth) i--;
        out.push(w.slice(0, i));
        w = w.slice(i);
      }
      line = w;
    }
    out.push(line);
  }
  return out;
}

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const M = 48;
const RIGHT = PAGE_W - M;

export function qty(milli: number) {
  return (milli / 1000).toLocaleString("en-GB", { maximumFractionDigits: 3 });
}

export function pdfFilename(number: string | null, kind: DocData["kind"]) {
  const base = number ?? (kind === "quote" ? "quote-draft" : "invoice-draft");
  return `${base.replace(/[^\w.-]+/g, "-")}.pdf`;
}

/** Renders an invoice, credit note or quote. */
export async function renderDocument(d: DocData): Promise<Uint8Array> {
  const bytes = await loadFonts();
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [regular, bold, display, regularExt, boldExt] = await Promise.all([
    pdf.embedFont(bytes.regular, { subset: true }),
    pdf.embedFont(bytes.bold, { subset: true }),
    pdf.embedFont(bytes.display, { subset: true }),
    pdf.embedFont(bytes.regularExt, { subset: true }),
    pdf.embedFont(bytes.boldExt, { subset: true }),
  ]);
  const R = face(regular, regularExt);
  const B = face(bold, boldExt);
  const D = face(display, boldExt);
  const rules = rulesFor(d.country);
  const lk = d.country === "lk";
  // A foreign currency is written with its code ("EUR 1,250.00"): clear to any reader, and every
  // character is in the embedded fonts.
  const foreignAmount = (minor: number) => {
    const digits = currencyDigits(d.currency);
    const n = new Intl.NumberFormat("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(minor) / 10 ** digits);
    return `${minor < 0 ? "-" : ""}${d.currency} ${n}`;
  };
  const m = (minor: number) => (d.home ? foreignAmount(minor) : formatMoney(minor, d.currency, { decimals: "always" }));
  const hm = (minor: number) => formatMoney(minor, d.home!.currency, { decimals: "always" });
  const numberText = d.number ?? "Draft";
  // UK VAT invoices show VAT per line; Sri Lankan Tax Invoices put SSCL and VAT in the totals.
  const mode: "plain" | "ukvat" | "lktax" = d.vatRegistered ? (lk ? "lktax" : "ukvat") : (lk && d.sscl > 0 ? "lktax" : "plain");

  pdf.setTitle(`${d.title} ${numberText} from ${d.seller.name}`);
  pdf.setAuthor(d.seller.name);
  pdf.setSubject(`${d.title} ${numberText}`);
  pdf.setCreator("BillingEase");
  pdf.setProducer("BillingEase");
  pdf.setKeywords([numberText]);
  // The number in plain text too, so mail filters and search can find it.
  (pdf as unknown as { getInfoDict(): { set(k: PDFName, v: PDFString): void } }).getInfoDict().set(PDFName.of("DocumentNumber"), PDFString.of(numberText));

  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let y = 0;
  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    y = PAGE_H - M;
  };
  const need = (h: number) => {
    if (y - h < M + 30) newPage();
  };

  // --- Header: seller on the left, title and number on the right
  newPage();
  drawMark(page, M, y, 28);
  const nameLines = wrap(D, d.seller.name, 16, 280);
  nameLines.forEach((l, i) => draw(page, D, l, M + 38, y - 19 - i * 19, 16));
  drawRight(page, D, d.title, RIGHT, y - 20, 22);
  drawRight(page, B, numberText, RIGHT, y - 38, 11, INK2);
  y -= Math.max(50, 26 + nameLines.length * 19) + 4;
  const sellerInfo: string[] = [];
  if (d.seller.legalName && d.seller.legalName !== d.seller.name) sellerInfo.push(d.seller.legalName);
  if (d.seller.address) sellerInfo.push(d.seller.address);
  const contact = [d.seller.email, d.seller.phone].filter(Boolean).join(" · ");
  if (contact) sellerInfo.push(contact);
  if (lk) {
    if (d.seller.taxId) sellerInfo.push(`${rules.wording.taxIdLabel}: ${d.seller.taxId}`);
    if (d.seller.vatNumber) sellerInfo.push(`${rules.wording.vatIdLabel}: ${d.seller.vatNumber}`);
  } else if (d.seller.vatNumber) {
    sellerInfo.push(`${rules.wording.vatIdLabel}: ${d.seller.vatNumber}`);
  }
  for (const s of sellerInfo) {
    for (const l of wrap(R, s, 9.5, 300)) {
      draw(page, R, l, M, y, 9.5, INK2);
      y -= 13;
    }
  }
  y -= 18;

  // --- Buyer and dates
  const top = y;
  draw(page, B, (d.kind === "quote" ? "QUOTE FOR" : lk ? "PURCHASER" : "BILL TO"), M, y, 8.5, MUTED);
  y -= 16;
  for (const l of wrap(B, d.buyer.name, 12, 280)) {
    draw(page, B, l, M, y, 12);
    y -= 15;
  }
  const buyerInfo = [d.buyer.address, d.buyer.email];
  if (lk) {
    if (d.buyer.taxId) buyerInfo.push(`${rules.wording.taxIdLabel}: ${d.buyer.taxId}`);
    if (d.buyer.vatNumber) buyerInfo.push(`${rules.wording.vatIdLabel}: ${d.buyer.vatNumber}`);
  } else if (d.buyer.vatNumber) {
    buyerInfo.push(`${rules.wording.vatIdLabel}: ${d.buyer.vatNumber}`);
  }
  for (const part of buyerInfo) {
    if (!part) continue;
    for (const l of wrap(R, part, 9.5, 280)) {
      draw(page, R, l, M, y, 9.5, INK2);
      y -= 13;
    }
  }
  let dy = top;
  for (const [k, v] of d.dates) {
    draw(page, R, k, RIGHT - 200, dy, 9.5, MUTED);
    drawRight(page, B, v, RIGHT, dy, 9.5);
    dy -= 16;
  }
  y = Math.min(y, dy) - 20;

  // --- Lines
  type Col = { label: string; right: number; value: (l: DocLine) => string };
  const cols: Col[] = mode === "ukvat"
    ? [
        { label: "QTY", right: RIGHT - 250, value: (l) => qty(l.quantityMilli) },
        { label: "PRICE", right: RIGHT - 180, value: (l) => m(l.unitPrice) },
        { label: "VAT RATE", right: RIGHT - 120, value: (l) => vatLabel(d.country, l.vatRateId) },
        { label: "NET", right: RIGHT - 55, value: (l) => m(l.net) },
        { label: "VAT", right: RIGHT, value: (l) => m(l.vat) },
      ]
    : [
        { label: "QTY", right: RIGHT - 200, value: (l) => qty(l.quantityMilli) },
        { label: lk ? "UNIT PRICE" : "PRICE", right: RIGHT - 95, value: (l) => m(l.unitPrice) },
        { label: lk ? "VALUE" : "AMOUNT", right: RIGHT, value: (l) => m(l.net) },
      ];
  const descRight = cols[0].right - 40;
  const header = () => {
    draw(page, B, "DESCRIPTION", M, y, 8, MUTED);
    for (const c of cols) drawRight(page, B, c.label, c.right, y, 8, MUTED);
    y -= 8;
    page.drawLine({ start: { x: M, y }, end: { x: RIGHT, y }, thickness: 1, color: INK });
    y -= 16;
  };
  header();
  for (const l of d.lines) {
    const desc = wrap(R, l.description, 10, descRight - M);
    const extra: string[] = [];
    if (l.discount > 0) extra.push(`Less discount ${m(l.discount)}`);
    if (mode === "lktax" && d.vatRegistered) extra.push(`VAT ${vatLabel(d.country, l.vatRateId)}${l.sscl > 0 ? " · SSCL" : ""}`);
    const h = desc.length * 13 + extra.length * 11 + 12;
    if (y - h < M + 40) {
      newPage();
      header();
    }
    desc.forEach((t, i) => draw(page, R, t, M, y - i * 13, 10));
    extra.forEach((t, i) => draw(page, R, t, M, y - desc.length * 13 - i * 11 + 1, 8, MUTED));
    for (const c of cols) drawRight(page, R, c.value(l), c.right, y, 10);
    y -= h - 2;
    page.drawLine({ start: { x: M, y: y + 6 }, end: { x: RIGHT, y: y + 6 }, thickness: 0.75, color: DIVIDER });
    y -= 10;
  }

  // --- Totals
  const L = RIGHT - 250;
  const rows: { label: string; sub?: string; value: string; strong?: boolean }[] = [];
  if (mode === "plain") {
    rows.push({ label: "Total", value: m(d.total), strong: true });
  } else if (mode === "ukvat") {
    rows.push({ label: "Total excluding VAT", value: m(d.net) });
    rows.push({ label: "VAT", value: m(d.vat) });
    rows.push({ label: "Total including VAT", value: m(d.total), strong: true });
  } else {
    rows.push({ label: "Value of supply", value: m(d.net) });
    if (d.sscl > 0) rows.push({ label: `SSCL ${(rules.ssclBps / 100).toLocaleString("en-GB")}%`, sub: "Social Security Contribution Levy", value: m(d.sscl) });
    for (const r of vatByRate(d)) {
      rows.push({ label: `VAT ${r.label}`, sub: d.sscl > 0 && rules.ssclInVatBase ? `on ${m(r.base)} (value plus SSCL)` : `on ${m(r.base)}`, value: m(r.vat) });
    }
    rows.push({ label: d.vat > 0 || d.sscl > 0 ? `Total including ${[d.sscl > 0 ? "SSCL" : "", d.vat > 0 || d.vatRegistered ? "VAT" : ""].filter(Boolean).join(" and ")}` : "Total", value: m(d.total), strong: true });
  }
  if (d.kind === "invoice" && (d.paid > 0 || d.credited > 0)) {
    if (d.credited > 0) rows.push({ label: "Credited", value: `-${m(d.credited)}` });
    if (d.paid > 0) rows.push({ label: "Paid", value: `-${m(d.paid)}` });
  }
  need(rows.length * 22 + 60);
  y -= 4;
  for (const r of rows) {
    if (r.strong) {
      page.drawLine({ start: { x: L, y: y + 11 }, end: { x: RIGHT, y: y + 11 }, thickness: 1, color: INK });
      y -= 3;
    }
    draw(page, r.strong ? B : R, r.label, L, y, r.strong ? 10.5 : 10, r.strong ? INK : INK2);
    drawRight(page, r.strong ? B : R, r.value, RIGHT, y, r.strong ? 10.5 : 10);
    if (r.sub) {
      y -= 11;
      draw(page, R, r.sub, L, y, 7.5, MUTED);
    }
    y -= 19;
  }
  if (d.kind === "invoice") {
    const open = d.total - d.paid - d.credited;
    page.drawLine({ start: { x: L, y: y + 10 }, end: { x: RIGHT, y: y + 10 }, thickness: 1, color: INK });
    y -= 8;
    draw(page, B, d.status === "paid" ? "Balance" : "Amount due", L, y, 11.5);
    drawRight(page, D, m(d.status === "void" ? 0 : open), RIGHT, y - 2, 18);
    y -= 34;
  } else {
    y -= 10;
  }

  // --- The same totals in the home currency, for a document in another currency
  if (d.home) {
    const h = d.home;
    const homeRows: [string, string][] = [];
    if (h.vat > 0 || h.sscl > 0) homeRows.push([`${mode === "lktax" ? "Value of supply" : "Total excluding VAT"} in ${h.currency}`, hm(h.net)]);
    if (h.sscl > 0) homeRows.push([`SSCL in ${h.currency}`, hm(h.sscl)]);
    if (h.vat > 0) homeRows.push([`VAT in ${h.currency}`, hm(h.vat)]);
    homeRows.push([`Total in ${h.currency}`, hm(h.total)]);
    need(homeRows.length * 16 + 34);
    draw(page, R, `${h.indicative ? "For reference, at" : "Converted at"} ${h.rateLabel}`, L, y, 8, MUTED);
    y -= 15;
    for (const [label, value] of homeRows) {
      draw(page, R, label, L, y, 9, INK2);
      drawRight(page, R, value, RIGHT, y, 9);
      y -= 15;
    }
    y -= 10;
  }

  // --- VAT summary by rate (UK VAT invoices)
  if (mode === "ukvat") {
    const summary = vatByRate(d);
    need(summary.length * 16 + 40);
    draw(page, B, "VAT SUMMARY", M, y, 8, MUTED);
    drawRight(page, B, "NET", M + 260, y, 8, MUTED);
    drawRight(page, B, "VAT", M + 340, y, 8, MUTED);
    y -= 7;
    page.drawLine({ start: { x: M, y }, end: { x: M + 340, y }, thickness: 0.75, color: LINE });
    y -= 14;
    for (const r of summary) {
      draw(page, R, r.label, M, y, 9.5);
      drawRight(page, R, m(r.base), M + 260, y, 9.5);
      drawRight(page, R, m(r.vat), M + 340, y, 9.5);
      y -= 15;
    }
    y -= 12;
  }

  // --- Mode of payment (Sri Lanka)
  if (lk && d.kind === "invoice" && d.modeOfPayment) {
    need(30);
    draw(page, B, "Mode of payment", M, y, 9.5);
    draw(page, R, d.modeOfPayment, M + 100, y, 9.5, INK2);
    y -= 22;
  }

  // --- Boxes: status, how to pay, notes
  const box = (fill: typeof TINT, heading: string | null, text: string, color = INK) => {
    const t = wrap(R, text, 9.5, RIGHT - M - 28);
    const h = t.length * 13 + (heading ? 16 : 0) + 20;
    need(h + 10);
    page.drawRectangle({ x: M, y: y - h, width: RIGHT - M, height: h, color: fill });
    let ty = y - 17;
    if (heading) {
      draw(page, B, heading, M + 14, ty, 9.5, color);
      ty -= 15;
    }
    for (const l of t) {
      draw(page, R, l, M + 14, ty, 9.5, color);
      ty -= 13;
    }
    y -= h + 10;
  };
  if (d.status === "void") box(SURFACE, null, `This ${d.kind === "quote" ? "quote" : "invoice"} was voided. Nothing is owed on it.`);
  else if (d.kind === "invoice" && d.status === "paid") box(POS_BG, null, "Paid in full. Thank you!", POS);
  else if (d.status === "draft") box(SURFACE, null, `Draft. This ${d.kind === "quote" ? "quote" : "invoice"} hasn't been sent yet.`);
  if (d.notes) box(SURFACE, d.kind === "credit_note" ? "Reason" : null, d.notes);
  if (d.kind !== "credit_note" && d.paymentDetails) box(TINT, "How to pay", d.paymentDetails);
  if (d.note) box(SURFACE, null, d.note);
  if (lk && d.sscl > 0 && rules.ssclInVatBase) {
    need(30);
    for (const l of wrap(R, "SSCL is shown as its own line and included in the value VAT is charged on (to confirm with IRD).", 8, RIGHT - M)) {
      draw(page, R, l, M, y, 8, MUTED);
      y -= 11;
    }
  }

  // --- Footer on every page
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: M - 8 }, end: { x: RIGHT, y: M - 8 }, thickness: 0.75, color: LINE });
    draw(p, R, `${d.seller.name} · ${d.title} ${numberText}`, M, M - 22, 8, MUTED);
    drawRight(p, R, `Page ${i + 1} of ${pages.length}`, RIGHT, M - 22, 8, MUTED);
  });
  return pdf.save({ useObjectStreams: false });
}

function vatLabel(country: CountryCode, id: string | null) {
  if (!id) return "-";
  return rulesFor(country).vatRates.find((r) => r.id === id)?.label.replace(/ \(.*\)$/, "") ?? id;
}

function vatByRate(d: DocData) {
  const out = new Map<string, { label: string; base: number; vat: number }>();
  const rules = rulesFor(d.country);
  for (const l of d.lines) {
    if (!l.vatRateId) continue;
    const label = rules.vatRates.find((r) => r.id === l.vatRateId)?.label ?? l.vatRateId;
    const row = out.get(l.vatRateId) ?? { label, base: 0, vat: 0 };
    row.base += l.net + (rules.ssclInVatBase ? l.sscl : 0);
    row.vat += l.vat;
    out.set(l.vatRateId, row);
  }
  return [...out.values()];
}

// ---------------------------------------------------------------------------
// Loading what to print

const day = (d: string) => formatDate(d, { year: true });

/** Everything an invoice or credit note's PDF shows, read for one business. */
export async function invoicePdfData(db: Exec, businessId: string, invoiceId: string): Promise<DocData | null> {
  const [b] = await db.select().from(businesses).where(eq(businesses.id, businessId));
  const [inv] = await db.select().from(invoices).where(and(eq(invoices.id, invoiceId), eq(invoices.businessId, businessId)));
  if (!b || !inv) return null;
  const [c] = await db.select().from(customers).where(and(eq(customers.id, inv.customerId), eq(customers.businessId, businessId)));
  const lines = await db.select().from(invoiceLines).where(and(eq(invoiceLines.invoiceId, inv.id), eq(invoiceLines.businessId, businessId))).orderBy(asc(invoiceLines.position));
  const recs = await db.select({ method: receipts.method, chequeNumber: receipts.chequeNumber }).from(receipts)
    .where(and(eq(receipts.invoiceId, inv.id), eq(receipts.businessId, businessId), isNull(receipts.voidedAt)));
  const vatRegistered = inv.status === "draft" ? b.vatRegistered : inv.vatRegistered;
  const snap = inv.snapshot ?? snapshotFor(b, c, vatRegistered);
  const lk = b.country === "lk";
  let parentNumber: string | null = null;
  if (inv.creditForId) {
    const [p] = await db.select({ number: invoices.number }).from(invoices).where(and(eq(invoices.id, inv.creditForId), eq(invoices.businessId, businessId)));
    parentNumber = p?.number ?? null;
  }
  const dates: [string, string][] = inv.kind === "credit_note"
    ? [["Date", day(inv.issueDate)], ...(parentNumber ? [["Against invoice", parentNumber] as [string, string]] : [])]
    : [
        ["Invoice date", day(inv.issueDate)],
        ...(lk ? [["Date of delivery", day(inv.supplyDate ?? inv.issueDate)] as [string, string]] : inv.supplyDate && inv.supplyDate !== inv.issueDate ? [["Date of supply", day(inv.supplyDate)] as [string, string]] : []),
        ["Due date", day(inv.dueDate)],
        ...(inv.reference ? [["Your reference", inv.reference] as [string, string]] : []),
      ];
  const methods = [...new Set(recs.map((r) => (r.method === "Cheque" && r.chequeNumber ? `Cheque no. ${r.chequeNumber}` : r.method)))];
  return {
    kind: inv.kind, country: b.country, currency: inv.currency, title: inv.kind === "credit_note" ? "Credit note" : snap.title, number: inv.number, status: inv.status,
    home: inv.currency === b.currency ? null : {
      currency: b.currency, rateLabel: `${describeRate(inv.currency, b.currency, parseRate(inv.fxRate) ?? "1")} (${day(inv.issueDate)})`,
      net: inv.homeNet, vat: inv.homeVat, sscl: inv.homeSscl, total: inv.homeTotal,
    },
    seller: snap.seller, buyer: snap.buyer, dates, vatRegistered,
    lines: lines.map((l) => ({ description: l.description, quantityMilli: l.quantityMilli, unitPrice: l.unitPrice, discount: l.discount, vatRateId: l.vatRateId, vatBps: l.vatBps, net: l.net, vat: l.vat, sscl: l.sscl })),
    net: inv.net, vat: inv.vat, sscl: inv.sscl, total: inv.total, paid: inv.paid, credited: inv.credited,
    paymentDetails: snap.paymentDetails, note: inv.kind === "credit_note" ? null : snap.note, notes: inv.notes,
    modeOfPayment: methods.length ? methods.join(", ") : rulesFor(b.country).receiveMethods.join(", "),
  };
}

export async function quotePdfData(db: Exec, businessId: string, quoteId: string): Promise<DocData | null> {
  const [b] = await db.select().from(businesses).where(eq(businesses.id, businessId));
  const [q] = await db.select().from(quotes).where(and(eq(quotes.id, quoteId), eq(quotes.businessId, businessId)));
  if (!b || !q) return null;
  const [c] = await db.select().from(customers).where(and(eq(customers.id, q.customerId), eq(customers.businessId, businessId)));
  const lines = await db.select().from(quoteLines).where(and(eq(quoteLines.quoteId, q.id), eq(quoteLines.businessId, businessId))).orderBy(asc(quoteLines.position));
  const vatRegistered = q.status === "draft" ? b.vatRegistered : q.vatRegistered;
  const snap = q.snapshot ?? snapshotFor(b, c, vatRegistered);
  return {
    kind: "quote", country: b.country, currency: q.currency, title: "Quote", number: q.number, status: q.status,
    home: q.currency === b.currency ? null : {
      currency: b.currency, rateLabel: describeRate(q.currency, b.currency, parseRate(q.fxRate) ?? "1"), indicative: true,
      net: 0, vat: 0, sscl: 0, total: q.homeTotal,
    },
    seller: snap.seller, buyer: snap.buyer, dates: [["Quote date", day(q.issueDate)], ["Valid until", day(q.expiryDate)]], vatRegistered,
    lines: lines.map((l) => ({ description: l.description, quantityMilli: l.quantityMilli, unitPrice: l.unitPrice, discount: l.discount, vatRateId: l.vatRateId, vatBps: l.vatBps, net: l.net, vat: l.vat, sscl: l.sscl })),
    net: q.net, vat: q.vat, sscl: q.sscl, total: q.total, paid: 0, credited: 0,
    paymentDetails: null, note: null, notes: q.notes,
  };
}

/** Renders the invoice or quote attached to an outbox email, when it's sent. */
export async function outboxAttachments(db: Exec, m: typeof outboxEmails.$inferSelect): Promise<Attachment[]> {
  if (!m.businessId) return [];
  const out: Attachment[] = [];
  if (m.attachInvoiceId) {
    const d = await invoicePdfData(db, m.businessId, m.attachInvoiceId);
    if (d) out.push({ filename: pdfFilename(d.number, d.kind), contentType: "application/pdf", content: await renderDocument(d) });
  }
  if (m.attachQuoteId) {
    const d = await quotePdfData(db, m.businessId, m.attachQuoteId);
    if (d) out.push({ filename: pdfFilename(d.number, d.kind), contentType: "application/pdf", content: await renderDocument(d) });
  }
  return out;
}
