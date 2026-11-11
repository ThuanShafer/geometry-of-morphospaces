import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { inaturalistUrl, loadTaxon, type TaxonPage } from '../model/inaturalist.ts'

type Status = 'loading' | 'ready' | 'empty' | 'error'

export function TaxonDialog({
  specimenId,
  binomial,
  onClose,
}: {
  specimenId: string
  binomial: string
  onClose: () => void
}) {
  const [status, setStatus] = useState<Status>('loading')
  const [taxon, setTaxon] = useState<TaxonPage | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    loadTaxon(specimenId, binomial, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return
        setTaxon(page)
        setStatus(page ? 'ready' : 'empty')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof DOMException && error.name === 'AbortError') return
        setStatus('error')
      })
    return () => controller.abort()
  }, [specimenId, binomial])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="taxon-pop" onClick={onClose}>
      <article
        className="taxon-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={binomial}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="taxon-bar">
          <p className="kicker">iNaturalist</p>
          <button type="button" className="text-button" onClick={onClose} autoFocus>
            Close
          </button>
        </header>
        {status === 'loading' && <p className="taxon-status">Opening the record…</p>}
        {status === 'error' && (
          <p className="taxon-status">
            The record could not be loaded.{' '}
            <a href={inaturalistUrl(specimenId, binomial)} target="_blank" rel="noreferrer">
              Open on iNaturalist
            </a>
          </p>
        )}
        {status === 'empty' && (
          <div className="taxon-copy">
            <h2>
              <em>{binomial}</em>
            </h2>
            <p className="taxon-status">iNaturalist has no taxon under this name.</p>
          </div>
        )}
        {status === 'ready' && taxon && <TaxonBody taxon={taxon} />}
      </article>
    </div>,
    document.body,
  )
}

function TaxonBody({ taxon }: { taxon: TaxonPage }) {
  const [photo, setPhoto] = useState(true)
  const rank = taxon.rank.charAt(0).toUpperCase() + taxon.rank.slice(1)
  return (
    <div className={photo && taxon.photoUrl ? 'taxon-body' : 'taxon-body is-text'}>
      {photo && taxon.photoUrl && (
        <figure className="taxon-figure">
          <img src={taxon.photoUrl} alt={taxon.name} onError={() => setPhoto(false)} />
        </figure>
      )}
      <div className="taxon-copy">
        {taxon.commonName && <p className="taxon-common">{taxon.commonName}</p>}
        <h2>
          {taxon.extinct && <span className="dagger">†</span>}
          <em>{taxon.name}</em>
        </h2>
        <p className="taxon-meta">
          {rank}
          <span>{taxon.observations.toLocaleString()} observations</span>
        </p>
        {taxon.lineage.length > 0 && <p className="taxon-lineage">{taxon.lineage.join(' · ')}</p>}
        {taxon.summary && <p className="taxon-summary">{taxon.summary}</p>}
        {taxon.photoCredit && <p className="taxon-credit">{taxon.photoCredit}</p>}
        <p className="taxon-out">
          <a href={taxon.pageUrl} target="_blank" rel="noreferrer">
            Open on iNaturalist
          </a>
        </p>
      </div>
    </div>
  )
}
