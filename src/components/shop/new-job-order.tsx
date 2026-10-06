"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, Loader2, Plus, Search } from "lucide-react"

import { findVehicles, type VehicleOption } from "@/app/app/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { vehicleLabel } from "@/lib/shop/format"
import { normalizePlate, normalizeVin } from "@/lib/shop/vin"
import { cn } from "@/lib/utils"
import { PlateChip } from "./common"
import { JobForm } from "./job-dialog"
import { VehicleForm } from "./vehicle-form-dialog"

type Step =
  | { name: "vehicle" }
  | { name: "new-vehicle"; query: string }
  | { name: "job"; vehicle: VehicleOption }

/** "New job order" button + dialog: pick (or add) a vehicle, then enter the job. */
export function NewJobOrderButton({
  className,
  size = "sm",
  label = "New job order",
  compact = false,
}: {
  className?: string
  size?: "sm" | "default" | "lg"
  label?: string
  /** Icon-only on small screens */
  compact?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button size={size} className={className} onClick={() => setOpen(true)} aria-label={label}>
        <Plus />
        <span className={cn(compact && "hidden sm:inline")}>{label}</span>
      </Button>
      <NewJobOrderDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export function NewJobOrderDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        {/* Content unmounts when closed, so each order starts at step 1 */}
        <NewJobOrderFlow onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function NewJobOrderFlow({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [step, setStep] = React.useState<Step>({ name: "vehicle" })

  if (step.name === "new-vehicle") {
    // Prefill only when the search looks like a VIN or a plate (not a customer name)
    const compact = normalizePlate(step.query)
    const defaults =
      compact.length === 17
        ? { vin: normalizeVin(step.query) }
        : compact.length >= 2 && compact.length <= 8 && /\d/.test(compact)
          ? { plate: compact }
          : undefined
    return (
      <>
        <StepHeader
          step={1}
          title="Add vehicle"
          description="Enter the VIN and press Decode to fill in year, make and model."
          onBack={() => setStep({ name: "vehicle" })}
        />
        <VehicleForm
          defaults={defaults}
          // Cancel goes back to the picker; after a save, onSaved has already moved us on
          onClose={() => setStep((s) => (s.name === "new-vehicle" ? { name: "vehicle" } : s))}
          onSaved={(id, saved) =>
            setStep({
              name: "job",
              vehicle: {
                id,
                label: vehicleLabel({
                  year: saved.year,
                  make: saved.make,
                  model: saved.model,
                  trim: saved.trim,
                }),
                plate: normalizePlate(saved.plate),
                plateState: saved.plateState.toUpperCase(),
                vin: normalizeVin(saved.vin),
                customerName: saved.customer.name,
                mileage: saved.mileage,
              },
            })
          }
        />
      </>
    )
  }

  if (step.name === "job") {
    const v = step.vehicle
    return (
      <>
        <StepHeader
          step={2}
          title="Job details"
          description="Record the work, with labor hours and parts. You can invoice it once it's completed."
          onBack={() => setStep({ name: "vehicle" })}
        />
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
          <PlateChip plate={v.plate} state={v.plateState} />
          <span className="font-medium">{v.label}</span>
          <span className="text-muted-foreground">· {v.customerName}</span>
        </div>
        <JobForm
          vehicleId={v.id}
          vehicleMileage={v.mileage}
          onClose={onClose}
          onSaved={() => router.push(`/app/vehicles/${v.id}`)}
        />
      </>
    )
  }

  return (
    <>
      <StepHeader
        step={1}
        title="New job order"
        description="Which vehicle is this for? Search by plate, VIN or customer."
      />
      <VehiclePicker
        onPick={(vehicle) => setStep({ name: "job", vehicle })}
        onAddNew={(query) => setStep({ name: "new-vehicle", query })}
      />
    </>
  )
}

function StepHeader({
  step,
  title,
  description,
  onBack,
}: {
  step: number
  title: string
  description: string
  onBack?: () => void
}) {
  return (
    <DialogHeader>
      <p className="text-xs font-medium uppercase tracking-wider text-primary">Step {step} of 2</p>
      <DialogTitle className="flex items-center gap-2">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Back"
            onClick={onBack}
            className="-ml-2"
          >
            <ArrowLeft />
          </Button>
        )}
        {title}
      </DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
  )
}

function VehiclePicker({
  onPick,
  onAddNew,
}: {
  onPick: (v: VehicleOption) => void
  onAddNew: (query: string) => void
}) {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<VehicleOption[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [failed, setFailed] = React.useState(false)

  // Search on the server as the user types (debounced; stale responses are ignored)
  React.useEffect(() => {
    let cancelled = false
    const timer = setTimeout(
      () => {
        setLoading(true)
        findVehicles(query)
          .then((r) => {
            if (cancelled) return
            setResults(r)
            setFailed(false)
          })
          .catch(() => !cancelled && setFailed(true))
          .finally(() => !cancelled && setLoading(false))
      },
      query ? 250 : 0,
    )
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          aria-label="Search vehicles"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Plate, VIN or customer name"
          className="h-11 pl-10 text-base"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {query.trim() ? "Matches" : "Recent vehicles"}
        </p>
        {failed ? (
          <p className="py-6 text-center text-sm text-destructive">
            Couldn&apos;t search vehicles. Try again.
          </p>
        ) : results && results.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
            {query.trim() ? "No vehicle found." : "No vehicles yet."} Add it below.
          </p>
        ) : (
          <ul className={cn("divide-y rounded-lg border", !results && "opacity-50")}>
            {(results ?? []).map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => onPick(v)}
                  className="group flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/60"
                >
                  <PlateChip plate={v.plate} state={v.plateState} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{v.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {v.customerName}
                      {v.vin && <span className="ml-2 font-mono">{v.vin}</span>}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={() => onAddNew(query)}>
        <Plus />
        {query.trim() ? `Add new vehicle “${query.trim()}”` : "Add new vehicle"}
      </Button>
    </div>
  )
}
