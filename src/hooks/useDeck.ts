import { useCallback, useEffect, useState } from 'react'
import { isBasicEnergy } from '../lib/cards'
import type { Card, DeckCard } from '../types/card'

const STORAGE_KEY = 'pokemon-tcg-deck-builder:deck'
const MAX_COPIES = 4
const DECK_SIZE = 60

function loadDeck(): DeckCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as DeckCard[]
  } catch {
    return []
  }
}

export interface UseDeckResult {
  cards: DeckCard[]
  totalCount: number
  isFull: boolean
  addCard: (card: Card) => { ok: boolean; reason?: string }
  removeCard: (cardId: string) => void
  setCount: (cardId: string, count: number) => void
  clearDeck: () => void
  importDeck: (cards: DeckCard[]) => void
  copiesOf: (cardId: string) => number
  maxCopies: number
  deckSize: number
}

export function useDeck(): UseDeckResult {
  const [cards, setCards] = useState<DeckCard[]>(loadDeck)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
  }, [cards])

  const totalCount = cards.reduce((sum, dc) => sum + dc.count, 0)
  const isFull = totalCount >= DECK_SIZE

  const copiesOf = useCallback(
    (cardId: string) => cards.find((dc) => dc.card.id === cardId)?.count ?? 0,
    [cards],
  )

  const addCard = useCallback(
    (card: Card): { ok: boolean; reason?: string } => {
      let result: { ok: boolean; reason?: string } = { ok: true }

      setCards((prev) => {
        const existing = prev.find((dc) => dc.card.id === card.id)
        const unlimited = isBasicEnergy(card)

        if (existing) {
          if (!unlimited && existing.count >= MAX_COPIES) {
            result = { ok: false, reason: `Max ${MAX_COPIES} copies of ${card.name} allowed.` }
            return prev
          }
          return prev.map((dc) =>
            dc.card.id === card.id ? { ...dc, count: dc.count + 1 } : dc,
          )
        }

        return [...prev, { card, count: 1 }]
      })

      return result
    },
    [],
  )

  const removeCard = useCallback((cardId: string) => {
    setCards((prev) => {
      const existing = prev.find((dc) => dc.card.id === cardId)
      if (!existing) return prev
      if (existing.count <= 1) {
        return prev.filter((dc) => dc.card.id !== cardId)
      }
      return prev.map((dc) =>
        dc.card.id === cardId ? { ...dc, count: dc.count - 1 } : dc,
      )
    })
  }, [])

  const setCount = useCallback((cardId: string, count: number) => {
    setCards((prev) => {
      if (count <= 0) return prev.filter((dc) => dc.card.id !== cardId)
      return prev.map((dc) => (dc.card.id === cardId ? { ...dc, count } : dc))
    })
  }, [])

  const clearDeck = useCallback(() => setCards([]), [])

  const importDeck = useCallback((imported: DeckCard[]) => setCards(imported), [])

  return {
    cards,
    totalCount,
    isFull,
    addCard,
    removeCard,
    setCount,
    clearDeck,
    importDeck,
    copiesOf,
    maxCopies: MAX_COPIES,
    deckSize: DECK_SIZE,
  }
}
