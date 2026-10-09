"use client"

import Link from "next/link"
import { ExternalLink, Loader2, Settings2, Store } from "lucide-react"

import { addCommonVendors } from "@/app/app/actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Vendor } from "@/lib/shop/types"
import { hostOf, isHttpUrl } from "@/lib/shop/vendor-links"
import { useServerAction } from "./use-server-action"

/** Parts dealers as one-click links, shown on the Finder so they're always at hand. */
export function VendorQuickLinks({ vendors }: { vendors: Vendor[] }) {
  const { run, pending, error } = useServerAction()

  return (
    <Card className="gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Store className="size-5 text-primary" />
          <h2 className="font-semibold">Parts vendors</h2>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/app/vendors">
            <Settings2 />
            {vendors.length ? "Manage vendors" : "Add your own"}
          </Link>
        </Button>
      </div>

      {vendors.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            No parts dealers yet. Add the usual ones (NAPA, AutoZone, O&apos;Reilly, Advance, RockAuto,
            WorldPac) in one click, then edit them with your account numbers.
          </p>
          <Button className="shrink-0" disabled={pending} onClick={() => run(() => addCommonVendors())}>
            {pending && <Loader2 className="animate-spin" />}
            Add common dealers
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {vendors.map((v) =>
              isHttpUrl(v.website) ? (
                <Button key={v.id} asChild variant="outline" size="sm">
                  <a href={v.website} target="_blank" rel="noopener noreferrer" title={hostOf(v.website)}>
                    {v.name}
                    <ExternalLink className="text-muted-foreground" />
                  </a>
                </Button>
              ) : null,
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Ordering for a specific car? Open the vehicle and press{" "}
            <span className="font-medium text-foreground">Order parts</span> — the vehicle and VIN are filled
            in for you.
          </p>
        </>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </Card>
  )
}
