import {
  Bell,
  ClipboardList,
  LineChart,
  MapPin,
  ScanBarcode,
  Truck,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { SectionHeading } from "./section-heading"

const features = [
  {
    icon: ScanBarcode,
    title: "Scan-to-stock",
    description:
      "Receive shipments and pull parts with your phone camera. No handheld scanners, no typing part numbers.",
    className: "lg:col-span-2",
    visual: true,
  },
  {
    icon: Bell,
    title: "Smart reorder alerts",
    description:
      "Set min/max per SKU. We flag low stock and draft the purchase order before you run out.",
  },
  {
    icon: ClipboardList,
    title: "Parts-to-job tracking",
    description:
      "Every part pulled is attached to a repair order, so nothing leaves the shelf unbilled.",
  },
  {
    icon: Truck,
    title: "Vendor & PO management",
    description:
      "Compare supplier pricing, send POs, and track deliveries from WorldPac, NAPA, AutoZone and more.",
  },
  {
    icon: MapPin,
    title: "Bins, racks & locations",
    description:
      "Map your shelves once. Techs find any part in seconds, across one location or ten.",
  },
  {
    icon: LineChart,
    title: "Margin & turnover reports",
    description:
      "See which parts make you money, which ones collect dust, and where cash is tied up.",
    className: "lg:col-span-2",
  },
]

function ScanVisual() {
  return (
    <div className="relative mt-6 flex h-32 items-center justify-center overflow-hidden rounded-lg border bg-background/60">
      <div className="flex h-16 items-end gap-[3px]">
        {Array.from({ length: 42 }).map((_, i) => (
          <span
            key={i}
            className="bg-foreground/80"
            style={{
              width: i % 3 === 0 ? 3 : i % 5 === 0 ? 4 : 1.5,
              height: i % 7 === 0 ? "100%" : "88%",
            }}
          />
        ))}
      </div>
      <div className="absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-primary shadow-[0_0_16px_2px_var(--primary)]" />
      <span className="absolute bottom-2 right-3 font-mono text-[10px] text-muted-foreground">
        BRK-PD-4471 · +12 received
      </span>
    </div>
  )
}

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Everything your parts room needs. Nothing it doesn't."
          description="Built with shop owners and service writers who were tired of spreadsheets, whiteboards and surprise stock-outs."
        />

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description, className, visual }) => (
            <Card
              key={title}
              className={cn(
                "group relative overflow-hidden bg-card/50 transition-colors hover:border-primary/40",
                className
              )}
            >
              <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
              <CardHeader>
                <span className="mb-3 flex size-10 items-center justify-center rounded-lg border bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {description}
                </CardDescription>
              </CardHeader>
              {visual && (
                <CardContent>
                  <ScanVisual />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
