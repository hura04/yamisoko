import { describe, it, expect } from 'vitest'
import { parseUpdates } from '../src/site/updates'
import updates from '../content/updates.json'
import site from '../content/site.json'

describe('content', () => {
  it('updates.json is valid', () => {
    expect(parseUpdates(updates).length).toBeGreaterThan(0)
  })
  it('site.json has feedbackUrl string', () => {
    expect(typeof site.feedbackUrl).toBe('string')
  })
})
