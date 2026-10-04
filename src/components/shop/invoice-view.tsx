"use client"

import Link from "next/link"
import { ArrowLeft, CheckCircle2, Printer, RotateCcw, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { computeTotals, formatDate, formatMoney, lineTotalCents } from "@/lib/shop/money"
import { SHOP } from "@/lib/shop/settings"
import type { Invoice } from "@/lib/shop/types"
import { setInvoiceStatus } from "@/app/app/actions"
import { StatusBadge } from "./common"
import { useServerAction } from "./use-server-action"

export function InvoiceView({ invoice }: { invoice: Invoice }) {
  const { run, pending, error } = useServerAction()

  const allItems = invoice.jobs.flatMap((j) => j.items)
  const totals = computeTotals(allItems, invoice.taxRate)
  const paid = invoice.status === "paid"

  return (
    <div className="space-y-6">
      {/* toolbar — hidden when printing */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href={`/app/vehicles/${invoice.vehicleId}`}>
            <ArrowLeft />
            Back to vehicle
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          {paid ? (
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => run(() => setInvoiceStatus(invoice.id, "unpaid"))}
            >
              <RotateCcw />
              Mark unpaid
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => run(() => setInvoiceStatus(invoice.id, "paid"))}
            >
              <CheckCircle2 />
              Mark paid
            </Button>
          )}
          <Button onClick={() => window.print()}>
            <Printer />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive print:hidden">
          {error}
        </p>
      )}

      <article className="mx-auto max-w-4xl rounded-xl border bg-card p-6 shadow-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-col justify-between gap-6 sm:flex-row">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Wrench className="size-4" strokeWidth={2.5} />
              </span>
              <p className="text-lg font-semibold">{SHOP.name}</p>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              <p>{SHOP.address}</p>
              <p>
                {SHOP.phone} · {SHOP.email}
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-3xl font-semibold tracking-tight">Invoice</p>
            <p className="mt-1 font-mono text-sm text-muted-foreground">#{invoice.number}</p>
            <div className="mt-3 flex items-center gap-2 sm:justify-end">
              <StatusBadge tone={paid ? "success" : "warning"} className="text-xs">
                {paid ? "Paid" : "Unpaid"}
              </StatusBadge>
            </div>
          </div>
        </header>

        <Separator className="my-8" />

        <section className="grid gap-6 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bill to</p>
            <p className="mt-2 font-medium">{invoice.customer.name}</p>
            {invoice.customer.phone && <p className="text-muted-foreground">{invoice.customer.phone}</p>}
            {invoice.customer.email && <p className="text-muted-foreground">{invoice.customer.email}</p>}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Vehicle</p>
            <p className="mt-2 font-medium">{invoice.vehicleLabel}</p>
            {invoice.plate && <p className="text-muted-foreground">Plate: {invoice.plate}</p>}
            {invoice.vin && <p className="font-mono text-xs text-muted-foreground">VIN: {invoice.vin}</p>}
            {invoice.mileage !== null && (
              <p className="text-muted-foreground">Mileage: {invoice.mileage.toLocaleString()} mi</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dates</p>
            <p className="mt-2">Issued {formatDate(invoice.createdAt)}</p>
            {invoice.paidAt && <p className="text-muted-foreground">Paid {formatDate(invoice.paidAt)}</p>}
          </div>
        </section>

        <section className="mt-10 space-y-8">
          {invoice.jobs.map((job) => (
            <div key={job.jobId} className="break-inside-avoid">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">{job.title}</h3>
                {job.technician && (
                  <p className="text-xs text-muted-foreground">Technician: {job.technician}</p>
                )}
              </div>
              {job.notes && <p className="mt-1 text-sm text-muted-foreground">{job.notes}</p>}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Type</th>
                      <th className="py-2 pr-3 font-medium">Description</th>
                      <th className="py-2 pr-3 text-right font-medium">Qty / hrs</th>
                      <th className="py-2 pr-3 text-right font-medium">Rate</th>
                      <th className="py-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2 pr-3 capitalize text-muted-foreground">{item.type}</td>
                        <td className="py-2 pr-3">{item.description}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{item.quantity}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{formatMoney(item.unitPrice)}</td>
                        <td className="py-2 text-right tabular-nums">
                          {formatMoney(lineTotalCents(item) / 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-10 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <Row label="Labor" value={totals.labor} />
            <Row label="Parts" value={totals.parts} />
            <Row label={`Tax (${(invoice.taxRate * 100).toFixed(2)}% on parts)`} value={totals.tax} />
            <div className="flex justify-between border-t pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(totals.total)}</dd>
            </div>
            {paid && (
              <div className="flex justify-between text-success">
                <dt>Amount due</dt>
                <dd className="tabular-nums">{formatMoney(0)}</dd>
              </div>
            )}
          </dl>
        </section>

        <footer className="mt-12 border-t pt-6 text-center text-xs text-muted-foreground">
          Thank you for your business. All parts and labor are warranted for 12 months / 12,000 miles.
        </footer>
      </article>
    </div>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd className="tabular-nums">{formatMoney(value)}</dd>
    </div>
  )
}
