/** Supabase (AWS) regions → the closest Vercel function region, with a readable name. */
const AWS_TO_VERCEL: Record<string, { vercel: string; name: string }> = {
  "us-east-1": { vercel: "iad1", name: "Washington, D.C., USA" },
  "us-east-2": { vercel: "cle1", name: "Cleveland, USA" },
  "us-west-1": { vercel: "sfo1", name: "San Francisco, USA" },
  "us-west-2": { vercel: "pdx1", name: "Portland, USA" },
  "ca-central-1": { vercel: "yul1", name: "Montréal, Canada" },
  "sa-east-1": { vercel: "gru1", name: "São Paulo, Brazil" },
  "eu-west-1": { vercel: "dub1", name: "Dublin, Ireland" },
  "eu-west-2": { vercel: "lhr1", name: "London, UK" },
  "eu-west-3": { vercel: "cdg1", name: "Paris, France" },
  "eu-central-1": { vercel: "fra1", name: "Frankfurt, Germany" },
  "eu-central-2": { vercel: "fra1", name: "Zürich, Switzerland" },
  "eu-north-1": { vercel: "arn1", name: "Stockholm, Sweden" },
  "ap-south-1": { vercel: "bom1", name: "Mumbai, India" },
  "ap-southeast-1": { vercel: "sin1", name: "Singapore" },
  "ap-southeast-2": { vercel: "syd1", name: "Sydney, Australia" },
  "ap-northeast-1": { vercel: "hnd1", name: "Tokyo, Japan" },
  "ap-northeast-2": { vercel: "icn1", name: "Seoul, South Korea" },
  "ap-northeast-3": { vercel: "kix1", name: "Osaka, Japan" },
  "ap-east-1": { vercel: "hkg1", name: "Hong Kong" },
  "af-south-1": { vercel: "cpt1", name: "Cape Town, South Africa" },
}

const VERCEL_NAMES: Record<string, string> = Object.fromEntries(
  Object.values(AWS_TO_VERCEL).map(({ vercel, name }) => [vercel, name]),
)

/** Region of a Supabase pooler host such as aws-0-ap-south-1.pooler.supabase.com */
export function supabaseRegion(host: string) {
  const m = /^aws-\d+-([a-z]+-[a-z]+-\d)\.pooler\.supabase\.com$/i.exec(host)
  if (!m) return null
  const region = m[1].toLowerCase()
  return { region, ...(AWS_TO_VERCEL[region] ?? { vercel: null, name: region }) }
}

export function vercelRegionName(code: string) {
  return VERCEL_NAMES[code] ?? code
}
