/**
 * Reads any bank's CSV export without knowing the bank: finds the delimiter, the header row
 * and which column is which, the order of the dates and how amounts are written. When no
 * header can be recognised, the caller asks the model for a Mapping and applies it here.
 * Pure functions, so they're tested on their own.
 */

export type StatementLineIn = { date: string; description: string; amount: number; balance: number | null; reference: string | null };

export type Mapping = {
  /** Index of the header row; data starts after it (-1: no header). */
  headerRow: number;
  date: number;
  description: number[];
  /** One signed amount column... */
  amount?: number | null;
  /** ...or separate money-out and money-in columns. */
  debit?: number | null;
  credit?: number | null;
  /** A column saying DR/CR (or Debit/Credit) when the amount column has no sign. */
  drcr?: number | null;
  balance?: number | null;
  reference?: number | null;
  dateOrder: "dmy" | "mdy" | "ymd";
  /** Some cards' exports show spending as positive. */
  invert?: boolean;
};

export type CsvResult = { lines: StatementLineIn[]; skipped: number; openingBalance: number | null; closingBalance: number | null };

/** Splits CSV text (RFC 4180 quotes; comma, semicolon, tab or pipe) into rows of cells. */
export function parseCsvText(text: string): string[][] {
  const clean = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const sample = clean.split("\n").slice(0, 30).join("\n");
  const delim = [",", ";", "\t", "|"].map((d) => ({ d, n: countOutsideQuotes(sample, d) })).sort((a, b) => b.n - a.n)[0].d;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell.trim() === "") { quoted = true; cell = ""; }
    else if (ch === delim) { row.push(cell.trim()); cell = ""; }
    else if (ch === "\n") { row.push(cell.trim()); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell.trim() !== "" || row.length) { row.push(cell.trim()); rows.push(row); }
  return rows.filter((r) => r.some((c) => c !== ""));
}

function countOutsideQuotes(s: string, d: string) {
  let n = 0;
  let q = false;
  for (const ch of s) {
    if (ch === '"') q = !q;
    else if (!q && ch === d) n++;
  }
  return n;
}

const norm = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, " ").replace(/[^a-z/]+/g, " ").trim();
const HEADERS: Record<string, string[]> = {
  date: ["date", "transaction date", "posting date", "posted date", "date posted", "value date", "txn date", "trans date", "booking date", "tran date", "entry date"],
  description: ["description", "details", "transaction details", "transaction description", "narrative", "narration", "particulars", "memo", "payee", "name", "merchant", "remarks", "transaction", "counter party", "counterparty"],
  amount: ["amount", "value", "transaction amount", "amount gbp", "amount lkr", "net amount"],
  debit: ["debit", "debits", "debit amount", "withdrawal", "withdrawals", "money out", "paid out", "dr", "out", "payments", "debit lkr", "debit gbp", "withdrawal amount"],
  credit: ["credit", "credits", "credit amount", "deposit", "deposits", "money in", "paid in", "cr", "in", "receipts", "credit lkr", "credit gbp", "deposit amount"],
  balance: ["balance", "running balance", "closing balance", "ledger balance", "available balance", "balance gbp", "balance lkr"],
  reference: ["reference", "ref", "cheque no", "cheque number", "chq no", "check number", "transaction id", "reference number", "ref no", "instrument no"],
  drcr: ["dr/cr", "cr/dr", "debit/credit", "type", "transaction type", "dc", "d/c"],
};

function headerKind(cell: string): string | null {
  const c = norm(cell);
  if (!c) return null;
  for (const [kind, names] of Object.entries(HEADERS)) if (names.includes(c)) return kind;
  // "Paid out (£)", "Withdrawals Rs" etc. already reduced; try prefixes last.
  for (const [kind, names] of Object.entries(HEADERS)) if (names.some((n) => n.length > 3 && c.startsWith(n))) return kind;
  return null;
}

/** Finds the header row and its columns. Null when nothing looks like a statement header. */
export function guessMapping(rows: string[][]): Mapping | null {
  for (let h = 0; h < Math.min(rows.length, 40); h++) {
    const kinds = rows[h].map(headerKind);
    const first = (k: string) => kinds.indexOf(k);
    const date = first("date");
    const descs = kinds.map((k, i) => (k === "description" ? i : -1)).filter((i) => i >= 0);
    const amount = first("amount");
    const debit = first("debit");
    const credit = first("credit");
    if (date < 0 || (amount < 0 && (debit < 0 || credit < 0))) continue;
    const description = descs.length ? descs : rows[h].map((_, i) => i).filter((i) => kinds[i] === null).slice(0, 1);
    const data = rows.slice(h + 1).map((r) => r[date]).filter(Boolean);
    return {
      headerRow: h, date, description,
      amount: amount >= 0 && (debit < 0 || credit < 0) ? amount : null,
      debit: debit >= 0 && credit >= 0 ? debit : null,
      credit: debit >= 0 && credit >= 0 ? credit : null,
      drcr: first("drcr") >= 0 ? first("drcr") : null,
      balance: first("balance") >= 0 ? first("balance") : null,
      reference: first("reference") >= 0 ? first("reference") : null,
      dateOrder: guessDateOrder(data),
    };
  }
  return null;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** dmy unless the dates prove otherwise (UK and Sri Lankan banks write day first). */
export function guessDateOrder(values: string[]): Mapping["dateOrder"] {
  let dmy = 0, mdy = 0, ymd = 0;
  for (const v of values.slice(0, 200)) {
    const parts = v.trim().split(/[\s/.\-T]+/).filter(Boolean);
    if (parts.length < 3) continue;
    if (/^\d{4}$/.test(parts[0])) ymd++;
    else if (/^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
      if (Number(parts[0]) > 12) dmy++;
      else if (Number(parts[1]) > 12) mdy++;
    }
  }
  if (ymd > dmy && ymd > mdy) return "ymd";
  return mdy > dmy ? "mdy" : "dmy";
}

/** "01/10/2026", "2026-10-01", "1 Oct 2026", "01-Oct-26", "Oct 1, 2026" → ISO date, or null. */
export function parseDate(v: string, order: Mapping["dateOrder"]): string | null {
  const s = v.trim().toLowerCase().replace(/,/g, " ");
  if (!s) return null;
  const parts = s.split(/[\s/.\-T]+/).filter(Boolean);
  if (parts.length < 3) return null;
  let d: number, m: number, y: number;
  const month = (p: string) => MONTHS.indexOf(p.slice(0, 3)) + 1;
  if (month(parts[1]) > 0 && /^\d+$/.test(parts[0])) [d, m, y] = [Number(parts[0]), month(parts[1]), Number(parts[2])];
  else if (month(parts[0]) > 0 && /^\d+$/.test(parts[1])) [m, d, y] = [month(parts[0]), Number(parts[1]), Number(parts[2])];
  else if (/^\d{4}$/.test(parts[0])) [y, m, d] = [Number(parts[0]), Number(parts[1]), Number(parts[2])];
  else if (order === "mdy") [m, d, y] = [Number(parts[0]), Number(parts[1]), Number(parts[2])];
  else [d, m, y] = [Number(parts[0]), Number(parts[1]), Number(parts[2])];
  if (y < 100) y += 2000;
  if (![d, m, y].every(Number.isInteger) || m < 1 || m > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
  const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return new Date(`${iso}T00:00:00Z`).toISOString().slice(0, 10) === iso ? iso : null;
}

/**
 * "£1,234.56", "-1234.56", "(1,234.56)", "1,234.56-", "Rs. 12,500.00 CR", "1.234,56" → signed
 * minor units. DR, a minus or brackets make it negative; CR positive. Null if it isn't an amount.
 */
export function parseAmount(v: string): number | null {
  const raw = v.trim().toLowerCase();
  if (!raw || raw === "-" || raw === "--") return null;
  const credit = /\b(cr|credit)\b/.test(raw);
  const negative = !credit && (/\b(dr|debit)\b/.test(raw) || /^\(.*\)$/.test(raw) || raw.includes("-"));
  let s = raw.replace(/\b(dr|cr|debit|credit)\b|gbp|lkr|rs\.?|[£$€()+\-\s]/g, "");
  // 1.234,56 (decimal comma) or 1,234.56
  if (/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(s) || /^\d+,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  if (!/^\d+(\.\d{1,3})?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  const minor = Number(whole) * 100 + Number(frac.slice(0, 2).padEnd(2, "0"));
  return negative ? -minor : minor;
}

const BALANCE_ROW = /brought forward|carried forward|opening balance|closing balance|balance b\/?f|balance c\/?f|^balance$/i;

/** Applies a mapping to the rows. Rows without a date or an amount (totals, notes) are skipped. */
export function applyMapping(rows: string[][], m: Mapping): CsvResult {
  const lines: StatementLineIn[] = [];
  let skipped = 0;
  let openingBalance: number | null = null;
  let closingBalance: number | null = null;
  const cell = (r: string[], i: number | null | undefined) => (i == null || i < 0 ? "" : r[i] ?? "");
  for (const r of rows.slice(m.headerRow + 1)) {
    const description = m.description.map((i) => cell(r, i)).filter(Boolean).join(" · ").replace(/\s+/g, " ").trim();
    const balance = m.balance != null ? parseAmount(cell(r, m.balance)) : null;
    if (BALANCE_ROW.test(description)) {
      if (openingBalance === null && lines.length === 0) openingBalance = balance;
      else closingBalance = balance;
      continue;
    }
    const date = parseDate(cell(r, m.date), m.dateOrder);
    let amount: number | null = null;
    if (m.amount != null) {
      amount = parseAmount(cell(r, m.amount));
      const flag = cell(r, m.drcr).toLowerCase();
      if (amount != null && flag) amount = /^(dr|d|debit|withdrawal|out)/.test(flag) ? -Math.abs(amount) : /^(cr|c|credit|deposit|in)/.test(flag) ? Math.abs(amount) : amount;
      if (amount != null && m.invert) amount = -amount;
    } else {
      const out = parseAmount(cell(r, m.debit));
      const inn = parseAmount(cell(r, m.credit));
      if (out) amount = -Math.abs(out);
      else if (inn) amount = Math.abs(inn);
    }
    if (!date || !amount) {
      skipped++;
      continue;
    }
    const ref = cell(r, m.reference).trim();
    lines.push({ date, description: description.slice(0, 500) || "(no description)", amount, balance, reference: ref ? ref.slice(0, 120) : null });
  }
  return { lines, skipped, openingBalance, closingBalance };
}

/**
 * How many running balances don't follow from the lines. Statements list newest first or
 * oldest first; whichever fits better is used.
 */
export function balanceProblems(lines: StatementLineIn[]): number {
  const withBal = lines.filter((l) => l.balance != null);
  if (withBal.length < 2) return 0;
  const count = (ls: StatementLineIn[]) => {
    let bad = 0;
    for (let i = 1; i < ls.length; i++) if (ls[i - 1].balance! + ls[i].amount !== ls[i].balance) bad++;
    return bad;
  };
  return Math.min(count(withBal), count([...withBal].reverse()));
}
