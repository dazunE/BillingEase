/**
 * Spreadsheet files: CSV out (Security and data → Take your data out) and a simple CSV in
 * (Bring your customers in). Bank statements have their own reader in the API.
 */

export type Cell = string | number | null | undefined;

/** A cell a spreadsheet would run as a formula (=, +, -, @, tab, CR), unless it's just a number. */
function risky(s: string) {
  return /^[=+\-@\t\r]/.test(s) && !/^[+-]?\d+(\.\d+)?$/.test(s);
}

function cell(v: Cell): string {
  if (v === null || v === undefined) return "";
  let s = typeof v === "number" ? String(v) : v;
  // Text that would run as a formula when opened is kept as text.
  if (typeof v === "string" && risky(s)) s = "'" + s;
  return /[",\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Rows to CSV text, with a header row first. Lines end in CRLF, as RFC 4180 asks. */
export function toCsv(header: string[], rows: Cell[][]): string {
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** Minor units as a plain decimal for a spreadsheet: 123456 → "1234.56" (no symbol, no separators). */
export function minorToDecimal(minor: number, digits = 2): string {
  const neg = minor < 0;
  const abs = Math.abs(Math.trunc(minor));
  if (digits === 0) return (neg ? "-" : "") + String(abs);
  const s = String(abs).padStart(digits + 1, "0");
  return (neg ? "-" : "") + s.slice(0, -digits) + "." + s.slice(-digits);
}

/** Reads CSV (comma, semicolon or tab, quoted fields, CRLF or LF) into rows of trimmed cells. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  const count = (ch: string) => first.split(ch).length - 1;
  const sep = [",", ";", "\t"].sort((a, b) => count(b) - count(a))[0];
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"' && field.trim() === "") {
      quoted = true;
      field = "";
    } else if (c === sep) {
      row.push(field.trim());
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field.trim());
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  row.push(field.trim());
  if (row.some((x) => x !== "")) rows.push(row);
  return rows;
}
