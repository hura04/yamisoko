import { describe, it, expect } from 'vitest'
import { createRng, randInt } from '../../src/game/rng'

describe('rng', () => {
  it('same seed gives same sequence', () => {
    const a = createRng(42)
    const b = createRng(42)
    for (let i = 0; i < 10; i++) expect(a()).toBe(b())
  })
  it('different seeds differ', () => {
    expect(createRng(1)()).not.toBe(createRng(2)())
  })
  it('values in [0,1)', () => {
    const r = createRng(7)
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v >= 0 && v < 1).toBe(true)
    }
  })
  it('randInt inclusive range', () => {
    const r = createRng(3)
    const seen = new Set<number>()
    for (let i = 0; i < 1000; i++) {
      const v = randInt(r, 3, 5)
      expect(v >= 3 && v <= 5).toBe(true)
      seen.add(v)
    }
    expect(seen.has(3) && seen.has(5)).toBe(true)
  })
})
