import type { DbConfigIssue } from "@/db"

const COPY: Record<DbConfigIssue, { title: string; intro: string }> = {
  "hosted-without-database": {
    title: "Connect a database to use the shop app",
    intro:
      "This site is running on a serverless host (like Vercel), which can't keep the local database file the app uses on your own computer. Connect a free hosted database instead:",
  },
  "missing-auth-token": {
    title: "Database token missing",
    intro: "TURSO_DATABASE_URL is set, but TURSO_AUTH_TOKEN isn't. Add the token:",
  },
  "invalid-url": {
    title: "Database address looks wrong",
    intro: "TURSO_DATABASE_URL should look like libsql://your-db-name-your-org.turso.io. Fix it:",
  },
}

/** Shown instead of the app when the database can't work as configured. */
export function DbSetupNeeded({ issue }: { issue: DbConfigIssue }) {
  const { title, intro } = COPY[issue]
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-warning/40 bg-warning/5 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-warning">Setup needed</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{intro}</p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
        {issue === "hosted-without-database" && (
          <>
            <li>
              Create a free database at{" "}
              <a
                href="https://turso.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                turso.tech
              </a>
              .
            </li>
            <li>Copy its database URL and create an auth token.</li>
          </>
        )}
        <li>
          In your hosting dashboard (Vercel: Project → Settings → Environment Variables), set{" "}
          <code className="rounded bg-muted px-1 font-mono">TURSO_DATABASE_URL</code> and{" "}
          <code className="rounded bg-muted px-1 font-mono">TURSO_AUTH_TOKEN</code>.
        </li>
        <li>Redeploy. Tables are created automatically on the first visit.</li>
      </ol>
      <p className="mt-6 text-xs text-muted-foreground">
        Running on your own computer instead? Use <code className="font-mono">npm run dev</code> — no setup
        needed.
      </p>
    </div>
  )
}
