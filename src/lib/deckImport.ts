import { findByExactName, findExactPrint } from '../api/pokemonTcg'
import { dedupeByFunctionalText } from './cards'
import { mapWithConcurrency } from './concurrency'
import type { ParsedDeckLine } from './deckList'
import type { DeckCard } from '../types/card'

export interface ImportIssue {
  raw: string
  reason: string
}

export interface ImportResult {
  cards: DeckCard[]
  issues: ImportIssue[]
}

export interface ResolveDeckListOptions {
  concurrency?: number
  onProgress?: (completed: number, total: number) => void
  signal?: AbortSignal
}

const DEFAULT_CONCURRENCY = 5

/**
 * Resolves parsed deck-list lines to real cards, looking multiple lines up
 * in parallel (bounded by `concurrency` so the free API isn't hammered).
 * Tries the exact print first (name + set code + number); if that print
 * isn't in the API's data, falls back to an exact name match, but only
 * auto-accepts it when every match plays identically (see
 * dedupeByFunctionalText) — otherwise it's ambiguous (e.g. "Darkness Energy"
 * has both Basic and Special versions) and gets reported instead of guessed at.
 */
export async function resolveDeckList(
  lines: ParsedDeckLine[],
  { concurrency = DEFAULT_CONCURRENCY, onProgress, signal }: ResolveDeckListOptions = {},
): Promise<ImportResult> {
  const resolvedCards: (DeckCard | null)[] = new Array(lines.length).fill(null)
  const lineIssues: (ImportIssue | null)[] = new Array(lines.length).fill(null)
  let completed = 0

  await mapWithConcurrency(lines, concurrency, async (line, index) => {
    try {
      const exact = await findExactPrint(
        { name: line.name, ptcgoCode: line.ptcgoCode, number: line.number },
        signal,
      )
      if (exact.length > 0) {
        resolvedCards[index] = { card: exact[0], count: line.count }
        return
      }

      const fallbackMatches = dedupeByFunctionalText(await findByExactName(line.name, signal))
      if (fallbackMatches.length === 1) {
        resolvedCards[index] = { card: fallbackMatches[0], count: line.count }
        return
      }

      lineIssues[index] = {
        raw: line.raw,
        reason:
          fallbackMatches.length === 0
            ? 'No matching card found.'
            : `"${line.name}" matched ${fallbackMatches.length} different cards — add it manually from search.`,
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err
      lineIssues[index] = { raw: line.raw, reason: err instanceof Error ? err.message : 'Lookup failed.' }
    } finally {
      completed += 1
      onProgress?.(completed, lines.length)
    }
  })

  return {
    cards: resolvedCards.filter((card): card is DeckCard => card !== null),
    issues: lineIssues.filter((issue): issue is ImportIssue => issue !== null),
  }
}
