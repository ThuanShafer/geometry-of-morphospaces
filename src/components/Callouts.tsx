import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { marksFor } from '../model/anatomy.ts'
import { frameInto, type Frame, type RaupParams } from '../model/raup.ts'

const SVG_NS = 'http://www.w3.org/2000/svg'

type Nodes = {
  shade: SVGLineElement
  leader: SVGLineElement
  shoulder: SVGLineElement
  dot: SVGCircleElement
  text: SVGTextElement
}

const PHIS = Array.from({ length: 16 }, (_, index) => (index / 16) * Math.PI * 2)

function blankFrame(): Frame {
  return { x: 0, y: 0, z: 0, s: 0, dxr: 0, dyr: 0, dzr: 0, dxg: 0, dyg: 0, dzg: 0 }
}

export function Callouts({
  params,
  id,
  svg,
  active,
  center,
}: {
  params: RaupParams
  id: string
  svg: RefObject<SVGSVGElement | null>
  active: boolean
  center: [number, number, number]
}) {
  const marks = useMemo(() => marksFor(params, id), [params, id])
  const anchors = useRef<(THREE.Group | null)[]>([])
  const origin = useRef<THREE.Group>(null)
  const nodes = useRef<Nodes[]>([])
  const normal = useMemo(() => new THREE.Vector3(), [])
  const local = useMemo(() => new THREE.Vector3(), [])
  const world = useMemo(() => new THREE.Vector3(), [])
  const bestWorld = useMemo(() => new THREE.Vector3(), [])
  const point = useMemo(() => new THREE.Vector3(), [])
  const midpoint = useMemo(() => new THREE.Vector3(), [])
  const view = useMemo(() => new THREE.Vector3(), [])
  const scratch = useMemo(() => blankFrame(), [])
  const size = useThree((state) => state.size)

  useEffect(() => {
    const root = svg.current
    if (!root) return
    root.replaceChildren()
    const defs = document.createElementNS(SVG_NS, 'defs')
    const marker = document.createElementNS(SVG_NS, 'marker')
    marker.setAttribute('id', 'anatomy-arrow')
    marker.setAttribute('viewBox', '0 0 10 10')
    marker.setAttribute('refX', '9')
    marker.setAttribute('refY', '5')
    marker.setAttribute('markerWidth', '9')
    marker.setAttribute('markerHeight', '9')
    marker.setAttribute('orient', 'auto')
    const head = document.createElementNS(SVG_NS, 'path')
    head.setAttribute('d', 'M0,0 L10,5 L0,10 Z')
    head.setAttribute('fill', '#f4efe6')
    marker.append(head)
    defs.append(marker)
    root.append(defs)
    nodes.current = marks.map((mark) => {
      const shade = document.createElementNS(SVG_NS, 'line')
      shade.setAttribute('class', 'shade')
      const leader = document.createElementNS(SVG_NS, 'line')
      leader.setAttribute('marker-end', 'url(#anatomy-arrow)')
      const shoulder = document.createElementNS(SVG_NS, 'line')
      const dot = document.createElementNS(SVG_NS, 'circle')
      dot.setAttribute('r', '2.4')
      const text = document.createElementNS(SVG_NS, 'text')
      text.textContent = mark.label
      root.append(shade, leader, shoulder, dot, text)
      return { shade, leader, shoulder, dot, text }
    })
    return () => {
      root.replaceChildren()
      nodes.current = []
    }
  }, [marks, svg])

  useEffect(() => {
    svg.current?.classList.toggle('is-on', active)
  }, [active, svg])

  useFrame(({ camera }) => {
    const root = svg.current
    const drawn = nodes.current
    if (!root || drawn.length !== marks.length) return
    origin.current?.getWorldPosition(midpoint)
    const placed: { x: number; y: number; show: boolean }[] = []
    for (let index = 0; index < marks.length; index++) {
      const object = anchors.current[index]
      const mark = marks[index]
      const parent = object?.parent
      if (!object || !parent) {
        placed.push({ x: 0, y: 0, show: false })
        continue
      }
      let bestDot = -Infinity
      const phis = mark.fixed ? [0] : PHIS
      for (const phi of phis) {
        let x: number
        let y: number
        let z: number
        let nx: number
        let ny: number
        let nz: number
        if (mark.fixed) {
          x = mark.x
          y = mark.y
          z = mark.z
          nx = mark.nx
          ny = mark.ny
          nz = mark.nz
        } else {
          frameInto(scratch, params, mark.theta, phi, mark.rho)
          x = scratch.x
          y = scratch.y
          z = scratch.z
          const length = Math.hypot(scratch.dxr, scratch.dyr, scratch.dzr) || 1
          const sign = mark.flip ? -1 : 1
          nx = (sign * scratch.dxr) / length
          ny = (sign * scratch.dyr) / length
          nz = (sign * scratch.dzr) / length
        }
        local.set(x, y, z)
        world.copy(local)
        parent.localToWorld(world)
        normal.set(nx, ny, nz).transformDirection(parent.matrixWorld)
        view.copy(camera.position).sub(world).normalize()
        const dot = normal.dot(view)
        if (dot > bestDot) {
          bestDot = dot
          bestWorld.copy(world)
          object.position.set(x, y, z)
        }
      }
      const facing = bestDot > 0.05
      point.copy(bestWorld).project(camera)
      const x = (point.x * 0.5 + 0.5) * size.width
      const y = (-point.y * 0.5 + 0.5) * size.height
      placed.push({ x, y, show: facing && point.z < 1 })
    }
    const centerNdc = midpoint.project(camera)
    const cx = (centerNdc.x * 0.5 + 0.5) * size.width
    const cy = (-centerNdc.y * 0.5 + 0.5) * size.height
    const labels = layout(placed, cx, cy, size.width, size.height)
    for (let index = 0; index < drawn.length; index++) {
      const node = drawn[index]
      const spot = placed[index]
      const label = labels[index]
      const show = spot.show && active
      const display = show ? '' : 'none'
      node.shade.style.display = display
      node.leader.style.display = display
      node.shoulder.style.display = display
      node.dot.style.display = display
      node.text.style.display = display
      if (!show) continue
      const shoulderX = label.x + (label.x >= spot.x ? -14 : 14)
      setLine(node.shade, shoulderX, label.y, spot.x, spot.y)
      setLine(node.leader, shoulderX, label.y, spot.x, spot.y)
      setLine(node.shoulder, label.x, label.y, shoulderX, label.y)
      node.dot.setAttribute('cx', String(spot.x))
      node.dot.setAttribute('cy', String(spot.y))
      node.text.setAttribute('x', String(label.x + (label.x >= spot.x ? 6 : -6)))
      node.text.setAttribute('y', String(label.y))
      node.text.setAttribute('text-anchor', label.x >= spot.x ? 'start' : 'end')
    }
  })

  return (
    <>
      <group ref={origin} position={center} />
      {marks.map((mark, index) => (
        <group
          key={mark.id}
          position={[mark.x, mark.y, mark.z]}
          ref={(node) => {
            anchors.current[index] = node
          }}
        />
      ))}
    </>
  )
}

function layout(
  spots: { x: number; y: number; show: boolean }[],
  cx: number,
  cy: number,
  width: number,
  height: number,
) {
  const phone = width < 800 || height < 560
  const landscape = phone && width > height
  const left = phone ? 14 : width < 1100 ? 400 : 452
  const top = phone ? (landscape ? 52 : 96) : 22
  const bottom = phone ? (landscape ? 128 : Math.round(height * 0.36)) : 28
  const reach = phone ? 52 : 86
  const labels = spots.map((spot) => {
    let dx = spot.x - cx
    let dy = spot.y - cy
    const length = Math.hypot(dx, dy) || 1
    dx /= length
    dy /= length
    let x = spot.x + dx * reach
    let y = spot.y + dy * (phone ? 36 : 48)
    if (x < left) x = Math.max(spot.x + 48, left)
    if (x > width - 16) x = width - 16
    y = Math.min(height - bottom, Math.max(top, y))
    // The species card occupies the lower left of the model area.
    const cardEdge = width < 1100 ? 830 : 900
    if (!phone && x < cardEdge && y > height - 330) y = height - 342
    return { x, y }
  })
  const order = labels
    .map((_, index) => index)
    .filter((index) => spots[index].show)
    .sort((a, b) => labels[a].y - labels[b].y)
  for (let step = 1; step < order.length; step++) {
    const previous = labels[order[step - 1]]
    const current = labels[order[step]]
    if (Math.abs(current.x - previous.x) < 160 && current.y - previous.y < 28) {
      current.y = Math.min(height - bottom, previous.y + 28)
    }
  }
  return labels
}

function setLine(line: SVGLineElement, x1: number, y1: number, x2: number, y2: number) {
  line.setAttribute('x1', String(x1))
  line.setAttribute('y1', String(y1))
  line.setAttribute('x2', String(x2))
  line.setAttribute('y2', String(y2))
}
