import "server-only"

import { connection } from "next/server"
import { asc, desc, eq, isNull } from "drizzle-orm"

import { getDb, schema } from "@/db"
import type { Invoice, Job, PendingJob, Vehicle, VehicleSummary, Vendor } from "./types"

type VehicleRow = typeof schema.vehicles.$inferSelect

export function toVehicle({ customerName, customerPhone, customerEmail, ...v }: VehicleRow): Vehicle {
  return { ...v, customer: { name: customerName, phone: customerPhone, email: customerEmail } }
}

/** All reads go through here: always render with fresh data, never at build time. */
async function db() {
  await connection()
  return getDb()
}

/** Vehicles for the finder, with pending-job counts. */
export async function listVehicles(): Promise<VehicleSummary[]> {
  const d = await db()
  const [vehicleRows, jobRows] = await Promise.all([
    d.select().from(schema.vehicles),
    d
      .select({
        vehicleId: schema.jobs.vehicleId,
        status: schema.jobs.status,
        invoiceId: schema.jobs.invoiceId,
        createdAt: schema.jobs.createdAt,
      })
      .from(schema.jobs),
  ])
  return vehicleRows.map((row) => {
    const jobs = jobRows.filter((j) => j.vehicleId === row.id)
    return {
      ...toVehicle(row),
      inProgress: jobs.filter((j) => j.status === "in_progress").length,
      toInvoice: jobs.filter((j) => j.status === "completed" && !j.invoiceId).length,
      lastActivity: jobs.reduce((latest, j) => (j.createdAt > latest ? j.createdAt : latest), row.createdAt),
    }
  })
}

export async function getVehicleDetail(id: string) {
  const d = await db()
  const [vehicleRow] = await d.select().from(schema.vehicles).where(eq(schema.vehicles.id, id))
  if (!vehicleRow) return null

  const jobs: Job[] = await d
    .select()
    .from(schema.jobs)
    .where(eq(schema.jobs.vehicleId, id))
    .orderBy(desc(schema.jobs.createdAt))
  const invoices: Invoice[] = await d.select().from(schema.invoices).where(eq(schema.invoices.vehicleId, id))

  return { vehicle: toVehicle(vehicleRow), jobs, invoices }
}

export async function listInvoices(): Promise<Invoice[]> {
  const d = await db()
  return d.select().from(schema.invoices).orderBy(desc(schema.invoices.number))
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const d = await db()
  const [row] = await d.select().from(schema.invoices).where(eq(schema.invoices.id, id))
  return row ?? null
}

/** Every job not yet invoiced, across all vehicles, oldest first. */
export async function listPendingJobs(): Promise<PendingJob[]> {
  const d = await db()
  const rows = await d
    .select()
    .from(schema.jobs)
    .innerJoin(schema.vehicles, eq(schema.jobs.vehicleId, schema.vehicles.id))
    .where(isNull(schema.jobs.invoiceId))
    .orderBy(schema.jobs.createdAt)
  return rows.map((r) => ({ ...r.jobs, vehicle: toVehicle(r.vehicles) }))
}

export async function getUnpaidInvoiceTotals() {
  const d = await db()
  return d
    .select({ jobs: schema.invoices.jobs, taxRate: schema.invoices.taxRate })
    .from(schema.invoices)
    .where(eq(schema.invoices.status, "unpaid"))
}

export async function listVendors(): Promise<Vendor[]> {
  const d = await db()
  return d.select().from(schema.vendors).orderBy(asc(schema.vendors.name))
}
