import type { Vendor } from "./types"

/** Only http(s) links are ever stored or rendered (blocks javascript: and similar). */
export function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

/** Accepts "napaonline.com" and turns it into "https://napaonline.com". */
export function normalizeUrl(value: string) {
  const v = value.trim()
  if (!v) return ""
  return /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`
}

/**
 * Placeholders a vendor search link can use. {q} is the vehicle + part together
 * ("2019 Honda CR-V brake pads"), which works with most dealers' plain search boxes.
 */
export const PLACEHOLDERS = ["{q}", "{part}", "{year}", "{make}", "{model}", "{vin}"] as const

/** The word staff search for when teaching the app a vendor's search link. */
export const SAMPLE_SEARCH_WORD = "brakepads"

export function hasPlaceholder(template: string) {
  return PLACEHOLDERS.some((p) => template.includes(p))
}

/**
 * Turns a pasted search-results link into a template: the sample word becomes {q}.
 * Links that already contain placeholders are left alone.
 */
export function toSearchTemplate(link: string) {
  const url = normalizeUrl(link)
  if (!url || hasPlaceholder(url)) return url
  return url.replace(new RegExp(SAMPLE_SEARCH_WORD, "gi"), "{q}")
}

export type OrderContext = {
  part?: string
  vehicle?: { year: string; make: string; model: string; vin: string }
}

/**
 * Where to send the user to order: the vendor's search filled in with the vehicle and part
 * when the vendor has a search link, otherwise its website. Returns null for unsafe links.
 */
export function vendorOrderUrl(vendor: Pick<Vendor, "website" | "searchUrl">, ctx: OrderContext = {}) {
  const part = ctx.part?.trim() ?? ""
  const v = ctx.vehicle
  const values: Record<(typeof PLACEHOLDERS)[number], string> = {
    "{q}": [v?.year, v?.make, v?.model, part].filter(Boolean).join(" "),
    "{part}": part,
    "{year}": v?.year ?? "",
    "{make}": v?.make ?? "",
    "{model}": v?.model ?? "",
    "{vin}": v?.vin ?? "",
  }
  // Use the search link only if every placeholder it needs has a value
  const template = vendor.searchUrl
  const usable = template && PLACEHOLDERS.every((p) => !template.includes(p) || values[p])
  const url = usable
    ? PLACEHOLDERS.reduce((acc, p) => acc.replaceAll(p, encodeURIComponent(values[p])), template)
    : vendor.website
  return isHttpUrl(url) ? url : null
}

export function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "")
  } catch {
    return url
  }
}

/** Common US parts dealers (home pages only). Shops can add these in one click and edit them. */
export const COMMON_VENDORS = [
  { name: "NAPA Auto Parts", website: "https://www.napaonline.com" },
  { name: "AutoZone", website: "https://www.autozone.com" },
  { name: "O'Reilly Auto Parts", website: "https://www.oreillyauto.com" },
  { name: "Advance Auto Parts", website: "https://shop.advanceautoparts.com" },
  { name: "RockAuto", website: "https://www.rockauto.com" },
  { name: "WorldPac", website: "https://www.worldpac.com" },
]
