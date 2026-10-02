import { Car, CircleGauge, Cog, Fuel, Hammer, Wrench } from "lucide-react"

const shops = [
  { name: "Ironside Auto", icon: Wrench },
  { name: "Redline Garage", icon: CircleGauge },
  { name: "Northgate Motors", icon: Car },
  { name: "Torque & Co.", icon: Cog },
  { name: "Summit Tire", icon: Fuel },
  { name: "Bolt Brothers", icon: Hammer },
]

export function LogoCloud() {
  return (
    <section className="border-y bg-card/30 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-muted-foreground">
          Trusted by 2,000+ independent shops across North America
        </p>
        <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <div className="flex w-max animate-marquee gap-14">
            {[...shops, ...shops].map(({ name, icon: Icon }, i) => (
              <div
                key={`${name}-${i}`}
                aria-hidden={i >= shops.length}
                className="flex items-center gap-2 text-lg font-semibold tracking-tight whitespace-nowrap text-muted-foreground/70"
              >
                <Icon className="size-5" />
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
