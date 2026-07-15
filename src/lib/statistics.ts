import type { DeckCard } from '../types/card'
import { isBasicPokemon } from './cards'

const OPENING_HAND_SIZE = 7

/** n-choose-k via an iterative product, kept numerically stable for deck-sized inputs. */
export function nCr(n: number, k: number): number {
  if (k < 0 || n < 0 || k > n) return 0
  const bounded = Math.min(k, n - k)
  let result = 1
  for (let i = 0; i < bounded; i++) {
    result *= (n - i) / (i + 1)
  }
  return result
}

/** P(exactly `observed` successes) drawing `draws` cards from a `populationSize` deck with `successStates` successes. */
export function hypergeometricPMF(
  populationSize: number,
  successStates: number,
  draws: number,
  observed: number,
): number {
  const denominator = nCr(populationSize, draws)
  if (denominator === 0) return 0
  return (nCr(successStates, observed) * nCr(populationSize - successStates, draws - observed)) / denominator
}

/** P(at least one success) drawing `draws` cards from a `populationSize` deck with `successStates` successes. */
export function atLeastOneChance(populationSize: number, successStates: number, draws: number): number {
  if (successStates <= 0) return 0
  const denominator = nCr(populationSize, draws)
  if (denominator === 0) return 0
  return 1 - nCr(populationSize - successStates, draws) / denominator
}

export interface BasicFetchChance {
  name: string
  count: number
  imageUrl: string
  chance: number
}

export interface OpeningHandStats {
  deckSize: number
  handSize: number
  totalBasics: number
  mulliganChance: number
  exactlyOneBasicChance: number
  twoOrMoreBasicsChance: number
  basicFetchChances: BasicFetchChance[]
}

export function computeOpeningHandStats(cards: DeckCard[]): OpeningHandStats {
  const deckSize = cards.reduce((sum, dc) => sum + dc.count, 0)
  const handSize = Math.min(OPENING_HAND_SIZE, deckSize)

  const basics = cards.filter((dc) => isBasicPokemon(dc.card))
  const totalBasics = basics.reduce((sum, dc) => sum + dc.count, 0)

  const mulliganChance = deckSize > 0 ? hypergeometricPMF(deckSize, totalBasics, handSize, 0) : 0
  const exactlyOneBasicChance = deckSize > 0 ? hypergeometricPMF(deckSize, totalBasics, handSize, 1) : 0
  const twoOrMoreBasicsChance = deckSize > 0
    ? Math.max(0, 1 - mulliganChance - exactlyOneBasicChance)
    : 0

  const grouped = new Map<string, { count: number; imageUrl: string }>()
  for (const dc of basics) {
    const existing = grouped.get(dc.card.name)
    if (existing) {
      existing.count += dc.count
    } else {
      grouped.set(dc.card.name, { count: dc.count, imageUrl: dc.card.images.small })
    }
  }

  const basicFetchChances: BasicFetchChance[] = Array.from(grouped.entries())
    .map(([name, { count, imageUrl }]) => ({
      name,
      count,
      imageUrl,
      chance: atLeastOneChance(deckSize, count, handSize),
    }))
    .sort((a, b) => b.chance - a.chance)

  return {
    deckSize,
    handSize,
    totalBasics,
    mulliganChance,
    exactlyOneBasicChance,
    twoOrMoreBasicsChance,
    basicFetchChances,
  }
}
