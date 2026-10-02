import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  Package,
  ScanBarcode,
  Search,
  Settings,
  Truck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const nav = [
  { icon: LayoutDashboard, label: "Overview", active: false },
  { icon: Boxes, label: "Inventory", active: true },
  { icon: ClipboardList, label: "Work orders", active: false },
  { icon: Truck, label: "Purchase orders", active: false },
  { icon: Settings, label: "Settings", active: false },
]

const kpis = [
  { label: "Inventory value", value: "$48,210", delta: "+4.2%" },
  { label: "Parts on hand", value: "1,284", delta: "+36" },
  { label: "Low stock", value: "7", delta: "needs reorder", warn: true },
]

const rows = [
  { sku: "BRK-PD-4471", name: "Ceramic brake pads (front)", bin: "A-12", qty: 24, max: 30, status: "In stock" },
  { sku: "OIL-5W30-QT", name: "Synthetic 5W-30 (qt)", bin: "Fluids", qty: 6, max: 60, status: "Low" },
  { sku: "FLT-OIL-0219", name: "Oil filter PF-2129", bin: "B-03", qty: 41, max: 50, status: "In stock" },
  { sku: "TIR-225-65R17", name: "All-season 225/65R17", bin: "Rack 2", qty: 2, max: 16, status: "Reorder" },
  { sku: "WPR-22-BLD", name: 'Wiper blade 22"', bin: "C-08", qty: 18, max: 24, status: "In stock" },
]

function statusClass(status: string) {
  if (status === "Reorder") return "bg-destructive/15 text-destructive border-destructive/30"
  if (status === "Low") return "bg-warning/15 text-warning border-warning/30"
  return "bg-success/15 text-success border-success/30"
}

function barClass(status: string) {
  if (status === "Reorder") return "bg-destructive"
  if (status === "Low") return "bg-warning"
  return "bg-success"
}

export function DashboardPreview() {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card/80 shadow-2xl shadow-black/40 backdrop-blur">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
        <div className="mx-auto hidden w-72 items-center justify-center rounded-md bg-muted/60 px-3 py-1 font-mono text-xs text-muted-foreground sm:flex">
          app.tekmetriclite.com/inventory
        </div>
      </div>

      <div className="flex">
        {/* sidebar */}
        <aside className="hidden w-48 shrink-0 border-r p-3 lg:block">
          <div className="space-y-1">
            {nav.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-2 text-xs",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Gauge className="size-3.5 text-primary" />
              Bay utilization
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted">
              <div className="h-full w-[78%] rounded-full bg-primary" />
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">5 of 6 bays active</p>
          </div>
        </aside>

        {/* main */}
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Parts inventory</p>
              <p className="text-xs text-muted-foreground">Main St. location · synced just now</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-md border bg-background/50 px-2.5 py-1.5 text-xs text-muted-foreground sm:flex">
                <Search className="size-3.5" />
                Search SKU, part, bin…
              </div>
              <div className="flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground">
                <ScanBarcode className="size-3.5" />
                Scan
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-lg border bg-background/40 p-2.5 sm:p-3">
                <p className="truncate text-[10px] text-muted-foreground sm:text-xs">{kpi.label}</p>
                <p className="mt-1 text-base font-semibold tabular-nums sm:text-xl">{kpi.value}</p>
                <p
                  className={cn(
                    "mt-0.5 flex items-center gap-1 truncate text-[10px] sm:text-xs",
                    kpi.warn ? "text-warning" : "text-success"
                  )}
                >
                  {kpi.warn && <AlertTriangle className="size-3" />}
                  {kpi.delta}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[1fr_auto] gap-3 border-b bg-muted/40 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:grid-cols-[1.6fr_0.6fr_1fr_auto]">
              <span>Part</span>
              <span className="hidden sm:block">Bin</span>
              <span className="hidden sm:block">Stock</span>
              <span>Status</span>
            </div>
            {rows.map((row) => (
              <div
                key={row.sku}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b px-3 py-2.5 text-xs last:border-b-0 sm:grid-cols-[1.6fr_0.6fr_1fr_auto]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="hidden size-7 shrink-0 items-center justify-center rounded-md bg-muted sm:flex">
                    <Package className="size-3.5 text-muted-foreground" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.name}</p>
                    <p className="truncate font-mono text-[10px] text-muted-foreground">{row.sku}</p>
                  </div>
                </div>
                <span className="hidden font-mono text-muted-foreground sm:block">{row.bin}</span>
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="h-1.5 flex-1 rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", barClass(row.status))}
                      style={{ width: `${Math.max(6, (row.qty / row.max) * 100)}%` }}
                    />
                  </div>
                  <span className="w-6 text-right tabular-nums text-muted-foreground">{row.qty}</span>
                </div>
                <Badge variant="outline" className={cn("text-[10px]", statusClass(row.status))}>
                  {row.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
