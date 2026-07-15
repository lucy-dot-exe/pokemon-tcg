import { CANONICAL_BASIC_ENERGIES } from '../data/basicEnergies'
import type { Card, Supertype } from '../types/card'

export function isBasicPokemon(card: Card): boolean {
  return card.supertype === 'Pokémon' && !!card.subtypes?.includes('Basic')
}

export function isBasicEnergy(card: Card): boolean {
  return card.supertype === 'Energy' && !!card.subtypes?.includes('Basic')
}

/**
 * Extracts the element from a basic energy's name ("Basic Darkness Energy"
 * or the vintage "Darkness Energy" both -> "Darkness"), since older prints
 * use the "Basic" prefix inconsistently even though the card plays identically.
 */
function basicEnergyType(card: Card): string {
  const match = /^(?:Basic )?(.+) Energy$/.exec(card.name)
  return match ? match[1] : card.name
}

/**
 * Identifies cards that play identically: same name and game text (attacks,
 * abilities, HP, types, weaknesses, resistances, retreat cost, rules).
 * Different artwork/sets/rarities of the same functional card hash the same.
 *
 * Basic Energy is keyed by element alone: it has no rules text, so two
 * prints of the same element are always identical in play regardless of
 * whether the name uses the "Basic" prefix. This also works around the
 * API's data being inconsistent for some prints (e.g. sve-8 "Basic Metal
 * Energy" is missing its `types` field entirely while sve-16, the same card
 * in the same set, has `types: ["Metal"]` — the full field-by-field key
 * would treat those as different cards).
 */
function functionalKey(card: Card): string {
  if (isBasicEnergy(card)) {
    return JSON.stringify({ energyType: basicEnergyType(card), supertype: card.supertype })
  }

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

/**
 * The canonical basic energies (Scarlet & Violet Energies, numbers 1-8)
 * whose name matches a search query — or all 8, when browsing the Energy
 * type with no query text yet. The API is never asked for Basic Energy (see
 * api/pokemonTcg.ts) since it's fixed, known data — this is the client-side
 * substitute, used to merge matching basics into search results.
 */
export function matchingBasicEnergies(query: string, supertype?: Supertype): Card[] {
  if (supertype && supertype !== 'Energy') return []
  const q = query.trim().toLowerCase()
  if (!q) return supertype === 'Energy' ? CANONICAL_BASIC_ENERGIES : []
  return CANONICAL_BASIC_ENERGIES.filter((card) => card.name.toLowerCase().includes(q))
}
