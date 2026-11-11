import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { valveHinge } from '../model/anatomy.ts'
import { buildShell, type MeshData, type RaupParams } from '../model/raup.ts'
import { Callouts } from './Callouts.tsx'
import { ignoreRaycast } from './raycast.ts'
import { nacreMap, shellFinish, type ShellFinish } from './shellFinish.ts'

/** How far each valve swings from the closed commissure. */
const GAPE = 0.85

export function ShellMesh({
  params,
  displaySize,
  quality,
  pattern = 'plain',
  glass = false,
  opacity = 1,
  emissiveIntensity = 0,
  interactive = false,
  labeled = false,
  paired = false,
  svg,
  onHover,
  onTogglePin,
}: {
  params: RaupParams
  displaySize: number
  quality: 'hero' | 'ghost'
  pattern?: string
  glass?: boolean
  opacity?: number
  emissiveIntensity?: number
  interactive?: boolean
  labeled?: boolean
  /** Second valve, hinged at the beak. Used for a revealed bivalve. */
  paired?: boolean
  svg?: RefObject<SVGSVGElement | null>
  onHover?: (hover: boolean) => void
  onTogglePin?: () => void
}) {
  const gl = useThree((state) => state.gl)
  const controls = useThree((state) => state.controls) as { enabled: boolean } | null
  const depth = useRef(0)
  const gesture = useRef({ x: 0, y: 0, dragged: false })
  const model = useMemo(() => buildShell(params, quality), [params, quality])
  const outer = useGeometry(model.outer)
  const inner = useGeometry(model.inner)
  const lip = useGeometry(model.lip)
  const apex = useGeometry(model.apex)
  const finish = useMemo(() => (glass ? null : shellFinish(pattern)), [glass, pattern])
  const pearl = useMemo(() => (finish?.innerNacre ? nacreMap() : null), [finish])
  const pair = useMemo(
    () => (paired && !glass ? pairLayout(params, model.outer.positions, displaySize) : null),
    [paired, glass, params, model, displaySize],
  )
  const scale = pair ? pair.scale : displaySize / model.maxExtent
  const [cx, cy, cz] = pair ? pair.center : model.center
  const relief: [number, number] = [finish?.relief ?? 0, finish?.relief ?? 0]
  const hit = interactive ? THREE.Mesh.prototype.raycast : ignoreRaycast

  useEffect(() => {
    const element = gl.domElement
    const release = () => {
      if (controls) controls.enabled = true
    }
    const move = (event: PointerEvent) => {
      const start = gesture.current
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 14) start.dragged = true
    }
    window.addEventListener('pointerup', release)
    window.addEventListener('pointermove', move)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointermove', move)
      element.style.cursor = ''
      release()
    }
  }, [gl, controls])

  const hold = (event: ThreeEvent<PointerEvent>) => {
    if (!interactive) return
    event.stopPropagation()
    gesture.current = { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY, dragged: false }
  }

  const pin = () => {
    if (gesture.current.dragged) return
    onTogglePin?.()
  }

  const enter = (event: ThreeEvent<PointerEvent>) => {
    if (!interactive) return
    event.stopPropagation()
    depth.current += 1
    gl.domElement.style.cursor = 'pointer'
    onHover?.(true)
  }
  const leave = (event: ThreeEvent<PointerEvent>) => {
    if (!interactive) return
    event.stopPropagation()
    depth.current = Math.max(0, depth.current - 1)
    queueMicrotask(() => {
      if (depth.current === 0) {
        gl.domElement.style.cursor = ''
        onHover?.(false)
      }
    })
  }

  const valve = () =>
    finish && (
      <Valve
        outer={outer}
        inner={inner}
        lip={lip}
        apex={apex}
        finish={finish}
        pearl={pearl}
        relief={relief}
        hit={hit}
        onPointerOver={enter}
        onPointerOut={leave}
        onPointerDown={hold}
        onClick={pin}
      />
    )

  const shadow = (
    <>
      {[outer, inner, lip, apex].map((geometry, index) => (
        <mesh key={index} geometry={geometry} raycast={ignoreRaycast}>
          <meshStandardMaterial
            color="#a9bcc8"
            transparent
            opacity={opacity}
            roughness={0.42}
            metalness={0}
            emissive="#f3e6d6"
            emissiveIntensity={emissiveIntensity}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  )

  const labels = !glass && interactive && svg && (
    <Callouts params={params} id={pattern} svg={svg} active={labeled} center={model.center} />
  )

  return (
    <group scale={scale} position={[-cx * scale, -cy * scale, -cz * scale]}>
      {glass ? (
        shadow
      ) : pair ? (
        <>
          <group position={pair.beak} quaternion={pair.open}>
            <group position={pair.minusBeak}>
              {valve()}
              {labels}
            </group>
          </group>
          <group position={pair.beak} quaternion={pair.twin} scale={[1, 1, -1]}>
            <group position={pair.minusBeak}>{valve()}</group>
          </group>
        </>
      ) : (
        <>
          {valve()}
          {labels}
        </>
      )}
    </group>
  )
}

function useGeometry(data: MeshData) {
  const geometry = useMemo(() => {
    const next = new THREE.BufferGeometry()
    next.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
    next.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3))
    next.setAttribute('color', new THREE.BufferAttribute(data.colors, 3))
    next.setAttribute('uv', new THREE.BufferAttribute(data.uvs, 2))
    next.setIndex(new THREE.BufferAttribute(data.indices, 1))
    return next
  }, [data])

  useEffect(() => () => geometry.dispose(), [geometry])
  return geometry
}

type PairLayout = {
  scale: number
  center: [number, number, number]
  beak: THREE.Vector3
  minusBeak: THREE.Vector3
  open: THREE.Quaternion
  twin: THREE.Quaternion
}

function pairLayout(params: RaupParams, positions: Float32Array, displaySize: number): PairLayout {
  const hinge = valveHinge(params)
  const axis = new THREE.Vector3(hinge.ax, hinge.ay, hinge.az)
  const beak = new THREE.Vector3(hinge.x, hinge.y, hinge.z)
  const open = new THREE.Quaternion().setFromAxisAngle(axis, -GAPE)
  const twin = new THREE.Quaternion().setFromAxisAngle(axis, GAPE)
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
  const box = new THREE.Box3()
  const point = new THREE.Vector3()
  for (const x of [minX, maxX]) {
    for (const y of [minY, maxY]) {
      for (const z of [minZ, maxZ]) {
        point.set(x, y, z).sub(beak).applyQuaternion(open).add(beak)
        box.expandByPoint(point)
        point.set(x, y, 2 * beak.z - z).sub(beak).applyQuaternion(twin).add(beak)
        box.expandByPoint(point)
      }
    }
  }
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const extent = Math.max(size.x, size.y, size.z, 1e-6)
  return {
    scale: displaySize / extent,
    center: [center.x, center.y, center.z],
    beak,
    minusBeak: beak.clone().multiplyScalar(-1),
    open,
    twin,
  }
}

function Valve({
  outer,
  inner,
  lip,
  apex,
  finish,
  pearl,
  relief,
  hit,
  onPointerOver,
  onPointerOut,
  onPointerDown,
  onClick,
}: {
  outer: THREE.BufferGeometry
  inner: THREE.BufferGeometry
  lip: THREE.BufferGeometry
  apex: THREE.BufferGeometry
  finish: ShellFinish
  pearl: THREE.Texture | null
  relief: [number, number]
  hit: typeof THREE.Mesh.prototype.raycast
  onPointerOver: (event: ThreeEvent<PointerEvent>) => void
  onPointerOut: (event: ThreeEvent<PointerEvent>) => void
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void
  onClick?: () => void
}) {
  return (
    <>
      <mesh
        geometry={outer}
        raycast={hit}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onPointerDown={onPointerDown}
        onClick={onClick}
      >
        <meshPhysicalMaterial
          vertexColors
          map={finish.map}
          normalMap={finish.normalMap}
          normalScale={relief}
          roughnessMap={finish.roughnessMap}
          roughness={1}
          metalness={finish.metalness}
          clearcoat={finish.clearcoat}
          clearcoatRoughness={finish.clearcoatRoughness}
          sheen={finish.sheen}
          sheenColor="#fff4e8"
          sheenRoughness={0.45}
          iridescence={finish.iridescence}
          iridescenceIOR={1.3}
          iridescenceThicknessRange={[140, 420]}
        />
      </mesh>
      <mesh geometry={inner} raycast={ignoreRaycast}>
        {pearl ? (
          <meshPhysicalMaterial
            map={pearl}
            roughness={0.2}
            metalness={0.22}
            clearcoat={0.7}
            clearcoatRoughness={0.18}
            iridescence={1}
            iridescenceIOR={1.3}
            iridescenceThicknessRange={[120, 480]}
          />
        ) : (
          <meshPhysicalMaterial vertexColors roughness={0.72} metalness={0} />
        )}
      </mesh>
      <mesh geometry={lip} raycast={ignoreRaycast}>
        {pearl && !finish.lipExterior ? (
          <meshPhysicalMaterial
            map={pearl}
            roughness={0.16}
            metalness={0.24}
            clearcoat={0.75}
            clearcoatRoughness={0.16}
            iridescence={1}
            iridescenceIOR={1.3}
            iridescenceThicknessRange={[100, 520]}
          />
        ) : (
          <meshPhysicalMaterial
            vertexColors
            map={finish.map}
            roughness={Math.min(0.85, finish.roughness + 0.08)}
            metalness={0}
          />
        )}
      </mesh>
      <mesh geometry={apex} raycast={ignoreRaycast}>
        <meshPhysicalMaterial
          vertexColors
          map={finish.map}
          roughness={Math.min(0.9, finish.roughness + 0.12)}
          metalness={0}
        />
      </mesh>
    </>
  )
}
