import { noteFor } from './notes.ts'
import { frame, whorlCount, type RaupParams } from './raup.ts'

const TAU = Math.PI * 2

export type PartId =
  | 'apex'
  | 'spire'
  | 'suture'
  | 'whorl'
  | 'aperture'
  | 'lip'
  | 'umbilicus'
  | 'periphery'
  | 'chamber'
  | 'interior'
  | 'tip'
  | 'base'

const LABEL: Record<PartId, string> = {
  apex: 'Apex',
  spire: 'Spire',
  suture: 'Suture',
  whorl: 'Body whorl',
  aperture: 'Aperture',
  lip: 'Outer lip',
  umbilicus: 'Umbilicus',
  periphery: 'Periphery',
  chamber: 'Living chamber',
  interior: 'Interior',
  tip: 'Tip',
  base: 'Base',
}

export type Mark = {
  id: PartId
  label: string
  x: number
  y: number
  z: number
  nx: number
  ny: number
  nz: number
  /** Position along the coil. The overlay slides φ so the arrow hits the side facing the camera. */
  theta: number
  rho: number
  flip: boolean
  /** A point that is not on the tube wall, such as the umbilicus. */
  fixed: boolean
}

export type Pose = {
  x: number
  y: number
  z: number
  gx: number
  gy: number
  gz: number
}

type Plan =
  | 'horn'
  | 'ivory'
  | 'scaphopod'
  | 'bivalve'
  | 'cephalopod'
  | 'ammonite'
  | 'open'
  | 'abalone'
  | 'flat'
  | 'tower'
  | 'snail'

export function aperturePose(params: RaupParams): Pose {
  const placed = frame(params, 0, 0, 0)
  const length = Math.hypot(placed.dxg, placed.dyg, placed.dzg) || 1
  return {
    x: placed.x,
    y: placed.y,
    z: placed.z,
    gx: placed.dxg / length,
    gy: placed.dyg / length,
    gz: placed.dzg / length,
  }
}

export type ValveHinge = {
  x: number
  y: number
  z: number
  /** Unit axis through the beak. A positive turn swings the margin toward +Z. */
  ax: number
  ay: number
  az: number
}

/** Umbo and the axis that opens the two valves of a high-expansion shell. */
export function valveHinge(params: RaupParams): ValveHinge {
  const beak = frame(params, -whorlCount(params.W) * TAU, 0, 0)
  const mouth = frame(params, 0, 0, 0)
  const vx = mouth.x - beak.x
  const vy = mouth.y - beak.y
  const vz = mouth.z - beak.z
  // These valves lie in the coiling plane. The hinge is perpendicular to the
  // beak-to-margin line so the margin swings out of that plane.
  let ax = vy
  let ay = -vx
  let az = 0
  if (Math.abs(vz) > Math.hypot(vx, vy)) {
    ax = 0
    ay = 1
    az = 0
  }
  const length = Math.hypot(ax, ay, az) || 1
  return {
    x: beak.x,
    y: beak.y,
    z: beak.z,
    ax: ax / length,
    ay: ay / length,
    az: az / length,
  }
}

export function marksFor(params: RaupParams, id: string): Mark[] {
  const note = noteFor(id)
  const whorls = whorlCount(params.W)
  const apexTheta = -whorls * TAU
  const marks: Mark[] = []
  const add = (part: PartId, theta: number, phi: number, rho = 1, flip = false) => {
    const placed = frame(params, theta, phi, rho)
    const length = Math.hypot(placed.dxr, placed.dyr, placed.dzr) || 1
    const sign = flip ? -1 : 1
    marks.push({
      id: part,
      label: note.parts?.[part] ?? LABEL[part],
      x: placed.x,
      y: placed.y,
      z: placed.z,
      nx: (sign * placed.dxr) / length,
      ny: (sign * placed.dyr) / length,
      nz: (sign * placed.dzr) / length,
      theta,
      rho,
      flip,
      fixed: false,
    })
  }

  switch (planFor(params, id)) {
    case 'horn':
    case 'ivory':
      add('tip', apexTheta * 0.97, 0)
      add('base', 0, 0.4)
      break
    case 'scaphopod':
      add('tip', apexTheta * 0.96, 0)
      add('aperture', 0, 0.35)
      break
    case 'bivalve':
      add('apex', apexTheta * 0.75, 0.2)
      add('lip', 0, 0.7)
      break
    case 'cephalopod':
      add('chamber', -1.15, 0.35)
      add('periphery', -Math.PI, 0)
      add('aperture', 0, 0.55)
      break
    case 'ammonite':
      add('periphery', -Math.PI * 0.85, 0)
      add('aperture', 0, 0.45)
      addUmbilicus(params, id, marks)
      break
    case 'open':
      add('whorl', -TAU * 0.72, 0.2)
      add('apex', apexTheta * 0.82, 0)
      add('aperture', 0, 0.4)
      break
    case 'abalone':
      add('spire', Math.max(apexTheta * 0.72, -TAU * 1.15), 0.3)
      add('aperture', -0.2, 0.85)
      add('interior', -0.55, Math.PI, 0.45, true)
      break
    case 'flat':
      add('periphery', -Math.PI, 0)
      add('aperture', 0, 0.5)
      if (params.D > 0.2) addUmbilicus(params, id, marks)
      else add('apex', apexTheta * 0.78, 0.2)
      break
    case 'tower':
      add('apex', apexTheta * 0.93, 0)
      add('spire', -Math.min(whorls * 0.5, 3.4) * TAU, 0.1)
      add('suture', -TAU * 0.7, -Math.PI / 2)
      add('aperture', 0, 0.4)
      break
    default:
      add('apex', apexTheta * 0.9, 0.15)
      if (whorls > 1.35) add('whorl', -Math.PI * 1.15, 0.2)
      if (params.T > 0.45 && whorls > 2) add('suture', -TAU * 0.85, -Math.PI / 2)
      add('aperture', 0, 0.45)
      break
  }

  return marks.slice(0, 4)
}

function addUmbilicus(params: RaupParams, id: string, marks: Mark[]) {
  const center = frame(params, 0, 0, 0)
  const note = noteFor(id)
  marks.push({
    id: 'umbilicus',
    label: note.parts?.umbilicus ?? LABEL.umbilicus,
    x: 0,
    y: center.y,
    z: 0,
    nx: 0,
    ny: 1,
    nz: 0,
    theta: 0,
    rho: 0,
    flip: false,
    fixed: true,
  })
}

function planFor(params: RaupParams, id: string): Plan {
  if (id === 'ovis') return 'horn'
  if (id === 'loxodonta') return 'ivory'
  if (id === 'dentalium') return 'scaphopod'
  if (id === 'mercenaria') return 'bivalve'
  if (id === 'nautilus') return 'cephalopod'
  if (id === 'spirula') return 'open'
  if (id === 'asteroceras' || id === 'dactylioceras') return 'ammonite'
  if (id === 'haliotis') return 'abalone'
  if (params.T > 3.1) return 'tower'
  if (params.T < 0.2 && params.W < 40) return 'flat'
  if (params.W > 80) return 'bivalve'
  return 'snail'
}
