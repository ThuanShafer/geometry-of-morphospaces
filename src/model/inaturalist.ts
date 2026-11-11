/** iNaturalist taxon id for the species page. Looked up from the current name. */
const TAXON: Record<string, number> = {
  turritella: 551924,
  terebra: 368661,
  melanoides: 209144,
  epitonium: 892722,
  lymnaea: 61770,
  charonia: 121741,
  lissachatina: 502885,
  buccinum: 130213,
  rochia: 962782,
  cornu: 480298,
  pagurus: 152975,
  murex: 358609,
  helix: 61523,
  spirorbis: 194018,
  littorina: 81606,
  planorbarius: 150979,
  planorbis: 150988,
  elphidium: 1353815,
  argonauta: 253674,
  powelliphanta: 395566,
  paryphanta: 108955,
  'cepaea-nemoralis': 48586,
  // Lunella smaragda is listed there as Lunella smaragdus.
  lunella: 398520,
  'cepaea-hortensis': 51039,
  'pomacea-diffusa': 479977,
  aliger: 1099504,
  'pomacea-canaliculata': 122278,
  spirula: 85107,
  nautilus: 123467,
  neverita: 59360,
  cassis: 200852,
  conus: 56719,
  tonna: 254661,
  ovis: 121578,
  cypraea: 84107,
  oliva: 208733,
  haliotis: 390162,
  dentalium: 1138803,
  loxodonta: 43694,
  mercenaria: 125758,
  melo: 578436,
  dreissena: 116340,
  mytilus: 117650,
  perna: 394900,
  saccostrea: 244646,
  sinohyriopsis: 1153368,
  pinctada: 368663,
  'ostrea-edulis': 53462,
  pinna: 118945,
  'ostrea-chilensis': 394133,
  cerastoderma: 210230,
  magallana: 605992,
  ensis: 332435,
  tridacna: 114396,
  'paphies-subtriangulata': 394306,
  panopea: 117618,
  'paphies-australis': 394304,
  pecten: 324563,
  teredo: 209057,
}

/** Species page when iNaturalist has the taxon, otherwise a search for the name. */
export function inaturalistUrl(id: string, binomial: string): string {
  const taxon = TAXON[id]
  if (taxon) return `https://www.inaturalist.org/taxa/${taxon}`
  return `https://www.inaturalist.org/taxa/search?q=${encodeURIComponent(binomial)}`
}

export type TaxonPage = {
  id: number
  name: string
  commonName: string | null
  rank: string
  extinct: boolean
  observations: number
  summary: string
  photoUrl: string | null
  photoCredit: string | null
  lineage: string[]
  pageUrl: string
}

const LINEAGE = new Set(['kingdom', 'phylum', 'class', 'order', 'family'])

/** The taxa site refuses to be framed, so the popup reads this public record instead. */
export async function loadTaxon(id: string, binomial: string, signal?: AbortSignal): Promise<TaxonPage | null> {
  const taxon = TAXON[id]
  const url = taxon
    ? `https://api.inaturalist.org/v1/taxa/${taxon}`
    : `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(binomial)}`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`iNaturalist responded ${response.status}`)
  const match = pickTaxon(await response.json(), taxon, binomial)
  return match ? taxonFromApi(match, inaturalistUrl(id, binomial)) : null
}

export function taxonFromApi(value: unknown, pageUrl: string): TaxonPage | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') return null
  const photo = isRecord(value.default_photo) ? value.default_photo : null
  const photoUrl = typeof photo?.medium_url === 'string' ? photo.medium_url : null
  const attribution = typeof photo?.attribution === 'string' ? photo.attribution.trim() : ''
  const license = typeof photo?.license_code === 'string' ? photo.license_code.toUpperCase() : ''
  const photoCredit = attribution || license || null
  return {
    id: value.id,
    name: value.name,
    commonName: typeof value.preferred_common_name === 'string' ? value.preferred_common_name : null,
    rank: typeof value.rank === 'string' ? value.rank : 'taxon',
    extinct: value.extinct === true,
    observations: typeof value.observations_count === 'number' ? value.observations_count : 0,
    summary: plainSummary(typeof value.wikipedia_summary === 'string' ? value.wikipedia_summary : ''),
    photoUrl,
    photoCredit,
    lineage: lineageOf(value.ancestors),
    pageUrl,
  }
}

function pickTaxon(body: unknown, taxon: number | undefined, binomial: string): unknown {
  const results = isRecord(body) && Array.isArray(body.results) ? body.results : []
  if (taxon) return results.find((row) => isRecord(row) && row.id === taxon) ?? results[0] ?? null
  const wanted = binomial.toLowerCase()
  return results.find((row) => isRecord(row) && typeof row.name === 'string' && row.name.toLowerCase() === wanted) ?? null
}

function lineageOf(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const names: string[] = []
  for (const ancestor of value) {
    if (!isRecord(ancestor) || typeof ancestor.rank !== 'string' || typeof ancestor.name !== 'string') continue
    if (LINEAGE.has(ancestor.rank)) names.push(ancestor.name)
  }
  return names
}

function plainSummary(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
