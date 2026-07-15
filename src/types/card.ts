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
}

export interface Card {
  id: string
  name: string
  supertype: Supertype
  subtypes?: string[]
  hp?: string
  types?: string[]
  rules?: string[]
  set: CardSet
  number: string
  rarity?: string
  images: CardImages
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
