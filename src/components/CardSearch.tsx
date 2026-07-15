import { useState } from 'react'
import { useCardSearch } from '../hooks/useCardSearch'
import { CardTile } from './CardTile'
import type { Card } from '../types/card'

interface CardSearchProps {
  onAddCard: (card: Card) => void
  copiesOf: (cardId: string) => number
}

export function CardSearch({ onAddCard, copiesOf }: CardSearchProps) {
  const [query, setQuery] = useState('')
  const { results, loading, error } = useCardSearch(query)

  return (
    <section className="card-search">
      <h2>Find cards</h2>
      <input
        type="search"
        placeholder="Search by card name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search Pokemon TCG cards by name"
      />

      {loading && <p className="status-text">Searching…</p>}
      {error && <p className="status-text status-error">{error}</p>}
      {!loading && !error && query.trim() && results.length === 0 && (
        <p className="status-text">No cards found for "{query}".</p>
      )}

      <div className="card-grid">
        {results.map((card) => (
          <CardTile key={card.id} card={card} count={copiesOf(card.id)} onAdd={onAddCard} />
        ))}
      </div>
    </section>
  )
}
