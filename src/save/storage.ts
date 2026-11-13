import { UPGRADE_IDS, UPGRADES, type UpgradeLevels } from '../game/upgrades'

export type Lang = 'ja' | 'en'

export interface SaveData {
  version: 1
  coins: number
  upgrades: UpgradeLevels
  bestDepth: number
  plays: number
  lang: Lang | null
}

export const SAVE_KEY = 'yamisoko.save.v1'

export function defaultSave(): SaveData {
  return {
    version: 1,
    coins: 0,
    upgrades: { range: 0, angle: 0, battery: 0, speed: 0, shield: 0 },
    bestDepth: 0,
    plays: 0,
    lang: null,
  }
}

export function getStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const count = (v: unknown): number => (Number.isInteger(v) && (v as number) >= 0 ? (v as number) : 0)

export function loadSave(storage: Storage | null): SaveData {
  const save = defaultSave()
  if (!storage) return save
  let raw: unknown
  try {
    const text = storage.getItem(SAVE_KEY)
    if (text === null) return save
    raw = JSON.parse(text)
  } catch {
    return save
  }
  if (typeof raw !== 'object' || raw === null) return save
  const r = raw as Record<string, unknown>
  save.coins = count(r.coins)
  save.bestDepth = count(r.bestDepth)
  save.plays = count(r.plays)
  save.lang = r.lang === 'ja' || r.lang === 'en' ? r.lang : null
  const up = typeof r.upgrades === 'object' && r.upgrades !== null ? (r.upgrades as Record<string, unknown>) : {}
  for (const id of UPGRADE_IDS) {
    const v = up[id]
    save.upgrades[id] = Number.isInteger(v) ? Math.max(0, Math.min(UPGRADES[id].maxLevel, v as number)) : 0
  }
  return save
}

export function writeSave(storage: Storage | null, data: SaveData): void {
  if (!storage) return
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch {
    // Saving is best-effort; the game keeps working without it.
  }
}
