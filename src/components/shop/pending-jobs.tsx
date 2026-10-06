"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, ChevronRight, Clock, FileText, Search, Wrench } from "lucide-react"

import { createInvoice, setJobStatus } from "@/app/app/actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { vehicleLabel } from "@/lib/shop/format"
import { computeTotals, formatMoney } from "@/lib/shop/money"
import { SHOP } from "@/lib/shop/settings"
import type { PendingJob, Vendor } from "@/lib/shop/types"
import { cn } from "@/lib/utils"
import { PartsBadge, PlateChip, StatusBadge } from "./common"
import { NewJobOrderButton } from "./new-job-order"
import { OrderPartsButton } from "./order-parts-dialog"
import { useServerAction } from "./use-server-action"

export type Filter = "all" | "in_progress" | "parts" | "completed"
const UNASSIGNED = "__unassigned"
const DAY = 86_400_000
/** Jobs open longer than this are flagged */
const STALE_DAYS = 3

export function PendingJobs({
  jobs,
  unpaidTotal,
  unpaidCount,
  now,
  initialFilter = "all",
  vendors,
}: {
  jobs: PendingJob[]
  unpaidTotal: number
  unpaidCount: number
  /** Server time, so "days waiting" renders the same on server and client */
  now: string
  initialFilter?: Filter
  vendors: Vendor[]
}) {
  const router = useRouter()
  const { run, pending, error } = useServerAction()
  const [filter, setFilter] = React.useState<Filter>(initialFilter)
  const [tech, setTech] = React.useState("")
  const [query, setQuery] = React.useState("")
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const nowMs = new Date(now).getTime()
  const rows = jobs.map((job) => ({
    job,
    total: computeTotals(job.items, SHOP.partsTaxRate).total,
    days: Math.floor((nowMs - new Date(job.createdAt).getTime()) / DAY),
  }))

  const inProgress = rows.filter((r) => r.job.status === "in_progress")
  const ready = rows.filter((r) => r.job.status === "completed")
  // Working jobs held up by parts (needed or on order)
  const waiting = inProgress.filter((r) => r.job.partsStatus === "needed" || r.job.partsStatus === "ordered")
  const vendorName = (id: string | null) => vendors.find((v) => v.id === id)?.name
  const readyValue = ready.reduce((sum, r) => sum + r.total, 0)
  const technicians = [...new Set(jobs.map((j) => j.technician).filter(Boolean))].sort()

  const q = query.trim().toLowerCase()
  const visible = rows.filter(({ job }) => {
    if (filter === "parts") {
      if (!waiting.some((r) => r.job.id === job.id)) return false
    } else if (filter !== "all" && job.status !== filter) return false
    if (tech === UNASSIGNED ? job.technician !== "" : tech && job.technician !== tech) return false
    if (!q) return true
    const v = job.vehicle
    return [job.title, v.plate, v.vin, v.customer.name, vehicleLabel(v)].some(
      (f) => f.toLowerCase().includes(q.replace(/[\s-]/g, "")) || f.toLowerCase().includes(q),
    )
  })

  function act(jobId: string, action: () => ReturnType<typeof setJobStatus>) {
    setBusyId(jobId)
    run(action, () => setBusyId(null))
  }

  function invoice(job: PendingJob) {
    setBusyId(job.id)
    run(
      () => createInvoice(job.vehicleId, [job.id]),
      ({ id }) => router.push(`/app/invoices/${id}`),
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pending jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every job that hasn&apos;t been invoiced yet, across all vehicles — oldest first. Mark a job
            complete, then press <span className="font-medium text-foreground">Invoice</span>.
          </p>
        </div>
        <NewJobOrderButton size="default" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={Wrench}
          label="In progress"
          value={String(inProgress.length)}
          hint={`${waiting.length} waiting on parts · ${inProgress.filter((r) => r.days >= STALE_DAYS).length} open ${STALE_DAYS}+ days`}
          onClick={() => setFilter("in_progress")}
          active={filter === "in_progress"}
        />
        <Stat
          icon={CheckCircle2}
          label="Ready to invoice"
          value={formatMoney(readyValue)}
          hint={`${ready.length} completed job${ready.length === 1 ? "" : "s"}`}
          onClick={() => setFilter("completed")}
          active={filter === "completed"}
        />
        <Link
          href="/app/invoices"
          className="rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
        >
          <Stat
            icon={FileText}
            label="Unpaid invoices"
            value={formatMoney(unpaidTotal)}
            hint={`${unpaidCount} awaiting payment`}
          />
        </Link>
      </div>

      <Card className="gap-0 p-0">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="all" className="px-3">
                All <Count n={rows.length} />
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="px-3">
                In progress <Count n={inProgress.length} />
              </TabsTrigger>
              <TabsTrigger value="parts" className="px-3">
                <span className="sm:hidden">Parts</span>
                <span className="hidden sm:inline">Waiting on parts</span> <Count n={waiting.length} />
              </TabsTrigger>
              <TabsTrigger value="completed" className="px-3">
                <span className="sm:hidden">Ready</span>
                <span className="hidden sm:inline">Ready to invoice</span> <Count n={ready.length} />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-1 flex-col gap-3 sm:flex-row lg:justify-end">
            <NativeSelect
              aria-label="Technician"
              value={tech}
              onChange={(e) => setTech(e.target.value)}
              className="sm:w-44"
            >
              <option value="">All technicians</option>
              {technicians.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              <option value={UNASSIGNED}>Unassigned</option>
            </NativeSelect>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search pending jobs"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Plate, customer, job…"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="border-b bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <CheckCircle2 className="size-6 text-success" />
            <p className="font-medium">
              {rows.length === 0 ? "All caught up" : "No jobs match these filters"}
            </p>
            <p className="text-sm text-muted-foreground">
              {rows.length === 0
                ? "Nothing in progress and nothing waiting to be invoiced."
                : "Try a different technician or search."}
            </p>
            {rows.length === 0 && <NewJobOrderButton className="mt-2" />}
          </div>
        ) : (
          <ul className="divide-y">
            {visible.map(({ job, total, days }) => {
              const busy = pending && busyId === job.id
              return (
                <li key={job.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{job.title}</p>
                      {job.status === "in_progress" ? (
                        <StatusBadge tone="info">In progress</StatusBadge>
                      ) : (
                        <StatusBadge tone="success">Ready to invoice</StatusBadge>
                      )}
                      <PartsBadge status={job.partsStatus} vendorName={vendorName(job.partsVendorId)} />
                      <span
                        className={cn(
                          "flex items-center gap-1 text-xs",
                          days >= STALE_DAYS ? "text-warning" : "text-muted-foreground",
                        )}
                      >
                        <Clock className="size-3" />
                        {days === 0 ? "Today" : `${days} day${days === 1 ? "" : "s"}`}
                      </span>
                    </div>
                    <Link
                      href={`/app/vehicles/${job.vehicleId}`}
                      className="group mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm"
                    >
                      <PlateChip plate={job.vehicle.plate} state={job.vehicle.plateState} />
                      <span className="group-hover:underline">{vehicleLabel(job.vehicle)}</span>
                      <span className="text-muted-foreground">· {job.vehicle.customer.name}</span>
                      {job.vehicle.customer.phone && (
                        <span className="text-muted-foreground">· {job.vehicle.customer.phone}</span>
                      )}
                    </Link>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {job.technician || "Unassigned"}
                      {job.partsStatus && job.partsNote && ` · Parts: ${job.partsNote}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <p className="font-semibold tabular-nums sm:w-24 sm:text-right">{formatMoney(total)}</p>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {job.status === "in_progress" && (
                        <OrderPartsButton
                          job={job}
                          vehicle={job.vehicle}
                          vendors={vendors}
                          variant={job.partsStatus === "needed" ? "default" : "outline"}
                        />
                      )}
                      {job.status === "in_progress" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => act(job.id, () => setJobStatus(job.id, "completed"))}
                        >
                          <CheckCircle2 />
                          {busy ? "Saving…" : "Mark complete"}
                        </Button>
                      ) : (
                        <Button size="sm" disabled={pending} onClick={() => invoice(job)}>
                          <FileText />
                          {busy ? "Creating…" : "Invoice"}
                        </Button>
                      )}
                      <Button asChild size="icon-sm" variant="ghost" aria-label="Open vehicle">
                        <Link href={`/app/vehicles/${job.vehicleId}`}>
                          <ChevronRight />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

function Count({ n }: { n: number }) {
  return <span className="ml-1 rounded bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">{n}</span>
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint: string
  onClick?: () => void
  active?: boolean
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </>
  )
  const className = cn(
    "block w-full rounded-xl border bg-card p-5 text-left transition-colors hover:border-primary/40",
    active && "border-primary/60 bg-primary/5",
  )
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(className, "cursor-pointer")} aria-pressed={active}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  )
}
