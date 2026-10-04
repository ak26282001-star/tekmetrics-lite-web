"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Plus, Search, SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { shopActions, useShop, vehicleLabel } from "@/lib/shop/store"
import type { Job, Vehicle } from "@/lib/shop/types"
import { normalizePlate, normalizeVin } from "@/lib/shop/vin"
import { LoadingState, PlateChip, StatusBadge } from "./common"
import { VehicleFormDialog } from "./vehicle-form-dialog"

type Mode = "plate" | "vin"

export function VehicleFinder() {
  const shop = useShop()
  const router = useRouter()
  const [mode, setMode] = React.useState<Mode>("plate")
  const [query, setQuery] = React.useState("")
  const [adding, setAdding] = React.useState(false)

  const needle = mode === "plate" ? normalizePlate(query) : normalizeVin(query)

  const results = React.useMemo(() => {
    if (!shop) return []
    const list = needle
      ? shop.vehicles.filter((v) => (mode === "plate" ? v.plate.includes(needle) : v.vin.includes(needle)))
      : shop.vehicles
    // Exact matches first, then most recent activity
    return [...list].sort((a, b) => {
      const exact = Number(field(b, mode) === needle) - Number(field(a, mode) === needle)
      return exact || lastActivity(shop.jobs, b).localeCompare(lastActivity(shop.jobs, a))
    })
  }, [shop, needle, mode])

  if (!shop) return <LoadingState />

  return (
    <div className="space-y-8">
      <Card className="gap-0 overflow-hidden p-0">
        <div className="border-b bg-gradient-to-br from-primary/10 via-transparent to-transparent p-5 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Find a vehicle</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search by license plate or VIN. Partial matches work — try the last 6 of the VIN.
          </p>

          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="mt-6">
            <TabsList>
              <TabsTrigger value="plate" className="px-4">
                License plate
              </TabsTrigger>
              <TabsTrigger value="vin" className="px-4">
                VIN
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form
            className="mt-3 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault()
              if (results.length === 1) router.push(`/app/vehicles/${results[0].id}`)
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                aria-label={mode === "plate" ? "License plate" : "VIN"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={mode === "plate" ? "e.g. 8KLM204" : "e.g. 5J6RW2H57KL004821 or 004821"}
                className="h-12 pl-11 font-mono text-base uppercase tracking-wider placeholder:font-sans placeholder:normal-case placeholder:tracking-normal"
                maxLength={mode === "plate" ? 12 : 20}
                autoComplete="off"
              />
            </div>
            <Button type="button" size="lg" className="h-12" onClick={() => setAdding(true)}>
              <Plus />
              Add vehicle
            </Button>
          </form>
        </div>

        <div className="p-2 sm:p-3">
          <p className="px-3 pt-2 pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {needle ? `${results.length} match${results.length === 1 ? "" : "es"}` : "All vehicles"}
          </p>

          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                <SearchX className="size-5 text-muted-foreground" />
              </span>
              <div>
                <p className="font-medium">
                  {needle ? (
                    <>
                      No vehicle with {mode === "plate" ? "plate" : "VIN"}{" "}
                      <span className="font-mono">{needle}</span>
                    </>
                  ) : (
                    "No vehicles yet"
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  New customer? Add the vehicle and we&apos;ll keep its history from here on.
                </p>
              </div>
              <Button onClick={() => setAdding(true)}>
                <Plus />
                {needle ? `Add ${needle}` : "Add vehicle"}
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {results.map((v) => (
                <VehicleRow key={v.id} vehicle={v} jobs={shop.jobs.filter((j) => j.vehicleId === v.id)} />
              ))}
            </ul>
          )}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => {
            if (confirm("Replace all data in this browser with the sample data?")) shopActions.resetDemoData()
          }}
        >
          Reset sample data
        </Button>
      </div>

      <VehicleFormDialog
        open={adding}
        onOpenChange={setAdding}
        existingVehicles={shop.vehicles}
        defaults={needle ? (mode === "plate" ? { plate: needle } : { vin: needle }) : undefined}
        onSaved={(id) => router.push(`/app/vehicles/${id}`)}
      />
    </div>
  )
}

function VehicleRow({ vehicle, jobs }: { vehicle: Vehicle; jobs: Job[] }) {
  const open = jobs.filter((j) => j.status === "in_progress").length
  const toInvoice = jobs.filter((j) => j.status === "completed" && !j.invoiceId).length

  return (
    <li>
      <Link
        href={`/app/vehicles/${vehicle.id}`}
        className="group flex items-center gap-4 rounded-lg px-3 py-4 transition-colors hover:bg-accent/60"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <PlateChip plate={vehicle.plate} state={vehicle.plateState} />
            <p className="font-semibold">{vehicleLabel(vehicle)}</p>
            {open > 0 && <StatusBadge tone="info">{open} in progress</StatusBadge>}
            {toInvoice > 0 && <StatusBadge tone="warning">{toInvoice} to invoice</StatusBadge>}
          </div>
          <p className="mt-1.5 truncate text-sm text-muted-foreground">
            {vehicle.customer.name}
            {vehicle.vin && (
              <>
                <span className="mx-2">·</span>
                <span className="font-mono text-xs">{vehicle.vin}</span>
              </>
            )}
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  )
}

function field(v: Vehicle, mode: Mode) {
  return mode === "plate" ? v.plate : v.vin
}

function lastActivity(jobs: Job[], v: Vehicle) {
  return jobs
    .filter((j) => j.vehicleId === v.id)
    .reduce((latest, j) => (j.createdAt > latest ? j.createdAt : latest), v.createdAt)
}
