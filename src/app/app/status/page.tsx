import type { Metadata } from "next";
import { connection } from "next/server";
import { AlertTriangle, CheckCircle2, Gauge, Server } from "lucide-react";

import { Card } from "@/components/ui/card";
import { getDbConnectionInfo, measureDb } from "@/db";
import { supabaseRegion, vercelRegionName } from "@/lib/shop/regions";

export const metadata: Metadata = {
  title: "Connection status",
};

/** A shop page needs a few database round trips, so this is roughly how long each page waits. */
const SLOW_PING_MS = 80;

export default async function StatusPage() {
  await connection();
  const info = getDbConnectionInfo();
  const serverRegion = process.env.VERCEL_REGION ?? null;
  const dbRegion = info ? supabaseRegion(info.host) : null;

  let result: Awaited<ReturnType<typeof measureDb>> | null = null;
  let error: string | null = null;
  try {
    result = await measureDb();
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const regionMismatch = Boolean(serverRegion && dbRegion?.vercel && serverRegion !== dbRegion.vercel);
  const slow = result ? result.pingMs >= SLOW_PING_MS : false;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Connection status</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How fast this app reaches its database. Refresh to measure again.
        </p>
      </div>

      {error ? (
        <Banner tone="bad" title="Can't reach the database">
          <p className="break-words font-mono text-xs">{error}</p>
          <p>
            Check the connection string, and that your Supabase project isn&apos;t paused (Supabase dashboard →
            Restore project).
          </p>
        </Banner>
      ) : regionMismatch && dbRegion ? (
        <Banner tone="warn" title="Your app server and database are far apart — this is why pages are slow">
          <p>
            The app runs in <b>{vercelRegionName(serverRegion!)}</b> ({serverRegion}) but your Supabase database
            is in <b>{dbRegion.name}</b> ({dbRegion.region}). Every page waits for several trips between them.
          </p>
          <p className="font-medium text-foreground">Fix (1 minute):</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Vercel → your project → <b>Settings</b> → <b>Functions</b> → <b>Function Region</b>.
            </li>
            <li>
              Choose <b>{dbRegion.name}</b> (<code className="font-mono">{dbRegion.vercel}</code>) and save.
            </li>
            <li>
              <b>Redeploy</b> (Deployments → ⋯ → Redeploy).
            </li>
          </ol>
        </Banner>
      ) : slow ? (
        <Banner tone="warn" title="The database is answering slowly">
          <p>
            Each round trip takes about {result!.pingMs} ms. If your Vercel Function Region isn&apos;t the
            closest one to your Supabase region, change it under Vercel → Settings → Functions, then redeploy.
          </p>
        </Banner>
      ) : (
        <Banner tone="good" title="Connected and fast">
          <p>Database round trips take about {result!.pingMs} ms.</p>
        </Banner>
      )}

      <Card className="gap-0 p-0">
        <dl className="divide-y text-sm">
          <Row icon={Server} label="App server region">
            {serverRegion ? `${vercelRegionName(serverRegion)} (${serverRegion})` : "Not on Vercel (local)"}
          </Row>
          <Row icon={Server} label="Database">
            {info ? (
              <>
                <span className="font-mono text-xs break-all">
                  {info.host}:{info.port}
                </span>
                {dbRegion && (
                  <span className="block text-muted-foreground">
                    Supabase region: {dbRegion.name} ({dbRegion.region})
                  </span>
                )}
                <span className="block text-muted-foreground">from {info.source}</span>
              </>
            ) : (
              "Not configured"
            )}
          </Row>
          {result && (
            <>
              <Row icon={Gauge} label="Round trip (select 1)">
                {result.pingMs} ms
              </Row>
              <Row icon={Gauge} label="Connect + table check">
                {result.readyMs} ms
                <span className="block text-muted-foreground">
                  Near 0 when this server was already warm; the first visit after a pause pays this once.
                </span>
              </Row>
              <Row icon={CheckCircle2} label="Data">
                {result.counts.vehicles} vehicles · {result.counts.jobs} jobs · {result.counts.vendors} vendors
              </Row>
            </>
          )}
        </dl>
      </Card>
    </div>
  );
}

function Banner({
  tone,
  title,
  children,
}: {
  tone: "good" | "warn" | "bad";
  title: string;
  children: React.ReactNode;
}) {
  const styles = {
    good: "border-success/40 bg-success/5 text-success",
    warn: "border-warning/40 bg-warning/5 text-warning",
    bad: "border-destructive/40 bg-destructive/5 text-destructive",
  }[tone];
  const Icon = tone === "good" ? CheckCircle2 : AlertTriangle;
  return (
    <div className={`rounded-xl border p-5 ${styles}`}>
      <p className="flex items-center gap-2 font-semibold">
        <Icon className="size-5 shrink-0" />
        {title}
      </p>
      <div className="mt-3 space-y-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 px-5 py-4 sm:grid-cols-[200px_1fr] sm:gap-4">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}
