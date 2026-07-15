import type { Card } from '../types/card'

/**
 * The 8 basic energy types, hardcoded as the canonical Scarlet & Violet
 * Energies print (numbers 1-8, real data captured from the API). Basic
 * Energy never changes — no new rules text, no rotation — so there's no
 * need to fetch or search for it; the API is asked to exclude it entirely
 * (see api/pokemonTcg.ts) and these constants are shown instead whenever a
 * search matches one.
 */
const SVE_SET = {
  id: 'sve',
  name: 'Scarlet & Violet Energies',
  series: 'Scarlet & Violet',
  releaseDate: '2023/03/31',
  ptcgoCode: 'SVE',
}

const SVE_LEGALITIES = {
  unlimited: 'Legal',
  standard: 'Legal',
  expanded: 'Legal',
} as const

function sveEnergy(number: number, element: string): Card {
  return {
    id: `sve-${number}`,
    name: `Basic ${element} Energy`,
    supertype: 'Energy',
    subtypes: ['Basic'],
    // The real API data for these prints is inconsistent about this field
    // (some entries omit it) — set it explicitly here since it's needed to
    // know what type of energy each card actually provides.
    types: [element],
    set: SVE_SET,
    number: String(number),
    rarity: 'Common',
    images: {
      small: `https://images.pokemontcg.io/sve/${number}.png`,
      large: `https://images.pokemontcg.io/sve/${number}_hires.png`,
    },
    legalities: SVE_LEGALITIES,
  }
}

export const CANONICAL_BASIC_ENERGIES: Card[] = [
  sveEnergy(1, 'Grass'),
  sveEnergy(2, 'Fire'),
  sveEnergy(3, 'Water'),
  sveEnergy(4, 'Lightning'),
  sveEnergy(5, 'Psychic'),
  sveEnergy(6, 'Fighting'),
  sveEnergy(7, 'Darkness'),
  sveEnergy(8, 'Metal'),
]

/** Every literal name a basic energy card might use across print eras (modern "Basic X Energy" and vintage "X Energy"). */
export const BASIC_ENERGY_NAMES: string[] = CANONICAL_BASIC_ENERGIES.flatMap((card) => [
  card.name,
  card.name.replace(/^Basic /, ''),
])
