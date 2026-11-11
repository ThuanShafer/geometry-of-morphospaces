import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Panel } from './components/Panel.tsx'
import { Scene } from './components/Scene.tsx'
import type { RaupParams } from './model/raup.ts'
import { FOUND_KEY, SPECIMENS, matchSpecimen, nearestSpecimen } from './model/specimens.ts'

const START = (SPECIMENS.find((specimen) => specimen.id === 'melanoides') ?? SPECIMENS[0]).params

function loadFound(): string[] {
  try {
    const raw = localStorage.getItem(FOUND_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const ids = new Set(SPECIMENS.map((specimen) => specimen.id))
    return parsed.filter((id): id is string => typeof id === 'string' && ids.has(id))
  } catch {
    return []
  }
}

function withStandingForm(ids: string[]): string[] {
  const standing = matchSpecimen(START)
  if (!standing || ids.includes(standing.id)) return ids
  return [standing.id, ...ids]
}

function remember(next: RaupParams, setFound: (update: (current: string[]) => string[]) => void) {
  const matched = matchSpecimen(next)
  if (!matched) return
  setFound((current) => (current.includes(matched.id) ? current : [...current, matched.id]))
}

export default function App() {
  const [params, setParams] = useState<RaupParams>(START)
  const [found, setFound] = useState<string[]>(() => withStandingForm(loadFound()))
  const [viewReset, setViewReset] = useState(0)
  const paramsRef = useRef(params)

  const hit = useMemo(() => matchSpecimen(params), [params])
  const near = useMemo(() => nearestSpecimen(params), [params])

  const change = useCallback((next: RaupParams) => {
    paramsRef.current = next
    setParams(next)
    remember(next, setFound)
  }, [])

  const commit = useCallback(() => {
    const matched = matchSpecimen(paramsRef.current)
    if (!matched) return
    const same =
      matched.params.W === paramsRef.current.W &&
      matched.params.D === paramsRef.current.D &&
      matched.params.T === paramsRef.current.T
    if (same) return
    paramsRef.current = matched.params
    setParams(matched.params)
  }, [])

  const clear = useCallback(() => {
    const matched = matchSpecimen(paramsRef.current)
    setFound(matched ? [matched.id] : [])
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(FOUND_KEY, JSON.stringify(found))
    } catch {
      // Private mode can refuse storage. The session still reveals names.
    }
  }, [found])

  return (
    <div className="app">
      <Scene
        params={params}
        found={found}
        pattern={hit?.id ?? 'plain'}
        onChange={change}
        onCommit={commit}
        viewReset={viewReset}
      />
      <Panel
        params={params}
        found={found}
        hit={hit}
        near={near}
        onChange={change}
        onCommit={commit}
        onClear={clear}
        onResetView={() => setViewReset((value) => value + 1)}
      />
    </div>
  )
}
