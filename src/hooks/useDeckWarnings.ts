import { useMemo } from 'react'
import type { DeckCard } from '../types/card'
import { computeDeckWarnings, type DeckWarning } from '../lib/deckWarnings'

export function useDeckWarnings(cards: DeckCard[]): DeckWarning[] {
  return useMemo(() => computeDeckWarnings(cards), [cards])
}
