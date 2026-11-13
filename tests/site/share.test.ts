import { describe, it, expect } from 'vitest'
import { buildShareUrl } from '../../src/site/share'

describe('share', () => {
  it('builds intent url with depth', () => {
    const url = buildShareUrl('ja', 12, 'https://x.example/yamisoko/')
    expect(url.startsWith('https://twitter.com/intent/tweet?')).toBe(true)
    const q = new URL(url).searchParams
    expect(q.get('text')).toContain('地下12階')
    expect(q.get('text')).toContain('#ヤミソコ')
    expect(q.get('url')).toBe('https://x.example/yamisoko/')
  })
  it('english text', () => {
    const q = new URL(buildShareUrl('en', 3, 'https://x.example/')).searchParams
    expect(q.get('text')).toContain('B3')
    expect(q.get('text')).toContain('#Yamisoko')
  })
  it('without depth uses title', () => {
    const q = new URL(buildShareUrl('en', null, 'https://x.example/')).searchParams
    expect(q.get('text')).toContain('Yamisoko')
  })
})
