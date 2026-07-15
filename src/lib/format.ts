import type { Card } from '../types/card'

/**
 * The pokemontcg.io API's `legalities.standard` field lags behind the real
 * rotation (it still marks pre-rotation regulation marks as standard-legal).
 * Regulation marks are stamped on the print and don't change, so Standard is
 * computed from them directly instead of trusting that field. Update this
 * when the format rotates.
 */
export const CURRENT_STANDARD_MIN_REGULATION_MARK = 'H'

export function isStandardLegal(card: Card): boolean {
  return !!card.regulationMark && card.regulationMark >= CURRENT_STANDARD_MIN_REGULATION_MARK
}
