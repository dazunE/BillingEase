import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/** Where attachment files live. Local disk now; an S3-compatible store can implement the same interface. */
export interface Storage {
  put(businessId: string, bytes: Uint8Array, ext: string): Promise<string>;
  get(key: string): Promise<Uint8Array>;
  remove(key: string): Promise<void>;
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
      const key = `${businessId}/${randomUUID()}${ext.replace(/[^.a-z0-9]/gi, "").slice(0, 8)}`;
      await mkdir(path.dirname(full(key)), { recursive: true });
      await writeFile(full(key), bytes);
      return key;
    },
    get: async (key) => new Uint8Array(await readFile(full(key))),
    remove: (key) => rm(full(key), { force: true }),
  };
}
