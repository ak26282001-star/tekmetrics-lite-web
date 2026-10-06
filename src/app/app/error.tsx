"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <p className="font-medium">Couldn&apos;t load shop data</p>
      <p className="mt-1 text-sm text-muted-foreground">The app couldn&apos;t reach its database.</p>
      <ul className="mt-6 space-y-2 rounded-lg border p-4 text-left text-sm text-muted-foreground">
        <li>
          Check <code className="font-mono">DATABASE_URL</code>: the Supabase{" "}
          <span className="font-medium text-foreground">Transaction pooler</span> string, with your real
          password.
        </li>
        <li>
          Make sure the Supabase project isn&apos;t paused (free projects pause after a week without use —
          restore it in the Supabase dashboard).
        </li>
        <li>After changing environment variables on Vercel, redeploy.</li>
        <li>The exact cause is in the server logs (lines starting with [db]).</li>
      </ul>
      {error.digest && <p className="mt-3 font-mono text-xs text-muted-foreground">Error ID: {error.digest}</p>}
      <Button variant="outline" className="mt-6" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
