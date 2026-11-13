import { describe, it, expect } from 'vitest'
import { parseUpdates } from '../../src/site/updates'

const e = (date: string, type = 'change') => ({ date, version: '1.0.0', type, ja: 'あ', en: 'a' })

describe('updates', () => {
  it('sorts newest first', () => {
    const r = parseUpdates([e('2026-11-01'), e('2026-11-20'), e('2026-11-10')])
    expect(r.map(x => x.date)).toEqual(['2026-11-20', '2026-11-10', '2026-11-01'])
  })
  it('bad date', () => {
    expect(() => parseUpdates([e('2026/11/01')])).toThrow(/0.*date/)
  })
  it('bad type', () => {
    expect(() => parseUpdates([e('2026-11-01', 'foo')])).toThrow(/type/)
  })
  it('missing field', () => {
    const { en: _en, ...rest } = e('2026-11-01')
    expect(() => parseUpdates([rest])).toThrow(/en/)
  })
  it('not an array', () => {
    expect(() => parseUpdates({})).toThrow()
  })
})
