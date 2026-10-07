import type { DbConfigIssue } from "@/db"

const COPY: Record<DbConfigIssue, { title: string; intro: string }> = {
  "missing-database-url": {
    title: "Connect your Supabase database",
    intro:
      "The app needs a database connection to store vehicles, jobs and invoices. Connected Supabase through Vercel's integration? Make sure it's connected to this project for this environment (Production / Preview), then redeploy — the app uses its POSTGRES_URL automatically. Or set DATABASE_URL yourself:",
  },
  "invalid-url": {
    title: "Database address looks wrong",
    intro:
      "The database URL should start with postgresql:// — copy it again from Supabase. If your password contains special characters like @, # or /, reset it to one with only letters and numbers.",
  },
  "password-placeholder": {
    title: "Fill in your database password",
    intro:
      "The database URL still contains [YOUR-PASSWORD]. Replace it (including the brackets) with your Supabase database password.",
  },
  "supabase-direct-on-serverless": {
    title: "Use Supabase's pooler connection string",
    intro:
      "The database URL uses the direct connection (db.….supabase.co), which Vercel can't reach. Use the Transaction pooler string instead (host ends in pooler.supabase.com, port 6543).",
  },
}

/** Shown instead of the app when the database can't work as configured. */
export function DbSetupNeeded({ issue, source }: { issue: DbConfigIssue; source: string | null }) {
  const { title, intro } = COPY[issue]
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-warning/40 bg-warning/5 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-warning">Setup needed</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{intro}</p>
      {source && source !== "DATABASE_URL" && (
        <p className="mt-2 text-sm text-muted-foreground">
          (The connection string currently comes from <code className="font-mono">{source}</code>. Setting{" "}
          <code className="font-mono">DATABASE_URL</code> overrides it.)
        </p>
      )}
      <ol className="mt-5 list-decimal space-y-2.5 pl-5 text-sm">
        <li>
          In{" "}
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Supabase
          </a>
          , open your project and click <span className="font-medium">Connect</span> at the top.
        </li>
        <li>
          Under <span className="font-medium">Transaction pooler</span>, copy the URI. It looks like{" "}
          <code className="break-all rounded bg-muted px-1 font-mono text-xs">
            postgresql://postgres.abcd:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
          </code>
        </li>
        <li>
          Replace <code className="rounded bg-muted px-1 font-mono">[YOUR-PASSWORD]</code> with your database
          password (Project Settings → Database can reset it).
        </li>
        <li>
          Save it as <code className="rounded bg-muted px-1 font-mono">DATABASE_URL</code>:
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <span className="text-foreground">Vercel:</span> Project → Settings → Environment Variables,
              then redeploy.
            </li>
            <li>
              <span className="text-foreground">Your computer:</span> in a file named{" "}
              <code className="font-mono">.env.local</code> in the project folder, then restart{" "}
              <code className="font-mono">npm run dev</code>.
            </li>
          </ul>
        </li>
      </ol>
      <p className="mt-6 text-xs text-muted-foreground">
        The app creates its tables automatically on the first visit, with row level security turned on so
        they&apos;re not readable through Supabase&apos;s public API.
      </p>
    </div>
  )
}
