import type { DeckCard } from '../types/card'

export interface WeaknessCounts {
  totalPokemon: number
  countByType: Map<string, number>
  noWeaknessCount: number
}

export interface ResistanceCounts {
  totalPokemon: number
  countByType: Map<string, number>
  noResistanceCount: number
}

/** Tallies how many Pokémon in the deck have each type in the given field (a card with multiple entries counts toward each). */
function computeTypeCounts(cards: DeckCard[], field: 'weaknesses' | 'resistances') {
  const pokemonCards = cards.filter((dc) => dc.card.supertype === 'Pokémon')
  const totalPokemon = pokemonCards.reduce((sum, dc) => sum + dc.count, 0)

  const countByType = new Map<string, number>()
  let noneCount = 0

  for (const { card, count } of pokemonCards) {
    const entries = card[field] ?? []
    const types = new Set(entries.map((entry) => entry.type))
    if (types.size === 0) {
      noneCount += count
      continue
    }
    for (const type of types) {
      countByType.set(type, (countByType.get(type) ?? 0) + count)
    }
  }

  return { totalPokemon, countByType, noneCount }
}

/** Tallies how many Pokémon in the deck are weak to each type (a card with multiple weaknesses counts toward each). */
export function computeWeaknessCounts(cards: DeckCard[]): WeaknessCounts {
  const { totalPokemon, countByType, noneCount } = computeTypeCounts(cards, 'weaknesses')
  return { totalPokemon, countByType, noWeaknessCount: noneCount }
}

/** Tallies how many Pokémon in the deck resist each type (a card with multiple resistances counts toward each). */
export function computeResistanceCounts(cards: DeckCard[]): ResistanceCounts {
  const { totalPokemon, countByType, noneCount } = computeTypeCounts(cards, 'resistances')
  return { totalPokemon, countByType, noResistanceCount: noneCount }
}
