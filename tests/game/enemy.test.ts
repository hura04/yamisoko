import { describe, it, expect } from 'vitest'
import { enemySpeed, stepEnemy, touchesPlayer } from '../../src/game/enemy'
import { isWall } from '../../src/game/maze'
import { createRng } from '../../src/game/rng'
import { openMaze, wallMaze } from '../helpers/maze'
import type { Enemy } from '../../src/game/types'

const mk = (x: number, y: number): Enemy => ({ pos: { x, y }, mode: 'wander', target: null })
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

describe('enemy', () => {
  it('enemySpeed', () => {
    expect(enemySpeed(1)).toBeCloseTo(1.6)
    expect(enemySpeed(21)).toBeCloseTo(2.6)
    expect(enemySpeed(100)).toBeCloseTo(3.0)
  })
  it('frozen enemy does not move', () => {
    const e = mk(5.5, 5.5)
    stepEnemy(openMaze(), e, { x: 3.5, y: 5.5 }, true, 2, 1, createRng(1))
    expect(e.pos).toEqual({ x: 5.5, y: 5.5 })
  })
  it('chases visible nearby player', () => {
    const e = mk(5.5, 5.5)
    const p = { x: 2.5, y: 5.5 }
    stepEnemy(openMaze(), e, p, false, 2, 0.5, createRng(1))
    expect(e.mode).toBe('chase')
    expect(dist(e.pos, p)).toBeLessThan(3)
  })
  it('wanders when player far', () => {
    const m = openMaze()
    const e = mk(8.5, 8.5)
    const r = createRng(2)
    for (let i = 0; i < 200; i++) {
      stepEnemy(m, e, { x: 1.5, y: 1.5 }, false, 2, 0.05, r)
      expect(e.mode).toBe('wander')
      expect(isWall(m, Math.floor(e.pos.x), Math.floor(e.pos.y))).toBe(false)
    }
  })
  it('does not chase through wall', () => {
    const e = mk(6.5, 5.5)
    stepEnemy(wallMaze(), e, { x: 4.5, y: 5.5 }, false, 2, 0.05, createRng(1))
    expect(e.mode).toBe('wander')
  })
  it('touchesPlayer', () => {
    expect(touchesPlayer(mk(5.0, 5.0), { x: 5.6, y: 5.0 })).toBe(true)
    expect(touchesPlayer(mk(5.0, 5.0), { x: 5.7, y: 5.0 })).toBe(false)
  })
})
