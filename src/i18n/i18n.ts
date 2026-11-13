import ja from './ja.json'
import en from './en.json'
import type { Lang } from '../save/storage'

const DICT: Record<Lang, Record<string, string>> = { ja, en }

export function detectLang(saved: Lang | null, navigatorLanguage: string | undefined): Lang {
  if (saved) return saved
  return navigatorLanguage?.toLowerCase().startsWith('ja') ? 'ja' : 'en'
}

export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const s = DICT[lang][key]
  if (s === undefined) return key
  return s.replace(/\{(\w+)\}/g, (m, name: string) => (vars && name in vars ? String(vars[name]) : m))
}
