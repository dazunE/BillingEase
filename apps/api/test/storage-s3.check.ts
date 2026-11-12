// Live check against a real S3 store: S3_ENDPOINT=... S3_BUCKET=... S3_ACCESS_KEY=... S3_SECRET_KEY=... npx tsx test/storage-s3.check.ts
import assert from "node:assert/strict";
import { s3Storage } from "../src/services/storage";

const env = process.env;
const s = s3Storage({ endpoint: env.S3_ENDPOINT!, bucket: env.S3_BUCKET!, accessKey: env.S3_ACCESS_KEY!, secretKey: env.S3_SECRET_KEY!, region: env.S3_REGION ?? "us-east-1" });
const bytes = new TextEncoder().encode("hello silo " + Date.now());
const key = await s.put("check", bytes, ".txt");
assert.deepEqual(await s.get(key), bytes);
await s.remove(key);
await assert.rejects(s.get(key));
const biz = crypto.randomUUID();
const a = await s.put(biz, bytes, ".txt"), b = await s.put(biz, bytes, ".txt");
await s.removeAll(biz);
await assert.rejects(s.get(a));
await assert.rejects(s.get(b));
console.log("s3 storage OK:", key);
