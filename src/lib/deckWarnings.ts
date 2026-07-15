import { computeOpeningHandStats } from './statistics'
import type { Card, DeckCard } from '../types/card'

export interface DeckWarning {
  id: string
  label: string
  passed: boolean
  details: string[]
}

const MULLIGAN_THRESHOLD = 0.15
const SINGLE_BASIC_THRESHOLD = 0.3
const WEAKNESS_SHARE_THRESHOLD = 0.5

const ENERGY_ELEMENTS = [
  'Grass',
  'Fire',
  'Water',
  'Lightning',
  'Psychic',
  'Fighting',
  'Darkness',
  'Metal',
  'Fairy',
  'Dragon',
]

/**
 * The API's `types` field is unreliable for energy cards — it's undefined
 * for most Special Energy (e.g. "Heat Fire Energy", "Bubbly Water Energy",
 * "Blend Energy GrassFirePsychicDarkness") and even for many vintage-named
 * Basic Energy prints, despite the card clearly providing a specific type.
 * Falling back to scanning the name for a known element covers those cases
 * — a plain (Basic or Special) Fire Energy counts toward a Fire requirement
 * either way.
 */
function inferEnergyTypes(card: Card): string[] {
  const types = new Set(card.types ?? [])
  for (const element of ENERGY_ELEMENTS) {
    if (card.name.includes(element)) types.add(element)
  }
  return Array.from(types)
}

/**
 * Every Stage 1 Pokémon needs its Basic in the deck, and every Stage 2 needs
 * both its Stage 1 and (via that Stage 1's own evolvesFrom) its Basic — the
 * full chain, not just the immediate previous stage.
 */
function evolutionCheck(cards: DeckCard[]): DeckWarning {
  const namesInDeck = new Set(cards.map((dc) => dc.card.name))
  const cardByName = new Map<string, Card>()
  for (const { card } of cards) {
    if (!cardByName.has(card.name)) cardByName.set(card.name, card)
  }

  const details: string[] = []

  for (const { card } of cards) {
    if (card.supertype !== 'Pokémon') continue

    if (card.subtypes?.includes('Stage 1')) {
      if (card.evolvesFrom && !namesInDeck.has(card.evolvesFrom)) {
        details.push(`${card.name} evolves from ${card.evolvesFrom}, but ${card.evolvesFrom} isn't in your deck.`)
      }
    } else if (card.subtypes?.includes('Stage 2')) {
      const stage1Name = card.evolvesFrom
      if (!stage1Name) continue

      if (!namesInDeck.has(stage1Name)) {
        details.push(`${card.name} evolves from ${stage1Name}, but ${stage1Name} isn't in your deck.`)
        continue
      }

      const basicName = cardByName.get(stage1Name)?.evolvesFrom
      if (basicName && !namesInDeck.has(basicName)) {
        details.push(
          `${card.name}'s evolution line needs ${basicName} (which ${stage1Name} evolves from), but it isn't in your deck.`,
        )
      }
    }
  }

  return {
    id: 'evolution',
    label: 'Basic Pokémon for evolutions',
    passed: details.length === 0,
    details:
      details.length > 0
        ? details
        : ['Every Stage 1 and Stage 2 Pokémon has its earlier evolutions in the deck.'],
  }
}

/**
 * For each energy type any attack in the deck needs, checks whether the
 * deck has enough of it to pay the single most expensive attack requiring
 * that type. "Colorless" costs are ignored since any energy can pay them.
 */
function energyCheck(cards: DeckCard[]): DeckWarning {
  const availableByType = new Map<string, number>()
  for (const { card, count } of cards) {
    if (card.supertype !== 'Energy') continue
    for (const type of inferEnergyTypes(card)) {
      availableByType.set(type, (availableByType.get(type) ?? 0) + count)
    }
  }

  const maxRequiredByType = new Map<string, { count: number; pokemonName: string; attackName: string }>()
  for (const { card } of cards) {
    if (card.supertype !== 'Pokémon') continue
    for (const attack of card.attacks ?? []) {
      const typeCounts = new Map<string, number>()
      for (const costType of attack.cost) {
        if (costType === 'Colorless') continue
        typeCounts.set(costType, (typeCounts.get(costType) ?? 0) + 1)
      }
      for (const [type, required] of typeCounts) {
        const existing = maxRequiredByType.get(type)
        if (!existing || required > existing.count) {
          maxRequiredByType.set(type, { count: required, pokemonName: card.name, attackName: attack.name })
        }
      }
    }
  }

  const details: string[] = []
  for (const [type, { count: required, pokemonName, attackName }] of maxRequiredByType) {
    const available = availableByType.get(type) ?? 0
    if (available < required) {
      details.push(
        `${type} Energy: ${pokemonName}'s "${attackName}" needs ${required}, but your deck only has ${available}.`,
      )
    }
  }

  return {
    id: 'energy',
    label: 'Energy for attacks',
    passed: details.length === 0,
    details: details.length > 0 ? details : ['Every attack has enough energy of its required type.'],
  }
}

/** The opening-hand mulligan chance (no basic Pokémon in the first 7 cards) should ideally stay below 15%. */
function mulliganCheck(cards: DeckCard[]): DeckWarning {
  const { mulliganChance } = computeOpeningHandStats(cards)
  const passed = mulliganChance < MULLIGAN_THRESHOLD
  const percent = `${(mulliganChance * 100).toFixed(1)}%`

  return {
    id: 'mulligan',
    label: 'Mulligan chance',
    passed,
    details: [
      passed
        ? `${percent} chance of no basic Pokémon in your opening hand — below the 15% target.`
        : `${percent} chance of no basic Pokémon in your opening hand — ideally below 15%. Consider adding more basic Pokémon.`,
    ],
  }
}

/**
 * The chance of exactly one basic Pokémon in the opening hand should ideally
 * stay below 30% — too high, and losing that single basic early leaves you
 * with no backup to keep playing.
 */
function singleBasicCheck(cards: DeckCard[]): DeckWarning {
  const { exactlyOneBasicChance } = computeOpeningHandStats(cards)
  const passed = exactlyOneBasicChance <= SINGLE_BASIC_THRESHOLD
  const percent = `${(exactlyOneBasicChance * 100).toFixed(1)}%`

  return {
    id: 'single-basic',
    label: 'Single basic Pokémon chance',
    passed,
    details: [
      passed
        ? `${percent} chance of exactly one basic Pokémon in your opening hand — at or below the 30% target.`
        : `${percent} chance of exactly one basic Pokémon in your opening hand — above the 30% target. Consider adding more basic Pokémon for backup.`,
    ],
  }
}

/**
 * No single weakness type should cover more than half the deck's Pokémon —
 * otherwise one well-typed opponent can threaten most of your board at once.
 */
function weaknessCheck(cards: DeckCard[]): DeckWarning {
  const pokemonCards = cards.filter((dc) => dc.card.supertype === 'Pokémon')
  const totalPokemon = pokemonCards.reduce((sum, dc) => sum + dc.count, 0)

  const countByWeakness = new Map<string, number>()
  for (const { card, count } of pokemonCards) {
    const weaknessTypes = new Set((card.weaknesses ?? []).map((weakness) => weakness.type))
    for (const type of weaknessTypes) {
      countByWeakness.set(type, (countByWeakness.get(type) ?? 0) + count)
    }
  }

  const details: string[] = []
  if (totalPokemon > 0) {
    for (const [type, count] of countByWeakness) {
      const share = count / totalPokemon
      if (share > WEAKNESS_SHARE_THRESHOLD) {
        details.push(
          `${count} of ${totalPokemon} Pokémon (${(share * 100).toFixed(0)}%) are weak to ${type} — more than half your deck.`,
        )
      }
    }
  }

  return {
    id: 'weakness',
    label: 'Weakness spread',
    passed: details.length === 0,
    details: details.length > 0 ? details : ['No single weakness type covers more than half your Pokémon.'],
  }
}

export function computeDeckWarnings(cards: DeckCard[]): DeckWarning[] {
  return [
    evolutionCheck(cards),
    energyCheck(cards),
    mulliganCheck(cards),
    singleBasicCheck(cards),
    weaknessCheck(cards),
  ]
}
