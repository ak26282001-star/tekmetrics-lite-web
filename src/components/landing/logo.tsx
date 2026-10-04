import Link from "next/link"
import { Wrench } from "lucide-react"

import { cn } from "@/lib/utils"

export function Logo({
  className,
  href = "/",
  compact = false,
}: {
  className?: string
  href?: string
  /** Hide the wordmark on small screens */
  compact?: boolean
}) {
  return (
    <Link
      href={href}
      aria-label="Tekmetric Lite"
      className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}
    >
      <span className="relative flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_24px_-4px_var(--primary)]">
        <Wrench className="size-4" strokeWidth={2.5} />
      </span>
      <span className={cn("text-lg", compact && "hidden sm:inline")}>
        Tekmetric <span className="text-primary">Lite</span>
      </span>
    </Link>
  )
}
