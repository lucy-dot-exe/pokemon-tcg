import { useMemo } from 'react'
import type { DeckCard } from '../types/card'
import { validateDeck, type DeckValidation } from '../lib/deckValidation'

export function useDeckValidation(cards: DeckCard[]): DeckValidation {
  return useMemo(() => validateDeck(cards), [cards])
}
