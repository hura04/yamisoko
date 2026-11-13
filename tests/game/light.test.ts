import { describe, it, expect } from 'vitest'
import { inBeam, inAura, isLit, hasLineOfSight } from '../../src/game/light'
import { openMaze, wallMaze } from '../helpers/maze'

const R = 4
const H = Math.PI / 6
const o = { x: 2.5, y: 5.5 }

describe('light', () => {
  it('beam hits point straight ahead', () => {
    expect(inBeam(openMaze(), o, 0, R, H, { x: 5.5, y: 5.5 })).toBe(true)
  })
  it('beam misses beyond range', () => {
    expect(inBeam(openMaze(), o, 0, R, H, { x: 7.5, y: 5.5 })).toBe(false)
  })
  it('beam misses outside angle', () => {
    expect(inBeam(openMaze(), o, 0, R, H, { x: 2.5, y: 3.5 })).toBe(false)
  })
  it('angle wraps around π', () => {
    expect(inBeam(openMaze(), { x: 8.5, y: 5.5 }, Math.PI, R, H, { x: 6.5, y: 5.6 })).toBe(true)
    expect(inBeam(openMaze(), { x: 8.5, y: 5.5 }, -Math.PI, R, H, { x: 6.5, y: 5.4 })).toBe(true)
  })
  it('wall blocks beam', () => {
    const m = wallMaze()
    expect(hasLineOfSight(m, { x: 3.5, y: 5.5 }, { x: 6.5, y: 5.5 })).toBe(false)
    expect(inBeam(m, { x: 3.5, y: 5.5 }, 0, R, H, { x: 6.5, y: 5.5 })).toBe(false)
  })
  it('aura lights behind player', () => {
    const p = { x: 1.6, y: 5.5 }
    expect(inAura(openMaze(), o, p)).toBe(true)
    expect(inBeam(openMaze(), o, 0, R, H, p)).toBe(false)
    expect(isLit(openMaze(), o, 0, R, H, p)).toBe(true)
  })
  it('aura limited by radius', () => {
    expect(inAura(openMaze(), o, { x: 1.0, y: 5.5 })).toBe(false)
  })
})
