import { useState } from 'react'
import { useCardSearch } from '../hooks/useCardSearch'
import { CardTile } from './CardTile'
import type { Card, Format } from '../types/card'

interface CardSearchProps {
  onAddCard: (card: Card) => void
  copiesOf: (cardId: string) => number
}

const FORMAT_OPTIONS: { value: Format | ''; label: string }[] = [
  { value: '', label: 'All formats' },
  { value: 'standard', label: 'Standard' },
  { value: 'expanded', label: 'Expanded' },
  { value: 'unlimited', label: 'Unlimited' },
]

export function CardSearch({ onAddCard, copiesOf }: CardSearchProps) {
  const [query, setQuery] = useState('')
  const [format, setFormat] = useState<Format | ''>('')
  const { results, loading, error } = useCardSearch(query, format || undefined)

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
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as Format | '')}
          aria-label="Filter by tournament format"
        >
          {FORMAT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

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
