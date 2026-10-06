"use client"

import * as React from "react"
import Link from "next/link"
import { Check, Copy, ExternalLink, Loader2, PackageCheck, PackageSearch, ShoppingCart } from "lucide-react"

import { setPartsStatus } from "@/app/app/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Separator } from "@/components/ui/separator"
import { vehicleLabel } from "@/lib/shop/format"
import type { Job, Vehicle, Vendor } from "@/lib/shop/types"
import { hostOf, vendorOrderUrl } from "@/lib/shop/vendor-links"
import { cn } from "@/lib/utils"
import { PartsBadge, PlateChip } from "./common"
import { useServerAction } from "./use-server-action"

type OrderJob = Pick<Job, "id" | "title" | "items" | "partsStatus" | "partsVendorId" | "partsNote">
type OrderVehicle = Pick<Vehicle, "year" | "make" | "model" | "trim" | "vin" | "plate" | "plateState">

/**
 * Opens the order-parts dialog for a vehicle. Pass the vehicle's open (uninvoiced) jobs so the order
 * can be tracked on one of them; with no jobs it still lets you order, just without status tracking.
 */
export function OrderPartsButton({
  jobs,
  jobId,
  vehicle,
  vendors,
  size = "sm",
  variant = "outline",
  className,
}: {
  jobs: OrderJob[]
  /** Preselect this job (e.g. when opened from a job card) */
  jobId?: string
  vehicle: OrderVehicle
  vendors: Vendor[]
  size?: "sm" | "default"
  variant?: "outline" | "default" | "ghost"
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const preselected = jobs.find((j) => j.id === jobId)
  return (
    <>
      <Button size={size} variant={variant} className={className} onClick={() => setOpen(true)}>
        <ShoppingCart />
        Order parts
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order parts</DialogTitle>
            <DialogDescription>
              {preselected ? (
                <>
                  For <span className="font-medium text-foreground">{preselected.title}</span>.{" "}
                </>
              ) : null}
              The vehicle is filled in for you.
            </DialogDescription>
          </DialogHeader>
          <OrderParts
            jobs={jobs}
            initialJobId={preselected?.id ?? jobs[0]?.id}
            vehicle={vehicle}
            vendors={vendors}
            onDone={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

const partNames = (job?: OrderJob) => [
  ...new Set((job?.items ?? []).filter((i) => i.type === "part").map((i) => i.description)),
]

function OrderParts({
  jobs,
  initialJobId,
  vehicle,
  vendors,
  onDone,
}: {
  jobs: OrderJob[]
  initialJobId?: string
  vehicle: OrderVehicle
  vendors: Vendor[]
  onDone: () => void
}) {
  const [jobId, setJobId] = React.useState(initialJobId ?? "")
  const job = jobs.find((j) => j.id === jobId)
  const partItems = partNames(job)
  const [part, setPart] = React.useState(() => partNames(jobs.find((j) => j.id === initialJobId))[0] ?? "")
  const [copied, setCopied] = React.useState(false)
  const [vendorId, setVendorId] = React.useState(job?.partsVendorId ?? "")
  const [note, setNote] = React.useState(job?.partsNote ?? "")

  function selectJob(id: string) {
    const next = jobs.find((j) => j.id === id)
    setJobId(id)
    setPart(partNames(next)[0] ?? part)
    setVendorId(next?.partsVendorId ?? vendorId)
    setNote(next?.partsNote ?? "")
  }
  const { run, pending, error } = useServerAction()

  const ctx = {
    part,
    vehicle: { year: vehicle.year, make: vehicle.make, model: vehicle.model, vin: vehicle.vin },
  }

  async function copyVin() {
    if (!vehicle.vin) return
    try {
      await navigator.clipboard.writeText(vehicle.vin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard can be unavailable (e.g. plain-http LAN address); the VIN is still shown to copy by hand
    }
  }

  function save(status: "needed" | "ordered" | "received" | null, after?: () => void) {
    if (!job) return
    run(() => setPartsStatus(job.id, { status, vendorId: vendorId || null, note }), after)
  }

  return (
    <div className="space-y-6">
      {/* The vehicle being worked on */}
      <div className="rounded-lg border bg-muted/40 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <PlateChip plate={vehicle.plate} state={vehicle.plateState} />
          <p className="font-semibold">{vehicleLabel(vehicle)}</p>
          {job && (
            <PartsBadge
              status={job.partsStatus}
              vendorName={vendors.find((v) => v.id === job.partsVendorId)?.name}
            />
          )}
        </div>
        {vehicle.vin ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">VIN</span>
            <code className="rounded bg-background px-2 py-1 font-mono text-sm tracking-wider select-all">
              {vehicle.vin}
            </code>
            <Button type="button" size="sm" variant="ghost" onClick={copyVin}>
              {copied ? <Check className="text-success" /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-xs text-warning">
            No VIN on file — add it to the vehicle for exact fitment.
          </p>
        )}
      </div>

      {jobs.length > 1 && (
        <div className="space-y-2">
          <Label htmlFor="op-job">For job</Label>
          <NativeSelect id="op-job" value={jobId} onChange={(e) => selectJob(e.target.value)}>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="op-part">Part needed</Label>
        <Input
          id="op-part"
          value={part}
          onChange={(e) => setPart(e.target.value)}
          placeholder="e.g. front brake pads, ignition coil"
          autoComplete="off"
        />
        {partItems.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {partItems.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPart(p)}
                className={cn(
                  "cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-accent",
                  part === p && "border-primary/60 bg-primary/10 text-primary",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Order from</p>
        {vendors.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No parts vendors yet.{" "}
            <Link href="/app/vendors" className="font-medium text-primary hover:underline">
              Add your dealers
            </Link>{" "}
            to order from here.
          </div>
        ) : (
          <ul className="divide-y rounded-lg border">
            {vendors.map((v) => {
              const href = vendorOrderUrl(v, ctx)
              const fillsVehicle = Boolean(v.searchUrl) && href !== null && href !== v.website
              return (
                <li key={v.id} className="flex items-center gap-3 px-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{v.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {hostOf(v.website)}
                      {v.accountNumber && ` · Acct ${v.accountNumber}`}
                      {v.phone && ` · ${v.phone}`}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 text-xs",
                        fillsVehicle ? "text-success" : "text-muted-foreground",
                      )}
                    >
                      {fillsVehicle
                        ? "Searches this vehicle + part"
                        : vehicle.vin
                          ? "Opens site · VIN copied to paste in their lookup"
                          : "Opens site"}
                    </p>
                  </div>
                  {href ? (
                    <Button asChild size="sm" variant={fillsVehicle ? "default" : "outline"}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          setVendorId(v.id)
                          void copyVin()
                        }}
                      >
                        {fillsVehicle ? <PackageSearch /> : <ExternalLink />}
                        {fillsVehicle ? "Search" : "Open"}
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-destructive">Invalid link</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          Dealer sites open in a new tab (they can&apos;t be shown inside this app).{" "}
          <Link href="/app/vendors" className="text-primary hover:underline">
            Manage vendors
          </Link>
        </p>
      </div>

      <Separator />

      {job ? (
        <PartsStatusSection
          job={job}
          vendors={vendors}
          vendorId={vendorId}
          setVendorId={setVendorId}
          note={note}
          setNote={setNote}
          pending={pending}
          error={error}
          save={(status) => save(status, onDone)}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          This vehicle has no open job. Add a job to track parts as needed → ordered → received.
        </p>
      )}
    </div>
  )
}

function PartsStatusSection({
  job,
  vendors,
  vendorId,
  setVendorId,
  note,
  setNote,
  pending,
  error,
  save,
}: {
  job: OrderJob
  vendors: Vendor[]
  vendorId: string
  setVendorId: (id: string) => void
  note: string
  setNote: (note: string) => void
  pending: boolean
  error: string | null
  save: (status: "needed" | "ordered" | "received" | null) => void
}) {
  // Track where the parts are
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Parts status</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="op-vendor" className="text-xs text-muted-foreground">
            Ordered from
          </Label>
          <NativeSelect id="op-vendor" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
            <option value="">—</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="op-note" className="text-xs text-muted-foreground">
            Order # / ETA
          </Label>
          <Input
            id="op-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="PO 48812, arriving 2pm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {job.partsStatus && (
          <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => save(null)}>
            Clear status
          </Button>
        )}
        {job.partsStatus !== "needed" && job.partsStatus !== "ordered" && (
          <Button type="button" variant="outline" disabled={pending} onClick={() => save("needed")}>
            Mark needs parts
          </Button>
        )}
        {job.partsStatus === "ordered" ? (
          <Button type="button" disabled={pending} onClick={() => save("received")}>
            {pending ? <Loader2 className="animate-spin" /> : <PackageCheck />}
            Parts received
          </Button>
        ) : (
          <Button type="button" disabled={pending} onClick={() => save("ordered")}>
            {pending ? <Loader2 className="animate-spin" /> : <Check />}
            Mark parts ordered
          </Button>
        )}
      </div>
    </div>
  )
}
