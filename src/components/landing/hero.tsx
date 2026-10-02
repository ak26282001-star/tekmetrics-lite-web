import Link from "next/link"
import { ArrowRight, Bell, CheckCircle2, PlayCircle, TrendingDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardPreview } from "./dashboard-preview"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="mb-6 gap-2 rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            New: barcode scanning on any phone
          </Badge>

          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Every part, every bay.{" "}
            <span className="text-gradient">Always in stock.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">
            Tekmetric Lite is the inventory system built for independent auto
            shops. Track parts, tires and fluids in real time, tie them to work
            orders, and reorder before a car ever waits on a lift.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="h-12 w-full px-7 text-base sm:w-auto" asChild>
              <Link href="#cta">
                Start 14-day free trial
                <ArrowRight />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full px-7 text-base sm:w-auto"
              asChild
            >
              <Link href="#product">
                <PlayCircle />
                See it in action
              </Link>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["No credit card required", "Set up in under an hour", "Cancel anytime"].map(
              (item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-primary" />
                  {item}
                </li>
              )
            )}
          </ul>
        </div>

        <div className="relative mx-auto mt-16 max-w-6xl sm:mt-20">
          <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-primary/40 via-primary/5 to-transparent" />
          <DashboardPreview />

          {/* floating notifications */}
          <div className="absolute -left-8 bottom-8 hidden w-64 animate-float rounded-xl border bg-card/90 p-4 shadow-xl backdrop-blur xl:block">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
                <Bell className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">Low stock alert</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  5W-30 synthetic is down to 6 qt. Draft PO created.
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -right-8 bottom-28 hidden w-60 animate-float rounded-xl border bg-card/90 p-4 shadow-xl backdrop-blur [animation-delay:-3s] xl:block">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                <TrendingDown className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">Shrinkage down 31%</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Every part now tied to a repair order.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
