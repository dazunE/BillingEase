import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";

/**
 * Database connection.
 *
 * - DATABASE_URL set: that PostgreSQL server (production, Docker).
 * - Otherwise an embedded PostgreSQL (PGlite) in PGLITE_DIR (default `.data/pglite`), so the
 *   app runs locally with no setup. `memory://` gives a throwaway database (tests).
 *
 * Migrations run on connect.
 */
export type Db = ReturnType<typeof drizzlePglite<typeof schema>>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
/** A database handle or an open transaction. */
export type Exec = Db | Tx;

export const MIGRATIONS = process.env.BE_MIGRATIONS_DIR ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../migrations");

export type DbHandle = { db: Db; close: () => Promise<void> };

export async function connect(opts: { url?: string; pgliteDir?: string } = {}): Promise<DbHandle> {
  const url = opts.url ?? process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url, max: Number(process.env.DB_POOL_MAX ?? 10) });
    const db = drizzlePg(pool, { schema });
    await migratePg(db, { migrationsFolder: MIGRATIONS });
    return { db: db as unknown as Db, close: () => pool.end() };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = opts.pgliteDir ?? process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  const inMemory = dir.startsWith("memory://");
  if (!inMemory) mkdirSync(dir, { recursive: true });
  const client = inMemory ? new PGlite() : new PGlite(dir);
  const db = drizzlePglite(client, { schema });
  await migratePglite(db, { migrationsFolder: MIGRATIONS });
  return { db, close: () => client.close() };
}
