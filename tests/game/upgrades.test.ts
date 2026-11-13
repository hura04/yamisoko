import { describe, it, expect } from 'vitest'
import { upgradeCost, computeStats, tryBuy, UPGRADE_IDS, type UpgradeLevels } from '../../src/game/upgrades'

const zero = (): UpgradeLevels => ({ range: 0, angle: 0, battery: 0, speed: 0, shield: 0 })

describe('upgrades', () => {
  it('ids order', () => {
    expect(UPGRADE_IDS).toEqual(['range', 'angle', 'battery', 'speed', 'shield'])
  })
  it('costs', () => {
    expect(upgradeCost('range', 0)).toBe(20)
    expect(upgradeCost('range', 1)).toBe(32)
    expect(upgradeCost('range', 2)).toBe(51)
  })
  it('base stats', () => {
    const s = computeStats(zero())
    expect(s.speed).toBe(3)
    expect(s.lightRange).toBe(4)
    expect(s.lightHalfAngle).toBeCloseTo(Math.PI / 6)
    expect(s.maxBattery).toBe(100)
    expect(s.shields).toBe(0)
  })
  it('stats grow', () => {
    const s = computeStats({ ...zero(), range: 2, shield: 1 })
    expect(s.lightRange).toBeCloseTo(5.2)
    expect(s.shields).toBe(1)
  })
  it('buy succeeds', () => {
    const lv = zero()
    const r = tryBuy(lv, 25, 'range')
    expect(r).toEqual({ levels: { ...zero(), range: 1 }, coins: 5 })
    expect(lv.range).toBe(0)
  })
  it('buy fails without coins', () => {
    expect(tryBuy(zero(), 19, 'range')).toBeNull()
  })
  it('buy fails at max', () => {
    expect(tryBuy({ ...zero(), shield: 3 }, 9999, 'shield')).toBeNull()
  })
})
