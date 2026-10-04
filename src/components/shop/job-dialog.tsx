"use client"

import * as React from "react"
import { Loader2, Package, Plus, Trash2, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { computeTotals, formatMoney, lineTotalCents } from "@/lib/shop/money"
import { SHOP } from "@/lib/shop/settings"
import { saveJob } from "@/app/app/actions"
import type { Job, JobStatus, LineItem, LineItemType } from "@/lib/shop/types"
import { cn } from "@/lib/utils"
import { clientId, useServerAction } from "./use-server-action"

/** Common jobs that prefill the line items */
const PRESETS: { title: string; items: Omit<LineItem, "id">[] }[] = [
  {
    title: "Oil change",
    items: [
      { type: "labor", description: "Oil & filter change", quantity: 0.5, unitPrice: SHOP.laborRate },
      { type: "part", description: "Synthetic oil (qt)", quantity: 5, unitPrice: 9.5 },
      { type: "part", description: "Oil filter", quantity: 1, unitPrice: 12.99 },
    ],
  },
  {
    title: "Tire rotation",
    items: [
      {
        type: "labor",
        description: "Rotate tires & set pressures",
        quantity: 0.3,
        unitPrice: SHOP.laborRate,
      },
    ],
  },
  {
    title: "Front brake pads",
    items: [
      { type: "labor", description: "Replace front brake pads", quantity: 1.2, unitPrice: SHOP.laborRate },
      { type: "part", description: "Ceramic brake pads (front)", quantity: 1, unitPrice: 89 },
    ],
  },
  {
    title: "Diagnostic",
    items: [{ type: "labor", description: "Diagnostic", quantity: 1, unitPrice: SHOP.laborRate }],
  },
]

type ItemDraft = { id: string; type: LineItemType; description: string; quantity: string; unitPrice: string }

const toDraft = (i: Omit<LineItem, "id"> & { id?: string }): ItemDraft => ({
  id: i.id ?? clientId(),
  type: i.type,
  description: i.description,
  quantity: String(i.quantity),
  unitPrice: String(i.unitPrice),
})

const parseItem = (d: ItemDraft): LineItem => ({
  id: d.id,
  type: d.type,
  description: d.description.trim(),
  quantity: Number(d.quantity) || 0,
  unitPrice: Number(d.unitPrice) || 0,
})

type JobFormProps = {
  vehicleId: string
  vehicleMileage: number | null
  /** Pass to edit an existing job */
  job?: Job
}

export function JobDialog({
  open,
  onOpenChange,
  ...props
}: JobFormProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{props.job ? "Edit job" : "Add job"}</DialogTitle>
          <DialogDescription>Record the work done, with labor hours and parts used.</DialogDescription>
        </DialogHeader>
        <JobForm {...props} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function JobForm({ vehicleId, vehicleMileage, job, onClose }: JobFormProps & { onClose: () => void }) {
  const [title, setTitle] = React.useState(job?.title ?? "")
  const [technician, setTechnician] = React.useState(job?.technician ?? "")
  const [mileage, setMileage] = React.useState(job?.mileage?.toString() ?? vehicleMileage?.toString() ?? "")
  const [status, setStatus] = React.useState<JobStatus>(job?.status ?? "in_progress")
  const [notes, setNotes] = React.useState(job?.notes ?? "")
  const [items, setItems] = React.useState<ItemDraft[]>(() => job?.items.map(toDraft) ?? [])
  const { run, pending, error, setError } = useServerAction()

  const totals = computeTotals(items.map(parseItem), SHOP.partsTaxRate)

  function applyPreset(preset: (typeof PRESETS)[number]) {
    if (!title.trim()) setTitle(preset.title)
    setItems((prev) => [...prev, ...preset.items.map(toDraft)])
  }

  function addItem(type: LineItemType) {
    setItems((prev) => [
      ...prev,
      toDraft({
        type,
        description: "",
        quantity: 1,
        unitPrice: type === "labor" ? SHOP.laborRate : 0,
      }),
    ])
  }

  function updateItem(id: string, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return setError("Give the job a title, e.g. “Front brake pads”")
    const parsed = items.map(parseItem)
    if (parsed.some((i) => !i.description)) return setError("Every line item needs a description")
    if (parsed.some((i) => i.quantity <= 0 || i.unitPrice < 0))
      return setError("Quantities must be above zero and prices can't be negative")
    const miles = mileage.trim() === "" ? null : Number(mileage.replace(/,/g, ""))
    if (miles !== null && (!Number.isInteger(miles) || miles < 0)) return setError("Enter a valid mileage")

    run(
      () =>
        saveJob({
          id: job?.id,
          vehicleId,
          title: title.trim(),
          technician: technician.trim(),
          mileage: miles,
          status,
          notes: notes.trim(),
          items: parsed,
        }),
      onClose,
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {!job && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Quick add:</span>
          {PRESETS.map((p) => (
            <Button key={p.title} type="button" variant="outline" size="sm" onClick={() => applyPreset(p)}>
              <Plus />
              {p.title}
            </Button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="job-title">Job title</Label>
          <Input
            id="job-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Front brake pads & rotors"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-tech">Technician</Label>
          <Input
            id="job-tech"
            value={technician}
            onChange={(e) => setTechnician(e.target.value)}
            placeholder="Marcus T."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="job-mileage">Mileage in</Label>
            <Input
              id="job-mileage"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-status">Status</Label>
            <NativeSelect
              id="job-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
            >
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </NativeSelect>
          </div>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="job-notes">What was done / notes</Label>
          <Textarea
            id="job-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Front pads at 2mm. Replaced pads and rotors, test drove — no noise."
            rows={3}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Labor & parts</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => addItem("labor")}>
              <Wrench />
              Labor
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addItem("part")}>
              <Package />
              Part
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
            No line items yet. Add labor or parts, or use a quick add above.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="hidden grid-cols-[88px_1fr_80px_100px_90px_36px] gap-2 px-1 text-xs text-muted-foreground sm:grid">
              <span>Type</span>
              <span>Description</span>
              <span>Qty / hrs</span>
              <span>Price / rate</span>
              <span className="text-right">Total</span>
              <span />
            </div>
            {items.map((item) => {
              const line = parseItem(item)
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_1fr_36px] gap-2 rounded-lg border p-2 sm:grid-cols-[88px_1fr_80px_100px_90px_36px] sm:items-center sm:rounded-none sm:border-0 sm:p-0"
                >
                  <NativeSelect
                    aria-label="Type"
                    value={item.type}
                    onChange={(e) => updateItem(item.id, { type: e.target.value as LineItemType })}
                    className="col-span-2 sm:col-span-1"
                  >
                    <option value="labor">Labor</option>
                    <option value="part">Part</option>
                  </NativeSelect>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove line"
                    className="text-muted-foreground hover:text-destructive sm:order-last"
                    onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                  >
                    <Trash2 />
                  </Button>
                  <Input
                    aria-label="Description"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    placeholder={item.type === "labor" ? "Labor description" : "Part name / number"}
                    className="col-span-3 sm:col-span-1"
                  />
                  <Input
                    aria-label={item.type === "labor" ? "Hours" : "Quantity"}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: e.target.value })}
                    inputMode="decimal"
                  />
                  <Input
                    aria-label={item.type === "labor" ? "Hourly rate" : "Unit price"}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, { unitPrice: e.target.value })}
                    inputMode="decimal"
                  />
                  <span className="self-center text-right text-sm tabular-nums">
                    {formatMoney(lineTotalCents(line) / 100)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <dl className="ml-auto w-full max-w-xs space-y-1.5 pt-2 text-sm">
          <TotalRow label="Labor" value={totals.labor} />
          <TotalRow label="Parts" value={totals.parts} />
          <TotalRow label={`Tax (${(SHOP.partsTaxRate * 100).toFixed(2)}% on parts)`} value={totals.tax} />
          <TotalRow label="Total" value={totals.total} strong />
        </dl>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {job ? "Save job" : "Add job"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function TotalRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div
      className={cn("flex justify-between", strong ? "border-t pt-2 font-semibold" : "text-muted-foreground")}
    >
      <dt>{label}</dt>
      <dd className="tabular-nums">{formatMoney(value)}</dd>
    </div>
  )
}
