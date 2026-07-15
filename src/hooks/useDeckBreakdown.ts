import { useMemo } from 'react'
import type { DeckCard } from '../types/card'
import { computeDeckBreakdown, type DeckBreakdown } from '../lib/deckBreakdown'

export function useDeckBreakdown(cards: DeckCard[]): DeckBreakdown {
  return useMemo(() => computeDeckBreakdown(cards), [cards])
}
