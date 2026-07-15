import { useEffect, useRef, useState } from 'react'
import { searchCards } from '../api/pokemonTcg'
import type { Card } from '../types/card'

export interface UseCardSearchResult {
  results: Card[]
  loading: boolean
  error: string | null
}

const DEBOUNCE_MS = 400

export function useCardSearch(query: string): UseCardSearchResult {
  const [results, setResults] = useState<Card[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setError(null)
      setLoading(false)
      return
    }

    const timeout = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setError(null)

      searchCards({ name: query, signal: controller.signal })
        .then((response) => {
          setResults(response.data)
          setLoading(false)
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') return
          setError(err instanceof Error ? err.message : 'Failed to search cards.')
          setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => () => abortRef.current?.abort(), [])

  return { results, loading, error }
}
