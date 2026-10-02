import { Boxes, CheckCircle2, ClipboardList, LineChart } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { SectionHeading } from "./section-heading"

const tabs = [
  {
    value: "inventory",
    label: "Inventory",
    icon: Boxes,
    title: "A live count of everything on your shelves",
    description:
      "Stock levels update the moment a part is received, pulled or returned — across every bin, rack and location.",
    points: [
      "Min/max levels per SKU with automatic reorder points",
      "Core charge and warranty return tracking",
      "Cycle counts that take minutes, not weekends",
    ],
  },
  {
    value: "work-orders",
    label: "Work orders",
    icon: ClipboardList,
    title: "Parts flow straight onto the repair order",
    description:
      "Techs scan what they pull. Service writers see it instantly on the RO, priced with your matrix.",
    points: [
      "Reserve parts for scheduled jobs",
      "Auto-apply your parts pricing matrix",
      "Catch unbilled parts before the car leaves",
    ],
  },
  {
    value: "reports",
    label: "Reports",
    icon: LineChart,
    title: "Know where every dollar on the shelf is going",
    description:
      "Turnover, gross profit by category, dead stock and vendor spend — ready when you open the app.",
    points: [
      "Gross profit on parts by tech, job and category",
      "Dead-stock report with suggested returns",
      "Export to QuickBooks or CSV in one click",
    ],
  },
]

function InventoryVisual() {
  const cats = [
    { name: "Brakes", value: 82 },
    { name: "Filters", value: 64 },
    { name: "Fluids", value: 18, low: true },
    { name: "Tires", value: 36 },
    { name: "Electrical", value: 71 },
  ]
  return (
    <div className="space-y-4">
      {cats.map((c) => (
        <div key={c.name}>
          <div className="mb-1.5 flex justify-between text-sm">
            <span>{c.name}</span>
            <span className={cn("tabular-nums", c.low ? "text-warning" : "text-muted-foreground")}>
              {c.value}% stocked
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", c.low ? "bg-warning" : "bg-primary")}
              style={{ width: `${c.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function WorkOrderVisual() {
  const lines = [
    { part: "Ceramic brake pads (front)", qty: 1, price: "$89.00" },
    { part: "Rotor — 12.6in vented", qty: 2, price: "$164.00" },
    { part: "Brake fluid DOT 4 (qt)", qty: 1, price: "$14.50" },
  ]
  return (
    <div className="rounded-lg border bg-background/60">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold">RO #10482 · 2019 Honda CR-V</p>
          <p className="text-xs text-muted-foreground">Front brake service · Bay 3 · Marcus T.</p>
        </div>
        <Badge className="bg-success/15 text-success border-success/30" variant="outline">
          Parts ready
        </Badge>
      </div>
      {lines.map((l) => (
        <div key={l.part} className="flex items-center justify-between border-b px-4 py-3 text-sm last:border-b-0">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-success" />
            {l.part}
            <span className="text-muted-foreground">×{l.qty}</span>
          </span>
          <span className="tabular-nums">{l.price}</span>
        </div>
      ))}
      <div className="flex justify-between bg-muted/40 px-4 py-3 text-sm font-semibold">
        <span>Parts total</span>
        <span className="tabular-nums">$267.50</span>
      </div>
    </div>
  )
}

function ReportsVisual() {
  const bars = [38, 52, 45, 61, 58, 72, 66, 80, 74, 88, 84, 95]
  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Parts gross profit · YTD</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">$214,860</p>
        </div>
        <Badge variant="outline" className="bg-success/15 text-success border-success/30">
          +18.4% vs last year
        </Badge>
      </div>
      <div className="mt-6 flex h-40 items-end gap-1.5 sm:gap-2">
        {bars.map((h, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-t-sm",
              i === bars.length - 1 ? "bg-primary" : "bg-primary/30"
            )}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>Jan</span>
        <span>Dec</span>
      </div>
    </div>
  )
}

const visuals: Record<string, React.ReactNode> = {
  inventory: <InventoryVisual />,
  "work-orders": <WorkOrderVisual />,
  reports: <ReportsVisual />,
}

export function ProductTabs() {
  return (
    <section id="product" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Product"
          title="One system from the shelf to the invoice"
        />

        <Tabs defaultValue="inventory" className="mt-12 items-center gap-10">
          <TabsList className="h-11 w-full max-w-md">
            {tabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="h-full">
                <Icon />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className="w-full data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 duration-300"
            >
              <div className="grid items-center gap-10 rounded-2xl border bg-card/50 p-6 sm:p-10 lg:grid-cols-2 lg:gap-16">
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tab.title}</h3>
                  <p className="mt-4 text-muted-foreground">{tab.description}</p>
                  <ul className="mt-6 space-y-3">
                    {tab.points.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border bg-background/40 p-5 shadow-xl sm:p-6">
                  {visuals[tab.value]}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}
