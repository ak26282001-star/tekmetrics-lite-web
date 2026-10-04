const TRANSLITERATION: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
}
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

export function normalizeVin(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

export function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

/** 17 characters, no I, O or Q. */
export function isVinFormatValid(vin: string) {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin)
}

/** North American check digit (position 9). Non-NA vehicles may legitimately fail this. */
export function isVinCheckDigitValid(vin: string) {
  if (!isVinFormatValid(vin)) return false
  let sum = 0
  for (let i = 0; i < 17; i++) {
    const c = vin[i]
    const value = /\d/.test(c) ? Number(c) : TRANSLITERATION[c]
    sum += value * WEIGHTS[i]
  }
  const remainder = sum % 11
  const expected = remainder === 10 ? "X" : String(remainder)
  return vin[8] === expected
}

export type DecodedVin = {
  year: string
  make: string
  model: string
  trim: string
}

/** Decodes a VIN with the free NHTSA vPIC API. */
export async function decodeVin(vin: string, signal?: AbortSignal): Promise<DecodedVin> {
  let res: Response
  try {
    res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
      { signal },
    )
  } catch {
    throw new Error("Couldn't reach the VIN lookup service. Enter year, make and model manually.")
  }
  if (!res.ok) throw new Error(`VIN lookup failed (${res.status})`)
  const data = await res.json()
  const r = data?.Results?.[0]
  if (!r || !r.Make) throw new Error("No vehicle found for this VIN")
  return {
    year: r.ModelYear ?? "",
    make: titleCase(r.Make ?? ""),
    model: r.Model ?? "",
    trim: r.Trim ?? "",
  }
}

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}
