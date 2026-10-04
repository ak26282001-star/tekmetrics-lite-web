export type Customer = {
  name: string
  phone: string
  email: string
}

export type Vehicle = {
  id: string
  plate: string
  plateState: string
  vin: string
  year: string
  make: string
  model: string
  trim: string
  color: string
  mileage: number | null
  customer: Customer
  createdAt: string
}

export type LineItemType = "labor" | "part"

export type LineItem = {
  id: string
  type: LineItemType
  description: string
  /** Hours for labor, quantity for parts */
  quantity: number
  /** Hourly rate for labor, unit price for parts */
  unitPrice: number
}

export type JobStatus = "in_progress" | "completed"

export type Job = {
  id: string
  vehicleId: string
  title: string
  notes: string
  technician: string
  mileage: number | null
  status: JobStatus
  items: LineItem[]
  createdAt: string
  completedAt: string | null
  invoiceId: string | null
}

export type InvoiceStatus = "unpaid" | "paid"

/** Jobs are copied into the invoice so later edits never change an issued invoice. */
export type InvoiceJob = {
  jobId: string
  title: string
  notes: string
  technician: string
  items: LineItem[]
}

export type Invoice = {
  id: string
  number: number
  vehicleId: string
  customer: Customer
  vehicleLabel: string
  plate: string
  vin: string
  mileage: number | null
  jobs: InvoiceJob[]
  taxRate: number
  status: InvoiceStatus
  createdAt: string
  paidAt: string | null
}

export type ShopState = {
  vehicles: Vehicle[]
  jobs: Job[]
  invoices: Invoice[]
  nextInvoiceNumber: number
}
