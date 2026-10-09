import "server-only"

import { readFileSync } from "node:fs"
import path from "node:path"

import { count, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

import { createSeedData } from "@/lib/shop/seed"
import { clientConfig, isServerless, resolveDatabaseUrl } from "./connection.mjs"
import * as schema from "./schema"

/**
 * Postgres connection, e.g. Supabase. Either set DATABASE_URL to the Supabase connection string
 * (Project → Connect → "Transaction pooler"), or connect Supabase through Vercel's integration,
 * which sets POSTGRES_URL (pooled) automatically.
 */
const { url: databaseUrl, source: urlSource } = resolveDatabaseUrl()

/** Which environment variable the connection string came from (for setup messages). */
export function getDbUrlSource() {
  return urlSource ?? null
}
const serverless = isServerless()

/**
 * Give up (and show the error page) instead of a spinner forever when the database doesn't answer.
 * Kept under Vercel's 10 s limit on the free plan, after which Vercel shows its own timeout page.
 */
const READY_TIMEOUT_MS = 8_000

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
  const config = clientConfig(url, { serverless })
  return drizzle(postgres(config.url, config.options), { schema })
}

type Db = ReturnType<typeof createDb>

// Reuse one pool across hot reloads in development and across requests in production
const globalForDb = globalThis as unknown as {
  db?: Db
  dbReady?: Promise<void>
}

const migrationsFolder = path.join(process.cwd(), "drizzle")

/** Timestamp of the newest migration shipped with this build, or null if the files aren't deployed. */
function latestMigrationMillis(): number | null {
  try {
    const journal = JSON.parse(
      readFileSync(path.join(migrationsFolder, "meta", "_journal.json"), "utf8"),
    ) as {
      entries: { when: number }[]
    }
    return Math.max(...journal.entries.map((e) => e.when))
  } catch {
    return null
  }
}

/**
 * Tables are normally created while deploying (`npm run build` runs scripts/migrate.mjs), so in
 * production a visit only does one quick check. Migrations run here as a fallback, and always in
 * development.
 */
async function ensureMigrated(db: Db) {
  if (process.env.NODE_ENV === "production") {
    try {
      const rows = await db.execute<{ last: string | null }>(
        sql`select max(created_at)::text as last from drizzle.__drizzle_migrations`,
      )
      const last = Number(rows[0]?.last ?? 0)
      const shipped = latestMigrationMillis()
      // Up to date — or migrated at deploy time and the files just aren't bundled with the server
      if (last > 0 && (shipped === null || last >= shipped)) return
    } catch {
      // Migrations table missing: fall through and create everything
    }
  }
  await migrate(db, { migrationsFolder })
}

async function prepare(db: Db) {
  const started = Date.now()
  await ensureMigrated(db)
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
  const ms = Date.now() - started
  if (ms > 1500) console.warn(`[db] Connecting took ${ms} ms — see /app/status for why.`)
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms)
    }),
  ]).finally(() => clearTimeout(timer))
}

/** Returns the database once migrations (and optional sample data) are applied. */
export async function getDb() {
  const issue = getDbConfigIssue()
  if (issue || !databaseUrl) throw new Error(`Database is not configured (${issue}). See README → Database.`)
  // Connect lazily so importing this module (e.g. during `next build`) never opens a connection
  const db = (globalForDb.db ??= createDb(databaseUrl))
  // Setup runs once per server and keeps going even if a visitor's request gives up waiting,
  // so the next request can use the finished result instead of starting over.
  globalForDb.dbReady ??= prepare(db).catch((err) => {
    globalForDb.dbReady = undefined // a real failure: allow a fresh retry on the next request
    // Shows up in the server / hosting logs with the real cause
    console.error("[db] Could not connect to or migrate the database:", err)
    throw err
  })
  await withTimeout(
    globalForDb.dbReady,
    READY_TIMEOUT_MS,
    `Database didn't respond within ${READY_TIMEOUT_MS / 1000} s`,
  ).catch((err) => {
    if (String(err?.message).startsWith("Database didn't respond"))
      console.error(
        `[db] Still connecting after ${READY_TIMEOUT_MS / 1000} s — showing the error page for now`,
      )
    throw err
  })
  return db
}

export { schema }

/** Connection details safe to show on the status page (never the password). */
export function getDbConnectionInfo() {
  if (!databaseUrl) return null
  try {
    const url = new URL(databaseUrl)
    return { source: urlSource, host: url.hostname, port: url.port || "5432", user: url.username }
  } catch {
    return null
  }
}

/** Measures how long the database takes to answer from this server. */
export async function measureDb() {
  const t0 = Date.now()
  const db = await getDb()
  const readyMs = Date.now() - t0
  const pings: number[] = []
  for (let i = 0; i < 3; i++) {
    const t = Date.now()
    await db.execute(sql`select 1`)
    pings.push(Date.now() - t)
  }
  const [vehicles, jobs, vendors] = await Promise.all(
    [schema.vehicles, schema.jobs, schema.vendors].map((table) =>
      db
        .select({ value: count() })
        .from(table)
        .then((r) => r[0].value),
    ),
  )
  return { readyMs, pingMs: [...pings].sort((a, b) => a - b)[1], counts: { vehicles, jobs, vendors } }
}
