// Creates / updates the database tables. Runs automatically before `next build` (so Vercel sets up
// Supabase while deploying, instead of on a visitor's first page load) and via `npm run db:migrate`.
// Skips quietly when no database is configured (e.g. a local build without .env).
import path from "node:path"

import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

import { clientConfig, isServerless, resolveDatabaseUrl } from "../src/db/connection.mjs"

// Next.js loads .env files for the app; do the same here for local runs
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file)
  } catch {
    // file not present
  }
}

const { url, source } = resolveDatabaseUrl()
if (!url) {
  console.log("[migrate] No DATABASE_URL / POSTGRES_URL set — skipping database setup.")
  process.exit(0)
}

let parsedHost = "?"
try {
  parsedHost = new URL(url).host
} catch {
  console.error(`[migrate] ${source} is not a valid postgres:// URL.`)
  process.exit(1)
}

const { url: clientUrl, options } = clientConfig(url, { serverless: isServerless() })
const client = postgres(clientUrl, { ...options, max: 1 })
const started = Date.now()
try {
  await migrate(drizzle(client), { migrationsFolder: path.join(process.cwd(), "drizzle") })
  console.log(`[migrate] Database is up to date (${source} → ${parsedHost}, ${Date.now() - started} ms).`)
} catch (err) {
  console.error(`[migrate] Could not set up the database (${source} → ${parsedHost}):`, err?.message ?? err)
  console.error(
    "[migrate] Check the connection string, that the Supabase project isn't paused, then redeploy.",
  )
  process.exitCode = 1
} finally {
  await client.end({ timeout: 5 })
}
