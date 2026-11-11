import * as THREE from 'three'
import { patternFor, type Pattern, type RGB } from '../model/patterns.ts'

export type ShellFinish = {
  map: THREE.CanvasTexture
  normalMap: THREE.CanvasTexture
  roughnessMap: THREE.CanvasTexture
  roughness: number
  clearcoat: number
  clearcoatRoughness: number
  sheen: number
  metalness: number
  iridescence: number
  relief: number
  innerNacre: boolean
  lipExterior: boolean
}

const WIDTH = 512
const HEIGHT = 256
const cache = new Map<string, ShellFinish>()
let pearl: THREE.CanvasTexture | null = null

export function shellFinish(id: string): ShellFinish {
  const pattern = patternFor(id)
  const key = [
    id,
    pattern.base.join('.'),
    pattern.ink.join('.'),
    pattern.bands,
    pattern.bars,
    pattern.spots,
    pattern.cords,
    pattern.ribs,
    pattern.radial,
    pattern.lamella,
    pattern.zigzag,
    pattern.rays,
    pattern.blotches,
    pattern.streaks,
    pattern.margin?.join('.') ?? '',
    pattern.beak?.join('.') ?? '',
    pattern.innerNacre ? 1 : 0,
  ].join(':')
  const cached = cache.get(key)
  if (cached) return cached
  const finish = bake(pattern)
  cache.set(key, finish)
  return finish
}

export function nacreMap(): THREE.CanvasTexture {
  if (pearl) return pearl
  pearl = shellFinish('spirula').map
  return pearl
}

function bake(pattern: Pattern): ShellFinish {
  const color = document.createElement('canvas')
  color.width = WIDTH
  color.height = HEIGHT
  const height = new Float32Array(WIDTH * HEIGHT)
  const roughBytes = new Uint8ClampedArray(WIDTH * HEIGHT * 4)
  const image = color.getContext('2d', { willReadFrequently: true })
  if (!image) return emptyFinish(pattern)
  const pixels = image.createImageData(WIDTH, HEIGHT)
  const data = pixels.data
  const random = mulberry32(seedOf(pattern))

  for (let y = 0; y < HEIGHT; y++) {
    const v = y / HEIGHT
    for (let x = 0; x < WIDTH; x++) {
      const u = x / WIDTH
      const n = fbm(u, v)
      let [r, g, b] = pattern.nacre ? nacreRgb(u, v, n) : pattern.base
      const ink = pattern.ink
      r += (n - 0.5) * 26
      g += (n - 0.5) * 22
      b += (n - 0.5) * 16

      if (pattern.bands > 0) {
        const stripe = Math.pow(Math.max(0, Math.sin(v * pattern.bands * Math.PI * 2)), 10)
        r = mix(r, ink[0], stripe)
        g = mix(g, ink[1], stripe)
        b = mix(b, ink[2], stripe)
      }
      if (pattern.bars > 0) {
        const stripe = Math.pow(0.5 + 0.5 * Math.sin((u * pattern.bars + v * 1.4) * Math.PI * 2), 14)
        r = mix(r, ink[0], stripe * 0.85)
        g = mix(g, ink[1], stripe * 0.85)
        b = mix(b, ink[2], stripe * 0.85)
      }
      if (pattern.tents) paintTents(u, v, ink, (nr, ng, nb, amount) => {
        r = mix(r, nr, amount)
        g = mix(g, ng, amount)
        b = mix(b, nb, amount)
      })
      if (pattern.letters) paintLetters(u, v, pattern.ink, (nr, ng, nb, amount) => {
        r = mix(r, nr, amount)
        g = mix(g, ng, amount)
        b = mix(b, nb, amount)
      })
      if (pattern.fossil) {
        const stone = 0.55 + n * 0.2
        r = r * stone + 90
        g = g * stone + 78
        b = b * stone + 62
        if (fbm(u * 2.4 + 4, v * 2.4) > 0.68) {
          r *= 0.55
          g *= 0.55
          b *= 0.55
        }
      }
      if (pattern.worn) {
        if (n < 0.38) {
          r = mix(r, 72, 0.55)
          g = mix(g, 60, 0.55)
          b = mix(b, 46, 0.55)
        } else if (n > 0.74) {
          r = mix(r, 214, 0.45)
          g = mix(g, 206, 0.45)
          b = mix(b, 190, 0.45)
        }
      }
      if (pattern.streaks > 0) {
        const streak = Math.pow(Math.max(0, Math.sin(v * pattern.streaks * Math.PI * 2 + n * 3)), 10)
        r = mix(r, ink[0], streak * 0.7)
        g = mix(g, ink[1], streak * 0.7)
        b = mix(b, ink[2], streak * 0.7)
      }
      if (pattern.rays > 0) {
        const ray = Math.pow(0.5 + 0.5 * Math.sin(v * pattern.rays * Math.PI * 2), 1.6)
        r = mix(r, ink[0], ray * 0.72)
        g = mix(g, ink[1], ray * 0.72)
        b = mix(b, ink[2], ray * 0.72)
      }
      if (pattern.zigzag > 0) {
        const wave = 0.5 + 0.42 * Math.sin(v * pattern.zigzag * Math.PI * 2)
        const band = Math.abs(((u * 8 + wave) % 1) - 0.5)
        const stripe = band < 0.09 ? 1 - band / 0.09 : 0
        r = mix(r, ink[0], stripe)
        g = mix(g, ink[1], stripe)
        b = mix(b, ink[2], stripe)
      }
      if (pattern.blotches > 0) paintBlotches(u, v, pattern.blotches, ink, (nr, ng, nb, amount) => {
        r = mix(r, nr, amount)
        g = mix(g, ng, amount)
        b = mix(b, nb, amount)
      })
      if (pattern.margin && u > 0.8) {
        const edge = smooth(0.8, 0.96, u)
        r = mix(r, pattern.margin[0], edge)
        g = mix(g, pattern.margin[1], edge)
        b = mix(b, pattern.margin[2], edge)
      }
      if (pattern.beak && u < 0.28) {
        const tip = 1 - smooth(0.04, 0.28, u)
        r = mix(r, pattern.beak[0], tip * 0.8)
        g = mix(g, pattern.beak[1], tip * 0.8)
        b = mix(b, pattern.beak[2], tip * 0.8)
      }

      const growth = 0.5 + 0.5 * Math.sin(u * pattern.growth * Math.PI * 2)
      const cord = pattern.cords > 0 ? 0.5 + 0.5 * Math.sin(v * pattern.cords * Math.PI * 2) : 0.5
      const rib = pattern.ribs > 0 ? Math.pow(0.5 + 0.5 * Math.sin(u * pattern.ribs * Math.PI * 2), 2) : 0.5
      const radial = pattern.radial > 0 ? Math.pow(0.5 + 0.5 * Math.sin(v * pattern.radial * Math.PI * 2), 3) : 0.5
      const lamella = pattern.lamella > 0 ? lamellaRidge(u, pattern.lamella) : 0
      if (pattern.radial > 0) {
        const grooveShade = Math.max(0, 0.55 - radial) * 46
        r -= grooveShade
        g -= grooveShade
        b -= grooveShade
      }
      const relief =
        (growth - 0.5) * 0.22 +
        (cord - 0.5) * 0.85 +
        (rib - 0.5) * 1.5 +
        (radial - 0.5) * 1.7 +
        lamella +
        (n - 0.5) * 0.28
      const groove = Math.max(0, -relief) * 36
      r -= groove
      g -= groove
      b -= groove

      const i = (y * WIDTH + x) * 4
      data[i] = clampByte(r)
      data[i + 1] = clampByte(g)
      data[i + 2] = clampByte(b)
      data[i + 3] = 255
      height[y * WIDTH + x] = relief
      const baseRough = 0.84 - pattern.gloss * 0.66
      const rough = Math.min(0.96, Math.max(0.08, baseRough + Math.max(0, -relief) * 0.42 - Math.max(0, relief) * 0.1))
      const shade = clampByte(rough * 255)
      roughBytes[i] = shade
      roughBytes[i + 1] = shade
      roughBytes[i + 2] = shade
      roughBytes[i + 3] = 255
    }
  }

  stampSpots(data, pattern, random)
  image.putImageData(pixels, 0, 0)

  const map = new THREE.CanvasTexture(color)
  map.colorSpace = THREE.SRGBColorSpace
  map.wrapS = THREE.RepeatWrapping
  map.wrapT = THREE.ClampToEdgeWrapping
  map.anisotropy = 8

  const normalCanvas = document.createElement('canvas')
  normalCanvas.width = WIDTH
  normalCanvas.height = HEIGHT
  const normalImage = normalCanvas.getContext('2d')
  const normalMap = new THREE.CanvasTexture(normalCanvas)
  if (normalImage) {
    normalImage.putImageData(new ImageData(normalsFrom(height), WIDTH, HEIGHT), 0, 0)
    normalMap.colorSpace = THREE.NoColorSpace
    normalMap.wrapS = THREE.RepeatWrapping
    normalMap.wrapT = THREE.ClampToEdgeWrapping
    normalMap.anisotropy = 8
    normalMap.needsUpdate = true
  }

  const roughCanvas = document.createElement('canvas')
  roughCanvas.width = WIDTH
  roughCanvas.height = HEIGHT
  const roughImage = roughCanvas.getContext('2d')
  const roughnessMap = new THREE.CanvasTexture(roughCanvas)
  if (roughImage) {
    roughImage.putImageData(new ImageData(roughBytes, WIDTH, HEIGHT), 0, 0)
    roughnessMap.colorSpace = THREE.NoColorSpace
    roughnessMap.wrapS = THREE.RepeatWrapping
    roughnessMap.wrapT = THREE.ClampToEdgeWrapping
    roughnessMap.anisotropy = 8
    roughnessMap.needsUpdate = true
  }

  const gloss = pattern.gloss
  return {
    map,
    normalMap,
    roughnessMap,
    roughness: 0.8 - gloss * 0.64,
    clearcoat: gloss * 0.92,
    clearcoatRoughness: 0.42 - gloss * 0.22,
    sheen: pattern.nacre ? 0.85 : 0.18 + (1 - gloss) * 0.28,
    metalness: pattern.nacre ? 0.16 : 0,
    iridescence: pattern.nacre ? 0.8 : 0,
    relief: pattern.relief,
    innerNacre: pattern.innerNacre,
    lipExterior: pattern.margin != null,
  }
}

function paintBlotches(
  u: number,
  v: number,
  rows: number,
  ink: RGB,
  mixInk: (r: number, g: number, b: number, amount: number) => void,
) {
  for (let row = 0; row < rows; row++) {
    const center = (row + 0.5) / rows
    const dv = Math.abs(v - center)
    if (dv > 0.16) continue
    const phase = (u * 2.2 + row * 0.37) % 1
    const du = Math.abs(phase - 0.5)
    if (du > 0.28) continue
    const amount = (1 - du / 0.28) * (1 - dv / 0.16)
    mixInk(ink[0], ink[1], ink[2], amount * 0.95)
  }
}

function lamellaRidge(u: number, count: number): number {
  const phase = (u * count) % 1
  const edge = Math.exp(-(((phase - 0.14) * 9) ** 2))
  return edge * 1.15 + (phase - 0.55) * 0.12
}

function smooth(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function paintTents(u: number, v: number, ink: RGB, mixInk: (r: number, g: number, b: number, amount: number) => void) {
  const cols = 7
  const rows = 5
  const column = Math.floor(u * cols)
  const cu = u * cols - column
  const cv = (v * rows + (column % 2) * 0.5) % 1
  const width = 1 - Math.abs(cu - 0.5) * 2
  const inside = cv > 0.18 && cv < 0.18 + width * 0.72 && width > 0.12
  if (inside) mixInk(ink[0], ink[1], ink[2], 0.92)
}

function paintLetters(
  u: number,
  v: number,
  ink: RGB,
  mixInk: (r: number, g: number, b: number, amount: number) => void,
) {
  const zig = 0.5 + 0.16 * Math.sin(u * 16 * Math.PI * 2) + 0.06 * Math.sin(v * 6 + u * 9)
  const upper = Math.abs(v - zig * 0.72) < 0.028
  const lower = Math.abs(v - (0.22 + zig * 0.5)) < 0.022
  if (upper || lower) mixInk(ink[0], ink[1], ink[2], 0.9)
}

function stampSpots(data: Uint8ClampedArray, pattern: Pattern, random: () => number) {
  const ink = pattern.ink
  for (let s = 0; s < pattern.spots; s++) {
    const cx = random() * WIDTH
    const cy = random() * HEIGHT
    const rx = (0.45 + random()) * pattern.spotSize * WIDTH
    const ry = rx * (0.55 + random() * 0.5)
    const x0 = Math.floor(cx - rx)
    const x1 = Math.ceil(cx + rx)
    const y0 = Math.max(0, Math.floor(cy - ry))
    const y1 = Math.min(HEIGHT - 1, Math.ceil(cy + ry))
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const du = (x - cx) / rx
        const dv = (y - cy) / ry
        const d = du * du + dv * dv
        if (d >= 1) continue
        const amount = 1 - d
        const xx = ((x % WIDTH) + WIDTH) % WIDTH
        const i = (y * WIDTH + xx) * 4
        data[i] = clampByte(mix(data[i], ink[0], amount))
        data[i + 1] = clampByte(mix(data[i + 1], ink[1], amount))
        data[i + 2] = clampByte(mix(data[i + 2], ink[2], amount))
      }
    }
  }
}

function normalsFrom(height: Float32Array): Uint8ClampedArray {
  const out = new Uint8ClampedArray(WIDTH * HEIGHT * 4)
  for (let y = 0; y < HEIGHT; y++) {
    const y0 = (y - 1 + HEIGHT) % HEIGHT
    const y1 = (y + 1) % HEIGHT
    for (let x = 0; x < WIDTH; x++) {
      const x0 = (x - 1 + WIDTH) % WIDTH
      const x1 = (x + 1) % WIDTH
      const dx = (height[y * WIDTH + x1] - height[y * WIDTH + x0]) * 3.2
      const dy = (height[y1 * WIDTH + x] - height[y0 * WIDTH + x]) * 3.2
      const len = Math.hypot(dx, dy, 1)
      const i = (y * WIDTH + x) * 4
      out[i] = (-dx / len) * 127.5 + 127.5
      out[i + 1] = (-dy / len) * 127.5 + 127.5
      out[i + 2] = (1 / len) * 127.5 + 127.5
      out[i + 3] = 255
    }
  }
  return out
}

function emptyFinish(pattern: Pattern): ShellFinish {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 2
  const map = new THREE.CanvasTexture(canvas)
  return {
    map,
    normalMap: map,
    roughnessMap: map,
    roughness: 0.6,
    clearcoat: 0.1,
    clearcoatRoughness: 0.4,
    sheen: 0.2,
    metalness: 0,
    iridescence: 0,
    relief: pattern.relief,
    innerNacre: pattern.innerNacre,
    lipExterior: false,
  }
}

function nacreRgb(u: number, v: number, n: number): RGB {
  return hsl((v * 0.42 + u * 0.22 + n * 0.12) % 1, 0.32, 0.74)
}

function hsl(h: number, s: number, l: number): RGB {
  const hue = h * 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (hue < 60) {
    r = c
    g = x
  } else if (hue < 120) {
    r = x
    g = c
  } else if (hue < 180) {
    g = c
    b = x
  } else if (hue < 240) {
    g = x
    b = c
  } else if (hue < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

function fbm(u: number, v: number): number {
  let sum = 0
  let amplitude = 0.5
  let freq = 3
  for (let octave = 0; octave < 4; octave++) {
    sum += amplitude * noise(u * freq, v * freq, freq)
    freq *= 2
    amplitude *= 0.5
  }
  return sum
}

function noise(x: number, y: number, period: number): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const wrap = (n: number) => ((n % period) + period) % period
  const a = hash(wrap(x0), y0)
  const b = hash(wrap(x0 + 1), y0)
  const c = hash(wrap(x0), y0 + 1)
  const d = hash(wrap(x0 + 1), y0 + 1)
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}

function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedOf(pattern: Pattern): number {
  return (
    (pattern.base[0] * 73856093) ^
    (pattern.base[1] * 19349663) ^
    (pattern.ink[2] * 83492791) ^
    (pattern.spots * 97) ^
    (pattern.bands * 13) ^
    (pattern.bars * 29)
  )
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function clampByte(n: number): number {
  return n < 0 ? 0 : n > 255 ? 255 : n
}
