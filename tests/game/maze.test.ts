import { describe, it, expect } from 'vitest'
import { createRng } from '../../src/game/rng'
import { cellsForDepth, generateMaze, isWall, bfsDistances } from '../../src/game/maze'

describe('maze', () => {
  it('cellsForDepth', () => {
    expect(cellsForDepth(1)).toBe(6)
    expect(cellsForDepth(10)).toBe(6)
    expect(cellsForDepth(11)).toBe(8)
    expect(cellsForDepth(21)).toBe(10)
    expect(cellsForDepth(999)).toBe(16)
  })
  it('size', () => {
    const m = generateMaze(6, createRng(1))
    expect(m.width).toBe(13)
    expect(m.height).toBe(13)
  })
  it('border is wall', () => {
    const m = generateMaze(6, createRng(1))
    for (let i = 0; i < m.width; i++) {
      expect(isWall(m, i, 0)).toBe(true)
      expect(isWall(m, i, m.height - 1)).toBe(true)
      expect(isWall(m, 0, i)).toBe(true)
      expect(isWall(m, m.width - 1, i)).toBe(true)
    }
    expect(isWall(m, -1, 0)).toBe(true)
  })
  it('exit reachable', () => {
    for (let s = 1; s <= 50; s++) {
      const m = generateMaze(6, createRng(s))
      const d = bfsDistances(m, m.start)
      expect(d[m.exit.y * m.width + m.exit.x]).toBeGreaterThan(0)
      expect(isWall(m, m.exit.x, m.exit.y)).toBe(false)
    }
  })
  it('all cells connected', () => {
    for (let s = 1; s <= 20; s++) {
      const m = generateMaze(6, createRng(s))
      const d = bfsDistances(m, m.start)
      for (let cy = 0; cy < 6; cy++)
        for (let cx = 0; cx < 6; cx++)
          expect(d[(2 * cy + 1) * m.width + 2 * cx + 1]).toBeGreaterThanOrEqual(0)
    }
  })
  it('deterministic', () => {
    const a = generateMaze(8, createRng(9))
    const b = generateMaze(8, createRng(9))
    expect(a.walls).toEqual(b.walls)
    expect(a.exit).toEqual(b.exit)
  })
})
