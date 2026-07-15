import { useDeckStatistics } from '../hooks/useDeckStatistics'
import type { DeckCard } from '../types/card'

interface StatisticsPanelProps {
  cards: DeckCard[]
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function StatisticsPanel({ cards }: StatisticsPanelProps) {
  const stats = useDeckStatistics(cards)

  if (cards.length === 0) {
    return (
      <section className="statistics-panel viz-root">
        <h2>Statistics</h2>
        <p className="status-text">Add cards to your deck to see opening hand statistics.</p>
      </section>
    )
  }

  return (
    <section className="statistics-panel viz-root">
      <h2>Opening hand statistics</h2>
      <p className="status-text">
        Based on a {stats.handSize}-card opening hand from your {stats.deckSize}-card deck
        ({stats.totalBasics} basic Pokémon).
      </p>

      <div className="stat-tile-row">
        <div className="stat-tile">
          <span className="stat-tile-label">Mulligan chance</span>
          <span className="stat-tile-value">{formatPercent(stats.mulliganChance)}</span>
          <span className="stat-tile-hint">No basic Pokémon in opening hand</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-label">Exactly one basic</span>
          <span className="stat-tile-value">{formatPercent(stats.exactlyOneBasicChance)}</span>
          <span className="stat-tile-hint">One basic Pokémon in opening hand</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-label">Two or more basics</span>
          <span className="stat-tile-value">{formatPercent(stats.twoOrMoreBasicsChance)}</span>
          <span className="stat-tile-hint">Multiple basic Pokémon in opening hand</span>
        </div>
      </div>

      <h3>Chance to open each basic Pokémon</h3>
      {stats.basicFetchChances.length === 0 ? (
        <p className="status-text">No basic Pokémon in the deck yet — this deck will always mulligan.</p>
      ) : (
        <ul className="fetch-chance-list">
          {stats.basicFetchChances.map((entry) => (
            <li key={entry.name} className="fetch-chance-row">
              <img className="fetch-chance-thumb" src={entry.imageUrl} alt="" />
              <span className="fetch-chance-name">
                {entry.name} <span className="fetch-chance-count">×{entry.count}</span>
              </span>
              <div className="fetch-chance-bar-track">
                <div className="fetch-chance-bar-fill" style={{ width: `${entry.chance * 100}%` }} />
              </div>
              <span className="fetch-chance-value">{formatPercent(entry.chance)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
