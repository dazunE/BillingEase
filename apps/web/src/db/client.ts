import { mkdirSync } from "node:fs";
import path from "node:path";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";

/**
 * Database connection.
 *
 * - With DATABASE_URL set, connects to that PostgreSQL server.
 * - Without it, runs an embedded PostgreSQL (PGlite) stored in PGLITE_DIR
 *   (default `.data/pglite`), so the app works locally with no setup.
 *   PGLITE_DIR=memory:// gives a throwaway in-memory database (used by tests).
 *
 * Migrations in ./drizzle are applied automatically on first use.
 */
export type Db = ReturnType<typeof drizzlePglite<typeof schema>>;

const MIGRATIONS = path.join(process.cwd(), "drizzle");

async function create(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url });
    const db = drizzlePg(pool, { schema });
    await migratePg(db, { migrationsFolder: MIGRATIONS });
    return db as unknown as Db;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  const inMemory = dir.startsWith("memory://");
  if (!inMemory) mkdirSync(dir, { recursive: true });
  const client = inMemory ? new PGlite() : new PGlite(dir);
  const db = drizzlePglite(client, { schema });
  await migratePglite(db, { migrationsFolder: MIGRATIONS });
  return db;
}

// One connection per server process, shared across hot reloads in development.
const g = globalThis as unknown as { __billingeaseDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  if (!g.__billingeaseDb) {
    g.__billingeaseDb = create().catch((err) => {
      // Don't cache a failed connection; the next request tries again.
      g.__billingeaseDb = undefined;
      throw err;
    });
  }
  return g.__billingeaseDb;
}

/** Test helper: start from a brand-new in-memory database. */
export function resetDbForTests(): Promise<Db> {
  g.__billingeaseDb = create();
  return g.__billingeaseDb;
}

export { schema };
