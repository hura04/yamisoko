import { describe, it, expect } from 'vitest'
import { loadSave, writeSave, defaultSave, SAVE_KEY } from '../../src/save/storage'

function memStorage(): Storage {
  const m = new Map<string, string>()
  return {
    get length() { return m.size },
    clear: () => m.clear(),
    getItem: k => (m.has(k) ? m.get(k)! : null),
    key: i => [...m.keys()][i] ?? null,
    removeItem: k => { m.delete(k) },
    setItem: (k, v) => { m.set(k, String(v)) },
  }
}
function throwingStorage(): Storage {
  const s = memStorage()
  s.getItem = () => { throw new Error('denied') }
  s.setItem = () => { throw new Error('denied') }
  return s
}

describe('storage', () => {
  it('null storage gives default', () => {
    expect(loadSave(null)).toEqual(defaultSave())
  })
  it('round trip', () => {
    const s = memStorage()
    const d = { ...defaultSave(), coins: 12, bestDepth: 4, plays: 3, lang: 'en' as const, upgrades: { ...defaultSave().upgrades, range: 2 } }
    writeSave(s, d)
    expect(loadSave(s)).toEqual(d)
  })
  it('corrupted json gives default', () => {
    const s = memStorage()
    s.setItem(SAVE_KEY, '{oops')
    expect(loadSave(s)).toEqual(defaultSave())
  })
  it('partial data merged', () => {
    const s = memStorage()
    s.setItem(SAVE_KEY, '{"coins":50}')
    expect(loadSave(s)).toEqual({ ...defaultSave(), coins: 50 })
  })
  it('invalid values sanitized', () => {
    const s = memStorage()
    s.setItem(SAVE_KEY, JSON.stringify({ coins: -5, bestDepth: 'x', plays: 1.5, lang: 'fr', upgrades: { range: 99, angle: -1, speed: 1.5, shield: null } }))
    const d = loadSave(s)
    expect(d.coins).toBe(0)
    expect(d.bestDepth).toBe(0)
    expect(d.plays).toBe(0)
    expect(d.lang).toBeNull()
    expect(d.upgrades).toEqual({ range: 5, angle: 0, battery: 0, speed: 0, shield: 0 })
  })
  it('non-object json gives default', () => {
    const s = memStorage()
    s.setItem(SAVE_KEY, 'null')
    expect(loadSave(s)).toEqual(defaultSave())
  })
  it('throwing storage does not throw', () => {
    const s = throwingStorage()
    expect(loadSave(s)).toEqual(defaultSave())
    expect(() => writeSave(s, defaultSave())).not.toThrow()
  })
})
