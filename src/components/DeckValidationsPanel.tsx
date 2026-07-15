import { useState } from 'react'
import { useDeckWarnings } from '../hooks/useDeckWarnings'
import type { DeckCard } from '../types/card'

interface DeckValidationsPanelProps {
  cards: DeckCard[]
}

export function DeckValidationsPanel({ cards }: DeckValidationsPanelProps) {
  const validations = useDeckWarnings(cards)
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set())

  const toggleAcknowledged = (id: string) => {
    setAcknowledged((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (cards.length === 0) {
    return (
      <section className="review-panel viz-root">
        <h2>Validations</h2>
        <p className="status-text">Add cards to your deck to see deck-building validations.</p>
      </section>
    )
  }

  const passingCount = validations.filter((validation) => validation.passed).length
  const failedCount = validations.filter((validation) => !validation.passed).length
  const unacknowledgedCount = validations.filter(
    (validation) => !validation.passed && !acknowledged.has(validation.id),
  ).length

  return (
    <section className="review-panel viz-root">
      <div className="review-header">
        <h2>Validations</h2>
        <span
          className={`review-badge ${unacknowledgedCount === 0 ? 'review-badge-pass' : 'review-badge-fail'}`}
        >
          {unacknowledgedCount === 0 ? 'All clear' : `${unacknowledgedCount} unacknowledged`}
        </span>
      </div>

      <div className="stat-tile-row">
        <div className="stat-tile">
          <span className="stat-tile-label">Passing</span>
          <span className="stat-tile-value stat-tile-value-good">{passingCount}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-label">Failed</span>
          <span className="stat-tile-value stat-tile-value-warning">{failedCount}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-label">Needs acknowledgement</span>
          <span className="stat-tile-value stat-tile-value-critical">{unacknowledgedCount}</span>
        </div>
      </div>

      <ul className="review-warning-list">
        {validations.map((validation) => {
          const isAcknowledged = acknowledged.has(validation.id)
          const statusClass = validation.passed
            ? 'review-warning-passed'
            : isAcknowledged
              ? 'review-warning-acknowledged'
              : ''
          return (
            <li key={validation.id} className={`review-warning ${statusClass}`}>
              <span className="review-warning-icon" aria-hidden="true">
                {validation.passed || isAcknowledged ? '✓' : '⚠'}
              </span>
              <div className="review-warning-text-group">
                <span className="review-check-label">{validation.label}</span>
                <ul className="review-warning-details">
                  {validation.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </div>
              {!validation.passed && (
                <button type="button" onClick={() => toggleAcknowledged(validation.id)}>
                  {isAcknowledged ? 'Acknowledged' : 'Acknowledge'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
