import type { Card, DeckCard } from '../types/card'
import { CardTile } from './CardTile'

interface DeckPanelProps {
  cards: DeckCard[]
  totalCount: number
  deckSize: number
  onAdd: (card: Card) => void
  onRemove: (cardId: string) => void
  onClear: () => void
}

const GROUP_ORDER = ['Pokémon', 'Trainer', 'Energy'] as const

function groupBySupertype(cards: DeckCard[]) {
  const groups = new Map<string, DeckCard[]>()
  for (const dc of cards) {
    const key = dc.card.supertype
    const list = groups.get(key) ?? []
    list.push(dc)
    groups.set(key, list)
  }
  return groups
}

function exportDeckList(cards: DeckCard[]): string {
  return cards
    .map((dc) => `${dc.count} ${dc.card.name} (${dc.card.set.name} ${dc.card.number})`)
    .join('\n')
}

export function DeckPanel({ cards, totalCount, deckSize, onAdd, onRemove, onClear }: DeckPanelProps) {
  const groups = groupBySupertype(cards)

  const handleExport = async () => {
    const text = exportDeckList(cards)
    try {
      await navigator.clipboard.writeText(text)
      alert('Deck list copied to clipboard.')
    } catch {
      alert(text)
    }
  }

  return (
    <section className="deck-panel">
      <div className="deck-panel-header">
        <h2>
          Your deck ({totalCount}/{deckSize})
        </h2>
        <div className="deck-panel-actions">
          <button type="button" onClick={handleExport} disabled={cards.length === 0}>
            Copy list
          </button>
          <button type="button" onClick={onClear} disabled={cards.length === 0}>
            Clear
          </button>
        </div>
      </div>

      {cards.length === 0 && <p className="status-text">Search for cards and add them to your deck.</p>}

      {GROUP_ORDER.map((supertype) => {
        const group = groups.get(supertype)
        if (!group || group.length === 0) return null
        const groupCount = group.reduce((sum, dc) => sum + dc.count, 0)
        return (
          <div key={supertype} className="deck-group">
            <h3>
              {supertype} ({groupCount})
            </h3>
            <div className="card-grid">
              {group.map((dc) => (
                <CardTile
                  key={dc.card.id}
                  card={dc.card}
                  count={dc.count}
                  onAdd={onAdd}
                  onRemove={() => onRemove(dc.card.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}
