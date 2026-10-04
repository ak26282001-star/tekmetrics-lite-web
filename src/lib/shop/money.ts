import type { LineItem } from "./types"

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export function formatMoney(dollars: number) {
  return usd.format(dollars)
}

/** Line totals are computed in whole cents to avoid floating point drift. */
export function lineTotalCents(item: LineItem) {
  return Math.round(item.quantity * item.unitPrice * 100)
}

export type Totals = {
  labor: number
  parts: number
  tax: number
  total: number
}

export function computeTotals(items: LineItem[], partsTaxRate: number): Totals {
  let labor = 0
  let parts = 0
  for (const item of items) {
    if (item.type === "labor") labor += lineTotalCents(item)
    else parts += lineTotalCents(item)
  }
  const tax = Math.round(parts * partsTaxRate)
  return {
    labor: labor / 100,
    parts: parts / 100,
    tax: tax / 100,
    total: (labor + parts + tax) / 100,
  }
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
