"use server"

import { revalidatePath } from "next/cache"
import { and, desc, eq, inArray, isNull, lt, max, ne, or, sql } from "drizzle-orm"
import { z } from "zod"

import { getDb, schema } from "@/db"
import { SHOP } from "@/lib/shop/settings"
import { vehicleLabel } from "@/lib/shop/format"
import type { Invoice } from "@/lib/shop/types"
import {
  COMMON_VENDORS,
  PLACEHOLDERS,
  hasPlaceholder,
  isHttpUrl,
  normalizeUrl,
  toSearchTemplate,
} from "@/lib/shop/vendor-links"
import { isVinFormatValid, normalizePlate, normalizeVin } from "@/lib/shop/vin"

// Server Actions are public POST endpoints: validate every input here, not just in the UI.
// TODO: add authentication before deploying publicly.

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string }

const fail = (error: string) => ({ ok: false, error }) as const
const ok = <T>(data: T) => ({ ok: true, data }) as const

function done() {
  revalidatePath("/app", "layout")
}

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input"
}

const now = () => new Date().toISOString()

// ---------------------------------------------------------------- vehicles

const vehicleInput = z.object({
  plate: z.string().max(12).transform(normalizePlate),
  plateState: z
    .string()
    .max(3)
    .transform((s) => s.trim().toUpperCase()),
  vin: z
    .string()
    .max(20)
    .transform(normalizeVin)
    .refine((v) => v === "" || isVinFormatValid(v), "VINs are 17 characters and never contain I, O or Q"),
  year: z.string().trim().max(4),
  make: z.string().trim().min(1, "Make is required").max(40),
  model: z.string().trim().min(1, "Model is required").max(60),
  trim: z.string().trim().max(40),
  color: z.string().trim().max(30),
  mileage: z.number().int().min(0).max(5_000_000).nullable(),
  customer: z.object({
    name: z.string().trim().min(1, "Customer name is required").max(100),
    phone: z.string().trim().max(30),
    email: z.string().trim().max(120),
  }),
})

export type VehicleInput = z.input<typeof vehicleInput>

async function findDuplicate(input: z.output<typeof vehicleInput>, excludeId?: string) {
  const d = await getDb()
  const matches = []
  if (input.vin) matches.push(eq(schema.vehicles.vin, input.vin))
  if (input.plate)
    matches.push(
      and(eq(schema.vehicles.plate, input.plate), eq(schema.vehicles.plateState, input.plateState)),
    )
  if (matches.length === 0) return null
  const [dup] = await d
    .select({ vin: schema.vehicles.vin, plate: schema.vehicles.plate })
    .from(schema.vehicles)
    .where(and(or(...matches), excludeId ? ne(schema.vehicles.id, excludeId) : undefined))
    .limit(1)
  if (!dup) return null
  return input.vin && dup.vin === input.vin
    ? "A vehicle with this VIN already exists"
    : "A vehicle with this plate already exists"
}

function vehicleColumns(v: z.output<typeof vehicleInput>) {
  const { customer, ...rest } = v
  return {
    ...rest,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email,
  }
}

export async function addVehicle(raw: VehicleInput): Promise<ActionResult<{ id: string }>> {
  const parsed = vehicleInput.safeParse(raw)
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const v = parsed.data
  if (!v.plate && !v.vin) return fail("Enter a license plate or a VIN")
  const dup = await findDuplicate(v)
  if (dup) return fail(dup)

  const id = crypto.randomUUID()
  const d = await getDb()
  await d.insert(schema.vehicles).values({ id, ...vehicleColumns(v), createdAt: now() })
  done()
  return ok({ id })
}

export async function updateVehicle(id: string, raw: VehicleInput): Promise<ActionResult> {
  const parsed = vehicleInput.safeParse(raw)
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const v = parsed.data
  if (!v.plate && !v.vin) return fail("Enter a license plate or a VIN")
  const dup = await findDuplicate(v, id)
  if (dup) return fail(dup)

  const d = await getDb()
  await d.update(schema.vehicles).set(vehicleColumns(v)).where(eq(schema.vehicles.id, id))
  done()
  return ok(null)
}

export type VehicleOption = {
  id: string
  label: string
  plate: string
  plateState: string
  vin: string
  customerName: string
  mileage: number | null
}

/** Search vehicles by plate, VIN or customer name (most recent first when the query is empty). */
export async function findVehicles(query: string): Promise<VehicleOption[]> {
  const q = String(query ?? "")
    .trim()
    .slice(0, 40)
  const compact = normalizePlate(q) // plates and VINs are stored uppercase without spaces
  const d = await getDb()
  const v = schema.vehicles
  const rows = await d
    .select()
    .from(v)
    .where(
      q
        ? or(
            compact ? sql`instr(${v.plate}, ${compact}) > 0` : undefined,
            compact ? sql`instr(${v.vin}, ${compact}) > 0` : undefined,
            sql`instr(lower(${v.customerName}), ${q.toLowerCase()}) > 0`,
          )
        : undefined,
    )
    .orderBy(desc(v.createdAt))
    .limit(8)
  return rows.map((r) => ({
    id: r.id,
    label: vehicleLabel(r),
    plate: r.plate,
    plateState: r.plateState,
    vin: r.vin,
    customerName: r.customerName,
    mileage: r.mileage,
  }))
}

// -------------------------------------------------------------------- jobs

const jobInput = z.object({
  id: z.string().optional(),
  vehicleId: z.string().min(1),
  title: z.string().trim().min(1, "Give the job a title").max(120),
  notes: z.string().trim().max(2000),
  technician: z.string().trim().max(60),
  mileage: z.number().int().min(0).max(5_000_000).nullable(),
  status: z.enum(["in_progress", "completed"]),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.enum(["labor", "part"]),
        description: z.string().trim().min(1, "Every line item needs a description").max(200),
        quantity: z.number().positive("Quantities must be above zero").max(10_000),
        unitPrice: z.number().min(0, "Prices can't be negative").max(1_000_000),
      }),
    )
    .max(100),
})

export type JobInput = z.input<typeof jobInput>

export async function saveJob(raw: JobInput): Promise<ActionResult> {
  const parsed = jobInput.safeParse(raw)
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const { id, ...job } = parsed.data
  const d = await getDb()

  const [vehicle] = await d
    .select({ id: schema.vehicles.id })
    .from(schema.vehicles)
    .where(eq(schema.vehicles.id, job.vehicleId))
  if (!vehicle) return fail("Vehicle not found")

  if (id) {
    const [existing] = await d.select().from(schema.jobs).where(eq(schema.jobs.id, id))
    if (!existing || existing.vehicleId !== job.vehicleId) return fail("Job not found")
    if (existing.invoiceId) return fail("This job is already invoiced and can't be changed")
    await d
      .update(schema.jobs)
      .set({
        ...job,
        completedAt: job.status === "completed" ? (existing.completedAt ?? now()) : null,
      })
      .where(and(eq(schema.jobs.id, id), isNull(schema.jobs.invoiceId)))
  } else {
    await d.insert(schema.jobs).values({
      ...job,
      id: crypto.randomUUID(),
      createdAt: now(),
      completedAt: job.status === "completed" ? now() : null,
      invoiceId: null,
    })
  }

  // Keep the vehicle's odometer at the highest reading we've seen
  if (job.mileage !== null) {
    await d
      .update(schema.vehicles)
      .set({ mileage: job.mileage })
      .where(
        and(
          eq(schema.vehicles.id, job.vehicleId),
          or(isNull(schema.vehicles.mileage), lt(schema.vehicles.mileage, job.mileage)),
        ),
      )
  }

  done()
  return ok(null)
}

export async function setJobStatus(
  jobId: string,
  status: "in_progress" | "completed",
): Promise<ActionResult> {
  if (status !== "in_progress" && status !== "completed") return fail("Invalid status")
  const d = await getDb()
  const result = await d
    .update(schema.jobs)
    .set({ status, completedAt: status === "completed" ? now() : null })
    .where(and(eq(schema.jobs.id, jobId), isNull(schema.jobs.invoiceId)))
  if (result.rowsAffected === 0) return fail("Job not found or already invoiced")
  done()
  return ok(null)
}

export async function deleteJob(jobId: string): Promise<ActionResult> {
  const d = await getDb()
  const result = await d
    .delete(schema.jobs)
    .where(and(eq(schema.jobs.id, jobId), isNull(schema.jobs.invoiceId)))
  if (result.rowsAffected === 0) return fail("Job not found or already invoiced")
  done()
  return ok(null)
}

// ---------------------------------------------------------------- invoices

const FIRST_INVOICE_NUMBER = 1001

/** Creates an invoice from completed, uninvoiced jobs on one vehicle. */
export async function createInvoice(
  vehicleId: string,
  jobIds: string[],
): Promise<ActionResult<{ id: string }>> {
  if (!Array.isArray(jobIds) || jobIds.length === 0 || jobIds.length > 100)
    return fail("Select jobs to invoice")
  const d = await getDb()

  try {
    const id = await d.transaction(async (tx) => {
      const [vehicleRow] = await tx.select().from(schema.vehicles).where(eq(schema.vehicles.id, vehicleId))
      if (!vehicleRow) throw new InvoiceError("Vehicle not found")

      const jobs = await tx
        .select()
        .from(schema.jobs)
        .where(
          and(
            eq(schema.jobs.vehicleId, vehicleId),
            inArray(schema.jobs.id, jobIds),
            eq(schema.jobs.status, "completed"),
            isNull(schema.jobs.invoiceId),
          ),
        )
      if (jobs.length !== new Set(jobIds).size)
        throw new InvoiceError("Some jobs are no longer ready to invoice — refresh and try again")

      const [{ last }] = await tx.select({ last: max(schema.invoices.number) }).from(schema.invoices)
      const mileages = jobs.map((j) => j.mileage).filter((m): m is number => m !== null)
      const invoice: Invoice = {
        id: crypto.randomUUID(),
        number: (last ?? FIRST_INVOICE_NUMBER - 1) + 1,
        vehicleId,
        customer: {
          name: vehicleRow.customerName,
          phone: vehicleRow.customerPhone,
          email: vehicleRow.customerEmail,
        },
        vehicleLabel: vehicleLabel(vehicleRow),
        plate: [vehicleRow.plateState, vehicleRow.plate].filter(Boolean).join(" "),
        vin: vehicleRow.vin,
        mileage: mileages.length ? Math.max(...mileages) : vehicleRow.mileage,
        jobs: jobs.map((j) => ({
          jobId: j.id,
          title: j.title,
          notes: j.notes,
          technician: j.technician,
          items: j.items,
        })),
        taxRate: SHOP.partsTaxRate,
        status: "unpaid",
        createdAt: now(),
        paidAt: null,
      }
      await tx.insert(schema.invoices).values(invoice)
      await tx
        .update(schema.jobs)
        .set({ invoiceId: invoice.id })
        .where(
          inArray(
            schema.jobs.id,
            jobs.map((j) => j.id),
          ),
        )
      return invoice.id
    })
    done()
    return ok({ id })
  } catch (err) {
    if (err instanceof InvoiceError) return fail(err.message)
    throw err
  }
}

class InvoiceError extends Error {}

export async function setInvoiceStatus(invoiceId: string, status: "unpaid" | "paid"): Promise<ActionResult> {
  if (status !== "unpaid" && status !== "paid") return fail("Invalid status")
  const d = await getDb()
  const result = await d
    .update(schema.invoices)
    .set({ status, paidAt: status === "paid" ? now() : null })
    .where(eq(schema.invoices.id, invoiceId))
  if (result.rowsAffected === 0) return fail("Invoice not found")
  done()
  return ok(null)
}

// ----------------------------------------------------------------- vendors

const vendorInput = z.object({
  name: z.string().trim().min(1, "Vendor name is required").max(80),
  website: z
    .string()
    .max(500)
    .transform(normalizeUrl)
    .refine((v) => v !== "", "Website is required")
    .refine(isHttpUrl, "Enter a valid website, e.g. napaonline.com"),
  searchUrl: z
    .string()
    .max(500)
    .transform(toSearchTemplate)
    .refine((v) => v === "" || isHttpUrl(v), "Search link must be a web address")
    .refine(
      (v) => v === "" || hasPlaceholder(v),
      `Search link must contain the word you searched for, or a placeholder like ${PLACEHOLDERS.join(", ")}`,
    ),
  accountNumber: z.string().trim().max(60),
  phone: z.string().trim().max(30),
  contactName: z.string().trim().max(80),
  notes: z.string().trim().max(1000),
})

export type VendorInput = z.input<typeof vendorInput>

export async function saveVendor(id: string | null, raw: VendorInput): Promise<ActionResult<{ id: string }>> {
  const parsed = vendorInput.safeParse(raw)
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const d = await getDb()

  if (id) {
    const result = await d.update(schema.vendors).set(parsed.data).where(eq(schema.vendors.id, id))
    if (result.rowsAffected === 0) return fail("Vendor not found")
    done()
    return ok({ id })
  }

  const newId = crypto.randomUUID()
  await d.insert(schema.vendors).values({ id: newId, ...parsed.data, createdAt: now() })
  done()
  return ok({ id: newId })
}

export async function deleteVendor(id: string): Promise<ActionResult> {
  const d = await getDb()
  const result = await d.delete(schema.vendors).where(eq(schema.vendors.id, id))
  if (result.rowsAffected === 0) return fail("Vendor not found")
  await d.update(schema.jobs).set({ partsVendorId: null }).where(eq(schema.jobs.partsVendorId, id))
  done()
  return ok(null)
}

/** Adds any of the common dealers the shop doesn't have yet (matched by website). */
export async function addCommonVendors(): Promise<ActionResult<{ added: number }>> {
  const d = await getDb()
  const existing = new Set(
    (await d.select({ website: schema.vendors.website }).from(schema.vendors)).map((v) => v.website),
  )
  const toAdd = COMMON_VENDORS.filter((v) => !existing.has(v.website))
  if (toAdd.length) {
    await d
      .insert(schema.vendors)
      .values(toAdd.map((v) => ({ id: crypto.randomUUID(), ...v, createdAt: now() })))
  }
  done()
  return ok({ added: toAdd.length })
}

// ------------------------------------------------------------ parts status

const partsStatusInput = z.object({
  status: z.enum(["needed", "ordered", "received"]).nullable(),
  vendorId: z.string().max(100).nullable(),
  note: z.string().trim().max(300),
})

export type PartsStatusInput = z.input<typeof partsStatusInput>

/** Updates a job's parts status (needs parts → ordered → received). */
export async function setPartsStatus(jobId: string, raw: PartsStatusInput): Promise<ActionResult> {
  const parsed = partsStatusInput.safeParse(raw)
  if (!parsed.success) return fail(firstIssue(parsed.error))
  const { status, vendorId, note } = parsed.data
  const d = await getDb()

  if (vendorId) {
    const [vendor] = await d
      .select({ id: schema.vendors.id })
      .from(schema.vendors)
      .where(eq(schema.vendors.id, vendorId))
    if (!vendor) return fail("Vendor not found")
  }

  const result = await d
    .update(schema.jobs)
    .set({
      partsStatus: status,
      partsVendorId: status ? vendorId : null,
      partsNote: status ? note : "",
      partsUpdatedAt: status ? now() : null,
    })
    .where(and(eq(schema.jobs.id, jobId), isNull(schema.jobs.invoiceId)))
  if (result.rowsAffected === 0) return fail("Job not found or already invoiced")
  done()
  return ok(null)
}
