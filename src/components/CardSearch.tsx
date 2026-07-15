import { useEffect, useRef, useState } from 'react'
import { useCardSearch } from '../hooks/useCardSearch'
import { CardTile } from './CardTile'
import type { Card, Supertype } from '../types/card'

interface CardSearchProps {
  onAddCard: (card: Card) => void
  copiesOf: (cardId: string) => number
}

const SUPERTYPES: Supertype[] = ['Pokémon', 'Trainer', 'Energy']

export function CardSearch({ onAddCard, copiesOf }: CardSearchProps) {
  const [query, setQuery] = useState('')
  const [supertype, setSupertype] = useState<Supertype>('Pokémon')
  const { results, loading, loadingMore, error, hasMore, loadMore } = useCardSearch(query, 'standard', supertype)

  const gridRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = gridRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { root, rootMargin: '200px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
    // hasMore is read here only to re-attach the observer when the sentinel
    // element mounts/unmounts (it's rendered conditionally on hasMore).
  }, [loadMore, hasMore])

  return (
    <section className="card-search">
      <h2>Find cards</h2>
      <div className="card-search-controls">
        <input
          type="search"
          placeholder="Search by card name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search Pokemon TCG cards by name"
        />
      </div>

      <div className="supertype-toggle" role="group" aria-label="Filter by card type">
        {SUPERTYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={supertype === type ? 'supertype-toggle-active' : ''}
            onClick={() => setSupertype(type)}
            aria-pressed={supertype === type}
          >
            {type}
          </button>
        ))}
      </div>

      {loading && <p className="status-text">Searching…</p>}
      {error && <p className="status-text status-error">{error}</p>}
      {!loading && !error && results.length === 0 && (
        <p className="status-text">
          {query.trim() ? `No cards found for "${query}".` : `No ${supertype} cards found.`}
        </p>
      )}

      <div className="card-grid" ref={gridRef}>
        {results.map((card) => (
          <CardTile key={card.id} card={card} count={copiesOf(card.id)} onAdd={onAddCard} />
        ))}
        {hasMore && <div ref={sentinelRef} className="card-grid-sentinel" />}
      </div>

      {loadingMore && <p className="status-text">Loading more…</p>}
    </section>
  )
}
