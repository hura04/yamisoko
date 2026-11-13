import { describe, it, expect } from 'vitest'
import { detectLang, t } from '../../src/i18n/i18n'
import ja from '../../src/i18n/ja.json'
import en from '../../src/i18n/en.json'

const REQUIRED = ['title', 'tagline', 'play', 'retry', 'upgrades', 'gameOver', 'depthReached', 'coinsEarned',
  'cause.battery', 'cause.enemy', 'upgrade.range', 'upgrade.angle', 'upgrade.battery', 'upgrade.speed', 'upgrade.shield',
  'max', 'buy', 'panel.news', 'panel.howto', 'panel.best', 'panel.changelog', 'panel.roadmap', 'panel.share',
  'panel.feedback', 'best.depth', 'best.plays', 'howto.body', 'share.text', 'share.button', 'feedback.link', 'meta.description']

describe('i18n', () => {
  it('detectLang', () => {
    expect(detectLang(null, 'ja-JP')).toBe('ja')
    expect(detectLang(null, 'en-US')).toBe('en')
    expect(detectLang(null, undefined)).toBe('en')
    expect(detectLang('en', 'ja')).toBe('en')
  })
  it('t with vars', () => {
    expect(t('ja', 'depthReached', { depth: 12 })).toBe('地下12階まで到達')
    expect(t('en', 'depthReached', { depth: 12 })).toBe('Reached B12')
  })
  it('unknown key returns key', () => {
    expect(t('ja', 'nope.key')).toBe('nope.key')
  })
  it('ja and en have same keys including required', () => {
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort())
    for (const k of REQUIRED) expect(Object.keys(ja)).toContain(k)
  })
})
