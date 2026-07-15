import type { Card, CardSearchResponse } from '../types/card'

const BASE_URL = 'https://api.pokemontcg.io/v2'

export interface SearchCardsOptions {
  name?: string
  page?: number
  pageSize?: number
  signal?: AbortSignal
}

export async function searchCards({
  name,
  page = 1,
  pageSize = 32,
  signal,
}: SearchCardsOptions): Promise<CardSearchResponse> {
  const params = new URLSearchParams()
  if (name && name.trim()) {
    params.set('q', `name:${name.trim()}*`)
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
