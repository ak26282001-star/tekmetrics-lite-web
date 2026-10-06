"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Gauge,
  Mail,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Trash2,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { computeTotals, formatDate, formatMoney } from "@/lib/shop/money"
import { SHOP } from "@/lib/shop/settings"
import { createInvoice, deleteJob, setJobStatus } from "@/app/app/actions"
import { vehicleLabel } from "@/lib/shop/format"
import type { Invoice, Job, Vehicle, Vendor } from "@/lib/shop/types"
import { cn } from "@/lib/utils"
import { PartsBadge, PlateChip, StatusBadge } from "./common"
import { JobDialog } from "./job-dialog"
import { OrderPartsButton } from "./order-parts-dialog"
import { useServerAction } from "./use-server-action"
import { VehicleFormDialog } from "./vehicle-form-dialog"

export function VehicleDetail({
  vehicle,
  jobs,
  invoices,
  vendors,
}: {
  vehicle: Vehicle
  jobs: Job[]
  invoices: Invoice[]
  vendors: Vendor[]
}) {
  const router = useRouter()
  const [editingVehicle, setEditingVehicle] = React.useState(false)
  const [jobDialog, setJobDialog] = React.useState<{ open: boolean; job?: Job }>({ open: false })
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const { run, pending, error } = useServerAction()

  const inProgress = jobs.filter((j) => j.status === "in_progress")
  const readyToInvoice = jobs.filter((j) => j.status === "completed" && !j.invoiceId)
  const invoiced = jobs.filter((j) => j.invoiceId)
  const invoicesById = new Map(invoices.map((i) => [i.id, i]))

  // Only keep selections that are still invoiceable
  const selectedIds = readyToInvoice.filter((j) => selected.has(j.id)).map((j) => j.id)
  const selectedTotal = readyToInvoice
    .filter((j) => selected.has(j.id))
    .reduce((sum, j) => sum + computeTotals(j.items, SHOP.partsTaxRate).total, 0)

  function toggle(jobId: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(jobId)
      else next.delete(jobId)
      return next
    })
  }

  function invoiceSelected() {
    run(
      () => createInvoice(vehicle.id, selectedIds),
      ({ id }) => router.push(`/app/invoices/${id}`),
    )
  }

  function removeJob(job: Job) {
    if (confirm(`Delete “${job.title}”?`)) run(() => deleteJob(job.id))
  }

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/app">
          <ArrowLeft />
          Finder
        </Link>
      </Button>

      <VehicleHeader vehicle={vehicle} onEdit={() => setEditingVehicle(true)} />

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Jobs</h2>
        <div className="flex flex-wrap gap-2">
          {/* Always available: orders for this vehicle, tracked on one of its open jobs */}
          <OrderPartsButton
            jobs={[...inProgress, ...readyToInvoice]}
            vehicle={vehicle}
            vendors={vendors}
            size="default"
          />
          <Button onClick={() => setJobDialog({ open: true })}>
            <Plus />
            Add job
          </Button>
        </div>
      </div>

      {jobs.length === 0 && (
        <Card className="items-center border-dashed py-12 text-center">
          <p className="font-medium">No jobs yet</p>
          <p className="text-sm text-muted-foreground">
            Add the first job to start this vehicle&apos;s history.
          </p>
          <Button onClick={() => setJobDialog({ open: true })}>
            <Plus />
            Add job
          </Button>
        </Card>
      )}

      {inProgress.length > 0 && (
        <JobSection
          title="In progress"
          count={inProgress.length}
          action={
            readyToInvoice.length === 0 && (
              <p className="text-xs text-muted-foreground">Mark a job complete to invoice it.</p>
            )
          }
        >
          {inProgress.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onEdit={() => setJobDialog({ open: true, job })}
              onDelete={() => removeJob(job)}
              vendorName={vendors.find((v) => v.id === job.partsVendorId)?.name}
              actions={
                <>
                  <OrderPartsButton
                    jobs={[job]}
                    jobId={job.id}
                    vehicle={vehicle}
                    vendors={vendors}
                    variant={job.partsStatus === "needed" ? "default" : "outline"}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => run(() => setJobStatus(job.id, "completed"))}
                  >
                    <CheckCircle2 />
                    Mark complete
                  </Button>
                </>
              }
            />
          ))}
        </JobSection>
      )}

      {readyToInvoice.length > 0 && (
        <JobSection
          title="Completed — ready to invoice"
          count={readyToInvoice.length}
          action={
            <Button disabled={selectedIds.length === 0 || pending} onClick={invoiceSelected}>
              <FileText />
              {selectedIds.length
                ? `Create invoice · ${formatMoney(selectedTotal)}`
                : "Select jobs to invoice"}
            </Button>
          }
        >
          {readyToInvoice.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              selectable
              selected={selected.has(job.id)}
              onSelect={(c) => toggle(job.id, c)}
              onEdit={() => setJobDialog({ open: true, job })}
              onDelete={() => removeJob(job)}
              vendorName={vendors.find((v) => v.id === job.partsVendorId)?.name}
              actions={
                <>
                  <OrderPartsButton jobs={[job]} jobId={job.id} vehicle={vehicle} vendors={vendors} />
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => run(() => setJobStatus(job.id, "in_progress"))}
                  >
                    <RotateCcw />
                    Reopen
                  </Button>
                </>
              }
            />
          ))}
        </JobSection>
      )}

      {invoiced.length > 0 && (
        <JobSection title="Service history" count={invoiced.length}>
          {invoiced.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              invoice={job.invoiceId ? invoicesById.get(job.invoiceId) : undefined}
            />
          ))}
        </JobSection>
      )}

      <VehicleFormDialog open={editingVehicle} onOpenChange={setEditingVehicle} vehicle={vehicle} />
      <JobDialog
        open={jobDialog.open}
        onOpenChange={(open) => setJobDialog((d) => ({ ...d, open }))}
        vehicleId={vehicle.id}
        vehicleMileage={vehicle.mileage}
        job={jobDialog.job}
      />
    </div>
  )
}

function VehicleHeader({ vehicle, onEdit }: { vehicle: Vehicle; onEdit: () => void }) {
  return (
    <Card className="gap-0 p-0">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <PlateChip plate={vehicle.plate} state={vehicle.plateState} />
            {vehicle.color && <StatusBadge tone="muted">{vehicle.color}</StatusBadge>}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{vehicleLabel(vehicle)}</h1>
          <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">VIN</dt>
              <dd className="font-mono">{vehicle.vin || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Mileage</dt>
              <dd className="flex items-center gap-1.5 tabular-nums">
                <Gauge className="size-3.5 text-muted-foreground" />
                {vehicle.mileage !== null ? `${vehicle.mileage.toLocaleString()} mi` : "—"}
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="flex items-center gap-2 font-medium">
              <User className="size-4 text-muted-foreground" />
              {vehicle.customer.name}
            </p>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil />
              Edit
            </Button>
          </div>
          <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {vehicle.customer.phone && (
              <a
                href={`tel:${vehicle.customer.phone}`}
                className="flex items-center gap-2 hover:text-foreground"
              >
                <Phone className="size-3.5" />
                {vehicle.customer.phone}
              </a>
            )}
            {vehicle.customer.email && (
              <a
                href={`mailto:${vehicle.customer.email}`}
                className="flex items-center gap-2 hover:text-foreground"
              >
                <Mail className="size-3.5" />
                {vehicle.customer.email}
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function JobSection({
  title,
  count,
  action,
  children,
}: {
  title: string
  count: number
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title} <span className="ml-1 text-foreground">{count}</span>
        </h3>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function JobCard({
  job,
  invoice,
  selectable,
  selected,
  onSelect,
  onEdit,
  onDelete,
  actions,
  vendorName,
}: {
  job: Job
  invoice?: Invoice
  selectable?: boolean
  selected?: boolean
  onSelect?: (checked: boolean) => void
  onEdit?: () => void
  onDelete?: () => void
  actions?: React.ReactNode
  vendorName?: string
}) {
  const totals = computeTotals(job.items, SHOP.partsTaxRate)
  const locked = Boolean(job.invoiceId)

  return (
    <Card className={cn("gap-4 py-5 transition-colors", selected && "border-primary/60 bg-primary/5")}>
      <CardHeader className="flex flex-row items-start gap-3 px-5">
        {selectable && (
          <Checkbox
            checked={selected}
            onCheckedChange={(c) => onSelect?.(c === true)}
            aria-label={`Select ${job.title} for invoice`}
            className="mt-1"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{job.title}</CardTitle>
            {job.status === "in_progress" ? (
              <StatusBadge tone="info">In progress</StatusBadge>
            ) : invoice ? (
              <StatusBadge tone={invoice.status === "paid" ? "success" : "warning"}>
                Invoice #{invoice.number} · {invoice.status === "paid" ? "Paid" : "Unpaid"}
              </StatusBadge>
            ) : (
              <StatusBadge tone="success">Completed</StatusBadge>
            )}
            {!job.invoiceId && <PartsBadge status={job.partsStatus} vendorName={vendorName} />}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(job.completedAt ?? job.createdAt)}
            {job.technician && ` · ${job.technician}`}
            {job.mileage !== null && ` · ${job.mileage.toLocaleString()} mi`}
          </p>
        </div>
        <p className="text-lg font-semibold tabular-nums">{formatMoney(totals.total)}</p>
      </CardHeader>

      <CardContent className="space-y-3 px-5">
        {job.notes && <p className="text-sm text-pretty">{job.notes}</p>}
        {!job.invoiceId && job.partsStatus && job.partsNote && (
          <p className="text-xs text-muted-foreground">Parts: {job.partsNote}</p>
        )}
        {job.items.length > 0 && (
          <ul className="divide-y rounded-lg border text-sm">
            {job.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                      item.type === "labor" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.type}
                  </span>
                  <span className="truncate">{item.description}</span>
                </span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {item.quantity} {item.type === "labor" ? "hr" : "×"} {formatMoney(item.unitPrice)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          {invoice && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/app/invoices/${invoice.id}`}>
                <FileText />
                View invoice
              </Link>
            </Button>
          )}
          {!locked && onEdit && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 />
                Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={onEdit}>
                <Pencil />
                Edit
              </Button>
            </>
          )}
          {actions}
        </div>
      </CardContent>
    </Card>
  )
}
