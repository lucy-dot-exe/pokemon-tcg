import { useDeckBreakdown } from '../hooks/useDeckBreakdown'
import type { DeckCard } from '../types/card'

interface DeckCompositionSectionProps {
  cards: DeckCard[]
}

interface BreakdownRowProps {
  label: string
  count: number
  total: number
}

function BreakdownRow({ label, count, total }: BreakdownRowProps) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="breakdown-row">
      <span className="breakdown-name">{label}</span>
      <div className="breakdown-bar-track">
        <div className="breakdown-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="breakdown-value">
        {count} ({pct.toFixed(0)}%)
      </span>
    </div>
  )
}

export function DeckCompositionSection({ cards }: DeckCompositionSectionProps) {
  const breakdown = useDeckBreakdown(cards)

  const pctOfDeck = (count: number) => (breakdown.total > 0 ? (count / breakdown.total) * 100 : 0)

  return (
    <>
      <h3>Deck composition</h3>
      <div className="stat-tile-row">
        <div className="stat-tile">
          <span className="stat-tile-label">Pokémon</span>
          <span className="stat-tile-value">{breakdown.pokemon.total}</span>
          <span className="stat-tile-hint">{pctOfDeck(breakdown.pokemon.total).toFixed(0)}% of deck</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-label">Trainer</span>
          <span className="stat-tile-value">{breakdown.trainer.total}</span>
          <span className="stat-tile-hint">{pctOfDeck(breakdown.trainer.total).toFixed(0)}% of deck</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-label">Energy</span>
          <span className="stat-tile-value">{breakdown.energy.total}</span>
          <span className="stat-tile-hint">{pctOfDeck(breakdown.energy.total).toFixed(0)}% of deck</span>
        </div>
      </div>

      {breakdown.pokemon.total > 0 && (
        <div className="breakdown-section">
          <h4>Pokémon ({breakdown.pokemon.total})</h4>
          <BreakdownRow label="Basic" count={breakdown.pokemon.basic} total={breakdown.pokemon.total} />
          <BreakdownRow label="Stage 1" count={breakdown.pokemon.stage1} total={breakdown.pokemon.total} />
          <BreakdownRow label="Stage 2" count={breakdown.pokemon.stage2} total={breakdown.pokemon.total} />
          {breakdown.pokemon.other > 0 && (
            <BreakdownRow label="Other" count={breakdown.pokemon.other} total={breakdown.pokemon.total} />
          )}
          {(breakdown.pokemon.ex > 0 || breakdown.pokemon.mega > 0) && (
            <div className="breakdown-badges">
              {breakdown.pokemon.ex > 0 && <span className="breakdown-badge">{breakdown.pokemon.ex} ex</span>}
              {breakdown.pokemon.mega > 0 && <span className="breakdown-badge">{breakdown.pokemon.mega} Mega</span>}
            </div>
          )}
        </div>
      )}

      {breakdown.trainer.total > 0 && (
        <div className="breakdown-section">
          <h4>Trainer ({breakdown.trainer.total})</h4>
          <BreakdownRow label="Supporter" count={breakdown.trainer.supporter} total={breakdown.trainer.total} />
          <BreakdownRow label="Item" count={breakdown.trainer.item} total={breakdown.trainer.total} />
          <BreakdownRow label="Stadium" count={breakdown.trainer.stadium} total={breakdown.trainer.total} />
          <BreakdownRow label="Tool" count={breakdown.trainer.tool} total={breakdown.trainer.total} />
        </div>
      )}

      {breakdown.energy.total > 0 && (
        <div className="breakdown-section">
          <h4>Energy ({breakdown.energy.total})</h4>
          <BreakdownRow label="Basic Energy" count={breakdown.energy.basic} total={breakdown.energy.total} />
          <BreakdownRow label="Special Energy" count={breakdown.energy.special} total={breakdown.energy.total} />
        </div>
      )}
    </>
  )
}
