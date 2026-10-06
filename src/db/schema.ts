import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core"

import type { Customer, InvoiceJob, LineItem } from "@/lib/shop/types"

export const vehicles = sqliteTable(
  "vehicles",
  {
    id: text("id").primaryKey(),
    plate: text("plate").notNull().default(""),
    plateState: text("plate_state").notNull().default(""),
    vin: text("vin").notNull().default(""),
    year: text("year").notNull().default(""),
    make: text("make").notNull(),
    model: text("model").notNull(),
    trim: text("trim").notNull().default(""),
    color: text("color").notNull().default(""),
    mileage: integer("mileage"),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull().default(""),
    customerEmail: text("customer_email").notNull().default(""),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("vehicles_plate_idx").on(t.plate), index("vehicles_vin_idx").on(t.vin)],
)

export const jobs = sqliteTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    title: text("title").notNull(),
    notes: text("notes").notNull().default(""),
    technician: text("technician").notNull().default(""),
    mileage: integer("mileage"),
    status: text("status", { enum: ["in_progress", "completed"] }).notNull(),
    items: text("items", { mode: "json" }).$type<LineItem[]>().notNull(),
    createdAt: text("created_at").notNull(),
    completedAt: text("completed_at"),
    invoiceId: text("invoice_id"),
    /** Parts workflow: null = no parts needed / not tracked */
    partsStatus: text("parts_status", { enum: ["needed", "ordered", "received"] }),
    partsVendorId: text("parts_vendor_id"),
    /** Free text such as the vendor's order number or ETA */
    partsNote: text("parts_note").notNull().default(""),
    partsUpdatedAt: text("parts_updated_at"),
  },
  (t) => [
    index("jobs_vehicle_idx").on(t.vehicleId),
    index("jobs_invoice_idx").on(t.invoiceId),
    index("jobs_parts_status_idx").on(t.partsStatus),
  ],
)

/** Invoices snapshot the customer, vehicle and jobs so later edits never change them. */
export const invoices = sqliteTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    number: integer("number").notNull().unique(),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    customer: text("customer", { mode: "json" }).$type<Customer>().notNull(),
    vehicleLabel: text("vehicle_label").notNull(),
    plate: text("plate").notNull().default(""),
    vin: text("vin").notNull().default(""),
    mileage: integer("mileage"),
    jobs: text("jobs", { mode: "json" }).$type<InvoiceJob[]>().notNull(),
    taxRate: real("tax_rate").notNull(),
    status: text("status", { enum: ["unpaid", "paid"] }).notNull(),
    createdAt: text("created_at").notNull(),
    paidAt: text("paid_at"),
  },
  (t) => [index("invoices_vehicle_idx").on(t.vehicleId)],
)

/** Parts dealers the shop orders from */
export const vendors = sqliteTable("vendors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  website: text("website").notNull(),
  /** Optional search link with {q} where the part name goes, e.g. https://example.com/search?q={q} */
  searchUrl: text("search_url").notNull().default(""),
  accountNumber: text("account_number").notNull().default(""),
  phone: text("phone").notNull().default(""),
  contactName: text("contact_name").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull(),
})
