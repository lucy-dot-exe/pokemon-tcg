import { BASIC_ENERGY_NAMES } from '../data/basicEnergies'
import { standardRegulationMarks } from '../lib/format'
import type { Card, CardSearchResponse, Format, Supertype } from '../types/card'

const BASE_URL = 'https://api.pokemontcg.io/v2'

export interface SearchCardsOptions {
  name?: string
  format?: Format
  supertype?: Supertype
  page?: number
  pageSize?: number
  signal?: AbortSignal
}

export async function searchCards({
  name,
  format,
  supertype,
  page = 1,
  pageSize = 100,
  signal,
}: SearchCardsOptions): Promise<CardSearchResponse> {
  const queryParts: string[] = []
  if (name && name.trim()) {
    queryParts.push(`name:${name.trim()}*`)
  }
  if (supertype) {
    queryParts.push(`supertype:${supertype}`)
  }
  // The API's own legalities.standard flag lags behind real rotations, so
  // "standard" is filtered directly by regulationMark instead (this API
  // doesn't support a >= comparison, so it's an explicit OR of every mark
  // from the current cutoff onward — see lib/format.ts). Expanded/unlimited
  // aren't affected by rotation the same way, so those still use the API's
  // legalities field directly.
  if (format === 'standard') {
    const marksClause = standardRegulationMarks()
      .map((mark) => `regulationMark:${mark}`)
      .join(' OR ')
    queryParts.push(`(${marksClause})`)
  } else if (format === 'expanded' || format === 'unlimited') {
    queryParts.push(`legalities.${format}:legal`)
  }
  // Basic Energy never changes and has no reason to be searched for — it's
  // shown from the CANONICAL_BASIC_ENERGIES constant instead (see
  // lib/cards.ts and data/basicEnergies.ts), so exclude every name it might
  // appear under (this API doesn't support grouped/compound negation, so
  // each name is excluded individually).
  for (const basicEnergyName of BASIC_ENERGY_NAMES) {
    queryParts.push(`-name:"${basicEnergyName}"`)
  }

  const params = new URLSearchParams()
  if (queryParts.length > 0) {
    params.set('q', queryParts.join(' '))
  }
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  params.set('orderBy', 'name')

  const response = await fetch(`${BASE_URL}/cards?${params.toString()}`, { signal })
  if (!response.ok) {
    throw new Error(`Pokemon TCG API request failed: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<CardSearchResponse>
}

export async function getCardById(id: string, signal?: AbortSignal): Promise<Card> {
  const response = await fetch(`${BASE_URL}/cards/${id}`, { signal })
  if (!response.ok) {
    throw new Error(`Pokemon TCG API request failed: ${response.status} ${response.statusText}`)
  }
  const { data } = (await response.json()) as { data: Card }
  return data
}

async function queryCards(q: string, signal?: AbortSignal): Promise<Card[]> {
  const params = new URLSearchParams()
  params.set('q', q)
  params.set('pageSize', '250')
  const response = await fetch(`${BASE_URL}/cards?${params.toString()}`, { signal })
  if (!response.ok) {
    throw new Error(`Pokemon TCG API request failed: ${response.status} ${response.statusText}`)
  }
  const data = (await response.json()) as CardSearchResponse
  return data.data
}

export interface ExactPrintQuery {
  name: string
  ptcgoCode: string
  number: string
}

/** Resolves the exact print referenced by a deck-list line (name + set code + number). */
export function findExactPrint(query: ExactPrintQuery, signal?: AbortSignal): Promise<Card[]> {
  return queryCards(`name:"${query.name}" set.ptcgoCode:${query.ptcgoCode} number:${query.number}`, signal)
}

/** Falls back to an exact (non-wildcard) name match when the print above can't be found. */
export function findByExactName(name: string, signal?: AbortSignal): Promise<Card[]> {
  return queryCards(`name:"${name}"`, signal)
}
