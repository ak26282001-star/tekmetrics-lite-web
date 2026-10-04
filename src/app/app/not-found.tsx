import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="font-medium">Not found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        This vehicle or invoice doesn&apos;t exist, or it was removed.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/app">Back to finder</Link>
      </Button>
    </div>
  );
}
