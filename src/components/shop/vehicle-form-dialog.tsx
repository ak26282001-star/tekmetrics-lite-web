"use client"

import * as React from "react"
import { AlertTriangle, Loader2, Sparkles } from "lucide-react"

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
import { Separator } from "@/components/ui/separator"
import { addVehicle, updateVehicle } from "@/app/app/actions"
import type { Vehicle } from "@/lib/shop/types"
import {
  decodeVin,
  isVinCheckDigitValid,
  isVinFormatValid,
  normalizePlate,
  normalizeVin,
} from "@/lib/shop/vin"
import { useServerAction } from "./use-server-action"

type FormState = {
  plate: string
  plateState: string
  vin: string
  year: string
  make: string
  model: string
  trim: string
  color: string
  mileage: string
  customerName: string
  customerPhone: string
  customerEmail: string
}

const empty: FormState = {
  plate: "",
  plateState: "",
  vin: "",
  year: "",
  make: "",
  model: "",
  trim: "",
  color: "",
  mileage: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
}

function fromVehicle(v: Vehicle): FormState {
  return {
    plate: v.plate,
    plateState: v.plateState,
    vin: v.vin,
    year: v.year,
    make: v.make,
    model: v.model,
    trim: v.trim,
    color: v.color,
    mileage: v.mileage?.toString() ?? "",
    customerName: v.customer.name,
    customerPhone: v.customer.phone,
    customerEmail: v.customer.email,
  }
}

type VehicleFormProps = {
  /** Pass to edit an existing vehicle */
  vehicle?: Vehicle
  /** Prefill for a new vehicle, e.g. the plate or VIN that was searched */
  defaults?: Partial<FormState>
  onSaved?: (id: string) => void
}

export function VehicleFormDialog({
  open,
  onOpenChange,
  ...props
}: VehicleFormProps & {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{props.vehicle ? "Edit vehicle" : "Add vehicle"}</DialogTitle>
          <DialogDescription>
            Enter the VIN and press Decode to fill in year, make and model automatically.
          </DialogDescription>
        </DialogHeader>
        {/* Content unmounts when closed, so the form starts fresh on every open */}
        <VehicleForm {...props} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function VehicleForm({ vehicle, defaults, onSaved, onClose }: VehicleFormProps & { onClose: () => void }) {
  const [form, setForm] = React.useState<FormState>(() =>
    vehicle ? fromVehicle(vehicle) : { ...empty, ...defaults },
  )
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState | "form", string>>>({})
  const [decoding, setDecoding] = React.useState(false)
  const [decodeMessage, setDecodeMessage] = React.useState<string | null>(null)
  const { run, pending, error: serverError } = useServerAction()

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const vin = normalizeVin(form.vin)
  const vinFormatOk = vin === "" || isVinFormatValid(vin)
  const vinCheckWarning = vin !== "" && vinFormatOk && !isVinCheckDigitValid(vin)

  async function handleDecode() {
    if (!isVinFormatValid(vin)) {
      setErrors((e) => ({ ...e, vin: "Enter a full 17-character VIN to decode" }))
      return
    }
    setDecoding(true)
    setDecodeMessage(null)
    try {
      const decoded = await decodeVin(vin)
      setForm((f) => ({
        ...f,
        year: decoded.year || f.year,
        make: decoded.make || f.make,
        model: decoded.model || f.model,
        trim: decoded.trim || f.trim,
      }))
      setDecodeMessage(`Decoded: ${[decoded.year, decoded.make, decoded.model].filter(Boolean).join(" ")}`)
    } catch (err) {
      setDecodeMessage(err instanceof Error ? err.message : "VIN lookup failed")
    } finally {
      setDecoding(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const plate = normalizePlate(form.plate)
    const next: typeof errors = {}

    if (!plate && !vin) next.form = "Enter a license plate or a VIN"
    if (vin && !isVinFormatValid(vin)) next.vin = "VINs are 17 characters and never contain I, O or Q"
    if (!form.make.trim()) next.make = "Required"
    if (!form.model.trim()) next.model = "Required"
    if (!form.customerName.trim()) next.customerName = "Required"
    const mileage = form.mileage.trim() === "" ? null : Number(form.mileage.replace(/,/g, ""))
    if (mileage !== null && (!Number.isInteger(mileage) || mileage < 0)) next.mileage = "Enter a whole number"

    setErrors(next)
    if (Object.keys(next).length) return

    const data = {
      plate,
      plateState: form.plateState.trim().toUpperCase(),
      vin,
      year: form.year.trim(),
      make: form.make.trim(),
      model: form.model.trim(),
      trim: form.trim.trim(),
      color: form.color.trim(),
      mileage,
      customer: {
        name: form.customerName.trim(),
        phone: form.customerPhone.trim(),
        email: form.customerEmail.trim(),
      },
    }

    // Duplicate plates/VINs are checked on the server
    if (vehicle) {
      run(
        () => updateVehicle(vehicle.id, data),
        () => {
          onSaved?.(vehicle.id)
          onClose()
        },
      )
    } else {
      run(
        () => addVehicle(data),
        ({ id }) => {
          onSaved?.(id)
          onClose()
        },
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <fieldset className="space-y-4">
        <legend className="mb-3 text-sm font-semibold">Vehicle</legend>

        <div className="grid gap-4 sm:grid-cols-[1fr_96px]">
          <Field label="License plate" error={errors.plate} id="plate">
            <Input
              id="plate"
              value={form.plate}
              onChange={set("plate")}
              placeholder="8KLM204"
              className="font-mono uppercase"
              autoComplete="off"
            />
          </Field>
          <Field label="State" id="plateState">
            <Input
              id="plateState"
              value={form.plateState}
              onChange={set("plateState")}
              placeholder="CA"
              maxLength={3}
              className="uppercase"
            />
          </Field>
        </div>

        <Field
          label="VIN"
          error={
            errors.vin ?? (vinFormatOk ? undefined : "VINs are 17 characters and never contain I, O or Q")
          }
          id="vin"
        >
          <div className="flex gap-2">
            <Input
              id="vin"
              value={form.vin}
              onChange={set("vin")}
              placeholder="17 characters"
              maxLength={20}
              className="font-mono uppercase"
              autoComplete="off"
            />
            <Button type="button" variant="outline" onClick={handleDecode} disabled={decoding}>
              {decoding ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Decode
            </Button>
          </div>
          {vinCheckWarning && (
            <p className="flex items-center gap-1.5 text-xs text-warning">
              <AlertTriangle className="size-3.5" />
              Check digit doesn&apos;t match — double-check the VIN (fine for some imports).
            </p>
          )}
          {decodeMessage && <p className="text-xs text-muted-foreground">{decodeMessage}</p>}
        </Field>

        <div className="grid gap-4 sm:grid-cols-[96px_1fr_1fr]">
          <Field label="Year" id="year">
            <Input
              id="year"
              value={form.year}
              onChange={set("year")}
              placeholder="2019"
              inputMode="numeric"
              maxLength={4}
            />
          </Field>
          <Field label="Make" error={errors.make} id="make">
            <Input id="make" value={form.make} onChange={set("make")} placeholder="Honda" />
          </Field>
          <Field label="Model" error={errors.model} id="model">
            <Input id="model" value={form.model} onChange={set("model")} placeholder="CR-V" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Trim" id="trim">
            <Input id="trim" value={form.trim} onChange={set("trim")} placeholder="EX" />
          </Field>
          <Field label="Color" id="color">
            <Input id="color" value={form.color} onChange={set("color")} placeholder="Silver" />
          </Field>
          <Field label="Mileage" error={errors.mileage} id="mileage">
            <Input
              id="mileage"
              value={form.mileage}
              onChange={set("mileage")}
              placeholder="64,210"
              inputMode="numeric"
            />
          </Field>
        </div>
      </fieldset>

      <Separator />

      <fieldset className="space-y-4">
        <legend className="mb-3 text-sm font-semibold">Customer</legend>
        <Field label="Name" error={errors.customerName} id="customerName">
          <Input
            id="customerName"
            value={form.customerName}
            onChange={set("customerName")}
            placeholder="Dana Ruiz"
            autoComplete="off"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" id="customerPhone">
            <Input
              id="customerPhone"
              type="tel"
              value={form.customerPhone}
              onChange={set("customerPhone")}
              placeholder="(555) 201-3344"
              autoComplete="off"
            />
          </Field>
          <Field label="Email" id="customerEmail">
            <Input
              id="customerEmail"
              type="email"
              value={form.customerEmail}
              onChange={set("customerEmail")}
              placeholder="name@example.com"
              autoComplete="off"
            />
          </Field>
        </div>
      </fieldset>

      {(errors.form || serverError) && (
        <p className="text-sm text-destructive">{errors.form ?? serverError}</p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {vehicle ? "Save changes" : "Add vehicle"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string
  id: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
