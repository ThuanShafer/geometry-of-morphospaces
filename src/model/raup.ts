// Raup's coiled shell, in the form used by Noshita (2014) and ktch.
// The generating curve is a circle (Raup's shape parameter S = 1) swept on a
// logarithmic spiral. θ = 0 is the aperture; θ decreases toward the apex.
//
//   r(θ) = W^(θ / 2π)
//   R    = r * (1 + D) / (1 − D)     distance of the tube center from the axis
//   Z    = r * 2T / (1 − D)          height of the tube center along the axis
//
// D = r_inner / r_outer. T = 0 is planispiral.
// Raup & Michelson 1965, Science 147:1294–1295.
// Raup 1966, Journal of Paleontology 40:1178–1190.

export type RaupParams = {
  W: number
  D: number
  T: number
}

export const WALL = 0.14

const TAU = Math.PI * 2

export type Frame = {
  x: number
  y: number
  z: number
  s: number
  dxr: number
  dyr: number
  dzr: number
  dxg: number
  dyg: number
  dzg: number
}

export function frameInto(
  out: Frame,
  params: RaupParams,
  theta: number,
  phi: number,
  rho: number,
): Frame {
  const W = params.W > 1 ? params.W : 1.0001
  const D = params.D < 0.98 ? params.D : 0.98
  const k = Math.log(W) / TAU
  const s = Math.exp(k * theta)
  const cx = (1 + D) / (1 - D)
  const cz = (2 * params.T) / (1 - D)
  const cosP = Math.cos(phi)
  const sinP = Math.sin(phi)
  const A = Math.max(0, cx + rho * cosP)
  const B = cz + rho * sinP
  const cosT = Math.cos(theta)
  const sinT = Math.sin(theta)

  out.s = s
  out.x = s * A * cosT
  out.y = -s * B
  out.z = s * A * sinT
  out.dxr = s * cosP * cosT
  out.dyr = -s * sinP
  out.dzr = s * cosP * sinT
  out.dxg = s * A * (k * cosT - sinT)
  out.dyg = -k * s * B
  out.dzg = s * A * (k * sinT + cosT)
  return out
}

export function frame(params: RaupParams, theta: number, phi: number, rho = 1): Frame {
  return frameInto(blankFrame(), params, theta, phi, rho)
}

function blankFrame(): Frame {
  return { x: 0, y: 0, z: 0, s: 0, dxr: 0, dyr: 0, dzr: 0, dxg: 0, dyg: 0, dzg: 0 }
}

/** How many revolutions until the apex is negligible, capped for the mesh. */
export function whorlCount(W: number): number {
  const safe = W > 1 ? W : 1.0001
  const raw = Math.log(1 / 0.012) / Math.log(safe)
  return Math.min(7.5, Math.max(0.42, raw))
}

export type MeshData = {
  positions: Float32Array
  normals: Float32Array
  colors: Float32Array
  uvs: Float32Array
  indices: Uint32Array
}

export type ShellMeshData = {
  outer: MeshData
  inner: MeshData
  lip: MeshData
  apex: MeshData
  center: [number, number, number]
  maxExtent: number
}

export function buildShell(params: RaupParams, quality: 'hero' | 'ghost'): ShellMeshData {
  const whorls = whorlCount(params.W)
  const steps = quality === 'hero' ? Math.max(96, Math.round(whorls * 56)) : Math.max(40, Math.round(whorls * 24))
  const segs = quality === 'hero' ? 42 : 18
  const outer = buildSurface(params, whorls, steps, segs, 1, true, outerColor)
  const inner = buildSurface(params, whorls, steps, segs, 1 - WALL, false, innerColor)
  const lip = buildRing(params, 0, segs, 1, whorls, 1)
  const apex = buildRing(params, -whorls * TAU, segs, -1, whorls, 0)
  const { center, maxExtent } = measure(outer.positions)
  return { outer, inner, lip, apex, center, maxExtent }
}

function buildSurface(
  params: RaupParams,
  whorls: number,
  steps: number,
  segs: number,
  rho: number,
  outward: boolean,
  colorAt: (along: number, phi: number) => [number, number, number],
): MeshData {
  const rings = steps + 1
  const vertCount = rings * segs
  const positions = new Float32Array(vertCount * 3)
  const normals = new Float32Array(vertCount * 3)
  const colors = new Float32Array(vertCount * 3)
  const uvs = new Float32Array(vertCount * 2)
  const indices = new Uint32Array(steps * segs * 6)
  const tmp = blankFrame()
  const sign = outward ? 1 : -1

  for (let i = 0; i <= steps; i++) {
    const along = i / steps
    const theta = -whorls * TAU * (1 - along)
    for (let j = 0; j < segs; j++) {
      const phi = (j / segs) * TAU
      frameInto(tmp, params, theta, phi, rho)
      const v = i * segs + j
      positions[v * 3] = tmp.x
      positions[v * 3 + 1] = tmp.y
      positions[v * 3 + 2] = tmp.z
      const len = Math.hypot(tmp.dxr, tmp.dyr, tmp.dzr) || 1
      normals[v * 3] = (sign * tmp.dxr) / len
      normals[v * 3 + 1] = (sign * tmp.dyr) / len
      normals[v * 3 + 2] = (sign * tmp.dzr) / len
      const [r, g, b] = colorAt(along, phi)
      colors[v * 3] = r
      colors[v * 3 + 1] = g
      colors[v * 3 + 2] = b
      uvs[v * 2] = whorls < 1 ? along : along * whorls
      uvs[v * 2 + 1] = j / segs
    }
  }

  let p = 0
  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < segs; j++) {
      const j2 = (j + 1) % segs
      const a = i * segs + j
      const b = (i + 1) * segs + j
      const c = (i + 1) * segs + j2
      const d = i * segs + j2
      p = writeTri(indices, p, positions, normals, a, b, c)
      p = writeTri(indices, p, positions, normals, a, c, d)
    }
  }

  return { positions, normals, colors, uvs, indices }
}

function buildRing(
  params: RaupParams,
  theta: number,
  segs: number,
  sign: 1 | -1,
  whorls: number,
  along: number,
): MeshData {
  const vertCount = segs * 2
  const positions = new Float32Array(vertCount * 3)
  const normals = new Float32Array(vertCount * 3)
  const colors = new Float32Array(vertCount * 3)
  const uvs = new Float32Array(vertCount * 2)
  const indices = new Uint32Array(segs * 6)
  const tmp = blankFrame()

  for (let j = 0; j < segs; j++) {
    const phi = (j / segs) * TAU
    for (let ring = 0; ring < 2; ring++) {
      const rho = ring === 0 ? 1 : 1 - WALL
      frameInto(tmp, params, theta, phi, rho)
      const v = ring * segs + j
      positions[v * 3] = tmp.x
      positions[v * 3 + 1] = tmp.y
      positions[v * 3 + 2] = tmp.z
      const len = Math.hypot(tmp.dxg, tmp.dyg, tmp.dzg) || 1
      normals[v * 3] = (sign * tmp.dxg) / len
      normals[v * 3 + 1] = (sign * tmp.dyg) / len
      normals[v * 3 + 2] = (sign * tmp.dzg) / len
      const [r, g, b] = ring === 0 ? outerColor(along, phi) : innerColor(along, phi)
      colors[v * 3] = r
      colors[v * 3 + 1] = g
      colors[v * 3 + 2] = b
      uvs[v * 2] = whorls < 1 ? along : along * whorls
      uvs[v * 2 + 1] = j / segs
    }
  }

  let p = 0
  for (let j = 0; j < segs; j++) {
    const j2 = (j + 1) % segs
    const o0 = j
    const o1 = j2
    const i1 = segs + j2
    const i0 = segs + j
    p = writeTri(indices, p, positions, normals, o0, i0, i1)
    p = writeTri(indices, p, positions, normals, o0, i1, o1)
  }

  return { positions, normals, colors, uvs, indices }
}

function writeTri(
  indices: Uint32Array,
  p: number,
  positions: Float32Array,
  normals: Float32Array,
  a: number,
  b: number,
  c: number,
): number {
  const ax = positions[a * 3]
  const ay = positions[a * 3 + 1]
  const az = positions[a * 3 + 2]
  const bx = positions[b * 3]
  const by = positions[b * 3 + 1]
  const bz = positions[b * 3 + 2]
  const cx = positions[c * 3]
  const cy = positions[c * 3 + 1]
  const cz = positions[c * 3 + 2]
  const nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay)
  const ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az)
  const nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
  const dot = nx * normals[a * 3] + ny * normals[a * 3 + 1] + nz * normals[a * 3 + 2]
  if (dot < 0) {
    indices[p] = a
    indices[p + 1] = c
    indices[p + 2] = b
  } else {
    indices[p] = a
    indices[p + 1] = b
    indices[p + 2] = c
  }
  return p + 3
}

function measure(positions: Float32Array): { center: [number, number, number]; maxExtent: number } {
  let minX = Infinity
  let minY = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let maxZ = -Infinity
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]
    const y = positions[i + 1]
    const z = positions[i + 2]
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (z < minZ) minZ = z
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
    if (z > maxZ) maxZ = z
  }
  return {
    center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    maxExtent: Math.max(maxX - minX, maxY - minY, maxZ - minZ, 1e-6),
  }
}

function outerColor(along: number, phi: number): [number, number, number] {
  const pore = 0.5 + 0.5 * Math.sin(along * 40 + phi * 3)
  const suture = Math.max(0, -Math.sin(phi))
  const shade = 0.035 * pore + (1 - along) * 0.07 + suture * suture * 0.34
  const v = clamp01(1 - shade)
  return [v, v, v]
}

function innerColor(along: number, phi: number): [number, number, number] {
  const flutter = 0.5 + 0.5 * Math.sin(phi * 3 + along * 8)
  return [
    clamp01(0.42 + along * 0.5),
    clamp01(0.11 + along * 0.34 + flutter * 0.03),
    clamp01(0.045 + along * 0.13),
  ]
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n
}
