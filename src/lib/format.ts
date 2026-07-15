import type { Card } from '../types/card'
import { isBasicEnergy } from './cards'

/**
 * The pokemontcg.io API's `legalities.standard` field lags behind the real
 * rotation (it still marks pre-rotation regulation marks as standard-legal).
 * Regulation marks are stamped on the print and don't change, so Standard is
 * computed from them directly instead of trusting that field. Update this
 * when the format rotates.
 */
export const CURRENT_STANDARD_MIN_REGULATION_MARK = 'H'

export function isStandardLegal(card: Card): boolean {
  // Basic Energy (no rules text beyond the symbol) is exempt from rotation —
  // any print, even a vintage one, is tournament legal. Special Energy has
  // rules text and rotates normally, so it still needs a current regulation mark.
  if (isBasicEnergy(card)) return true
  return !!card.regulationMark && card.regulationMark >= CURRENT_STANDARD_MIN_REGULATION_MARK
}
