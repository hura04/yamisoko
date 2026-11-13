import { describe, it, expect } from 'vitest'
import { startRun, stepRun, isOver, finishRun, applyResult } from '../../src/game/run'
import { defaultSave } from '../../src/save/storage'
import { BALANCE } from '../../src/game/balance'

const lv = { range: 1, angle: 0, battery: 2, speed: 0, shield: 1 }
const still = { x: 0, y: 0 }
const toExit = (run: ReturnType<typeof startRun>) => {
  const e = run.floor.maze.exit
  run.floor.enemies = []
  run.floor.player.pos = { x: e.x + 0.5, y: e.y + 0.5 }
}

describe('run', () => {
  it('starts at depth 1 with upgraded stats', () => {
    const r = startRun(lv, 123)
    expect(r.floor.depth).toBe(1)
    expect(r.stats.lightRange).toBeCloseTo(4.6)
    expect(r.stats.maxBattery).toBe(140)
    expect(r.floor.player.battery).toBe(140)
    expect(r.floor.player.shields).toBe(1)
    expect(r.coins).toBe(0)
    expect(isOver(r)).toBe(false)
  })
  it('clearing advances depth and carries battery', () => {
    const r = startRun(lv, 5)
    r.floor.player.battery = 60
    r.floor.player.shields = 0
    toExit(r)
    expect(stepRun(r, still, 0.01)).toContain('cleared')
    expect(r.floor.depth).toBe(2)
    expect(r.floor.status).toBe('playing')
    expect(r.floor.player.battery).toBeCloseTo(60 - 0.02 + BALANCE.pickups.exitRestore)
    expect(r.floor.player.shields).toBe(0)
  })
  it('coins accumulate across floors', () => {
    const r = startRun(lv, 5)
    r.floor.enemies = []
    const c = r.floor.items.find(i => i.kind === 'coin')!
    r.floor.player.pos = { ...c.pos }
    stepRun(r, still, 0.01)
    toExit(r)
    stepRun(r, still, 0.01)
    r.floor.enemies = []
    const c2 = r.floor.items.find(i => i.kind === 'coin')!
    r.floor.player.pos = { ...c2.pos }
    stepRun(r, still, 0.01)
    expect(r.coins).toBe(2)
  })
  it('death ends run', () => {
    const r = startRun(lv, 5)
    r.floor.enemies = []
    r.floor.player.battery = 0.001
    stepRun(r, still, 0.1)
    expect(isOver(r)).toBe(true)
    expect(finishRun(r).deathCause).toBe('battery')
  })
  it('finishRun bonus', () => {
    const r = startRun(lv, 5)
    r.floor.depth = 7
    r.floor.status = 'dead'
    r.floor.deathCause = 'enemy'
    r.coins = 3
    expect(finishRun(r)).toEqual({ depth: 7, coinsEarned: 17, deathCause: 'enemy' })
  })
  it('applyResult', () => {
    const save = { ...defaultSave(), coins: 10, bestDepth: 5, plays: 2 }
    const next = applyResult(save, { depth: 3, coinsEarned: 9, deathCause: 'battery' })
    expect(next).toEqual({ ...save, coins: 19, bestDepth: 5, plays: 3 })
    expect(save.coins).toBe(10)
    expect(applyResult(save, { depth: 8, coinsEarned: 0, deathCause: 'enemy' }).bestDepth).toBe(8)
  })
})
