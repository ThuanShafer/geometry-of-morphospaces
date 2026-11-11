import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import type { RaupParams } from '../model/raup.ts'
import { specimenById } from '../model/specimens.ts'
import { ShellMesh } from './ShellMesh.tsx'
import { Morphospace } from './Morphospace.tsx'

type Vec3 = [number, number, number]

type Frame = {
  camera: Vec3
  target: Vec3
  shell: Vec3
  shellSize: number
  cube: Vec3
  cubeScale: number
}

const WIDE: Frame = {
  camera: [2.05, 0.95, 8.5],
  target: [2.15, 0.1, 0],
  shell: [0.7, 0.08, 0],
  shellSize: 3.05,
  cube: [3.85, 0.05, 0],
  cubeScale: 1,
}

const MEDIUM: Frame = {
  camera: [2.2, 1.05, 8.8],
  target: [2.0, 0.25, 0],
  shell: [1.35, 0.4, 0],
  shellSize: 2.15,
  cube: [3.75, 0.5, 0],
  cubeScale: 0.62,
}

const PHONE: Frame = {
  camera: [0, 1.05, 8.2],
  target: [0, 0.55, 0],
  shell: [0, 0.22, 0.35],
  shellSize: 1.62,
  cube: [0, 1.62, -0.3],
  cubeScale: 0.4,
}

const PHONE_LAND: Frame = {
  camera: [0.35, 0.55, 5.8],
  target: [0.25, 0.32, 0],
  shell: [-1.15, 0.28, 0],
  shellSize: 2.2,
  cube: [1.95, 0.38, 0],
  cubeScale: 0.62,
}

function frameFor(width: number, height: number): Frame {
  if (width < 800 || height < 560) return width > height ? PHONE_LAND : PHONE
  if (width < 1100) return MEDIUM
  return WIDE
}

const MOBILE_SPIN = 0.2
const DESKTOP_SPIN = 0.12

const CUBE_CAMERA: Vec3 = [1.35, 1.05, 7.8]
const CUBE_TARGET: Vec3 = [0, 0.05, 0]
const SHELL_CAMERA: Vec3 = [1.15, 0.62, 4.4]
const SHELL_TARGET: Vec3 = [0, -0.12, 0]

export function Scene({
  params,
  found,
  pattern,
  onChange,
  onCommit,
  viewReset,
}: {
  params: RaupParams
  found: readonly string[]
  pattern: string
  onChange: (params: RaupParams) => void
  onCommit: () => void
  viewReset: number
}) {
  const narrow = useNarrowScreen()
  const callouts = useRef<SVGSVGElement>(null)
  if (narrow) {
    return (
      <>
        <Canvas
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '64%', touchAction: 'none' }}
          camera={{ position: CUBE_CAMERA, fov: 30, near: 0.1, far: 80 }}
          dpr={[1, 2]}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
        >
          <color attach="background" args={['#081016']} />
          <fog attach="fog" args={['#081016', 18, 36]} />
          <Lights />
          <Studio />
          <Morphospace
            params={params}
            found={found}
            onChange={onChange}
            onCommit={onCommit}
            position={CUBE_TARGET}
            scale={0.68}
          />
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            enablePan={false}
            minDistance={2.6}
            maxDistance={14}
            minPolarAngle={0.12}
            maxPolarAngle={Math.PI * 0.92}
            rotateSpeed={0.95}
            zoomSpeed={0.65}
            touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
            target={CUBE_TARGET}
          />
          <FixedCamera position={CUBE_CAMERA} target={CUBE_TARGET} viewReset={viewReset} />
        </Canvas>
        <Canvas
          style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: '44%', pointerEvents: 'none', touchAction: 'none' }}
          camera={{ position: SHELL_CAMERA, fov: 30, near: 0.1, far: 40 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
          onCreated={({ gl, scene }) => {
            gl.setClearColor(0x000000, 0)
            scene.background = null
          }}
        >
          <Lights />
          <Studio />
          <ShellStage
            params={params}
            pattern={pattern}
            callouts={callouts}
            position={SHELL_TARGET}
            displaySize={1.85}
            labeled={false}
            spin={MOBILE_SPIN}
          />
          <FixedCamera position={SHELL_CAMERA} target={SHELL_TARGET} viewReset={0} />
        </Canvas>
      </>
    )
  }
  return (
    <>
    <Canvas
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
      camera={{ position: WIDE.camera, fov: 30, near: 0.1, far: 80 }}
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
    >
      <color attach="background" args={['#081016']} />
      <fog attach="fog" args={['#081016', 18, 36]} />
      <Lights />
      <Stage
        params={params}
        found={found}
        pattern={pattern}
        callouts={callouts}
        onChange={onChange}
        onCommit={onCommit}
        viewReset={viewReset}
      />
    </Canvas>
    <svg ref={callouts} className="callouts" aria-hidden="true" />
    </>
  )
}

function Lights() {
  return (
    <>
      <hemisphereLight args={['#d7e4ee', '#c98462', 0.55]} />
      <ambientLight intensity={0.18} />
      <directionalLight position={[5, 6.5, 4]} intensity={2.4} color="#fff6ec" />
      <directionalLight position={[-5, 2.2, -3]} intensity={0.7} color="#8ec4d4" />
      <directionalLight position={[1.5, -1.5, 5]} intensity={0.35} color="#f0a56a" />
    </>
  )
}

function Stage({
  params,
  found,
  pattern,
  callouts,
  onChange,
  onCommit,
  viewReset,
}: {
  params: RaupParams
  found: readonly string[]
  pattern: string
  callouts: RefObject<SVGSVGElement | null>
  onChange: (params: RaupParams) => void
  onCommit: () => void
  viewReset: number
}) {
  const width = useThree((state) => state.size.width)
  const height = useThree((state) => state.size.height)
  const frame = frameFor(width, height)
  const roomy = width >= 800 && height >= 560
  return (
    <>
      <Studio />
      <ShellStage
        params={params}
        pattern={pattern}
        callouts={callouts}
        position={frame.shell}
        displaySize={frame.shellSize}
        labeled={roomy}
        spin={DESKTOP_SPIN}
      />
      <Ground position={[frame.shell[0], frame.shell[1] - frame.shellSize * 0.52, frame.shell[2]]} />
      <Morphospace
        params={params}
        found={found}
        onChange={onChange}
        onCommit={onCommit}
        position={frame.cube}
        scale={frame.cubeScale}
      />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan={roomy}
        minDistance={2.4}
        maxDistance={18}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI * 0.92}
        rotateSpeed={roomy ? 0.72 : 0.95}
        zoomSpeed={0.65}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        target={frame.target}
      />
      <FixedCamera position={frame.camera} target={frame.target} viewReset={viewReset} />
    </>
  )
}

function ShellStage({
  params,
  pattern,
  callouts,
  position,
  displaySize,
  labeled: allowLabels,
  spin,
}: {
  params: RaupParams
  pattern: string
  callouts: RefObject<SVGSVGElement | null>
  position: Vec3
  displaySize: number
  /** Anatomy labels stay off the small screen. The shell is part of the background. */
  labeled: boolean
  spin: number
}) {
  const group = useRef<THREE.Group>(null)
  const reduced = useReducedMotion()
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const revealed = pattern !== 'plain'
  const paired = revealed && specimenById(pattern)?.group === 'Bivalvia'
  useEffect(() => {
    setHover(false)
    setPinned(false)
  }, [pattern])
  useFrame((_, delta) => {
    if (reduced || !group.current) return
    if (allowLabels && (hover || pinned)) return
    group.current.rotation.y += delta * spin
  })
  return (
    <group ref={group} position={position} rotation={[0.28, -1.05, 0]}>
      <ShellMesh
        params={params}
        displaySize={displaySize}
        quality="hero"
        pattern={pattern}
        paired={paired}
        interactive={allowLabels && revealed}
        labeled={allowLabels && (hover || pinned)}
        svg={callouts}
        onHover={setHover}
        onTogglePin={() => setPinned((value) => !value)}
      />
    </group>
  )
}

function Studio() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const map = pmrem.fromScene(room, 0.04).texture
    scene.environment = map
    scene.environmentIntensity = 0.5
    return () => {
      if (scene.environment === map) scene.environment = null
      map.dispose()
      room.traverse((object) => {
        const mesh = object as THREE.Mesh
        mesh.geometry?.dispose()
        const material = mesh.material
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
        else material?.dispose()
      })
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

function Ground({ position }: { position: Vec3 }) {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const context = canvas.getContext('2d')
    if (context) {
      const gradient = context.createRadialGradient(64, 64, 6, 64, 64, 64)
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.fillStyle = gradient
      context.fillRect(0, 0, 128, 128)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])
  useEffect(() => () => map.dispose(), [map])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position}>
      <planeGeometry args={[3.6, 3.6]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

function FixedCamera({ position, target, viewReset }: { position: Vec3; target: Vec3; viewReset: number }) {
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls) as { target: THREE.Vector3; update: () => void } | null
  useEffect(() => {
    camera.position.set(...position)
    camera.lookAt(...target)
    if (controls) {
      controls.target.set(...target)
      controls.update()
    }
  }, [camera, controls, position, target, viewReset])
  return null
}

function useNarrowScreen() {
  const query = '(max-width: 800px), (max-height: 560px)'
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const apply = () => setNarrow(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])
  return narrow
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(query.matches)
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [])
  return reduced
}
