"use client"

import { useSyncExternalStore } from "react"

import { SHOP } from "./settings"
import { createSeedState } from "./seed"
import type { Invoice, Job, ShopState, Vehicle } from "./types"

/**
 * Client-side store persisted to localStorage. There is no backend yet, so
 * data lives in this browser only. Swap these actions for API calls later.
 */
const STORAGE_KEY = "tekmetric-lite:shop:v1"

let state: ShopState | null = null
const listeners = new Set<() => void>()

function load(): ShopState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ShopState
  } catch {
    // Unreadable or blocked storage: fall back to sample data
  }
  return createSeedState()
}

function getSnapshot(): ShopState {
  if (state === null) state = load()
  return state
}

function getServerSnapshot(): ShopState | null {
  return null
}

function setState(updater: (s: ShopState) => ShopState) {
  state = updater(getSnapshot())
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or blocked: keep working in memory
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Keep other open tabs in sync
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return
    state = load()
    listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

/** Returns null during server render and the first hydration pass. */
export function useShop(): ShopState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

const now = () => new Date().toISOString()
export const newId = () => crypto.randomUUID()

export const shopActions = {
  addVehicle(vehicle: Omit<Vehicle, "id" | "createdAt">) {
    const id = newId()
    setState((s) => ({
      ...s,
      vehicles: [{ ...vehicle, id, createdAt: now() }, ...s.vehicles],
    }))
    return id
  },

  updateVehicle(id: string, patch: Partial<Omit<Vehicle, "id">>) {
    setState((s) => ({
      ...s,
      vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }))
  },

  saveJob(job: Omit<Job, "id" | "createdAt" | "completedAt" | "invoiceId"> & { id?: string }) {
    setState((s) => {
      const existing = job.id ? s.jobs.find((j) => j.id === job.id) : undefined
      if (existing) {
        if (existing.invoiceId) return s // invoiced jobs are locked
        const completedAt = job.status === "completed" ? (existing.completedAt ?? now()) : null
        return {
          ...s,
          jobs: s.jobs.map((j) => (j.id === existing.id ? { ...existing, ...job, completedAt } : j)),
          vehicles: bumpMileage(s.vehicles, job.vehicleId, job.mileage),
        }
      }
      const created: Job = {
        ...job,
        id: newId(),
        createdAt: now(),
        completedAt: job.status === "completed" ? now() : null,
        invoiceId: null,
      }
      return {
        ...s,
        jobs: [created, ...s.jobs],
        vehicles: bumpMileage(s.vehicles, job.vehicleId, job.mileage),
      }
    })
  },

  setJobStatus(jobId: string, status: Job["status"]) {
    setState((s) => ({
      ...s,
      jobs: s.jobs.map((j) =>
        j.id === jobId && !j.invoiceId
          ? { ...j, status, completedAt: status === "completed" ? now() : null }
          : j,
      ),
    }))
  },

  deleteJob(jobId: string) {
    setState((s) => ({
      ...s,
      jobs: s.jobs.filter((j) => j.id !== jobId || j.invoiceId !== null),
    }))
  },

  /** Creates an invoice from completed, uninvoiced jobs. Returns the invoice id. */
  createInvoice(vehicleId: string, jobIds: string[]): string | null {
    let invoiceId: string | null = null
    setState((s) => {
      const vehicle = s.vehicles.find((v) => v.id === vehicleId)
      const jobs = s.jobs.filter(
        (j) => jobIds.includes(j.id) && j.vehicleId === vehicleId && j.status === "completed" && !j.invoiceId,
      )
      if (!vehicle || jobs.length === 0) return s

      const id = newId()
      invoiceId = id
      const mileages = jobs.map((j) => j.mileage).filter((m): m is number => m !== null)
      const invoice: Invoice = {
        id,
        number: s.nextInvoiceNumber,
        vehicleId,
        customer: { ...vehicle.customer },
        vehicleLabel: vehicleLabel(vehicle),
        plate: [vehicle.plateState, vehicle.plate].filter(Boolean).join(" "),
        vin: vehicle.vin,
        mileage: mileages.length ? Math.max(...mileages) : vehicle.mileage,
        jobs: jobs.map((j) => ({
          jobId: j.id,
          title: j.title,
          notes: j.notes,
          technician: j.technician,
          items: j.items.map((i) => ({ ...i })),
        })),
        taxRate: SHOP.partsTaxRate,
        status: "unpaid",
        createdAt: now(),
        paidAt: null,
      }
      return {
        ...s,
        nextInvoiceNumber: s.nextInvoiceNumber + 1,
        invoices: [invoice, ...s.invoices],
        jobs: s.jobs.map((j) => (jobs.some((x) => x.id === j.id) ? { ...j, invoiceId: id } : j)),
      }
    })
    return invoiceId
  },

  setInvoiceStatus(invoiceId: string, status: Invoice["status"]) {
    setState((s) => ({
      ...s,
      invoices: s.invoices.map((inv) =>
        inv.id === invoiceId ? { ...inv, status, paidAt: status === "paid" ? now() : null } : inv,
      ),
    }))
  },

  resetDemoData() {
    setState(() => createSeedState())
  },
}

function bumpMileage(vehicles: Vehicle[], vehicleId: string, mileage: number | null) {
  if (mileage === null) return vehicles
  return vehicles.map((v) =>
    v.id === vehicleId && (v.mileage === null || mileage > v.mileage) ? { ...v, mileage } : v,
  )
}

export function vehicleLabel(v: Pick<Vehicle, "year" | "make" | "model" | "trim">) {
  return [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")
}
