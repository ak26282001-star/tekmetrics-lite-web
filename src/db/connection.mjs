// Shared by the app (src/db/index.ts) and the deploy-time migration script (scripts/migrate.mjs).
// Plain JavaScript so the script can run with Node during `npm run build`.

/** Checked in order: your own DATABASE_URL first, then what Vercel's Supabase integration sets. */
export const URL_VARIABLES = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL"]

/** @param {Record<string, string | undefined>} env */
export function resolveDatabaseUrl(env = process.env) {
  const source = URL_VARIABLES.find((name) => env[name]?.trim())
  return source
    ? { url: /** @type {string} */ (env[source]).trim(), source }
    : { url: undefined, source: null }
}

/** @param {Record<string, string | undefined>} env */
export function isServerless(env = process.env) {
  return Boolean(env.VERCEL || env.NETLIFY || env.AWS_LAMBDA_FUNCTION_NAME)
}

/**
 * postgres-js connection string + options.
 * - Query options are stripped: the driver forwards unknown ones (Vercel's `supa=base-pooler.x`,
 *   Prisma's `pgbouncer=true`) to Postgres as settings, which it rejects. SSL is set explicitly.
 * - prepare: false is required by Supabase's transaction pooler (port 6543).
 * - fetch_types: false skips a type-lookup round trip on every new connection (no array columns used).
 * @param {string} url
 * @param {{ serverless?: boolean }} [opts]
 */
export function clientConfig(url, { serverless = false } = {}) {
  const parsed = new URL(url)
  const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)
  parsed.search = ""
  return {
    url: parsed.toString(),
    options: {
      prepare: false,
      fetch_types: false,
      // A few connections so a page's parallel queries don't queue behind each other
      max: serverless ? 3 : 10,
      idle_timeout: serverless ? 20 : 60,
      ssl: isLocalHost ? false : /** @type {const} */ ("require"),
      connect_timeout: 7,
    },
  }
}
