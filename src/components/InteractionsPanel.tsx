import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useCardInteractions } from '../hooks/useCardInteractions'
import { useCardInteractionRules } from '../hooks/useCardInteractionRules'
import { CARD_INTERACTION_RULES, type CardCondition, type HpOperator } from '../lib/cardInteractions'
import { CardDetailCard } from './CardDetailCard'
import { UnifiedInteractionGraph } from './UnifiedInteractionGraph'
import type { DeckCard, Supertype } from '../types/card'

interface InteractionsPanelProps {
  cards: DeckCard[]
}

const SUPERTYPE_OPTIONS: { value: Supertype | ''; label: string }[] = [
  { value: '', label: 'Any type' },
  { value: 'Pokémon', label: 'Pokémon' },
  { value: 'Trainer', label: 'Trainer' },
  { value: 'Energy', label: 'Energy' },
]

const HP_OPERATOR_OPTIONS: { value: HpOperator | ''; label: string }[] = [
  { value: '', label: 'No HP condition' },
  { value: '<=', label: '≤ (or less)' },
  { value: '<', label: '< (less than)' },
  { value: '=', label: '= (exactly)' },
  { value: '>=', label: '≥ (or more)' },
  { value: '>', label: '> (more than)' },
]

const HP_OPERATOR_SYMBOL: Record<HpOperator, string> = {
  '<=': '≤',
  '<': '<',
  '=': '=',
  '>=': '≥',
  '>': '>',
}

/** Breaks a condition down into the same fields the custom-rule builder has, so users can see how to recreate it. */
function queryFields(condition: CardCondition): string[] {
  const fields: string[] = []
  fields.push(`Type: ${condition.supertype ?? 'Any type'}`)
  if (condition.subtype) fields.push(`Subtype: ${condition.subtype}`)
  if (condition.namePrefix) fields.push(`Name starts with: "${condition.namePrefix}"`)
  if (condition.hp) fields.push(`HP: ${HP_OPERATOR_SYMBOL[condition.hp.operator]} ${condition.hp.value}`)
  if (condition.noRuleBox) fields.push('No Rule Box (excludes ex, V, VMAX, etc.)')
  return fields
}

/** Closes a popover on an outside click or Escape, while it's open. */
function useClosePopoverOnOutsideInteraction(isOpen: boolean, ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, ref, onClose])
}

export function InteractionsPanel({ cards }: InteractionsPanelProps) {
  const { rules: customRules, runtimeRules, addRule, removeRule } = useCardInteractionRules()
  const allRules = useMemo(() => [...CARD_INTERACTION_RULES, ...runtimeRules], [runtimeRules])
  const interactions = useCardInteractions(cards, allRules)
  const conditionById = useMemo(() => new Map(allRules.map((rule) => [rule.id, rule.condition])), [allRules])

  const deckCardNames = useMemo(
    () => Array.from(new Set(cards.map((dc) => dc.card.name))).sort((a, b) => a.localeCompare(b)),
    [cards],
  )

  const cardByName = useMemo(() => {
    const map = new Map<string, DeckCard['card']>()
    for (const { card } of cards) {
      if (!map.has(card.name)) map.set(card.name, card)
    }
    return map
  }, [cards])

  const [selectedCardName, setSelectedCardName] = useState<string | null>(null)
  const selectedCard = selectedCardName ? (cardByName.get(selectedCardName) ?? null) : null

  const [disabledInteractionIds, setDisabledInteractionIds] = useState<Set<string>>(new Set())
  const toggleInteraction = (id: string) => {
    setDisabledInteractionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const visibleInteractions = useMemo(
    () => interactions.filter((interaction) => !disabledInteractionIds.has(interaction.id)),
    [interactions, disabledInteractionIds],
  )

  const [expandedInteractionId, setExpandedInteractionId] = useState<string | null>(null)

  const [isNewInteractionOpen, setNewInteractionOpen] = useState(false)
  const newInteractionRef = useRef<HTMLDivElement | null>(null)
  useClosePopoverOnOutsideInteraction(isNewInteractionOpen, newInteractionRef, () => setNewInteractionOpen(false))

  const [triggerCardName, setTriggerCardName] = useState('')
  const [supertype, setSupertype] = useState<Supertype | ''>('')
  const [subtype, setSubtype] = useState('')
  const [namePrefix, setNamePrefix] = useState('')
  const [noRuleBox, setNoRuleBox] = useState(false)
  const [hpOperator, setHpOperator] = useState<HpOperator | ''>('')
  const [hpValue, setHpValue] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!triggerCardName.trim()) return

    const parsedHpValue = Number(hpValue)
    addRule({
      triggerCardName: triggerCardName.trim(),
      description,
      condition: {
        supertype: supertype || undefined,
        subtype: subtype.trim() || undefined,
        namePrefix: namePrefix.trim() || undefined,
        noRuleBox: noRuleBox || undefined,
        hp:
          hpOperator && hpValue.trim() && !Number.isNaN(parsedHpValue)
            ? { operator: hpOperator, value: parsedHpValue }
            : undefined,
      },
    })

    setTriggerCardName('')
    setSupertype('')
    setSubtype('')
    setNamePrefix('')
    setNoRuleBox(false)
    setHpOperator('')
    setHpValue('')
    setDescription('')
    setNewInteractionOpen(false)
  }

  if (cards.length === 0) {
    return (
      <section className="interactions-panel viz-root">
        <h2>Interactions</h2>
        <p className="status-text">Add cards to your deck to see how they interact.</p>
      </section>
    )
  }

  return (
    <section className="interactions-panel viz-root">
      <h2>Interactions</h2>

      {interactions.length === 0 ? (
        <p className="status-text">No card interactions apply to your deck yet.</p>
      ) : (
        <>
          {visibleInteractions.length === 0 ? (
            <p className="status-text">All interactions are hidden — check one below to show the graph.</p>
          ) : (
            <div className="interactions-graph-row">
              <UnifiedInteractionGraph
                interactions={visibleInteractions}
                cards={cards}
                onCardClick={setSelectedCardName}
              />
              {selectedCard && (
                <CardDetailCard
                  card={selectedCard}
                  interactions={interactions}
                  disabledInteractionIds={disabledInteractionIds}
                  onToggleInteraction={toggleInteraction}
                  onClose={() => setSelectedCardName(null)}
                />
              )}
            </div>
          )}

          <div className="breakdown-section">
            <h4>Interactions</h4>
            <p className="status-text">Uncheck one to hide it from the graph. Click one to see what it matches.</p>
            <ul className="custom-rule-list">
              {interactions.map((interaction) => {
                const isExpanded = expandedInteractionId === interaction.id
                const condition = conditionById.get(interaction.id)
                return (
                  <li key={interaction.id} className="custom-rule-row interaction-row">
                    <input
                      type="checkbox"
                      checked={!disabledInteractionIds.has(interaction.id)}
                      onChange={() => toggleInteraction(interaction.id)}
                      aria-label={`Show ${interaction.triggerCardName} on the graph`}
                    />
                    <button
                      type="button"
                      className="interaction-query-trigger"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedInteractionId(isExpanded ? null : interaction.id)}
                    >
                      <strong>{interaction.triggerCardName}</strong> — {interaction.description}
                    </button>

                    {isExpanded && (
                      <div className="interaction-query-results">
                        {condition ? (
                          <>
                            <p className="interaction-query-label">
                              Same as building this on "New interaction" below:
                            </p>
                            <ul className="interaction-query-fields">
                              {queryFields(condition).map((field) => (
                                <li key={field}>{field}</li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <p className="status-text">Not something the builder below can create (evolution is structural).</p>
                        )}

                        {interaction.matchingCards.length === 0 ? (
                          <p className="status-text">No cards in your deck match this interaction.</p>
                        ) : (
                          <>
                            <p className="interaction-query-label">Currently matches:</p>
                            <ul>
                              {interaction.matchingCards.map((match) => (
                                <li key={match.name}>
                                  {match.name} × {match.count}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}

      {customRules.length > 0 && (
        <div className="breakdown-section">
          <h4>Your custom rules</h4>
          <ul className="custom-rule-list">
            {customRules.map((rule) => (
              <li key={rule.id} className="custom-rule-row">
                <span>
                  <strong>{rule.triggerCardName}</strong> — {rule.description}
                </span>
                <button type="button" onClick={() => removeRule(rule.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="interaction-toggle-popover-wrap" ref={newInteractionRef}>
        <button
          type="button"
          className="interaction-toggle-trigger"
          aria-expanded={isNewInteractionOpen}
          onClick={() => setNewInteractionOpen((open) => !open)}
        >
          New interaction
        </button>

        {isNewInteractionOpen && (
          <div className="interaction-toggle-popover">
            <h4>Add a custom interaction</h4>
            <form className="custom-rule-form" onSubmit={handleSubmit}>
              <select
                value={triggerCardName}
                onChange={(e) => setTriggerCardName(e.target.value)}
                aria-label="Trigger card"
                required
              >
                <option value="">Select a card in your deck…</option>
                {deckCardNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <div className="custom-rule-form-row">
                <select
                  value={supertype}
                  onChange={(e) => setSupertype(e.target.value as Supertype | '')}
                  aria-label="Target card type"
                >
                  {SUPERTYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Subtype (e.g. Basic)"
                  value={subtype}
                  onChange={(e) => setSubtype(e.target.value)}
                  aria-label="Target subtype"
                />
              </div>
              <input
                type="text"
                placeholder={`Name starts with (e.g. "N's")`}
                value={namePrefix}
                onChange={(e) => setNamePrefix(e.target.value)}
                aria-label="Target name starts with"
              />
              <label className="custom-rule-form-checkbox">
                <input type="checkbox" checked={noRuleBox} onChange={(e) => setNoRuleBox(e.target.checked)} />
                No Rule Box (excludes ex, V, VMAX, etc.)
              </label>
              <div className="custom-rule-form-row">
                <select
                  value={hpOperator}
                  onChange={(e) => setHpOperator(e.target.value as HpOperator | '')}
                  aria-label="HP comparison"
                >
                  {HP_OPERATOR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="HP value"
                  value={hpValue}
                  onChange={(e) => setHpValue(e.target.value)}
                  disabled={!hpOperator}
                  aria-label="HP value"
                />
              </div>
              <input
                type="text"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-label="Rule description"
              />
              <button type="submit" disabled={!triggerCardName.trim()}>
                Add interaction
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
