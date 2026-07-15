import type { Card } from '../types/card'

interface CardTileProps {
  card: Card
  count?: number
  onAdd?: (card: Card) => void
  onRemove?: (card: Card) => void
}

export function CardTile({ card, count = 0, onAdd, onRemove }: CardTileProps) {
  return (
    <div className="card-tile">
      <img src={card.images.small} alt={card.name} loading="lazy" />
      <div className="card-tile-info">
        <span className="card-tile-name">{card.name}</span>
        <span className="card-tile-set">{card.set.name}</span>
      </div>
      <div className="card-tile-actions">
        {onRemove && (
          <button type="button" onClick={() => onRemove(card)} aria-label={`Remove ${card.name}`}>
            −
          </button>
        )}
        {count > 0 && <span className="card-tile-count">{count}</span>}
        {onAdd && (
          <button type="button" onClick={() => onAdd(card)} aria-label={`Add ${card.name}`}>
            +
          </button>
        )}
      </div>
    </div>
  )
}
