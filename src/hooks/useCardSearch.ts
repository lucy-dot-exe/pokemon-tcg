import { useCallback, useEffect, useRef, useState } from 'react'
import { searchCards } from '../api/pokemonTcg'
import { dedupeByFunctionalText, matchingBasicEnergies } from '../lib/cards'
import type { Card, Format, Supertype } from '../types/card'

export interface UseCardSearchResult {
  results: Card[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
}

const DEBOUNCE_MS = 400
const SEARCH_PAGE_SIZE = 100
const PRELOAD_PAGE_SIZE = 20
// How many cards we want to actually show (post-filter/dedupe) before
// stopping — a filter like Standard can knock out most of a raw page, so a
// single fetch often isn't enough on its own.
const MIN_RESULT_TARGET = 20
// Safety valve: stop looping even short of the target once we've fetched
// this many pages, so a very restrictive filter can't trigger a runaway
// fetch loop against the whole card database.
const MAX_PAGES_PER_FETCH = 15

interface FetchLoopParams {
  query: string
  format: Format | undefined
  supertype: Supertype | undefined
  pageSize: number
  startPage: number
  initialRawCards: Card[]
  initialFetchedCount: number
  targetCount: number
  signal: AbortSignal
}

interface FetchLoopResult {
  rawCards: Card[]
  results: Card[]
  page: number
  fetchedCount: number
  totalCount: number
  hasMore: boolean
}

/**
 * Fetches pages one at a time until the deduped result count hits
 * `targetCount`, the API's list is exhausted, or the page cap is hit.
 */
async function fetchPagesUntilTarget({
  query,
  format,
  supertype,
  pageSize,
  startPage,
  initialRawCards,
  initialFetchedCount,
  targetCount,
  signal,
}: FetchLoopParams): Promise<FetchLoopResult> {
  let rawCards = initialRawCards
  let page = startPage
  let fetchedCount = initialFetchedCount
  let totalCount = initialFetchedCount
  let pagesFetched = 0

  while (true) {
    const response = await searchCards({ name: query, format, supertype, page, pageSize, signal })

    rawCards = [...rawCards, ...response.data]
    fetchedCount += response.data.length
    totalCount = response.totalCount
    pagesFetched += 1

    const results = dedupeByFunctionalText(rawCards)
    const hasMore = fetchedCount < totalCount

    if (
      results.length >= targetCount ||
      !hasMore ||
      pagesFetched >= MAX_PAGES_PER_FETCH ||
      response.data.length === 0
    ) {
      return { rawCards, results, page, fetchedCount, totalCount, hasMore }
    }

    page += 1
  }
}

interface BrowseCacheEntry {
  rawCards: Card[]
  results: Card[]
  page: number
  pageSize: number
  fetchedCount: number
  totalCount: number
  hasMore: boolean
}

/**
 * Caches the "browse this type" view (empty query, just a supertype/format
 * pick) so switching between type tabs doesn't re-fetch every time. Keyed
 * on supertype+format only, since that's all that varies with no query text.
 * Lives for the page session — no TTL, since card data barely changes.
 */
const browseCache = new Map<string, BrowseCacheEntry>()

function browseCacheKey(format: Format | undefined, supertype: Supertype | undefined): string {
  return `${supertype ?? ''}|${format ?? ''}`
}

export function useCardSearch(query: string, format?: Format, supertype?: Supertype): UseCardSearchResult {
  const [results, setResults] = useState<Card[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const rawCardsRef = useRef<Card[]>([])
  const pageRef = useRef(1)
  // The API's pagination is page*pageSize based, so once a fetch session
  // starts with a given page size, every subsequent page for it must reuse
  // the same size — mixing sizes mid-session would skip or duplicate items.
  const pageSizeRef = useRef(SEARCH_PAGE_SIZE)
  const fetchedCountRef = useRef(0)
  const totalCountRef = useRef(0)

  const hasMoreRef = useRef(false)
  const loadingRef = useRef(false)
  const loadingMoreRef = useRef(false)

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])
  useEffect(() => {
    loadingRef.current = loading
  }, [loading])
  useEffect(() => {
    loadingMoreRef.current = loadingMore
  }, [loadingMore])

  useEffect(() => {
    rawCardsRef.current = []
    pageRef.current = 1
    fetchedCountRef.current = 0
    totalCountRef.current = 0
    setResults([])
    setHasMore(false)
    setError(null)
    // A fresh search supersedes any in-flight "load more" for the previous
    // query/filter — its abort() only fires once the new fetch actually
    // starts, so without this its catch handler's early AbortError return
    // would leave "Loading more…" stuck on screen indefinitely.
    setLoadingMore(false)

    const isBrowsing = !query.trim()
    if (isBrowsing) {
      const cached = browseCache.get(browseCacheKey(format, supertype))
      if (cached) {
        rawCardsRef.current = cached.rawCards
        pageRef.current = cached.page
        pageSizeRef.current = cached.pageSize
        fetchedCountRef.current = cached.fetchedCount
        totalCountRef.current = cached.totalCount
        setResults(cached.results)
        setHasMore(cached.hasMore)
        setLoading(false)
        return
      }
    }

    const pageSize = isBrowsing ? PRELOAD_PAGE_SIZE : SEARCH_PAGE_SIZE
    pageSizeRef.current = pageSize

    // No debounce delay when there's no typed query yet (e.g. just switched
    // type/format) — only debounce actual keystrokes.
    const delay = isBrowsing ? 0 : DEBOUNCE_MS

    const timeout = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)

      fetchPagesUntilTarget({
        query,
        format,
        supertype,
        pageSize,
        startPage: 1,
        initialRawCards: matchingBasicEnergies(query, supertype),
        initialFetchedCount: 0,
        targetCount: MIN_RESULT_TARGET,
        signal: controller.signal,
      })
        .then((loopResult) => {
          if (controller.signal.aborted) return

          rawCardsRef.current = loopResult.rawCards
          pageRef.current = loopResult.page
          fetchedCountRef.current = loopResult.fetchedCount
          totalCountRef.current = loopResult.totalCount

          setResults(loopResult.results)
          setHasMore(loopResult.hasMore)
          setLoading(false)

          if (isBrowsing) {
            browseCache.set(browseCacheKey(format, supertype), {
              rawCards: loopResult.rawCards,
              results: loopResult.results,
              page: loopResult.page,
              pageSize,
              fetchedCount: loopResult.fetchedCount,
              totalCount: loopResult.totalCount,
              hasMore: loopResult.hasMore,
            })
          }
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') return
          setError(err instanceof Error ? err.message : 'Failed to search cards.')
          setLoading(false)
        })
    }, delay)

    return () => clearTimeout(timeout)
  }, [query, format, supertype])

  useEffect(() => () => abortRef.current?.abort(), [])

  const loadMore = useCallback(() => {
    if (loadingRef.current || loadingMoreRef.current || !hasMoreRef.current) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const pageSize = pageSizeRef.current
    const isBrowsing = !query.trim()
    const currentCount = dedupeByFunctionalText(rawCardsRef.current).length

    setLoadingMore(true)
    fetchPagesUntilTarget({
      query,
      format,
      supertype,
      pageSize,
      startPage: pageRef.current + 1,
      initialRawCards: rawCardsRef.current,
      initialFetchedCount: fetchedCountRef.current,
      targetCount: currentCount + MIN_RESULT_TARGET,
      signal: controller.signal,
    })
      .then((loopResult) => {
        if (controller.signal.aborted) return

        rawCardsRef.current = loopResult.rawCards
        pageRef.current = loopResult.page
        fetchedCountRef.current = loopResult.fetchedCount
        totalCountRef.current = loopResult.totalCount

        setResults(loopResult.results)
        setHasMore(loopResult.hasMore)
        setLoadingMore(false)

        if (isBrowsing) {
          browseCache.set(browseCacheKey(format, supertype), {
            rawCards: loopResult.rawCards,
            results: loopResult.results,
            page: loopResult.page,
            pageSize,
            fetchedCount: loopResult.fetchedCount,
            totalCount: loopResult.totalCount,
            hasMore: loopResult.hasMore,
          })
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Failed to load more cards.')
        setLoadingMore(false)
      })
  }, [query, format, supertype])

  return { results, loading, loadingMore, error, hasMore, loadMore }
}
