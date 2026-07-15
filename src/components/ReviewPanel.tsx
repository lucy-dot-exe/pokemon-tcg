import { useDeckValidation } from '../hooks/useDeckValidation'
import type { DeckCard } from '../types/card'
import { CardTile } from './CardTile'

interface ReviewPanelProps {
  cards: DeckCard[]
}

export function ReviewPanel({ cards }: ReviewPanelProps) {
  const validation = useDeckValidation(cards)

  if (cards.length === 0) {
    return (
      <section className="review-panel">
        <h2>Deck review</h2>
        <p className="status-text">Add cards to your deck to check tournament legality.</p>
      </section>
    )
  }

  return (
    <section className="review-panel">
      <div className="review-header">
        <h2>Deck review</h2>
        <span className={`review-badge ${validation.isLegal ? 'review-badge-pass' : 'review-badge-fail'}`}>
          {validation.isLegal ? 'Legal' : 'Not legal'}
        </span>
      </div>

      <ul className="review-check-list">
        {validation.checks.map((check) => (
          <li key={check.id} className="review-check">
            <span
              className={`review-check-icon ${check.passed ? 'review-check-icon-pass' : 'review-check-icon-fail'}`}
              aria-hidden="true"
            >
              {check.passed ? '✓' : '✕'}
            </span>
            <div className="review-check-text">
              <span className="review-check-label">{check.label}</span>
              <span className="review-check-detail">{check.detail}</span>
            </div>
          </li>
        ))}
      </ul>

      {validation.illegalCards.length > 0 && (
        <>
          <h3>Cards not legal in Standard</h3>
          <div className="card-grid">
            {validation.illegalCards.map((dc) => (
              <CardTile key={dc.card.id} card={dc.card} count={dc.count} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
