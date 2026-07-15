import type { DeckCard } from '../types/card'
import { isBasicPokemon } from './cards'
import { isStandardLegal } from './format'

const REQUIRED_DECK_SIZE = 60

export interface DeckCheck {
  id: string
  label: string
  passed: boolean
  detail: string
}

export interface DeckValidation {
  isLegal: boolean
  checks: DeckCheck[]
  illegalCards: DeckCard[]
}

export function validateDeck(cards: DeckCard[]): DeckValidation {
  const deckSize = cards.reduce((sum, dc) => sum + dc.count, 0)
  const sizeCheck: DeckCheck = {
    id: 'deck-size',
    label: 'Deck size',
    passed: deckSize === REQUIRED_DECK_SIZE,
    detail: `${deckSize}/${REQUIRED_DECK_SIZE} cards`,
  }

  const illegalCards = cards.filter((dc) => !isStandardLegal(dc.card))
  const regulationCheck: DeckCheck = {
    id: 'regulation',
    label: 'Format regulation (Standard)',
    passed: illegalCards.length === 0,
    detail:
      illegalCards.length === 0
        ? 'Every card meets the current Standard regulation.'
        : `${illegalCards.length} card${illegalCards.length === 1 ? '' : 's'} not legal in Standard.`,
  }

  const totalBasics = cards
    .filter((dc) => isBasicPokemon(dc.card))
    .reduce((sum, dc) => sum + dc.count, 0)
  const basicCheck: DeckCheck = {
    id: 'basic-pokemon',
    label: 'Basic Pokémon',
    passed: totalBasics >= 1,
    detail:
      totalBasics >= 1
        ? `${totalBasics} basic Pokémon in deck.`
        : 'No basic Pokémon in deck — this deck cannot be played.',
  }

  const checks = [sizeCheck, regulationCheck, basicCheck]

  return {
    isLegal: checks.every((check) => check.passed),
    checks,
    illegalCards,
  }
}
