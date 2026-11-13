import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

let html = ''

describe('build output', () => {
  beforeAll(() => {
    execSync('npx vite build --logLevel error', { env: { ...process.env, SITE_URL: 'https://example.github.io/yamisoko/' }, stdio: 'pipe' })
    html = readFileSync('dist/index.html', 'utf8')
  }, 120_000)

  it('og:image is absolute', () => {
    expect(html).toContain('<meta property="og:image" content="https://example.github.io/yamisoko/ogp.png"')
  })
  it('canonical and og:url', () => {
    expect(html).toContain('<link rel="canonical" href="https://example.github.io/yamisoko/"')
    expect(html).toContain('<meta property="og:url" content="https://example.github.io/yamisoko/"')
  })
  it('no placeholder left', () => {
    expect(html).not.toContain('%SITE_URL%')
  })
  it('title and description', () => {
    expect(html).toMatch(/<title>[^<]*ヤミソコ[^<]*Yamisoko[^<]*<\/title>/)
    expect(html).toContain('<meta name="description"')
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image"')
  })
  it('static files copied', () => {
    expect(existsSync('dist/ogp.png')).toBe(true)
    expect(existsSync('dist/robots.txt')).toBe(true)
  })
})
