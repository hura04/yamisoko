import { describe, it, expect } from 'vitest'
import { createFloor, stepFloor, tileOf } from '../../src/game/floor'
import { bfsDistances } from '../../src/game/maze'
import { createRng } from '../../src/game/rng'
import { computeStats } from '../../src/game/upgrades'
import { BALANCE } from '../../src/game/balance'
import { openMaze } from '../helpers/maze'
import type { FloorState } from '../../src/game/types'

const stats = computeStats({ range: 0, angle: 0, battery: 0, speed: 0, shield: 0 })
const still = { x: 0, y: 0 }

/** Floor on an open 11x11 room with nothing in it, player at (2.5,5.5) facing right. */
function emptyRoom(): FloorState {
  const s = createFloor(1, createRng(1), stats)
  s.maze = openMaze()
  s.maze.exit = { x: 9, y: 9 }
  s.enemies = []
  s.items = []
  s.traps = []
  s.player.pos = { x: 2.5, y: 5.5 }
  s.player.facing = 0
  return s
}

describe('floor', () => {
  it('tileOf', () => {
    expect(tileOf({ x: 2.7, y: 5.1 })).toEqual({ x: 2, y: 5 })
  })
  it('placement counts', () => {
    const s = createFloor(5, createRng(1), stats)
    expect(s.depth).toBe(5)
    expect(s.enemies.length).toBe(3)
    expect(s.traps.length).toBe(2)
    expect(s.items.filter(i => i.kind === 'coin').length).toBe(5)
    expect(s.items.filter(i => i.kind === 'battery').length).toBe(2)
    expect(s.status).toBe('playing')
  })
  it('spawn distance', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = createFloor(20, createRng(seed), stats)
      const d = bfsDistances(s.maze, s.maze.start)
      const at = (p: { x: number; y: number }) => d[Math.floor(p.y) * s.maze.width + Math.floor(p.x)]
      for (const e of s.enemies) expect(at(e.pos)).toBeGreaterThanOrEqual(BALANCE.enemy.minSpawnDist)
      for (const t of s.traps) expect(at(t.pos)).toBeGreaterThanOrEqual(BALANCE.trap.minSpawnDist)
    }
  })
  it('no item, trap or enemy on start or exit, no duplicates', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = createFloor(10, createRng(seed), stats)
      const keys = [...s.items, ...s.traps, ...s.enemies].map(o => `${Math.floor(o.pos.x)},${Math.floor(o.pos.y)}`)
      expect(new Set(keys).size).toBe(keys.length)
      expect(keys).not.toContain(`${s.maze.start.x},${s.maze.start.y}`)
      expect(keys).not.toContain(`${s.maze.exit.x},${s.maze.exit.y}`)
    }
  })
  it('carry keeps battery', () => {
    const s = createFloor(2, createRng(1), stats, { battery: 40, shields: 1 })
    expect(s.player.battery).toBe(40)
    expect(s.player.shields).toBe(1)
  })
  it('coin pickup', () => {
    const s = emptyRoom()
    s.items = [{ kind: 'coin', pos: { x: 2.5, y: 5.5 }, taken: false }]
    expect(stepFloor(s, still, stats, 0.016, createRng(1))).toContain('coin')
    expect(s.coinsCollected).toBe(1)
    expect(stepFloor(s, still, stats, 0.016, createRng(1))).not.toContain('coin')
    expect(s.coinsCollected).toBe(1)
  })
  it('battery pickup', () => {
    const s = emptyRoom()
    s.player.battery = 50
    s.items = [{ kind: 'battery', pos: { x: 2.5, y: 5.5 }, taken: false }]
    expect(stepFloor(s, still, stats, 0.01, createRng(1))).toContain('battery')
    expect(s.player.battery).toBeCloseTo(50 - 0.02 + BALANCE.pickups.battery)
  })
  it('trap drains once', () => {
    const s = emptyRoom()
    s.traps = [{ pos: { x: 2.5, y: 5.5 }, triggered: false }]
    expect(stepFloor(s, still, stats, 0.001, createRng(1))).toContain('trap')
    expect(s.player.battery).toBeCloseTo(100 - 0.002 - BALANCE.pickups.trapDamage)
    const b = s.player.battery
    expect(stepFloor(s, still, stats, 0.001, createRng(1))).not.toContain('trap')
    expect(s.player.battery).toBeCloseTo(b - 0.002)
    expect(s.status).toBe('playing')
  })
  it('battery death', () => {
    const s = emptyRoom()
    s.player.battery = 0.01
    expect(stepFloor(s, still, stats, 0.1, createRng(1))).toContain('dead')
    expect(s.status).toBe('dead')
    expect(s.deathCause).toBe('battery')
    expect(stepFloor(s, still, stats, 0.1, createRng(1))).toEqual([])
  })
  it('enemy death without shield', () => {
    const s = emptyRoom()
    s.enemies = [{ pos: { x: 2.3, y: 5.5 }, mode: 'wander', target: null }]
    expect(stepFloor(s, still, stats, 0.016, createRng(1))).toContain('dead')
    expect(s.deathCause).toBe('enemy')
  })
  it('enemy hit consumes shield', () => {
    const s = emptyRoom()
    s.player.shields = 1
    s.enemies = [{ pos: { x: 2.3, y: 5.5 }, mode: 'wander', target: null }]
    expect(stepFloor(s, still, stats, 0.016, createRng(1))).toContain('shield')
    expect(s.status).toBe('playing')
    expect(s.player.shields).toBe(0)
  })
  it('frozen enemy in beam does not move', () => {
    const s = emptyRoom()
    s.enemies = [{ pos: { x: 5.5, y: 5.5 }, mode: 'wander', target: null }]
    stepFloor(s, still, stats, 0.1, createRng(1))
    expect(s.enemies[0].pos).toEqual({ x: 5.5, y: 5.5 })
  })
  it('enemy outside beam moves', () => {
    const s = emptyRoom()
    s.player.facing = Math.PI
    s.enemies = [{ pos: { x: 5.5, y: 5.5 }, mode: 'wander', target: null }]
    stepFloor(s, still, stats, 0.1, createRng(1))
    expect(s.enemies[0].pos.x).toBeLessThan(5.5)
  })
  it('reaching exit clears', () => {
    const s = emptyRoom()
    s.player.pos = { x: 9.5, y: 9.5 }
    s.player.battery = 50
    expect(stepFloor(s, still, stats, 0.01, createRng(1))).toContain('cleared')
    expect(s.status).toBe('cleared')
    expect(s.player.battery).toBeCloseTo(50 - 0.02 + BALANCE.pickups.exitRestore)
  })
  it('huge dt clamped', () => {
    const s = emptyRoom()
    stepFloor(s, still, stats, 5, createRng(1))
    expect(100 - s.player.battery).toBeLessThanOrEqual(BALANCE.player.drainPerSec * BALANCE.maxDt + 1e-9)
  })
})
