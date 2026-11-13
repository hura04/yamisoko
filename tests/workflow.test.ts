import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

describe('deploy workflow', () => {
  it('PR runs cannot cancel a pending main deploy (concurrency is per-ref, not one shared group)', () => {
    const y = readFileSync('.github/workflows/deploy.yml', 'utf8')
    expect(y).not.toMatch(/group:\s*pages\s*$/m)
    expect(y).toContain('github.ref')
  })
})
