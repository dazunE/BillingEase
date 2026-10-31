import { lookup as dnsLookup } from "node:dns";
import { request } from "node:https";
import { isIP } from "node:net";

/** Reads an OAuth app's client metadata document from the https URL that is its client id. */
export type FetchClientDocument = (url: URL) => Promise<unknown>;

const MAX_BYTES = 64 * 1024;

/** Addresses an outside URL must never reach: this machine, the private network, cloud metadata. */
export function isPrivateAddress(ip: string) {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateAddress(v6.slice(7));
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe8") || v6.startsWith("fe9") || v6.startsWith("fea") || v6.startsWith("feb") || v6.startsWith("ff");
}

/**
 * The real fetch: https only, public addresses only (checked as the connection is made, so a
 * name can't switch to a private address afterwards), no redirects, small and quick. The URL
 * comes from whoever starts a sign-in, so it is treated as hostile.
 */
export const fetchClientDocument: FetchClientDocument = (url) => new Promise((resolve, reject) => {
  if (url.protocol !== "https:") return reject(new Error("not https"));
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) return reject(new Error("an address, not a name"));
  const req = request(url, {
    method: "GET",
    headers: { accept: "application/json" },
    timeout: 5000,
    lookup: (hostname, options, cb) => {
      dnsLookup(hostname, options, (err, address, family) => {
        if (err) return cb(err, address, family);
        const all = Array.isArray(address) ? address.map((a) => a.address) : [address];
        if (!all.length || all.some(isPrivateAddress)) return cb(new Error("not a public address"), address, family);
        cb(null, address, family);
      });
    },
  }, (res) => {
    if (res.statusCode !== 200) {
      res.resume();
      return reject(new Error(`HTTP ${res.statusCode}`));
    }
    const chunks: Buffer[] = [];
    let size = 0;
    res.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BYTES) {
        req.destroy(new Error("too large"));
        return;
      }
      chunks.push(c);
    });
    res.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (err) {
        reject(err);
      }
    });
    res.on("error", reject);
  });
  req.on("timeout", () => req.destroy(new Error("timed out")));
  req.on("error", reject);
  req.end();
});
