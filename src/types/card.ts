export type Supertype = 'Pokémon' | 'Trainer' | 'Energy'

export interface CardImages {
  small: string
  large: string
}

export interface CardSet {
  id: string
  name: string
  series: string
  releaseDate: string
  ptcgoCode?: string
}

export type Format = 'standard' | 'expanded' | 'unlimited'

export type Legalities = Partial<Record<Format, 'Legal' | 'Banned'>>

export interface Attack {
  name: string
  cost: string[]
  convertedEnergyCost: number
  damage: string
  text: string
}

export interface Ability {
  name: string
  text: string
  type: string
}

export interface WeaknessResistance {
  type: string
  value: string
}

export interface Card {
  id: string
  name: string
  supertype: Supertype
  subtypes?: string[]
  hp?: string
  types?: string[]
  rules?: string[]
  attacks?: Attack[]
  abilities?: Ability[]
  weaknesses?: WeaknessResistance[]
  resistances?: WeaknessResistance[]
  retreatCost?: string[]
  set: CardSet
  number: string
  rarity?: string
  images: CardImages
  legalities: Legalities
  regulationMark?: string
}

export interface CardSearchResponse {
  data: Card[]
  page: number
  pageSize: number
  count: number
  totalCount: number
}

export interface DeckCard {
  card: Card
  count: number
}

export interface Deck {
  id: string
  name: string
  cards: DeckCard[]
  createdAt: string
  updatedAt: string
}
