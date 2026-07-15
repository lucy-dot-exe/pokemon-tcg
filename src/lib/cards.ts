import type { Card } from '../types/card'

/**
 * Identifies cards that play identically: same name and game text (attacks,
 * abilities, HP, types, weaknesses, resistances, retreat cost, rules).
 * Different artwork/sets/rarities of the same functional card hash the same.
 */
function functionalKey(card: Card): string {
  return JSON.stringify({
    name: card.name,
    supertype: card.supertype,
    subtypes: card.subtypes,
    hp: card.hp,
    types: card.types,
    attacks: card.attacks,
    abilities: card.abilities,
    weaknesses: card.weaknesses,
    resistances: card.resistances,
    retreatCost: card.retreatCost,
    rules: card.rules,
  })
}

/**
 * Collapses cards that are functionally identical down to one entry, so
 * reprints with different artwork/sets don't clutter search results with
 * options that play exactly the same.
 */
export function dedupeByFunctionalText(cards: Card[]): Card[] {
  const seen = new Set<string>()
  const result: Card[] = []
  for (const card of cards) {
    const key = functionalKey(card)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(card)
  }
  return result
}
