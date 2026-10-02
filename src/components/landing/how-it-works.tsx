import { FileSpreadsheet, ScanLine, Rocket } from "lucide-react"

import { SectionHeading } from "./section-heading"

const steps = [
  {
    icon: FileSpreadsheet,
    title: "Import your parts",
    description:
      "Upload a CSV or spreadsheet, or pull your catalog straight from your supplier. We map the columns for you.",
  },
  {
    icon: ScanLine,
    title: "Label your shelves",
    description:
      "Print bin labels in one click and do a quick scan count. Your on-hand numbers are now real.",
  },
  {
    icon: Rocket,
    title: "Run on autopilot",
    description:
      "Parts deduct as techs pull them, alerts fire at your min levels, and POs go out with a tap.",
  },
]

export function HowItWorks() {
  return (
    <section className="relative border-y bg-card/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="Up and running before lunch"
          description="No consultants, no six-week onboarding. Most shops are fully counted and live on day one."
        />

        <ol className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
          />
          {steps.map(({ icon: Icon, title, description }, i) => (
            <li key={title} className="relative text-center">
              <div className="relative mx-auto flex size-14 items-center justify-center rounded-2xl border bg-background shadow-lg">
                <Icon className="size-6 text-primary" />
                <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold">{title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
