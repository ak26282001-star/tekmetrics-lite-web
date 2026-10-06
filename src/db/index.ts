import "server-only"

import path from "node:path"

import { count } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

import { createSeedData } from "@/lib/shop/seed"
import * as schema from "./schema"

/**
 * Postgres connection, e.g. Supabase. Set DATABASE_URL to the Supabase connection string
 * (Project → Connect → "Transaction pooler" for Vercel / serverless hosts).
 */
const databaseUrl = process.env.DATABASE_URL?.trim() || undefined
const serverless = Boolean(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME)

export type DbConfigIssue =
  | "missing-database-url"
  | "invalid-url"
  | "password-placeholder"
  | "supabase-direct-on-serverless"

/** Detects setups that can never work, so the app can explain them instead of failing on every page. */
export function getDbConfigIssue(): DbConfigIssue | null {
  if (!databaseUrl) return "missing-database-url"
  let url: URL
  try {
    url = new URL(databaseUrl)
  } catch {
    return "invalid-url"
  }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") return "invalid-url"
  // Supabase's copied string contains a literal placeholder until the password is filled in
  if (/YOUR[-_]PASSWORD/i.test(decodeURIComponent(url.password))) return "password-placeholder"
  // Supabase direct connections (db.<ref>.supabase.co) are IPv6-only, which Vercel and most
  // serverless hosts can't reach; their pooler hosts work everywhere.
  if (serverless && /^db\.[^.]+\.supabase\.co$/i.test(url.hostname)) return "supabase-direct-on-serverless"
  return null
}

function createDb(url: string) {
  const { hostname } = new URL(url)
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  const client = postgres(url, {
    // Required for Supabase's transaction pooler (port 6543); harmless elsewhere
    prepare: false,
    // Serverless functions each hold their own pool, so keep it small there
    max: serverless ? 1 : 10,
    ssl: isLocalHost ? false : "require",
    connect_timeout: 15,
  })
  return drizzle(client, { schema })
}

type Db = ReturnType<typeof createDb>

// Reuse one pool across hot reloads in development and across requests in production
const globalForDb = globalThis as unknown as {
  db?: Db
  dbReady?: Promise<void>
}

async function prepare(db: Db) {
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") })
  // Sample data is opt-in so a real shop database never gets demo customers
  if (process.env.SEED_SAMPLE_DATA === "true") {
    const [{ value }] = await db.select({ value: count() }).from(schema.vehicles)
    if (value === 0) {
      const seed = createSeedData()
      await db.transaction(async (tx) => {
        await tx.insert(schema.vehicles).values(
          seed.vehicles.map(({ customer, ...v }) => ({
            ...v,
            customerName: customer.name,
            customerPhone: customer.phone,
            customerEmail: customer.email,
          })),
        )
        await tx.insert(schema.jobs).values(seed.jobs)
        await tx.insert(schema.invoices).values(seed.invoices)
        await tx.insert(schema.vendors).values(seed.vendors)
      })
    }
  }
}

/** Returns the database once migrations (and optional sample data) are applied. */
export async function getDb() {
  const issue = getDbConfigIssue()
  if (issue || !databaseUrl) throw new Error(`Database is not configured (${issue}). See README → Database.`)
  // Connect lazily so importing this module (e.g. during `next build`) never opens a connection
  const db = (globalForDb.db ??= createDb(databaseUrl))
  globalForDb.dbReady ??= prepare(db).catch((err) => {
    globalForDb.dbReady = undefined // allow a retry on the next request
    // Shows up in the server / hosting logs with the real cause
    console.error("[db] Could not connect to or migrate the database:", err)
    throw err
  })
  await globalForDb.dbReady
  return db
}

export { schema }
