import { BALANCE } from './balance'
import type { PlayerStats } from './types'

export type UpgradeId = 'range' | 'angle' | 'battery' | 'speed' | 'shield'
export type UpgradeLevels = Record<UpgradeId, number>

export const UPGRADE_IDS: UpgradeId[] = ['range', 'angle', 'battery', 'speed', 'shield']

export const UPGRADES: Record<UpgradeId, { baseCost: number; maxLevel: number; perLevel: number }> = {
  range: { baseCost: 20, maxLevel: 5, perLevel: 0.6 },
  angle: { baseCost: 20, maxLevel: 5, perLevel: Math.PI / 36 },
  battery: { baseCost: 25, maxLevel: 5, perLevel: 20 },
  speed: { baseCost: 30, maxLevel: 4, perLevel: 0.3 },
  shield: { baseCost: 60, maxLevel: 3, perLevel: 1 },
}

export function upgradeCost(id: UpgradeId, level: number): number {
  return Math.round(UPGRADES[id].baseCost * Math.pow(1.6, level))
}

export function computeStats(levels: UpgradeLevels): PlayerStats {
  const u = (id: UpgradeId) => UPGRADES[id].perLevel * levels[id]
  return {
    speed: BALANCE.player.baseSpeed + u('speed'),
    lightRange: BALANCE.light.baseRange + u('range'),
    lightHalfAngle: BALANCE.light.baseHalfAngle + u('angle'),
    maxBattery: BALANCE.player.baseMaxBattery + u('battery'),
    shields: u('shield'),
  }
}

export function tryBuy(levels: UpgradeLevels, coins: number, id: UpgradeId): { levels: UpgradeLevels; coins: number } | null {
  const lv = levels[id]
  if (lv >= UPGRADES[id].maxLevel) return null
  const cost = upgradeCost(id, lv)
  if (coins < cost) return null
  return { levels: { ...levels, [id]: lv + 1 }, coins: coins - cost }
}
