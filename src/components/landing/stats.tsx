const stats = [
  { value: "31%", label: "less parts shrinkage" },
  { value: "6 hrs", label: "saved per week on counts" },
  { value: "2,000+", label: "shops on Tekmetric Lite" },
  { value: "99.9%", label: "uptime, every month" },
]

export function Stats() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-background px-6 py-8 text-center sm:py-10">
              <dt className="sr-only">{s.label}</dt>
              <dd className="text-gradient text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                {s.value}
              </dd>
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
