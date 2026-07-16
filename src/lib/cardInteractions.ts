import type { Card, DeckCard, Supertype } from '../types/card'

export type HpOperator = '<=' | '<' | '=' | '>=' | '>'

export interface CardCondition {
  supertype?: Supertype
  subtype?: string
  hp?: { operator: HpOperator; value: number }
  /** Matches cards whose name starts with this string (e.g. "N's" for N's Pokémon). */
  namePrefix?: string
  /** Excludes Pokémon with a Rule Box (ex, V, VMAX, VSTAR, GX, etc.). */
  noRuleBox?: boolean
}

/** Subtypes that put a Rule Box on a Pokémon card (see e.g. Poké Pad's own reminder text). */
const RULE_BOX_SUBTYPES = ['ex', 'EX', 'GX', 'V', 'VMAX', 'VSTAR', 'BREAK', 'Prime', 'LEGEND', 'Star', 'Radiant', 'Tag Team']

export interface CardInteractionRule {
  id: string
  triggerCardName: string
  description: string
  /** The query a target card must satisfy — the same shape the custom-rule builder produces. */
  condition: CardCondition
}

function evaluateHp(cardHp: string | undefined, operator: HpOperator, value: number): boolean {
  if (cardHp === undefined) return false
  const hp = Number(cardHp)
  if (Number.isNaN(hp)) return false

  switch (operator) {
    case '<=':
      return hp <= value
    case '<':
      return hp < value
    case '=':
      return hp === value
    case '>=':
      return hp >= value
    case '>':
      return hp > value
  }
}

/** Turns a declarative condition (the shape a user picks in the UI, and the only shape that survives localStorage) into a predicate. */
export function evaluateCondition(card: Card, condition: CardCondition): boolean {
  if (condition.supertype && card.supertype !== condition.supertype) return false
  if (condition.subtype && !card.subtypes?.includes(condition.subtype)) return false
  if (condition.hp && !evaluateHp(card.hp, condition.hp.operator, condition.hp.value)) return false
  if (condition.namePrefix && !card.name.startsWith(condition.namePrefix)) return false
  if (condition.noRuleBox && card.subtypes?.some((subtype) => RULE_BOX_SUBTYPES.includes(subtype))) return false
  return true
}

function describeHp(operator: HpOperator, value: number): string {
  switch (operator) {
    case '<=':
      return `${value} HP or less`
    case '<':
      return `less than ${value} HP`
    case '=':
      return `exactly ${value} HP`
    case '>=':
      return `${value} HP or more`
    case '>':
      return `more than ${value} HP`
  }
}

/** Describes a condition in plain English for auto-generated rule descriptions. */
export function describeCondition(condition: CardCondition): string {
  const parts: string[] = []
  if (condition.subtype) parts.push(condition.subtype)
  if (condition.supertype) parts.push(condition.supertype)
  if (parts.length === 0) parts.push('cards')

  let description = parts.join(' ')
  if (condition.hp) {
    description += ` with ${describeHp(condition.hp.operator, condition.hp.value)}`
  }
  if (condition.namePrefix) {
    description += ` whose name starts with "${condition.namePrefix}"`
  }
  if (condition.noRuleBox) {
    description += ' with no Rule Box'
  }
  return description
}

/**
 * Built-in card-to-card interaction rules: for a trigger card present in the
 * deck, which other cards in the deck does it actually interact with right
 * now. Each one's condition is expressed in the same shape the custom-rule
 * builder produces, so every built-in rule doubles as an example of
 * something a user could recreate themselves. User-defined rules (see
 * useCardInteractionRules) are merged with these at the component level
 * before being passed to computeCardInteractions.
 */
export const CARD_INTERACTION_RULES: CardInteractionRule[] = [
  {
    id: 'buddy-buddy-poffin',
    triggerCardName: 'Buddy-Buddy Poffin',
    description: 'Search your deck for up to 2 Basic Pokémon with 70 HP or less and put them onto your Bench.',
    condition: { supertype: 'Pokémon', subtype: 'Basic', hp: { operator: '<=', value: 70 } },
  },
  {
    id: 'cyrano',
    triggerCardName: 'Cyrano',
    description: 'Search your deck for up to 3 Pokémon ex, reveal them, and put them into your hand.',
    condition: { supertype: 'Pokémon', subtype: 'ex' },
  },
  {
    id: 'meowth-ex',
    triggerCardName: 'Meowth ex',
    description: 'Last-Ditch Catch: Search your deck for a Supporter card, reveal it, and put it into your hand.',
    condition: { supertype: 'Trainer', subtype: 'Supporter' },
  },
  {
    id: 'ns-castle',
    triggerCardName: "N's Castle",
    description: "N's Pokémon in play (both yours and your opponent's) have no Retreat Cost.",
    condition: { supertype: 'Pokémon', namePrefix: "N's" },
  },
  {
    id: 'ns-zoroark-ex',
    triggerCardName: "N's Zoroark ex",
    description: "Night Joker: Choose 1 of your Benched N's Pokémon's attacks and use it as this attack.",
    condition: { supertype: 'Pokémon', namePrefix: "N's" },
  },
  {
    id: 'ns-pp-up',
    triggerCardName: "N's PP Up",
    description: "Attach a Basic Energy card from your discard pile to 1 of your Benched N's Pokémon.",
    condition: { supertype: 'Pokémon', namePrefix: "N's" },
  },
  {
    id: 'ultra-ball',
    triggerCardName: 'Ultra Ball',
    description:
      'You can use this card only if you discard 2 other cards from your hand. Search your deck for a Pokémon, reveal it, and put it into your hand.',
    condition: { supertype: 'Pokémon' },
  },
  {
    id: 'night-stretcher',
    triggerCardName: 'Night Stretcher',
    description: 'Put a Pokémon or a Basic Energy card from your discard pile into your hand.',
    condition: { supertype: 'Pokémon' },
  },
  {
    id: 'poke-pad',
    triggerCardName: 'Poké Pad',
    description: "Search your deck for a Pokémon that doesn't have a Rule Box, reveal it, and put it into your hand.",
    condition: { supertype: 'Pokémon', noRuleBox: true },
  },
  {
    id: 'secret-box',
    triggerCardName: 'Secret Box',
    description:
      'You can use this card only if you discard 3 other cards from your hand. Search your deck for an Item card, a Pokémon Tool card, a Supporter card, and a Stadium card, and put them into your hand.',
    condition: { supertype: 'Trainer' },
  },
  {
    id: 'pecharunt-ex',
    triggerCardName: 'Pecharunt ex',
    description:
      "Subjugating Chains poisons your new Active Pokémon when switching in — Binding Mochi turns that into 40 more damage on that Pokémon's attacks.",
    condition: { namePrefix: 'Binding Mochi' },
  },
]

export interface MatchingCard {
  name: string
  count: number
}

export interface CardInteractionResult {
  id: string
  triggerCardName: string
  description: string
  matchingCards: MatchingCard[]
  totalMatchingCount: number
}

/** Only evaluates rules whose trigger card is actually in the deck, so unrelated rules add nothing to the result. */
export function computeCardInteractions(cards: DeckCard[], rules: CardInteractionRule[]): CardInteractionResult[] {
  const results: CardInteractionResult[] = []

  for (const rule of rules) {
    const triggerPresent = cards.some((dc) => dc.card.name === rule.triggerCardName)
    if (!triggerPresent) continue

    const countByName = new Map<string, number>()
    for (const { card, count } of cards) {
      if (card.name === rule.triggerCardName) continue
      if (!evaluateCondition(card, rule.condition)) continue
      countByName.set(card.name, (countByName.get(card.name) ?? 0) + count)
    }

    const matchingCards = Array.from(countByName.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
    const totalMatchingCount = matchingCards.reduce((sum, match) => sum + match.count, 0)

    results.push({
      id: rule.id,
      triggerCardName: rule.triggerCardName,
      description: rule.description,
      matchingCards,
      totalMatchingCount,
    })
  }

  return results
}

/**
 * Evolution is a default, always-on interaction rather than a fixed named
 * rule — unlike "Buddy-Buddy Poffin", there's no single trigger card name:
 * whichever Basic Pokémon happen to be in the deck are each their own
 * trigger. For every Basic with a Stage 1 and/or Stage 2 already in the
 * deck, this shows that evolution line (both stages flattened into one set
 * of targets, since the graph is a single hub with spokes, not a chain).
 */
export function computeEvolutionInteractions(cards: DeckCard[]): CardInteractionResult[] {
  const results: CardInteractionResult[] = []

  const cardByName = new Map<string, Card>()
  for (const { card } of cards) {
    if (!cardByName.has(card.name)) cardByName.set(card.name, card)
  }

  const basicNames = new Set(
    cards
      .filter((dc) => dc.card.supertype === 'Pokémon' && dc.card.subtypes?.includes('Basic'))
      .map((dc) => dc.card.name),
  )

  for (const basicName of basicNames) {
    const countByName = new Map<string, number>()

    for (const { card, count } of cards) {
      if (card.supertype !== 'Pokémon' || !card.evolvesFrom) continue

      if (card.subtypes?.includes('Stage 1') && card.evolvesFrom === basicName) {
        countByName.set(card.name, (countByName.get(card.name) ?? 0) + count)
      } else if (card.subtypes?.includes('Stage 2')) {
        const stage1 = cardByName.get(card.evolvesFrom)
        if (stage1?.evolvesFrom === basicName) {
          countByName.set(card.name, (countByName.get(card.name) ?? 0) + count)
        }
      }
    }

    if (countByName.size === 0) continue

    const matchingCards = Array.from(countByName.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
    const totalMatchingCount = matchingCards.reduce((sum, match) => sum + match.count, 0)

    results.push({
      id: `evolution-${basicName}`,
      triggerCardName: basicName,
      description: `${basicName}'s evolution line already in your deck.`,
      matchingCards,
      totalMatchingCount,
    })
  }

  return results
}
