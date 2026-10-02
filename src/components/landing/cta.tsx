import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Cta() {
  return (
    <section id="cta" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-card px-6 py-16 text-center sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[700px] -translate-x-1/2 rounded-full bg-primary/25 blur-[120px]" />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              Stop guessing what&apos;s on the shelf.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground sm:text-lg">
              Join 2,000+ shops running a tighter parts room. Free for 14 days —
              we&apos;ll even help you import your inventory.
            </p>

            <form className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
              <label htmlFor="cta-email" className="sr-only">
                Work email
              </label>
              <Input
                id="cta-email"
                type="email"
                required
                placeholder="you@yourshop.com"
                className="h-12 bg-background/70 text-base"
              />
              <Button type="submit" size="lg" className="h-12 px-6 text-base">
                Get started
                <ArrowRight />
              </Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required · Setup in under an hour
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
