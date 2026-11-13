export type UpdateType = 'news' | 'change' | 'plan'
export interface UpdateEntry { date: string; version: string; type: UpdateType; ja: string; en: string }

const TYPES: UpdateType[] = ['news', 'change', 'plan']

export function parseUpdates(raw: unknown): UpdateEntry[] {
  if (!Array.isArray(raw)) throw new Error('updates.json must be an array')
  const out = raw.map((item, i): UpdateEntry => {
    if (typeof item !== 'object' || item === null) throw new Error(`updates[${i}] must be an object`)
    const r = item as Record<string, unknown>
    for (const k of ['date', 'version', 'type', 'ja', 'en']) {
      if (typeof r[k] !== 'string' || (r[k] as string).length === 0) throw new Error(`updates[${i}].${k} is missing`)
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date as string)) throw new Error(`updates[${i}].date must be YYYY-MM-DD`)
    if (!TYPES.includes(r.type as UpdateType)) throw new Error(`updates[${i}].type must be news, change or plan`)
    return { date: r.date as string, version: r.version as string, type: r.type as UpdateType, ja: r.ja as string, en: r.en as string }
  })
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}
