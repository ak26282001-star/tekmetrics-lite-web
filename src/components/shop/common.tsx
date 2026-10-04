import { Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  )
}

const tones = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  info: "bg-primary/15 text-primary border-primary/30",
  muted: "bg-muted text-muted-foreground border-border",
}

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: keyof typeof tones
  children: React.ReactNode
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn(tones[tone], className)}>
      {children}
    </Badge>
  )
}

/** A license plate styled chip */
export function PlateChip({ plate, state }: { plate: string; state?: string }) {
  if (!plate) return null
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-foreground/80 bg-foreground px-2 py-0.5 font-mono text-sm font-bold tracking-widest text-background">
      {state && <span className="text-[10px] font-semibold opacity-70">{state}</span>}
      {plate}
    </span>
  )
}
