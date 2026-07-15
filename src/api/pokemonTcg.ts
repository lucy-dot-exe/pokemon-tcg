import type { Card, CardSearchResponse, Format } from '../types/card'

const BASE_URL = 'https://api.pokemontcg.io/v2'

export interface SearchCardsOptions {
  name?: string
  format?: Format
  page?: number
  pageSize?: number
  signal?: AbortSignal
}

export async function searchCards({
  name,
  format,
  page = 1,
  pageSize = 32,
  signal,
}: SearchCardsOptions): Promise<CardSearchResponse> {
  const queryParts: string[] = []
  if (name && name.trim()) {
    queryParts.push(`name:${name.trim()}*`)
  }
  // The API's own legalities.standard flag lags behind real rotations, so
  // "standard" is filtered client-side from regulationMark instead (see
  // lib/format.ts). Expanded/unlimited aren't affected by rotation the same
  // way, so those still use the API's field directly.
  if (format === 'expanded' || format === 'unlimited') {
    queryParts.push(`legalities.${format}:legal`)
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
