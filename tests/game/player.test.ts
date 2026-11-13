import { describe, it, expect } from 'vitest'
import { createPlayer, movePlayer, drainBattery, addBattery, hitPlayer, tickPlayer, normalizeDir } from '../../src/game/player'
import { BALANCE } from '../../src/game/balance'
import { openMaze } from '../helpers/maze'
import type { PlayerStats } from '../../src/game/types'

const stats: PlayerStats = { speed: 3, lightRange: 4, lightHalfAngle: Math.PI / 6, maxBattery: 100, shields: 0 }
const R = BALANCE.player.radius

describe('player', () => {
  it('createPlayer centers on tile and uses stats', () => {
    const p = createPlayer({ x: 1, y: 1 }, stats)
    expect(p.pos).toEqual({ x: 1.5, y: 1.5 })
    expect(p.battery).toBe(100)
    expect(createPlayer({ x: 1, y: 1 }, stats, 40, 2).battery).toBe(40)
  })
  it('normalizeDir', () => {
    expect(normalizeDir({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 })
    const d = normalizeDir({ x: 3, y: 4 })
    expect(Math.hypot(d.x, d.y)).toBeCloseTo(1, 9)
    expect(normalizeDir({ x: 0.5, y: 0 })).toEqual({ x: 0.5, y: 0 })
  })
  it('diagonal not faster', () => {
    const p = createPlayer({ x: 5, y: 5 }, stats)
    movePlayer(openMaze(), p, { x: 1, y: 1 }, 3, 0.1)
    expect(Math.hypot(p.pos.x - 5.5, p.pos.y - 5.5)).toBeCloseTo(0.3, 6)
  })
  it('stops at wall', () => {
    const m = openMaze()
    const p = createPlayer({ x: 5, y: 5 }, stats)
    for (let i = 0; i < 100; i++) movePlayer(m, p, { x: 1, y: 0 }, 3, 0.1)
    expect(p.pos.x).toBeLessThanOrEqual(m.width - 1 - R + 1e-6)
    expect(p.pos.x).toBeGreaterThan(m.width - 1 - R - 0.05)
  })
  it('slides along wall', () => {
    const m = openMaze()
    const p = createPlayer({ x: 9, y: 5 }, stats)
    p.pos.x = m.width - 1 - R
    const y0 = p.pos.y
    movePlayer(m, p, { x: 1, y: 1 }, 3, 0.1)
    expect(p.pos.y).toBeGreaterThan(y0)
  })
  it('facing follows dir', () => {
    const p = createPlayer({ x: 5, y: 5 }, stats)
    movePlayer(openMaze(), p, { x: 0, y: -1 }, 3, 0.01)
    expect(p.facing).toBeCloseTo(-Math.PI / 2, 9)
    movePlayer(openMaze(), p, { x: 0, y: 0 }, 3, 0.01)
    expect(p.facing).toBeCloseTo(-Math.PI / 2, 9)
  })
  it('battery drain floors at 0', () => {
    const p = createPlayer({ x: 1, y: 1 }, stats, 1)
    drainBattery(p, 10)
    expect(p.battery).toBe(0)
  })
  it('addBattery caps at max', () => {
    const p = createPlayer({ x: 1, y: 1 }, stats, 90)
    addBattery(p, 30, 100)
    expect(p.battery).toBe(100)
  })
  it('shield absorbs one hit', () => {
    const p = createPlayer({ x: 1, y: 1 }, stats, 100, 1)
    expect(hitPlayer(p)).toBe('shield')
    expect(p.shields).toBe(0)
    expect(hitPlayer(p)).toBe('ignored')
    tickPlayer(p, BALANCE.player.invulnSec + 0.01)
    expect(hitPlayer(p)).toBe('dead')
  })
})
