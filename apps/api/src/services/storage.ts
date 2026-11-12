import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash, createHmac, randomUUID } from "node:crypto";

/** Where attachment files live: local disk, or an S3-compatible store (Silo/MinIO) when S3_ENDPOINT is set. */
export interface Storage {
  put(businessId: string, bytes: Uint8Array, ext: string): Promise<string>;
  get(key: string): Promise<Uint8Array>;
  remove(key: string): Promise<void>;
  /** Every file a business has, when it's deleted. */
  removeAll(businessId: string): Promise<void>;
}

const newKey = (businessId: string, ext: string) => `${businessId}/${randomUUID()}${ext.replace(/[^.a-z0-9]/gi, "").slice(0, 8)}`;

export function diskStorage(dir: string): Storage {
  const root = path.resolve(dir);
  const full = (key: string) => {
    const p = path.resolve(root, key);
    if (!p.startsWith(root + path.sep)) throw new Error("Bad storage key.");
    return p;
  };
  return {
    async put(businessId, bytes, ext) {
      const key = newKey(businessId, ext);
      await mkdir(path.dirname(full(key)), { recursive: true });
      await writeFile(full(key), bytes);
      return key;
    },
    get: async (key) => new Uint8Array(await readFile(full(key))),
    remove: (key) => rm(full(key), { force: true }),
    removeAll: async (businessId) => {
      if (!/^[0-9a-f-]{36}$/i.test(businessId)) throw new Error("Bad business id.");
      await rm(full(businessId), { recursive: true, force: true });
    },
  };
}

export type S3Config = { endpoint: string; bucket: string; accessKey: string; secretKey: string; region: string };

// ponytail: hand-rolled SigV4 (path-style, single PUT) instead of @aws-sdk/client-s3; fine for attachment-sized files.
export function s3Storage(c: S3Config): Storage {
  const sha = (d: string | Uint8Array) => createHash("sha256").update(d).digest("hex");
  const hmac = (k: string | Buffer, d: string) => createHmac("sha256", k).update(d).digest();
  const enc = (v: string) => encodeURIComponent(v).replace(/[!'()*]/g, (ch) => "%" + ch.charCodeAt(0).toString(16).toUpperCase());
  const checkKey = (key: string) => {
    if (key.split("/").some((s) => !s || s === "." || s === "..")) throw new Error("Bad storage key.");
    return key;
  };

  async function call(method: "PUT" | "GET" | "DELETE", key: string, body?: Uint8Array, query: Record<string, string> = {}) {
    const url = new URL(`${c.endpoint.replace(/\/$/, "")}/${c.bucket}${key ? "/" + key.split("/").map(enc).join("/") : ""}`);
    const qs = Object.keys(query).sort().map((k) => `${enc(k)}=${enc(query[k])}`).join("&");
    if (qs) url.search = qs;
    const amzDate = new Date().toISOString().replace(/[-:]|\.\d{3}/g, "");
    const day = amzDate.slice(0, 8);
    const payloadHash = sha(body ?? "");
    const headers: Record<string, string> = { host: url.host, "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate };
    const signed = Object.keys(headers).sort();
    const canonical = [method, url.pathname, qs, signed.map((h) => `${h}:${headers[h]}\n`).join(""), signed.join(";"), payloadHash].join("\n");
    const scope = `${day}/${c.region}/s3/aws4_request`;
    const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha(canonical)].join("\n");
    const kSign = hmac(hmac(hmac(hmac(`AWS4${c.secretKey}`, day), c.region), "s3"), "aws4_request");
    headers.authorization = `AWS4-HMAC-SHA256 Credential=${c.accessKey}/${scope}, SignedHeaders=${signed.join(";")}, Signature=${hmac(kSign, toSign).toString("hex")}`;
    const res = await fetch(url, { method, headers, body });
    if (!res.ok && !(method === "DELETE" && res.status === 404)) throw new Error(`Storage ${method} ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return res;
  }

  return {
    async put(businessId, bytes, ext) {
      const key = newKey(businessId, ext);
      await call("PUT", key, bytes);
      return key;
    },
    get: async (key) => new Uint8Array(await (await call("GET", checkKey(key))).arrayBuffer()),
    remove: async (key) => void (await call("DELETE", checkKey(key))),
    async removeAll(businessId) {
      if (!/^[0-9a-f-]{36}$/i.test(businessId)) throw new Error("Bad business id.");
      // Deleting a key while listing doesn't skip others: each round lists what's left.
      for (;;) {
        const xml = await (await call("GET", "", undefined, { "list-type": "2", prefix: `${businessId}/` })).text();
        const keys = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
        if (!keys.length) return;
        for (const k of keys) await call("DELETE", checkKey(k));
      }
    },
  };
}
