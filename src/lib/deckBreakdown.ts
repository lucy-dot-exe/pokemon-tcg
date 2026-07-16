import { computeResistanceCounts, computeWeaknessCounts } from './weakness'
import type { DeckCard } from '../types/card'

export interface PokemonBreakdown {
  total: number
  basic: number
  stage1: number
  stage2: number
  other: number
  ex: number
  mega: number
}

export interface TrainerBreakdown {
  total: number
  supporter: number
  item: number
  stadium: number
  tool: number
}

export interface EnergyBreakdown {
  total: number
  basic: number
  special: number
}

export interface WeaknessBreakdownEntry {
  type: string
  count: number
}

export interface ResistanceBreakdownEntry {
  type: string
  count: number
}

export interface DeckBreakdown {
  total: number
  pokemon: PokemonBreakdown
  trainer: TrainerBreakdown
  energy: EnergyBreakdown
  weaknesses: WeaknessBreakdownEntry[]
  noWeaknessCount: number
  resistances: ResistanceBreakdownEntry[]
  noResistanceCount: number
}

export function computeDeckBreakdown(cards: DeckCard[]): DeckBreakdown {
  const breakdown: DeckBreakdown = {
    total: 0,
    pokemon: { total: 0, basic: 0, stage1: 0, stage2: 0, other: 0, ex: 0, mega: 0 },
    trainer: { total: 0, supporter: 0, item: 0, stadium: 0, tool: 0 },
    energy: { total: 0, basic: 0, special: 0 },
    weaknesses: [],
    noWeaknessCount: 0,
    resistances: [],
    noResistanceCount: 0,
  }

  for (const { card, count } of cards) {
    breakdown.total += count
    const subtypes = card.subtypes ?? []

    if (card.supertype === 'Pokémon') {
      const p = breakdown.pokemon
      p.total += count
      if (subtypes.includes('Basic')) p.basic += count
      else if (subtypes.includes('Stage 1')) p.stage1 += count
      else if (subtypes.includes('Stage 2')) p.stage2 += count
      else p.other += count
      if (subtypes.includes('ex')) p.ex += count
      if (subtypes.includes('MEGA')) p.mega += count
    } else if (card.supertype === 'Trainer') {
      const t = breakdown.trainer
      t.total += count
      if (subtypes.includes('Supporter')) t.supporter += count
      else if (subtypes.includes('Item')) t.item += count
      else if (subtypes.includes('Stadium')) t.stadium += count
      else if (subtypes.includes('Pokémon Tool')) t.tool += count
    } else if (card.supertype === 'Energy') {
      const e = breakdown.energy
      e.total += count
      if (subtypes.includes('Basic')) e.basic += count
      else e.special += count
    }
  }

  const weaknessCounts = computeWeaknessCounts(cards)
  breakdown.weaknesses = Array.from(weaknessCounts.countByType.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
  breakdown.noWeaknessCount = weaknessCounts.noWeaknessCount

  const resistanceCounts = computeResistanceCounts(cards)
  breakdown.resistances = Array.from(resistanceCounts.countByType.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
  breakdown.noResistanceCount = resistanceCounts.noResistanceCount

  return breakdown
}
