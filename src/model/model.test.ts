import { describe, expect, it } from 'vitest'
import { buildShell, frame, whorlCount } from './raup.ts'
import { aperturePose, marksFor, valveHinge } from './anatomy.ts'
import { NOTES } from './notes.ts'
import { PATTERNS } from './patterns.ts'
import { inaturalistUrl, taxonFromApi } from './inaturalist.ts'
import { SPECIMENS, inBounds } from './specimens.ts'
import { CUBE, TOLERANCE, fromLocal, isMatch, toLocal } from './space.ts'

describe('Raup frame', () => {
  it('triples the scale in one revolution when W is 3', () => {
    const params = { W: 3, D: 0.1, T: 0.4 }
    const mouth = frame(params, 0, 0, 1)
    const previous = frame(params, -Math.PI * 2, 0, 1)
    expect(mouth.s / previous.s).toBeCloseTo(3, 6)
  })

  it('defines D as the inner radius over the outer radius', () => {
    for (const D of [0, 0.07, 0.4, 0.64, 0.84]) {
      const params = { W: 2, D, T: 0.2 }
      const outer = frame(params, 0, 0, 1)
      const inner = frame(params, 0, Math.PI, 1)
      const outerR = Math.hypot(outer.x, outer.z)
      const innerR = Math.hypot(inner.x, inner.z)
      expect(innerR / outerR).toBeCloseTo(D, 5)
    }
  })

  it('keeps a planispiral shell on the coiling plane', () => {
    const up = frame({ W: 2, D: 0.2, T: 0 }, 0, Math.PI / 2, 1)
    const down = frame({ W: 2, D: 0.2, T: 0 }, 0, -Math.PI / 2, 1)
    expect(up.y + down.y).toBeCloseTo(0, 6)
  })

  it('raises the centerline as T grows', () => {
    const low = frame({ W: 2, D: 0.1, T: 1 }, 0, 0, 1)
    const high = frame({ W: 2, D: 0.1, T: 3 }, 0, 0, 1)
    expect(Math.abs(high.y)).toBeGreaterThan(Math.abs(low.y) * 2)
  })

  it('gives the clam less than one turn and the nautilus several', () => {
    expect(whorlCount(1e5)).toBeLessThan(1)
    expect(whorlCount(3)).toBeGreaterThan(3)
    expect(whorlCount(1.35)).toBeGreaterThan(6)
  })
})

describe('shell mesh', () => {
  it('builds finite, outward-facing triangles for every specimen', () => {
    for (const specimen of SPECIMENS) {
      const mesh = buildShell(specimen.params, 'ghost')
      for (const part of [mesh.outer, mesh.inner, mesh.lip, mesh.apex]) {
        expect(part.positions.some((value) => !Number.isFinite(value))).toBe(false)
        expect(part.indices.length % 3).toBe(0)
        const vertices = part.positions.length / 3
        expect(part.uvs.length).toBe(vertices * 2)
        for (let i = 0; i < part.indices.length; i++) {
          expect(part.indices[i]).toBeLessThan(vertices)
        }
        const a = part.indices[0]
        const b = part.indices[1]
        const c = part.indices[2]
        const ax = part.positions[a * 3]
        const ay = part.positions[a * 3 + 1]
        const az = part.positions[a * 3 + 2]
        const bx = part.positions[b * 3]
        const by = part.positions[b * 3 + 1]
        const bz = part.positions[b * 3 + 2]
        const cx = part.positions[c * 3]
        const cy = part.positions[c * 3 + 1]
        const cz = part.positions[c * 3 + 2]
        const nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay)
        const ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az)
        const nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
        const dot = nx * part.normals[a * 3] + ny * part.normals[a * 3 + 1] + nz * part.normals[a * 3 + 2]
        expect(dot).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

describe('bivalve hinge', () => {
  it('swings the margin out of the valve when the shell opens', () => {
    const clams = SPECIMENS.filter((specimen) => specimen.group === 'Bivalvia')
    expect(clams.length).toBeGreaterThan(10)
    for (const specimen of clams) {
      const hinge = valveHinge(specimen.params)
      expect(Math.hypot(hinge.ax, hinge.ay, hinge.az)).toBeCloseTo(1, 5)
      const mouth = frame(specimen.params, 0, 0, 0)
      const vx = mouth.x - hinge.x
      const vy = mouth.y - hinge.y
      const vz = mouth.z - hinge.z
      expect(Math.abs(hinge.ax * vx + hinge.ay * vy + hinge.az * vz)).toBeLessThan(1e-6)
      const turned = swing(vx, vy, vz, hinge.ax, hinge.ay, hinge.az, 0.5)
      expect(turned.z, specimen.id).toBeGreaterThan(0.2)
    }
  })
})

describe('morphospace', () => {
  it('keeps specimen coordinates inside the cube and on a round trip', () => {
    for (const specimen of SPECIMENS) {
      expect(inBounds(specimen.params)).toBe(true)
      const [x, y, z] = toLocal(specimen.params)
      expect(Math.abs(x)).toBeLessThanOrEqual(CUBE / 2 + 1e-6)
      expect(Math.abs(y)).toBeLessThanOrEqual(CUBE / 2 + 1e-6)
      expect(Math.abs(z)).toBeLessThanOrEqual(CUBE / 2 + 1e-6)
      const back = fromLocal(x, y, z)
      expect(Math.abs(Math.log10(back.W) - Math.log10(specimen.params.W))).toBeLessThan(1e-6)
      expect(back.D).toBeCloseTo(specimen.params.D, 5)
      expect(back.T).toBeCloseTo(specimen.params.T, 5)
      expect(isMatch(back, specimen.params)).toBe(true)
    }
  })

  it('gives every specimen its own lock, with no shared neighborhood', () => {
    for (let i = 0; i < SPECIMENS.length; i++) {
      for (let j = i + 1; j < SPECIMENS.length; j++) {
        const a = SPECIMENS[i]
        const b = SPECIMENS[j]
        const error = {
          log10W: Math.log10(a.params.W) - Math.log10(b.params.W),
          D: a.params.D - b.params.D,
          T: a.params.T - b.params.T,
        }
        const separated =
          Math.abs(error.log10W) >= TOLERANCE.log10W * 2 ||
          Math.abs(error.D) >= TOLERANCE.D * 2 ||
          Math.abs(error.T) >= TOLERANCE.T * 2
        expect(separated, `${a.id} overlaps ${b.id}`).toBe(true)
      }
    }
  })

  it('gives every animal a surface of its own', () => {
    for (const specimen of SPECIMENS) {
      expect(PATTERNS[specimen.id], specimen.id).toBeDefined()
    }
  })

  it('gives every animal an iNaturalist page', () => {
    expect(inaturalistUrl('nautilus', 'Nautilus pompilius')).toBe('https://www.inaturalist.org/taxa/123467')
    expect(inaturalistUrl('mytilus', 'Mytilus edulis')).toBe('https://www.inaturalist.org/taxa/117650')
    for (const specimen of SPECIMENS) {
      const url = inaturalistUrl(specimen.id, `${specimen.genus} ${specimen.species}`)
      expect(url.startsWith('https://www.inaturalist.org/'), specimen.id).toBe(true)
    }
    expect(inaturalistUrl('dactylioceras', 'Dactylioceras commune')).toContain('Dactylioceras%20commune')
  })

  it('reads an iNaturalist taxon into the popup record', () => {
    const page = taxonFromApi(
      {
        id: 123467,
        name: 'Nautilus pompilius',
        preferred_common_name: 'Emperor Nautilus',
        rank: 'species',
        extinct: false,
        observations_count: 331,
        wikipedia_summary: 'The <b>chambered nautilus</b> keeps a <i>spiral</i> shell.',
        default_photo: {
          medium_url: 'https://static.inaturalist.org/photos/58051104/medium.jpg',
          attribution: '(c) Ian Shaw',
          license_code: 'cc-by',
        },
        ancestors: [
          { rank: 'kingdom', name: 'Animalia' },
          { rank: 'subphylum', name: 'Conchifera' },
          { rank: 'phylum', name: 'Mollusca' },
          { rank: 'family', name: 'Nautilidae' },
        ],
      },
      'https://www.inaturalist.org/taxa/123467',
    )
    expect(page).toMatchObject({
      name: 'Nautilus pompilius',
      commonName: 'Emperor Nautilus',
      summary: 'The chambered nautilus keeps a spiral shell.',
      photoCredit: '(c) Ian Shaw',
      lineage: ['Animalia', 'Mollusca', 'Nautilidae'],
      pageUrl: 'https://www.inaturalist.org/taxa/123467',
    })
    expect(taxonFromApi({ name: 'no id' }, 'https://www.inaturalist.org/taxa/search?q=x')).toBeNull()
  })

  it('gives every animal a fact and a few separated parts', () => {
    for (const specimen of SPECIMENS) {
      const note = NOTES[specimen.id]
      expect(note?.fact.length, specimen.id).toBeGreaterThan(40)
      const pose = aperturePose(specimen.params)
      expect(Math.hypot(pose.gx, pose.gy, pose.gz)).toBeCloseTo(1, 5)
      const marks = marksFor(specimen.params, specimen.id)
      expect(marks.length).toBeGreaterThanOrEqual(2)
      expect(marks.length).toBeLessThanOrEqual(4)
      for (const mark of marks) {
        expect(mark.label.length).toBeGreaterThan(0)
        expect(Number.isFinite(mark.x + mark.y + mark.z)).toBe(true)
      }
      for (let i = 0; i < marks.length; i++) {
        for (let j = i + 1; j < marks.length; j++) {
          const distance = Math.hypot(
            marks[i].x - marks[j].x,
            marks[i].y - marks[j].y,
            marks[i].z - marks[j].z,
          )
          expect(distance, `${specimen.id} ${marks[i].id}/${marks[j].id}`).toBeGreaterThan(0.2)
        }
      }
    }
  })
})

function swing(
  vx: number,
  vy: number,
  vz: number,
  ax: number,
  ay: number,
  az: number,
  angle: number,
) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dot = ax * vx + ay * vy + az * vz
  const cx = ay * vz - az * vy
  const cy = az * vx - ax * vz
  const cz = ax * vy - ay * vx
  return {
    x: vx * cos + cx * sin + ax * dot * (1 - cos),
    y: vy * cos + cy * sin + ay * dot * (1 - cos),
    z: vz * cos + cz * sin + az * dot * (1 - cos),
  }
}
