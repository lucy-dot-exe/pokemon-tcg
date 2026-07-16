import { useMemo } from 'react'
import type { DeckCard } from '../types/card'
import {
  computeCardInteractions,
  computeEvolutionInteractions,
  type CardInteractionResult,
  type CardInteractionRule,
} from '../lib/cardInteractions'

export function useCardInteractions(cards: DeckCard[], rules: CardInteractionRule[]): CardInteractionResult[] {
  return useMemo(
    () => [...computeEvolutionInteractions(cards), ...computeCardInteractions(cards, rules)],
    [cards, rules],
  )
}
