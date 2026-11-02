import { createHash, createHmac, randomBytes, randomInt } from "node:crypto";

/**
 * Time-based one-time codes (RFC 6238) for two-step sign-in: SHA-1, 6 digits, 30-second steps,
 * which is what every authenticator app (1Password, Google Authenticator, Authy) expects.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const STEP_SECONDS = 30;

export function base32Encode(buf: Buffer) {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string) {
  const clean = text.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | ALPHABET.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** A new 160-bit secret, base32 (32 characters). */
export const newSecret = () => base32Encode(randomBytes(20));

export const stepAt = (ms = Date.now()) => Math.floor(ms / 1000 / STEP_SECONDS);

/** The 6-digit code for a secret at a time step. */
export function codeAt(secret: string, step: number) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const mac = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = mac[mac.length - 1] & 15;
  const n = (mac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(n).padStart(6, "0");
}

/**
 * The step a code matches, allowing one step either side for a phone clock that's a little out,
 * or null. Codes at or before `after` (the last one used) don't count, so each works once.
 */
export function matchStep(secret: string, code: string, after: number | null, now = Date.now()) {
  const c = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return null;
  const at = stepAt(now);
  for (const step of [at - 1, at, at + 1]) {
    if (after !== null && step <= after) continue;
    if (codeAt(secret, step) === c) return step;
  }
  return null;
}

/** What an authenticator app scans: otpauth://totp/BillingEase:email?secret=…&issuer=BillingEase */
export const otpauthUri = (secret: string, email: string) =>
  `otpauth://totp/${encodeURIComponent(`BillingEase:${email}`)}?secret=${secret}&issuer=BillingEase&algorithm=SHA1&digits=6&period=${STEP_SECONDS}`;

// ---- Backup codes ------------------------------------------------------------------------

// No 0/O or 1/I/L: they're read off paper.
const CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Ten codes like 4KQ7-9MZD. */
export function newBackupCodes(n = 10) {
  return Array.from({ length: n }, () => {
    let s = "";
    for (let i = 0; i < 8; i++) s += CODE_CHARS[randomInt(CODE_CHARS.length)];
    return `${s.slice(0, 4)}-${s.slice(4)}`;
  });
}

/** The same code however it's typed (spaces, dashes, lower case). */
export const normaliseBackup = (code: string) => code.toUpperCase().replace(/[^0-9A-Z]/g, "");
export const hashBackup = (code: string) => createHash("sha256").update(normaliseBackup(code)).digest("hex");
export const looksLikeBackup = (code: string) => normaliseBackup(code).length === 8;
