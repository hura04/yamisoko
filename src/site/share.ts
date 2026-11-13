import { t } from '../i18n/i18n'
import type { Lang } from '../save/storage'

export function buildShareUrl(lang: Lang, depth: number | null, pageUrl: string): string {
  const text = depth === null ? `${t(lang, 'title')} — ${t(lang, 'tagline')}` : t(lang, 'share.text', { depth })
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pageUrl)}`
}
