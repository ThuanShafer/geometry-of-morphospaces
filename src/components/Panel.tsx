import { useEffect, useId, useState } from 'react'
import type { RaupParams } from '../model/raup.ts'
import { TaxonDialog } from './TaxonDialog.tsx'
import { noteFor } from '../model/notes.ts'
import { SPECIMENS, specimenById, type Specimen } from '../model/specimens.ts'
import {
  D_MAX,
  D_MIN,
  T_MAX,
  T_MIN,
  clampParams,
  formatFixed,
  formatSigned,
  formatW,
  formatWInput,
  linearToSlider,
  parseNumber,
  sliderToLinear,
  sliderToW,
  wToSlider,
  type AxisError,
} from '../model/space.ts'

export function Panel({
  params,
  found,
  hit,
  near,
  onChange,
  onCommit,
  onClear,
  onResetView,
}: {
  params: RaupParams
  found: readonly string[]
  hit: Specimen | null
  near: { specimen: Specimen; warmth: number; error: AxisError }
  onChange: (params: RaupParams) => void
  onCommit: () => void
  onClear: () => void
  onResetView: () => void
}) {
  const [details, setDetails] = useState(false)
  const set = (next: RaupParams) => onChange(clampParams(next))

  return (
    <div className="hud">
      <div className="sheet-head">
        <div>
          <p className="kicker">Raup · 1966</p>
          <h1>
            Every shell
            <br />
            is the same shell.
          </h1>
        </div>
        <div className="sheet-actions">
          <button type="button" className="text-button" onClick={onResetView}>
            Reset view
          </button>
          <button
            type="button"
            className="text-button sheet-toggle"
            aria-expanded={details}
            onClick={() => setDetails((open) => !open)}
          >
            {details ? 'Close' : 'Details'}
          </button>
        </div>
      </div>
      <aside className={details ? 'panel is-open' : 'panel'}>
        <p className="rule">A tube that grows only at its mouth. Three numbers decide the form.</p>

        <div className="params">
          <Parameter
            symbol="W"
            name="whorl expansion"
            hint="How much the tube widens in one full turn."
            about="How many times wider the tube becomes in one full turn. Close to 1, the coil stays narrow through many turns. A very large value flares in less than a turn, which is how a clam valve sits in this model."
            value={params.W}
            format={formatWInput}
            slider={wToSlider(params.W)}
            minLabel="1.1"
            maxLabel="10⁶"
            onSlider={(step) => set({ ...params, W: sliderToW(step) })}
            onValue={(W) => set({ ...params, W })}
            onCommit={onCommit}
          />
          <Parameter
            symbol="D"
            name="distance from axis"
            hint="0 touches the axis. Toward 1, the turns leave a hole."
            about="How far the tube sits from the coiling axis: the inner radius divided by the outer radius. At 0 the inner margin touches the axis. Toward 1 the turns leave a hole, the umbilicus."
            value={params.D}
            format={formatFixed}
            slider={linearToSlider(params.D, D_MIN, D_MAX)}
            minLabel="0"
            maxLabel="0.88"
            onSlider={(step) => set({ ...params, D: sliderToLinear(step, D_MIN, D_MAX) })}
            onValue={(D) => set({ ...params, D })}
            onCommit={onCommit}
          />
          <Parameter
            symbol="T"
            name="translation"
            hint="0 stays flat. Larger values build a tower."
            about="How far the aperture moves along the axis in one turn. At 0 the coil is flat, as in a nautilus. Larger values drop each whorl and stack them into a tower."
            value={params.T}
            format={formatFixed}
            slider={linearToSlider(params.T, T_MIN, T_MAX)}
            minLabel="0"
            maxLabel="6"
            onSlider={(step) => set({ ...params, T: sliderToLinear(step, T_MIN, T_MAX) })}
            onValue={(T) => set({ ...params, T })}
            onCommit={onCommit}
          />
        </div>

        <p className="gesture">Drag to turn the cube. Drag the bright point inside it.</p>

        <div className="sheet-extra">
        <p className="how how-pointer">Drag the point in the cube, or turn the shell. The sliders are the same three axes.</p>
        <p className="how how-touch">
          Drag the bright point in the cube. Drag to turn the cube, and pinch to zoom.
        </p>
        {hit && (
          <div className="sheet-creature">
            <p className="line">{hit.line}</p>
            <Fact id={hit.id} binomial={`${hit.genus} ${hit.species}`} />
          </div>
        )}

        <p className="eq">
          r(θ) = W<sup>θ/2π</sup>
          <br />
          R = r (1+D)/(1−D)
          <br />
          Z = r · 2T/(1−D)
        </p>
        <p className="eq-note">θ = 0 at the mouth. The aperture is held to a circle.</p>

        <div className="found">
          <div className="found-top">
            <span>
              {found.length} of {SPECIMENS.length}
            </span>
            <button type="button" className="text-button" onClick={onClear}>
              Clear names
            </button>
          </div>
          <ul>
            {found.map((id) => {
              const specimen = specimenById(id)
              if (!specimen) return null
              const current = hit?.id === id
              return (
                <li key={id} className={current ? 'is-current' : undefined}>
                  {specimen.extinct && <span className="dagger">†</span>}
                  <em>
                    {specimen.genus} {specimen.species}
                  </em>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="actions">
          <button type="button" className="text-button" onClick={onResetView}>
            Reset view
          </button>
        </div>

        <p className="cite">
          <a href="https://doi.org/10.1126/science.147.3663.1294" target="_blank" rel="noreferrer">
            Raup &amp; Michelson 1965, Science 147:1294–1295.
          </a>
          <br />
          <a href="https://www.jstor.org/stable/1301992" target="_blank" rel="noreferrer">
            Raup 1966, Journal of Paleontology 40:1178–1190.
          </a>
          <br />
          The axes are not commensurate, so distance in the cube is not a biological distance (
          <a href="https://doi.org/10.1111/brv.12276" target="_blank" rel="noreferrer">
            Gerber 2017, Biological Reviews 92:1142–1155
          </a>
          ). Coordinates are reconstructions in the regions Raup mapped. Nautilus is fixed at a threefold expansion.
        </p>
        </div>
      </aside>

      <div className="readout-slot">
        {hit ? (
          <article className="card" aria-live="polite">
            <p className="kicker">{hit.kicker ?? (hit.kind === 'not-a-shell' ? 'Not a shell' : hit.group)}</p>
            <h2>
              {hit.extinct && <span className="dagger">†</span>}
              <em>
                {hit.genus} {hit.species}
              </em>
            </h2>
            <p className="auth">{hit.authority}</p>
            <p className="meta">{hit.kind === 'not-a-shell' ? `${hit.group} · ${hit.family}` : hit.family}</p>
            <p className="line">{hit.line}</p>
            <Fact id={hit.id} binomial={`${hit.genus} ${hit.species}`} />
            <p className="hover-hint">
              <span className="for-pointer">Hover the shell</span>
              <span className="for-touch">Tap the shell</span>
            </p>
            <p className="coords">
              W {formatW(hit.params.W)}
              <span>D {formatFixed(hit.params.D)}</span>
              <span>T {formatFixed(hit.params.T)}</span>
            </p>
          </article>
        ) : near.warmth > 0.28 ? (
          <div className="card approach" aria-live="polite">
            <p className="kicker">Nearby</p>
            <p className="line">A form is near. Trim the residual.</p>
            <dl className="residual">
              <div>
                <dt>Δlog10 W</dt>
                <dd>{formatSigned(near.error.log10W)}</dd>
              </div>
              <div>
                <dt>ΔD</dt>
                <dd>{formatSigned(near.error.D)}</dd>
              </div>
              <div>
                <dt>ΔT</dt>
                <dd>{formatSigned(near.error.T)}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="card empty" aria-live="polite">
            <p className="kicker">Unoccupied</p>
            <p className="line">Nothing alive, nothing fossil.</p>
            <p className="quiet">Raup: impossible, or too costly. Gould: life never came here.</p>
          </div>
        )}
      </div>
      <p className="credit">
        Designed by{' '}
        <a href="https://www.linkedin.com/in/thuanpreena/" target="_blank" rel="noreferrer">
          Thuan Shafer Preena
        </a>{' '}
        with AI & Love
      </p>
    </div>
  )
}

function Fact({ id, binomial }: { id: string; binomial: string }) {
  const narrow = useNarrowScreen()
  const [open, setOpen] = useState(false)
  return (
    <p className="fact">
      {noteFor(id).fact}
      {!narrow && (
        <>
          {' '}
          <button type="button" className="fact-link" onClick={() => setOpen(true)}>
            Read more
          </button>
          {open && <TaxonDialog specimenId={id} binomial={binomial} onClose={() => setOpen(false)} />}
        </>
      )}
    </p>
  )
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

function Parameter({
  symbol,
  name,
  hint,
  about,
  value,
  format,
  slider,
  minLabel,
  maxLabel,
  onSlider,
  onValue,
  onCommit,
}: {
  symbol: string
  name: string
  hint: string
  about: string
  value: number
  format: (value: number) => string
  slider: number
  minLabel: string
  maxLabel: string
  onSlider: (step: number) => void
  onValue: (value: number) => void
  onCommit: () => void
}) {
  const fieldId = useId()
  const noteId = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const shown = draft ?? format(value)

  return (
    <div className="param">
      <span className="param-top">
        <label className="sym" htmlFor={fieldId}>
          {symbol}
        </label>
        <span className="param-title">
          <label className="sym-name" htmlFor={fieldId}>
            {name}
          </label>
          <button
            type="button"
            className="info-button"
            aria-expanded={aboutOpen}
            aria-controls={noteId}
            aria-label={`What ${symbol} means`}
            onClick={() => setAboutOpen((open) => !open)}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 7.15V11.4" />
              <circle cx="8" cy="4.7" r="0.75" />
            </svg>
          </button>
        </span>
        <input
          id={fieldId}
          className="num"
          type="text"
          inputMode="decimal"
          aria-label={name}
          value={shown}
          onFocus={(event) => {
            setDraft(format(value))
            event.currentTarget.select()
          }}
          onChange={(event) => {
            setDraft(event.target.value)
            const next = parseNumber(event.target.value)
            if (next != null) onValue(next)
          }}
          onBlur={() => {
            setDraft(null)
            onCommit()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
        />
      </span>
      <input
        className="slider"
        type="range"
        min={0}
        max={1000}
        step={1}
        value={slider}
        aria-label={symbol}
        aria-valuetext={format(value)}
        onChange={(event) => onSlider(Number(event.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
      />
      <span className="slider-scale">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </span>
      {aboutOpen ? (
        <p id={noteId} className="info-note">
          {about}
        </p>
      ) : (
        <span className="hint">{hint}</span>
      )}
    </div>
  )
}
