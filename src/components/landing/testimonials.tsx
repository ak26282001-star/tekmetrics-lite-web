import { Star } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { SectionHeading } from "./section-heading"

const testimonials = [
  {
    quote:
      "We used to lose a set of pads or a jug of oil every week and never know where it went. Now every part is on a ticket. It paid for itself in the first month.",
    name: "Dana Ruiz",
    role: "Owner, Ironside Auto",
  },
  {
    quote:
      "My techs actually use it. Scan, pull, done. The low-stock alerts alone saved us from sending three cars home last month.",
    name: "Marcus Thompson",
    role: "Shop Foreman, Redline Garage",
  },
  {
    quote:
      "Running three locations off one inventory used to be a nightmare. Transfers between shops now take a tap instead of a phone call.",
    name: "Priya Shah",
    role: "Operations, Northgate Motors",
  },
]

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
}

export function Testimonials() {
  return (
    <section className="border-y bg-card/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Loved by shops"
          title="Built for the people who turn the wrenches"
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="justify-between bg-background/60">
              <CardContent>
                <div className="flex gap-0.5 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-5 leading-relaxed text-pretty">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </CardContent>
              <CardFooter className="gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                    {initials(t.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
