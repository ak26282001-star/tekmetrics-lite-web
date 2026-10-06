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
          <span className="font-medium text-foreground">On your computer:</span> stop the app, run{" "}
          <code className="font-mono">npm install</code> then <code className="font-mono">npm run dev</code>, and
          make sure the project folder isn&apos;t read-only.
        </li>
        <li>
          <span className="font-medium text-foreground">Hosted (Vercel etc.):</span> check that{" "}
          <code className="font-mono">TURSO_DATABASE_URL</code> and{" "}
          <code className="font-mono">TURSO_AUTH_TOKEN</code> are correct, then redeploy.
        </li>
        <li>The exact cause is in the server logs (lines starting with [db]).</li>
      </ul>
      {error.digest && <p className="mt-3 font-mono text-xs text-muted-foreground">Error ID: {error.digest}</p>}
      <Button variant="outline" className="mt-6" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
