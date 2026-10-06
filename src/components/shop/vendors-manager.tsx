"use client"

import * as React from "react"
import { ExternalLink, PackageSearch, Pencil, Phone, Plus, Search, Store, Trash2, User } from "lucide-react"

import { addCommonVendors, deleteVendor } from "@/app/app/actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Vendor } from "@/lib/shop/types"
import { COMMON_VENDORS, hostOf, vendorOrderUrl } from "@/lib/shop/vendor-links"
import { StatusBadge } from "./common"
import { useServerAction } from "./use-server-action"
import { VendorFormDialog } from "./vendor-form-dialog"

export function VendorsManager({ vendors }: { vendors: Vendor[] }) {
  const [dialog, setDialog] = React.useState<{ open: boolean; vendor?: Vendor }>({ open: false })
  const [part, setPart] = React.useState("")
  const { run, pending, error } = useServerAction()

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Parts vendors</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Your parts dealers. Open a job and press{" "}
            <span className="font-medium text-foreground">Order parts</span> to order for that vehicle, or
            search every vendor for a part below.
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true })}>
          <Plus />
          Add vendor
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {vendors.length === 0 ? (
        <Card className="items-center gap-3 border-dashed py-14 text-center">
          <Store className="size-6 text-muted-foreground" />
          <p className="font-medium">No vendors yet</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Add the dealers you order from, or start with common ones (
            {COMMON_VENDORS.map((v) => v.name).join(", ")}) and edit them.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" disabled={pending} onClick={() => run(() => addCommonVendors())}>
              Add common dealers
            </Button>
            <Button onClick={() => setDialog({ open: true })}>
              <Plus />
              Add vendor
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card className="gap-3 p-5">
            <label htmlFor="multi-search" className="text-sm font-medium">
              Search all vendors
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="multi-search"
                value={part}
                onChange={(e) => setPart(e.target.value)}
                placeholder="Part name or number, e.g. 2018 Ford F-150 ignition coil"
                className="pl-9"
                autoComplete="off"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Then press Search on each vendor. Vendors without a search link open their home page.
            </p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vendors.map((v) => {
              const href = vendorOrderUrl(v, { part })
              const searches = Boolean(part.trim() && v.searchUrl && href && href !== v.website)
              return (
                <Card key={v.id} className="gap-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{v.name}</p>
                      <a
                        href={v.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-sm text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {hostOf(v.website)}
                      </a>
                    </div>
                    <StatusBadge tone={v.searchUrl ? "success" : "muted"}>
                      {v.searchUrl ? "Auto search" : "Website only"}
                    </StatusBadge>
                  </div>

                  <dl className="space-y-1 text-sm text-muted-foreground">
                    {v.accountNumber && (
                      <div>
                        <dt className="sr-only">Account</dt>
                        <dd>
                          Acct <span className="font-mono text-foreground">{v.accountNumber}</span>
                        </dd>
                      </div>
                    )}
                    {v.phone && (
                      <div>
                        <dt className="sr-only">Phone</dt>
                        <dd>
                          <a
                            href={`tel:${v.phone}`}
                            className="flex items-center gap-1.5 hover:text-foreground"
                          >
                            <Phone className="size-3.5" />
                            {v.phone}
                          </a>
                        </dd>
                      </div>
                    )}
                    {v.contactName && (
                      <div>
                        <dt className="sr-only">Contact</dt>
                        <dd className="flex items-center gap-1.5">
                          <User className="size-3.5" />
                          {v.contactName}
                        </dd>
                      </div>
                    )}
                    {v.notes && <p className="pt-1 text-xs">{v.notes}</p>}
                  </dl>

                  <div className="mt-auto flex flex-wrap items-center gap-2">
                    {href && (
                      <Button asChild size="sm" variant={searches ? "default" : "outline"} className="flex-1">
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          {searches ? <PackageSearch /> : <ExternalLink />}
                          {searches ? "Search" : "Open site"}
                        </a>
                      </Button>
                    )}
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Edit ${v.name}`}
                      onClick={() => setDialog({ open: true, vendor: v })}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Delete ${v.name}`}
                      className="text-muted-foreground hover:text-destructive"
                      disabled={pending}
                      onClick={() => {
                        if (confirm(`Remove ${v.name} from your vendors?`)) run(() => deleteVendor(v.id))
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      <VendorFormDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        vendor={dialog.vendor}
      />
    </div>
  )
}
