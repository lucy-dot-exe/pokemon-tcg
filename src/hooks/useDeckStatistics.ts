import { useMemo } from 'react'
import type { DeckCard } from '../types/card'
import { computeOpeningHandStats, type OpeningHandStats } from '../lib/statistics'

export function useDeckStatistics(cards: DeckCard[]): OpeningHandStats {
  return useMemo(() => computeOpeningHandStats(cards), [cards])
}
