export type RGB = [number, number, number]

export type Pattern = {
  base: RGB
  ink: RGB
  bands: number
  bars: number
  spots: number
  spotSize: number
  tents: boolean
  letters: boolean
  nacre: boolean
  fossil: boolean
  worn: boolean
  ribs: number
  cords: number
  growth: number
  gloss: number
  relief: number
  innerNacre: boolean
  /** Ridges running from the beak to the margin. */
  radial: number
  /** Sharp commarginal shelves, as on an oyster. */
  lamella: number
  /** Dark zigzag bands, as on a zebra mussel. */
  zigzag: number
  /** Pale or dark rays from the beak. */
  rays: number
  /** Spiral rows of blotches, as on a volute. */
  blotches: number
  /** Dark streaks along the direction of growth. */
  streaks: number
  /** Color of the shell edge, sampled at the aperture. */
  margin: RGB | null
  /** Color gathered at the beak. */
  beak: RGB | null
}

const PLAIN: Pattern = {
  base: [226, 208, 184],
  ink: [156, 122, 88],
  bands: 0,
  bars: 0,
  spots: 0,
  spotSize: 0.045,
  tents: false,
  letters: false,
  nacre: false,
  fossil: false,
  worn: false,
  ribs: 0,
  cords: 4,
  growth: 48,
  gloss: 0.38,
  relief: 0.55,
  innerNacre: false,
  radial: 0,
  lamella: 0,
  zigzag: 0,
  rays: 0,
  blotches: 0,
  streaks: 0,
  margin: null,
  beak: null,
}

function coat(base: RGB, ink: RGB, extra: Partial<Pattern> = {}): Pattern {
  return { ...PLAIN, base, ink, ...extra }
}

export const PATTERNS: Record<string, Pattern> = {
  plain: PLAIN,
  turritella: coat([148, 104, 72], [78, 48, 32], { cords: 11, growth: 36, gloss: 0.28, relief: 0.7 }),
  helix: coat([214, 186, 152], [120, 86, 58], { bands: 4, cords: 2, gloss: 0.4, relief: 0.35 }),
  cornu: coat([122, 78, 48], [62, 36, 22], { bands: 3, spots: 28, gloss: 0.3, relief: 0.45 }),
  lissachatina: coat([156, 112, 74], [62, 36, 22], { bars: 20, gloss: 0.34, relief: 0.4 }),
  'cepaea-nemoralis': coat([214, 176, 62], [42, 28, 16], { bands: 5, cords: 0, gloss: 0.48, relief: 0.22 }),
  'cepaea-hortensis': coat([228, 210, 150], [58, 40, 24], { bands: 5, cords: 0, gloss: 0.5, relief: 0.2 }),
  paryphanta: coat([86, 92, 52], [36, 40, 22], { cords: 1, growth: 22, gloss: 0.62, relief: 0.18 }),
  powelliphanta: coat([46, 50, 30], [20, 22, 14], { cords: 0, growth: 16, gloss: 0.7, relief: 0.12 }),
  'pomacea-canaliculata': coat([168, 148, 64], [62, 48, 22], { bands: 6, gloss: 0.42, relief: 0.3 }),
  'pomacea-diffusa': coat([198, 178, 118], [96, 74, 40], { bands: 3, gloss: 0.4, relief: 0.28 }),
  planorbarius: coat([118, 64, 50], [62, 32, 26], { cords: 2, gloss: 0.32, relief: 0.4 }),
  planorbis: coat([78, 46, 38], [40, 22, 18], { cords: 2, gloss: 0.28, relief: 0.42 }),
  lymnaea: coat([186, 158, 116], [110, 82, 52], { cords: 1, growth: 60, gloss: 0.22, relief: 0.25 }),
  melanoides: coat([74, 50, 34], [36, 24, 16], { cords: 12, spots: 18, gloss: 0.24, relief: 0.75 }),
  buccinum: coat([188, 178, 164], [96, 88, 74], { bands: 4, cords: 3, gloss: 0.3, relief: 0.48 }),
  littorina: coat([58, 60, 58], [28, 28, 26], { worn: true, cords: 2, gloss: 0.34, relief: 0.3 }),
  aliger: coat([214, 168, 146], [140, 78, 64], { spots: 12, spotSize: 0.06, cords: 1, gloss: 0.58, relief: 0.22 }),
  conus: coat([232, 214, 188], [64, 36, 24], { tents: true, cords: 0, gloss: 0.72, relief: 0.16 }),
  murex: coat([210, 186, 162], [120, 90, 64], { ribs: 18, cords: 2, gloss: 0.26, relief: 1.15 }),
  charonia: coat([220, 196, 162], [64, 40, 28], { bands: 5, spots: 36, gloss: 0.46, relief: 0.4 }),
  neverita: coat([176, 172, 164], [110, 106, 98], { cords: 0, growth: 20, gloss: 0.74, relief: 0.12 }),
  rochia: coat([230, 222, 210], [168, 46, 36], { bars: 14, cords: 2, gloss: 0.44, relief: 0.35 }),
  lunella: coat([42, 108, 76], [16, 42, 32], { cords: 7, gloss: 0.5, relief: 0.55 }),
  terebra: coat([96, 58, 38], [236, 224, 204], { spots: 48, spotSize: 0.028, cords: 2, gloss: 0.36, relief: 0.4 }),
  epitonium: coat([238, 234, 228], [200, 196, 188], { ribs: 16, cords: 0, growth: 8, gloss: 0.4, relief: 1.25 }),
  cassis: coat([206, 142, 78], [92, 48, 28], { spots: 22, cords: 4, gloss: 0.48, relief: 0.55 }),
  tonna: coat([198, 162, 114], [120, 86, 52], { cords: 5, growth: 28, gloss: 0.2, relief: 0.5 }),
  cypraea: coat([242, 238, 230], [48, 36, 28], { spots: 180, spotSize: 0.011, cords: 0, growth: 6, gloss: 0.94, relief: 0.08 }),
  oliva: coat([64, 42, 30], [214, 176, 120], { letters: true, cords: 0, growth: 8, gloss: 0.9, relief: 0.1 }),
  haliotis: coat([118, 102, 74], [42, 52, 36], {
    cords: 8,
    spots: 36,
    spotSize: 0.055,
    growth: 22,
    gloss: 0.22,
    relief: 1.05,
    innerNacre: true,
  }),
  nautilus: coat([230, 218, 198], [92, 58, 36], { bars: 11, cords: 0, gloss: 0.42, relief: 0.28, innerNacre: true }),
  asteroceras: coat([154, 136, 112], [92, 78, 60], { fossil: true, ribs: 12, cords: 0, gloss: 0.08, relief: 0.7 }),
  dactylioceras: coat([136, 120, 102], [78, 66, 52], { fossil: true, ribs: 22, cords: 0, gloss: 0.08, relief: 0.9 }),
  spirula: coat([236, 232, 226], [186, 210, 206], { nacre: true, cords: 0, growth: 14, gloss: 0.66, relief: 0.2, innerNacre: true }),
  argonauta: coat([234, 226, 208], [186, 170, 146], { ribs: 9, cords: 0, growth: 10, gloss: 0.12, relief: 0.45 }),
  mercenaria: coat([214, 198, 178], [140, 120, 100], { cords: 8, growth: 24, gloss: 0.18, relief: 0.6 }),
  dentalium: coat([228, 222, 208], [52, 110, 78], { ribs: 12, cords: 0, growth: 6, gloss: 0.3, relief: 0.8 }),
  ovis: coat([176, 118, 48], [92, 58, 24], { bars: 8, cords: 0, growth: 12, gloss: 0.36, relief: 0.65 }),
  loxodonta: coat([236, 228, 210], [196, 184, 160], { cords: 0, growth: 8, gloss: 0.28, relief: 0.22 }),
  pagurus: coat([128, 106, 82], [62, 48, 36], { worn: true, bands: 3, gloss: 0.18, relief: 0.5 }),
  spirorbis: coat([236, 236, 232], [196, 196, 190], { cords: 2, growth: 10, gloss: 0.1, relief: 0.35 }),
  elphidium: coat([198, 190, 172], [120, 112, 96], { ribs: 28, cords: 0, gloss: 0.55, relief: 0.6 }),
  melo: coat([214, 126, 48], [64, 24, 10], {
    blotches: 4,
    cords: 0,
    growth: 22,
    gloss: 0.78,
    relief: 0.14,
  }),
  dreissena: coat([214, 196, 150], [36, 32, 24], {
    zigzag: 6,
    cords: 0,
    growth: 18,
    gloss: 0.4,
    relief: 0.22,
  }),
  mytilus: coat([28, 36, 52], [96, 62, 36], {
    streaks: 6,
    cords: 0,
    growth: 46,
    gloss: 0.58,
    relief: 0.28,
    innerNacre: true,
  }),
  perna: coat([98, 64, 36], [42, 32, 22], {
    streaks: 4,
    cords: 0,
    growth: 34,
    gloss: 0.52,
    relief: 0.26,
    margin: [18, 128, 72],
    innerNacre: true,
  }),
  saccostrea: coat([88, 82, 74], [48, 44, 38], {
    lamella: 11,
    radial: 5,
    worn: true,
    cords: 0,
    gloss: 0.1,
    relief: 0.95,
  }),
  sinohyriopsis: coat([58, 44, 30], [28, 36, 22], {
    lamella: 9,
    growth: 16,
    gloss: 0.32,
    relief: 0.55,
    margin: [36, 78, 46],
    innerNacre: true,
  }),
  pinctada: coat([62, 64, 42], [24, 28, 18], {
    lamella: 16,
    growth: 8,
    gloss: 0.2,
    relief: 0.72,
    margin: [12, 14, 12],
    innerNacre: true,
  }),
  'ostrea-edulis': coat([176, 164, 146], [112, 72, 108], {
    lamella: 18,
    worn: true,
    spots: 14,
    spotSize: 0.04,
    cords: 0,
    gloss: 0.12,
    relief: 0.48,
  }),
  pinna: coat([186, 124, 58], [120, 70, 32], {
    radial: 22,
    lamella: 7,
    cords: 0,
    gloss: 0.36,
    relief: 0.8,
    innerNacre: true,
  }),
  'ostrea-chilensis': coat([158, 162, 146], [96, 108, 90], {
    lamella: 20,
    worn: true,
    cords: 0,
    gloss: 0.14,
    relief: 0.4,
  }),
  cerastoderma: coat([220, 202, 172], [120, 78, 42], {
    radial: 24,
    spots: 30,
    spotSize: 0.012,
    cords: 0,
    gloss: 0.22,
    relief: 1.05,
  }),
  magallana: coat([124, 104, 114], [72, 58, 64], {
    radial: 7,
    lamella: 10,
    worn: true,
    cords: 0,
    gloss: 0.1,
    relief: 1.0,
  }),
  ensis: coat([74, 70, 38], [40, 48, 28], {
    growth: 58,
    cords: 0,
    gloss: 0.42,
    relief: 0.16,
    margin: [48, 36, 58],
  }),
  tridacna: coat([232, 226, 210], [186, 150, 128], {
    radial: 6,
    cords: 0,
    gloss: 0.26,
    relief: 1.25,
  }),
  'paphies-subtriangulata': coat([176, 140, 86], [110, 78, 42], {
    growth: 32,
    worn: true,
    cords: 0,
    gloss: 0.18,
    relief: 0.36,
  }),
  panopea: coat([214, 208, 196], [150, 142, 128], {
    growth: 14,
    worn: true,
    cords: 0,
    gloss: 0.08,
    relief: 0.3,
  }),
  'paphies-australis': coat([228, 220, 204], [150, 90, 130], {
    growth: 26,
    cords: 0,
    gloss: 0.24,
    relief: 0.22,
    beak: [142, 78, 118],
  }),
  pecten: coat([198, 116, 92], [236, 220, 206], {
    radial: 18,
    rays: 9,
    cords: 0,
    gloss: 0.38,
    relief: 1.0,
  }),
  teredo: coat([214, 202, 184], [92, 62, 40], {
    radial: 10,
    growth: 20,
    cords: 0,
    gloss: 0.16,
    relief: 0.55,
    beak: [110, 72, 44],
  }),
}

export function patternFor(id: string): Pattern {
  return PATTERNS[id] ?? PLAIN
}
