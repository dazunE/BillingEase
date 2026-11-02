import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Config } from "../config";

/** Where attachment files live: local disk, or a bucket on any S3-compatible store. */
export interface Storage {
  put(businessId: string, bytes: Uint8Array, ext: string): Promise<string>;
  get(key: string): Promise<Uint8Array>;
  remove(key: string): Promise<void>;
  /** Every file a business has, when it's deleted. */
  removeAll(businessId: string): Promise<void>;
}

/** Keys are `<businessId>/<uuid><ext>`, the same on disk and in a bucket, so files can be copied across as they are. */
const newKey = (businessId: string, ext: string) => `${businessId}/${randomUUID()}${ext.replace(/[^.a-z0-9]/gi, "").slice(0, 8)}`;

const checkBusinessId = (businessId: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(businessId)) throw new Error("Bad business id.");
};

export function storageFor(config: Config["storage"]): Storage {
  return config.s3 ? s3Storage(config.s3) : diskStorage(config.dir);
}

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
      checkBusinessId(businessId);
      await rm(full(businessId), { recursive: true, force: true });
    },
  };
}

/** Any S3-compatible store (AWS S3, MinIO, Silo, Garage…). The bucket stays private: files are only served through the API. */
export function s3Storage(o: NonNullable<Config["storage"]["s3"]>, client?: S3Client): Storage {
  const s3 = client ?? new S3Client({
    endpoint: o.endpoint ?? undefined,
    region: o.region,
    forcePathStyle: o.forcePathStyle,
    credentials: { accessKeyId: o.accessKeyId, secretAccessKey: o.secretAccessKey },
    // Self-hosted stores often don't accept the newer default checksum headers.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  const Bucket = o.bucket;
  const full = (key: string) => {
    if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}[.a-z0-9]*$/i.test(key)) throw new Error("Bad storage key.");
    return o.prefix + key;
  };
  return {
    async put(businessId, bytes, ext) {
      checkBusinessId(businessId);
      const key = newKey(businessId, ext);
      await s3.send(new PutObjectCommand({ Bucket, Key: full(key), Body: bytes, ContentLength: bytes.byteLength }));
      return key;
    },
    async get(key) {
      const res = await s3.send(new GetObjectCommand({ Bucket, Key: full(key) }));
      if (!res.Body) throw new Error("File not found.");
      return await res.Body.transformToByteArray();
    },
    async remove(key) {
      await s3.send(new DeleteObjectCommand({ Bucket, Key: full(key) }));
    },
    async removeAll(businessId) {
      checkBusinessId(businessId);
      let token: string | undefined;
      do {
        const page = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: `${o.prefix}${businessId}/`, ContinuationToken: token }));
        const keys = (page.Contents ?? []).flatMap((c) => (c.Key ? [{ Key: c.Key }] : []));
        if (keys.length) {
          const res = await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: keys, Quiet: true } }));
          if (res.Errors?.length) throw new Error(`Couldn't delete ${res.Errors.length} file(s): ${res.Errors[0].Message ?? res.Errors[0].Code}`);
        }
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
      } while (token);
    },
  };
}
