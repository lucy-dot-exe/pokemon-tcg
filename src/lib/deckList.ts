import type { DeckCard } from '../types/card'
import { fixMojibake } from './textEncoding'

export interface ParsedDeckLine {
  raw: string
  count: number
  name: string
  ptcgoCode: string
  number: string
}

export interface ParseDeckListResult {
  lines: ParsedDeckLine[]
  unparsedLines: string[]
}

const SECTION_HEADER = /^(Pokémon|Trainer|Energy)\s*:\s*\d+$/i
const CARD_LINE = /^(\d+)\s+(.+)\s+(\S+)\s+(\S+)$/

/**
 * Parses the deck-list exchange format shared between deck-building tools:
 * a "Supertype: count" header per section, then one "<count> <name> <set
 * code> <number>" line per card.
 */
export function parseDeckList(text: string): ParseDeckListResult {
  const lines: ParsedDeckLine[] = []
  const unparsedLines: string[] = []

  for (const rawLine of fixMojibake(text).split('\n')) {
    const line = rawLine.trim()
    if (!line || SECTION_HEADER.test(line)) continue

    const match = CARD_LINE.exec(line)
    if (!match) {
      unparsedLines.push(line)
      continue
    }

    const [, countStr, name, ptcgoCode, number] = match
    lines.push({ raw: line, count: Number(countStr), name: name.trim(), ptcgoCode, number })
  }

  return { lines, unparsedLines }
}

const SECTION_ORDER = ['Pokémon', 'Trainer', 'Energy'] as const

/** Formats a deck back into the shared exchange format for export. */
export function formatDeckList(cards: DeckCard[]): string {
  const sections = SECTION_ORDER.map((supertype) => {
    const group = cards.filter((dc) => dc.card.supertype === supertype)
    const groupCount = group.reduce((sum, dc) => sum + dc.count, 0)
    if (group.length === 0) return null

    const cardLines = group.map(
      (dc) => `${dc.count} ${dc.card.name} ${dc.card.set.ptcgoCode ?? dc.card.set.id} ${dc.card.number}`,
    )
    return [`${supertype}: ${groupCount}`, ...cardLines].join('\n')
  }).filter((section): section is string => section !== null)

  return sections.join('\n\n')
}
