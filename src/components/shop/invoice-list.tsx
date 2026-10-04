"use client"

import Link from "next/link"
import { FileText } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { computeTotals, formatDate, formatMoney } from "@/lib/shop/money"
import type { Invoice } from "@/lib/shop/types"
import { StatusBadge } from "./common"

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const rows = [...invoices]
    .sort((a, b) => b.number - a.number)
    .map((inv) => ({
      ...inv,
      total: computeTotals(
        inv.jobs.flatMap((j) => j.items),
        inv.taxRate,
      ).total,
    }))
  const outstanding = rows.filter((r) => r.status === "unpaid").reduce((s, r) => s + r.total, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create invoices from completed jobs on a vehicle&apos;s page.
          </p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-2 text-right">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="text-lg font-semibold tabular-nums">{formatMoney(outstanding)}</p>
        </div>
      </div>

      <Card className="p-0">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <FileText className="size-6 text-muted-foreground" />
            <p className="font-medium">No invoices yet</p>
            <p className="text-sm text-muted-foreground">
              Find a vehicle, complete a job, then select it to invoice.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((inv) => (
                <TableRow key={inv.id} className="relative">
                  <TableCell className="pl-5 font-mono">
                    {/* stretched link makes the whole row clickable */}
                    <Link href={`/app/invoices/${inv.id}`} className="after:absolute after:inset-0">
                      #{inv.number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(inv.createdAt)}</TableCell>
                  <TableCell>{inv.customer.name}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.vehicleLabel}</TableCell>
                  <TableCell>
                    <StatusBadge tone={inv.status === "paid" ? "success" : "warning"}>
                      {inv.status === "paid" ? "Paid" : "Unpaid"}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="pr-5 text-right font-medium tabular-nums">
                    {formatMoney(inv.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
