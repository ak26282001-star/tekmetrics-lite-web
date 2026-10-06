import "server-only"

import { mkdirSync } from "node:fs"
import path from "node:path"

import { createClient } from "@libsql/client"
import { count } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"
import { migrate } from "drizzle-orm/libsql/migrator"

import { createSeedData } from "@/lib/shop/seed"
import * as schema from "./schema"

/**
 * Local development uses a SQLite file at data/shop.db.
 * In production set TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) to use a hosted libSQL database.
 */
const remoteUrl = process.env.TURSO_DATABASE_URL
const isLocal = !remoteUrl

function createDb() {
  if (isLocal) mkdirSync(path.join(process.cwd(), "data"), { recursive: true })
  const client = createClient({
    url: remoteUrl ?? "file:data/shop.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  return drizzle(client, { schema })
}

type Db = ReturnType<typeof createDb>

// Reuse one connection across hot reloads in development
const globalForDb = globalThis as unknown as {
  db?: Db
  dbReady?: Promise<void>
}

async function prepare(db: Db) {
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") })
  // Sample data only for a brand-new local database, never for a hosted one
  if (isLocal && process.env.SEED_SAMPLE_DATA !== "false") {
    const [{ value }] = await db.select({ value: count() }).from(schema.vehicles)
    if (value === 0) {
      const seed = createSeedData()
      await db.batch([
        db.insert(schema.vehicles).values(
          seed.vehicles.map(({ customer, ...v }) => ({
            ...v,
            customerName: customer.name,
            customerPhone: customer.phone,
            customerEmail: customer.email,
          })),
        ),
        db.insert(schema.jobs).values(seed.jobs),
        db.insert(schema.invoices).values(seed.invoices),
        db.insert(schema.vendors).values(seed.vendors),
      ])
    }
  }
}

/** Returns the database once migrations (and first-run sample data) are applied. */
export async function getDb() {
  // Connect lazily so importing this module (e.g. during `next build`) never opens the database
  const db = (globalForDb.db ??= createDb())
  globalForDb.dbReady ??= prepare(db).catch((err) => {
    globalForDb.dbReady = undefined // allow a retry on the next request
    throw err
  })
  await globalForDb.dbReady
  return db
}

export { schema }
