import type { Vehicle } from "./types"

export function vehicleLabel(v: Pick<Vehicle, "year" | "make" | "model" | "trim">) {
  return [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")
}
