import Link from "next/link"
import { Check } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { SectionHeading } from "./section-heading"

const plans = [
  {
    name: "Starter",
    price: "$49",
    description: "For single-bay shops getting off the spreadsheet.",
    features: [
      "Up to 1,000 SKUs",
      "2 users",
      "Barcode scanning",
      "Low-stock alerts",
      "CSV import & export",
    ],
    cta: "Start free trial",
  },
  {
    name: "Shop",
    price: "$99",
    description: "For busy shops that want parts tied to every job.",
    features: [
      "Unlimited SKUs",
      "10 users",
      "Work order parts tracking",
      "Purchase orders & vendors",
      "Margin & turnover reports",
      "QuickBooks sync",
    ],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Multi-location",
    price: "$249",
    description: "For groups running inventory across several shops.",
    features: [
      "Everything in Shop",
      "Unlimited users",
      "Up to 5 locations",
      "Inter-shop transfers",
      "Role-based permissions",
      "Priority phone support",
    ],
    cta: "Talk to sales",
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple pricing. No per-bay fees."
          description="Every plan includes a 14-day free trial, free data import and unlimited parts lookups."
        />

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "relative bg-card/50",
                plan.featured &&
                  "border-primary/60 bg-card shadow-[0_0_60px_-15px_var(--primary)] lg:-my-4 lg:py-10"
              )}
            >
              {plan.featured && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3">
                  Most popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-semibold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/ month</span>
                </p>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  variant={plan.featured ? "default" : "outline"}
                  asChild
                >
                  <Link href="#cta">{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
