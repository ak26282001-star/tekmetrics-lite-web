"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-24 text-center">
      <p className="font-medium">Couldn&apos;t load shop data</p>
      <p className="mt-1 text-sm text-muted-foreground">
        The database may be unreachable. Check the server logs, then try again.
      </p>
      <Button variant="outline" className="mt-6" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
