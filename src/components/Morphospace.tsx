import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { RaupParams } from '../model/raup.ts'
import { SPECIMENS, type Specimen } from '../model/specimens.ts'
import { CUBE, fromLocal, toLocal, warmthOf } from '../model/space.ts'
import { ShellMesh } from './ShellMesh.tsx'
import { ignoreRaycast } from './raycast.ts'

export function Morphospace({
  params,
  found,
  onChange,
  onCommit,
  position,
  scale = 1,
}: {
  params: RaupParams
  found: readonly string[]
  onChange: (params: RaupParams) => void
  onCommit: () => void
  position: [number, number, number]
  scale?: number
}) {
  const space = useRef<THREE.Group>(null)
  const edges = useMemo(() => cubeEdges(), [])
  const grid = useMemo(() => cubeGrid(), [])

  useEffect(() => () => grid.dispose(), [grid])

  return (
    <group ref={space} position={position} scale={scale}>
      {edges.map((edge) => (
        <mesh key={edge.key} position={edge.position} quaternion={edge.quaternion} raycast={ignoreRaycast}>
          <boxGeometry args={[0.014, edge.length, 0.014]} />
          <meshBasicMaterial color="#d7e2e8" toneMapped={false} />
        </mesh>
      ))}
      <lineSegments geometry={grid}>
        <lineBasicMaterial color="#d5dee6" transparent opacity={0.14} toneMapped={false} />
      </lineSegments>
      <Crosshair params={params} />
      <Marker space={space} params={params} onChange={onChange} onCommit={onCommit} />
      {SPECIMENS.map((specimen) => (
        <Ghost key={specimen.id} specimen={specimen} params={params} found={found.includes(specimen.id)} />
      ))}
      <Label text="log10 W" position={[CUBE / 2 + 0.08, -CUBE / 2 - 0.28, CUBE / 2]} />
      <Label text="T" position={[-CUBE / 2 - 0.28, CUBE / 2 + 0.16, CUBE / 2]} size={0.42} />
      <Label text="D" position={[CUBE / 2 + 0.08, -CUBE / 2 - 0.28, -CUBE / 2]} />
      <Label text="1" position={[-CUBE / 2, -CUBE / 2 - 0.16, CUBE / 2 + 0.02]} size={0.36} />
      <Label text="1e3" position={[0, -CUBE / 2 - 0.16, CUBE / 2 + 0.02]} size={0.4} />
      <Label text="1e6" position={[CUBE / 2, -CUBE / 2 - 0.16, CUBE / 2 + 0.02]} size={0.4} />
      <Label text="0" position={[-CUBE / 2 - 0.16, -CUBE / 2, CUBE / 2]} size={0.32} />
      <Label text="6" position={[-CUBE / 2 - 0.16, CUBE / 2, CUBE / 2]} size={0.32} />
      <Label text="0" position={[CUBE / 2 + 0.18, -CUBE / 2, CUBE / 2]} size={0.32} />
      <Label text="0.9" position={[CUBE / 2 + 0.22, -CUBE / 2, -CUBE / 2]} size={0.4} />
    </group>
  )
}

function Ghost({
  specimen,
  params,
  found,
}: {
  specimen: Specimen
  params: RaupParams
  found: boolean
}) {
  const warmth = warmthOf(params, specimen.params)
  const [x, y, z] = toLocal(specimen.params)
  return (
    <group position={[x, y, z]}>
      <ShellMesh
        params={specimen.params}
        displaySize={0.2}
        quality="ghost"
        pattern={specimen.id}
        glass={!found}
        opacity={found ? 1 : 0.1 + warmth * 0.62}
        emissiveIntensity={found ? 0 : warmth * 0.45}
      />
      {found && warmth > 0.84 && <Label text={specimen.genus} position={[0, 0.18, 0]} size={0.46} serif />}
    </group>
  )
}

function Marker({
  space,
  params,
  onChange,
  onCommit,
}: {
  space: RefObject<THREE.Group | null>
  params: RaupParams
  onChange: (params: RaupParams) => void
  onCommit: () => void
}) {
  const { camera, controls, gl } = useThree()
  const dragging = useRef(false)
  const narrow = useThree((state) => state.size.width < 800 || state.size.height < 560)
  const plane = useMemo(() => new THREE.Plane(), [])
  const position = toLocal(params)
  const onChangeRef = useRef(onChange)
  const onCommitRef = useRef(onCommit)

  useEffect(() => {
    onChangeRef.current = onChange
    onCommitRef.current = onCommit
  })

  useEffect(() => {
    const element = gl.domElement
    const hit = new THREE.Vector3()
    const ndc = new THREE.Vector2()
    const raycaster = new THREE.Raycaster()

    const move = (event: PointerEvent) => {
      if (!dragging.current || !space.current) return
      const rect = element.getBoundingClientRect()
      ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      if (!raycaster.ray.intersectPlane(plane, hit)) return
      const local = space.current.worldToLocal(hit.clone())
      onChangeRef.current(fromLocal(local.x, local.y, local.z))
    }
    const up = () => {
      if (!dragging.current) return
      dragging.current = false
      const orbit = controls as { enabled?: boolean } | null
      if (orbit) orbit.enabled = true
      element.style.cursor = ''
      onCommitRef.current()
    }
    element.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      element.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [camera, controls, gl, plane, space])

  const start = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)
    const ax = Math.abs(direction.x)
    const ay = Math.abs(direction.y)
    const az = Math.abs(direction.z)
    const normal =
      ax >= ay && ax >= az ? new THREE.Vector3(1, 0, 0) : ay >= az ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1)
    plane.setFromNormalAndCoplanarPoint(normal, event.point)
    dragging.current = true
    const orbit = controls as { enabled?: boolean } | null
    if (orbit) orbit.enabled = false
    gl.domElement.style.cursor = 'grabbing'
  }

  return (
    <group>
      <mesh
        position={position}
        onPointerDown={start}
        onPointerOver={() => {
          if (!dragging.current) gl.domElement.style.cursor = 'grab'
        }}
        onPointerOut={() => {
          if (!dragging.current) gl.domElement.style.cursor = ''
        }}
      >
        <sphereGeometry args={[narrow ? 0.48 : 0.16, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={position} raycast={ignoreRaycast}>
        <sphereGeometry args={[0.042, 20, 20]} />
        <meshBasicMaterial color="#f7f3ea" toneMapped={false} />
      </mesh>
    </group>
  )
}

function Crosshair({ params }: { params: RaupParams }) {
  const geometry = useMemo(() => {
    const next = new THREE.BufferGeometry()
    next.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3))
    return next
  }, [])

  useLayoutEffect(() => {
    const [x, y, z] = toLocal(params)
    const h = CUBE / 2
    const array = geometry.attributes.position.array as Float32Array
    array.set([-h, y, z, h, y, z, x, -h, z, x, h, z, x, y, -h, x, y, h])
    geometry.attributes.position.needsUpdate = true
    geometry.computeBoundingSphere()
  }, [geometry, params])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#f4efe6" transparent opacity={0.4} toneMapped={false} />
    </lineSegments>
  )
}

function Label({
  text,
  position,
  size = 0.72,
  serif = false,
}: {
  text: string
  position: [number, number, number]
  size?: number
  serif?: boolean
}) {
  const map = useMemo(() => makeLabel(text, serif), [text, serif])
  useEffect(() => () => map.dispose(), [map])
  return (
    <sprite position={position} scale={[size, size / 4, 1]} raycast={ignoreRaycast}>
      <spriteMaterial map={map} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  )
}

function makeLabel(text: string, serif: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = 'rgba(226, 234, 238, 0.92)'
  context.font = serif
    ? 'italic 64px Palatino, "Iowan Old Style", Georgia, serif'
    : '500 52px "SF Mono", ui-monospace, Menlo, monospace'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, canvas.width / 2, canvas.height / 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function cubeEdges() {
  const h = CUBE / 2
  const corners: [number, number, number][] = [
    [-h, -h, -h],
    [h, -h, -h],
    [h, h, -h],
    [-h, h, -h],
    [-h, -h, h],
    [h, -h, h],
    [h, h, h],
    [-h, h, h],
  ]
  const pairs = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ]
  return pairs.map(([i, j], index) => {
    const start = new THREE.Vector3(...corners[i])
    const end = new THREE.Vector3(...corners[j])
    const direction = end.clone().sub(start)
    const length = direction.length()
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    )
    return {
      key: index,
      position: start.add(end).multiplyScalar(0.5).toArray() as [number, number, number],
      quaternion,
      length,
    }
  })
}

function cubeGrid() {
  const h = CUBE / 2
  const divisions = 4
  const points: number[] = []
  const push = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
    points.push(x1, y1, z1, x2, y2, z2)
  }
  for (let i = 1; i < divisions; i++) {
    const t = -h + (i / divisions) * CUBE
    push(-h, t, h, h, t, h)
    push(t, -h, h, t, h, h)
    push(-h, t, -h, -h, t, h)
    push(-h, -h, t, -h, h, t)
    push(t, -h, -h, t, -h, h)
    push(-h, -h, t, h, -h, t)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3))
  return geometry
}
