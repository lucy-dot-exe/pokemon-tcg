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

/**
 * Every regulation mark letter from the current cutoff through 'Z' — used to
 * build an API-side filter (the API only supports exact-match/OR queries,
 * not a >= comparison, so this generates the equivalent explicit list).
 * Marks beyond what's been printed yet just match 0 cards, harmlessly.
 */
export function standardRegulationMarks(): string[] {
  const marks: string[] = []
  for (
    let code = CURRENT_STANDARD_MIN_REGULATION_MARK.charCodeAt(0);
    code <= 'Z'.charCodeAt(0);
    code++
  ) {
    marks.push(String.fromCharCode(code))
  }
  return marks
}

function isFairyEnergy(card: Card): boolean {
  return card.supertype === 'Energy' && card.name.startsWith('Fairy Energy')
}

export function isStandardLegal(card: Card): boolean {
  // Fairy Energy is retired — no longer legal in Standard regardless of the
  // Basic Energy exemption below.
  if (isFairyEnergy(card)) return false
  // Basic Energy (no rules text beyond the symbol) is exempt from rotation —
  // any print, even a vintage one, is tournament legal. Special Energy has
  // rules text and rotates normally, so it still needs a current regulation mark.
  if (isBasicEnergy(card)) return true
  return !!card.regulationMark && card.regulationMark >= CURRENT_STANDARD_MIN_REGULATION_MARK
}
