import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFName, PDFString, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatDate } from "./dates";
import { formatMoney } from "./money";

/** Everything the PDF shows. Same shape as the on-screen InvoiceDocument. */
export type InvoicePdfData = {
  business: { name: string };
  customer: { name: string; email: string | null; phone: string | null; address: string | null };
  invoice: { number: string; issueDate: string; dueDate: string; memo: string | null; totalCents: number; paidCents: number; status: string };
  lines: { description: string; quantity: number; unitCents: number; amountCents: number }[];
  /** The online pay link, shown while there's something left to pay. */
  payLink?: string;
};

export function invoicePdfFilename(inv: { number: string }) {
  return `${inv.number.replace(/[^\w.-]+/g, "-")}.pdf`;
}

// Brand colors (see globals.css)
const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const INK = hex("#18161f");
const INK2 = hex("#47444f");
const MUTED = hex("#5f5b68");
const LINE = hex("#e2dfe8");
const DIVIDER = hex("#efedf2");
const VIOLET = hex("#b9a3ff");
const TINT = hex("#eee8ff");
const POS = hex("#2f5711");
const POS_BG = hex("#e2f6d5");
const SURFACE = hex("#efedf3");

const FONT_FILES = {
  regular: "@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff",
  bold: "@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff",
  display: "@fontsource/sora/files/sora-latin-700-normal.woff",
  regularExt: "@fontsource/dm-sans/files/dm-sans-latin-ext-400-normal.woff",
  boldExt: "@fontsource/dm-sans/files/dm-sans-latin-ext-700-normal.woff",
};

let fontBytes: Promise<Record<keyof typeof FONT_FILES, Uint8Array>> | null = null;
function loadFonts() {
  fontBytes ??= Promise.all(
    Object.entries(FONT_FILES).map(async ([k, f]) => [k, new Uint8Array(await readFile(path.join(process.cwd(), "node_modules", f)))] as const),
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

/** Splits text into runs drawable by one font. Characters neither font has become "?". */
function runs(f: Face, text: string) {
  const out: { font: PDFFont; text: string }[] = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    let font = f.main;
    let c = ch;
    if (!f.mainSet.has(cp)) {
      if (f.ext && f.extSet.has(cp)) font = f.ext;
      else if (/\s/.test(ch)) c = " ";
      else c = "?";
    }
    const last = out[out.length - 1];
    if (last && last.font === font) last.text += c;
    else out.push({ font, text: c });
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
      // a single word wider than the column: break it
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

const PAGE_W = 612; // US Letter
const PAGE_H = 792;
const M = 54; // margin
const RIGHT = PAGE_W - M;
const LONG = { month: "long", day: "numeric", year: "numeric" } as const;

/** Renders the invoice as a PDF, laid out like the on-screen invoice. */
export async function renderInvoicePdf(d: InvoicePdfData): Promise<Uint8Array> {
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

  const { business, customer, invoice, lines } = d;
  pdf.setTitle(`Invoice ${invoice.number} from ${business.name}`);
  pdf.setAuthor(business.name);
  pdf.setSubject(`Invoice ${invoice.number}`);
  pdf.setCreator("BillingEase");
  pdf.setProducer("BillingEase");

  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let y = 0;

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    y = PAGE_H - M;
  };

  // --- Header
  newPage();
  page.drawSvgPath("M8 0h14a8 8 0 0 1 8 8v14a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8V8a8 8 0 0 1 8-8z", { x: M, y, color: VIOLET });
  // the BillingEase mark, scaled from its 24px box
  page.drawSvgPath("M5 19 11 5h8l-6 14z", { x: M + 3, y: y - 3, scale: 1, color: INK });
  const nameLines = wrap(D, business.name, 17, 300);
  nameLines.forEach((l, i) => draw(page, D, l, M + 42, y - 21 - i * 21, 17));
  drawRight(page, D, "Invoice", RIGHT, y - 22, 24);
  drawRight(page, R, invoice.number, RIGHT, y - 40, 11, INK2);
  y -= Math.max(56, 30 + nameLines.length * 21) + 22;

  // --- Bill to / dates
  const top = y;
  draw(page, B, "BILL TO", M, y, 8.5, MUTED);
  y -= 17;
  for (const l of wrap(B, customer.name, 12.5, 300)) {
    draw(page, B, l, M, y, 12.5);
    y -= 16;
  }
  for (const part of [customer.address, customer.email, customer.phone]) {
    if (!part) continue;
    for (const l of wrap(R, part, 10, 300)) {
      draw(page, R, l, M, y, 10, INK2);
      y -= 14;
    }
  }
  let dy = top;
  for (const [k, v] of [
    ["Issued", formatDate(invoice.issueDate, LONG)],
    ["Due", formatDate(invoice.dueDate, LONG)],
  ]) {
    draw(page, R, k, RIGHT - 190, dy, 10, MUTED);
    drawRight(page, B, v, RIGHT, dy, 10);
    dy -= 17;
  }
  y = Math.min(y, dy) - 22;

  // --- Line items
  const COL = { qty: RIGHT - 200, price: RIGHT - 90, amount: RIGHT };
  const descWidth = COL.qty - 40 - M;
  const tableHeader = () => {
    draw(page, B, "DESCRIPTION", M, y, 8.5, MUTED);
    drawRight(page, B, "QTY", COL.qty, y, 8.5, MUTED);
    drawRight(page, B, "PRICE", COL.price, y, 8.5, MUTED);
    drawRight(page, B, "AMOUNT", COL.amount, y, 8.5, MUTED);
    y -= 8;
    page.drawLine({ start: { x: M, y }, end: { x: RIGHT, y }, thickness: 1, color: INK });
    y -= 18;
  };
  tableHeader();
  for (const l of lines) {
    const desc = wrap(R, l.description, 10.5, descWidth);
    const h = desc.length * 14 + 12;
    if (y - h < M + 40) {
      newPage();
      tableHeader();
    }
    desc.forEach((t, i) => draw(page, R, t, M, y - i * 14, 10.5));
    drawRight(page, R, String(l.quantity), COL.qty, y, 10.5);
    drawRight(page, R, formatMoney(l.unitCents, { cents: true }), COL.price, y, 10.5);
    drawRight(page, R, formatMoney(l.amountCents, { cents: true }), COL.amount, y, 10.5);
    y -= h - 4;
    page.drawLine({ start: { x: M, y: y + 6 }, end: { x: RIGHT, y: y + 6 }, thickness: 0.75, color: DIVIDER });
    y -= 12;
  }

  // --- Totals
  const settled = invoice.status === "paid" || invoice.status === "void";
  const open = invoice.status === "void" ? 0 : invoice.totalCents - invoice.paidCents;
  const totalsH = invoice.paidCents > 0 ? 90 : 70;
  if (y - totalsH < M + 30) newPage();
  y -= 6;
  const L = RIGHT - 230;
  draw(page, R, "Total", L, y, 10.5, INK2);
  drawRight(page, B, formatMoney(invoice.totalCents, { cents: true }), RIGHT, y, 10.5);
  y -= 20;
  if (invoice.paidCents > 0) {
    draw(page, R, "Paid", L, y, 10.5, INK2);
    drawRight(page, B, `−${formatMoney(invoice.paidCents, { cents: true })}`, RIGHT, y, 10.5);
    y -= 20;
  }
  page.drawLine({ start: { x: L, y: y + 8 }, end: { x: RIGHT, y: y + 8 }, thickness: 1, color: INK });
  y -= 14;
  draw(page, B, settled ? "Balance" : "Amount due", L, y, 12);
  drawRight(page, D, formatMoney(open, { cents: true }), RIGHT, y - 2, 19);
  y -= 40;

  // --- Notes, status and the pay link
  const box = (fill: typeof TINT, f: Face, text: string, color = INK, link?: string) => {
    const t = wrap(f, text, 10.5, RIGHT - M - 28);
    const linkLines = link ? wrap(B, link, 10, RIGHT - M - 28) : [];
    const h = t.length * 15 + linkLines.length * 14 + 22;
    if (y - h < M + 20) newPage();
    page.drawRectangle({ x: M, y: y - h, width: RIGHT - M, height: h, color: fill });
    let ty = y - 20;
    for (const l of t) {
      draw(page, f, l, M + 14, ty, 10.5, color);
      ty -= 15;
    }
    for (const l of linkLines) {
      draw(page, B, l, M + 14, ty, 10, hex("#4b2fc4"));
      ty -= 14;
    }
    if (link) addLink(pdf, page, link, M, y - h, RIGHT - M, h);
    y -= h + 14;
  };

  if (invoice.memo) {
    for (const l of wrap(R, invoice.memo, 10.5, RIGHT - M)) {
      if (y < M + 30) newPage();
      draw(page, R, l, M, y, 10.5, INK2);
      y -= 15;
    }
    y -= 12;
  }
  if (invoice.status === "void") box(SURFACE, B, "This invoice was voided. Nothing is owed on it.");
  else if (invoice.status === "paid") box(POS_BG, B, "Paid in full. Thank you!", POS);
  else if (d.payLink && invoice.status === "sent") box(TINT, B, `Pay ${formatMoney(open, { cents: true })} online by card or bank transfer:`, INK, d.payLink);
  else if (invoice.status === "draft") box(SURFACE, B, "Draft. This invoice hasn't been sent yet.");

  // --- Footer on every page
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: M - 8 }, end: { x: RIGHT, y: M - 8 }, thickness: 0.75, color: LINE });
    draw(p, R, `${business.name} · Invoice ${invoice.number}`, M, M - 24, 8.5, MUTED);
    drawRight(p, R, `Page ${i + 1} of ${pages.length}`, RIGHT, M - 24, 8.5, MUTED);
  });

  return pdf.save();
}

/** Makes a rectangle on the page a clickable link. */
function addLink(pdf: PDFDocument, page: PDFPage, url: string, x: number, y: number, w: number, h: number) {
  const annot = pdf.context.register(
    pdf.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [x, y, x + w, y + h],
      Border: [0, 0, 0],
      A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
    }),
  );
  const existing = page.node.lookup(PDFName.of("Annots"));
  if (existing) (existing as unknown as { push: (v: unknown) => void }).push(annot);
  else page.node.set(PDFName.of("Annots"), pdf.context.obj([annot]));
}
