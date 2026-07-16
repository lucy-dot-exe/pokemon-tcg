import { useCallback, useEffect, useState } from 'react'
import { describeCondition, type CardCondition, type CardInteractionRule } from '../lib/cardInteractions'

const STORAGE_KEY = 'pokemon-tcg-deck-builder:custom-interaction-rules'

export interface StoredCardInteractionRule {
  id: string
  triggerCardName: string
  description: string
  condition: CardCondition
}

function loadRules(): StoredCardInteractionRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as StoredCardInteractionRule[]
  } catch {
    return []
  }
}

export interface NewCardInteractionRule {
  triggerCardName: string
  condition: CardCondition
  description?: string
}

export interface UseCardInteractionRulesResult {
  rules: StoredCardInteractionRule[]
  runtimeRules: CardInteractionRule[]
  addRule: (rule: NewCardInteractionRule) => void
  removeRule: (id: string) => void
}

export function useCardInteractionRules(): UseCardInteractionRulesResult {
  const [rules, setRules] = useState<StoredCardInteractionRule[]>(loadRules)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
  }, [rules])

  const addRule = useCallback(({ triggerCardName, condition, description }: NewCardInteractionRule) => {
    setRules((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        triggerCardName,
        condition,
        description: description?.trim() || `Interacts with ${describeCondition(condition)}.`,
      },
    ])
  }, [])

  const removeRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== id))
  }, [])

  const runtimeRules: CardInteractionRule[] = rules.map((rule) => ({
    id: rule.id,
    triggerCardName: rule.triggerCardName,
    description: rule.description,
    condition: rule.condition,
  }))

  return { rules, runtimeRules, addRule, removeRule }
}
