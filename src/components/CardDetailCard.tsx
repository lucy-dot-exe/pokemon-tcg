import { DEFAULT_ENERGY_TYPE_COLOR, ENERGY_TYPE_COLORS } from '../data/energyTypeColors'
import type { CardInteractionResult } from '../lib/cardInteractions'
import type { Card } from '../types/card'

interface CardDetailCardProps {
  card: Card
  interactions: CardInteractionResult[]
  disabledInteractionIds: Set<string>
  onToggleInteraction: (id: string) => void
  onClose: () => void
}

function EnergyCost({ cost }: { cost: string[] }) {
  return (
    <span className="energy-cost">
      {cost.map((type, index) => (
        <span
          key={index}
          className="energy-cost-pip"
          style={{ backgroundColor: ENERGY_TYPE_COLORS[type] ?? DEFAULT_ENERGY_TYPE_COLOR }}
          title={type}
        />
      ))}
    </span>
  )
}

export function CardDetailCard({
  card,
  interactions,
  disabledInteractionIds,
  onToggleInteraction,
  onClose,
}: CardDetailCardProps) {
  const cardInteractions = interactions.filter(
    (interaction) =>
      interaction.triggerCardName === card.name || interaction.matchingCards.some((match) => match.name === card.name),
  )

  return (
    <div className="card-detail">
      <button type="button" className="card-detail-close" onClick={onClose} aria-label="Close card details">
        ×
      </button>

      <img src={card.images.large} alt={card.name} className="card-detail-image" />

      <div className="card-detail-info">
        <h3>{card.name}</h3>
        <p className="card-detail-meta">
          {card.supertype}
          {card.subtypes && card.subtypes.length > 0 ? ` · ${card.subtypes.join(', ')}` : ''}
          {card.hp ? ` · HP ${card.hp}` : ''}
        </p>

        {card.types && card.types.length > 0 && (
          <p className="card-detail-meta">Type: {card.types.join(', ')}</p>
        )}

        {card.abilities?.map((ability) => (
          <p key={ability.name} className="card-detail-text">
            <strong>
              {ability.type}: {ability.name}
            </strong>
            <br />
            {ability.text}
          </p>
        ))}

        {card.attacks?.map((attack) => (
          <p key={attack.name} className="card-detail-text">
            <strong>
              <EnergyCost cost={attack.cost} /> {attack.name}
              {attack.damage ? ` — ${attack.damage}` : ''}
            </strong>
            {attack.text && (
              <>
                <br />
                {attack.text}
              </>
            )}
          </p>
        ))}

        {card.rules?.map((rule, index) => (
          <p key={index} className="card-detail-text">
            {rule}
          </p>
        ))}

        {(card.weaknesses || card.resistances || card.retreatCost) && (
          <p className="card-detail-meta">
            {card.weaknesses && card.weaknesses.length > 0 && (
              <>Weakness: {card.weaknesses.map((w) => `${w.type} ${w.value}`).join(', ')} </>
            )}
            {card.resistances && card.resistances.length > 0 && (
              <>Resistance: {card.resistances.map((r) => `${r.type} ${r.value}`).join(', ')} </>
            )}
            {card.retreatCost && card.retreatCost.length > 0 && (
              <>
                Retreat: <EnergyCost cost={card.retreatCost} />
              </>
            )}
          </p>
        )}

        <p className="card-detail-meta">
          {card.set.name} · #{card.number}
        </p>

        {cardInteractions.length > 0 && (
          <div className="card-detail-interactions">
            <h4>Interactions</h4>
            <ul>
              {cardInteractions.map((interaction) => {
                const isTrigger = interaction.triggerCardName === card.name
                const otherNames = new Set<string>()
                if (!isTrigger) otherNames.add(interaction.triggerCardName)
                for (const match of interaction.matchingCards) {
                  if (match.name !== card.name) otherNames.add(match.name)
                }

                return (
                  <li key={interaction.id} className="card-detail-text card-detail-interaction-row">
                    <label className="card-detail-interaction-toggle">
                      <input
                        type="checkbox"
                        checked={!disabledInteractionIds.has(interaction.id)}
                        onChange={() => onToggleInteraction(interaction.id)}
                        aria-label={`Show ${interaction.triggerCardName} on the graph`}
                      />
                      <span>
                        <strong>{interaction.triggerCardName}</strong>
                        {isTrigger ? ' (this card)' : ` → ${card.name}`}
                      </span>
                    </label>
                    {interaction.description}
                    {otherNames.size > 0 && (
                      <>
                        <br />
                        Cards: {Array.from(otherNames).join(', ')}
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
