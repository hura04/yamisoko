import { t } from '../i18n/i18n'
import type { Lang, SaveData } from '../save/storage'
import { buildShareUrl } from './share'
import type { UpdateEntry } from './updates'

export interface PanelOptions {
  lang: Lang
  updates: UpdateEntry[]
  save: SaveData
  feedbackUrl: string
  pageUrl: string
  onLangChange(lang: Lang): void
}
export interface Panels { setLang(lang: Lang): void; setSave(save: SaveData): void }

const TABS = ['news', 'howto', 'changelog', 'roadmap'] as const
type Tab = (typeof TABS)[number]

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export function mountPanels(root: HTMLElement, opts: PanelOptions): Panels {
  let { lang, save } = opts
  let tab: Tab = 'news'
  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel)!

  const list = (entries: UpdateEntry[], withVersion: boolean) =>
    entries.length === 0
      ? '<p class="muted">—</p>'
      : `<ul class="entries">${entries.map(e => `<li><time datetime="${e.date}">${e.date}</time>${withVersion ? ` <span class="ver">v${esc(e.version)}</span>` : ''}<p>${esc(e[lang])}</p></li>`).join('')}</ul>`

  function renderBest() {
    $('#best').innerHTML = `<h2>${esc(t(lang, 'panel.best'))}</h2>
      <p>${esc(save.bestDepth > 0 ? t(lang, 'best.depth', { depth: save.bestDepth }) : t(lang, 'best.none'))}</p>
      <p>${esc(t(lang, 'best.plays', { plays: save.plays }))}</p>`
  }

  function renderTabs() {
    root.querySelectorAll<HTMLButtonElement>('.tabs [data-tab]').forEach(b => {
      const active = b.dataset.tab === tab
      b.classList.toggle('active', active)
      b.setAttribute('aria-selected', String(active))
    })
    for (const id of TABS) $(`#${id}`).classList.toggle('tab-active', id === tab)
  }

  function render() {
    document.documentElement.lang = lang
    $('#site-title').textContent = t(lang, 'title')
    $('#site-tagline').textContent = t(lang, 'tagline')
    $('#lang-toggle').textContent = t(lang, 'lang.toggle')

    const news = opts.updates.filter(u => u.type === 'news')
    $('#news').innerHTML = `<h2>${esc(t(lang, 'panel.news'))}</h2>${list(news, false)}`
    $('#howto').innerHTML = `<h2>${esc(t(lang, 'panel.howto'))}</h2>${t(lang, 'howto.body').split('\n').map(l => `<p>${esc(l)}</p>`).join('')}`
    $('#changelog').innerHTML = `<h2>${esc(t(lang, 'panel.changelog'))}</h2>${list(opts.updates.filter(u => u.type === 'change'), true)}`
    $('#roadmap').innerHTML = `<h2>${esc(t(lang, 'panel.roadmap'))}</h2>${list(opts.updates.filter(u => u.type === 'plan'), false)}`
    $('#share').innerHTML = `<h2>${esc(t(lang, 'panel.share'))}</h2>
      <a class="button share" target="_blank" rel="noopener" href="${esc(buildShareUrl(lang, save.bestDepth > 0 ? save.bestDepth : null, opts.pageUrl))}">${esc(t(lang, 'share.button'))}</a>`
    const fb = $('#feedback')
    fb.hidden = !opts.feedbackUrl
    fb.innerHTML = opts.feedbackUrl
      ? `<h2>${esc(t(lang, 'panel.feedback'))}</h2><a target="_blank" rel="noopener" href="${esc(opts.feedbackUrl)}">${esc(t(lang, 'feedback.link'))}</a>`
      : ''
    root.querySelectorAll<HTMLButtonElement>('.tabs [data-tab]').forEach(b => { b.textContent = t(lang, `panel.${b.dataset.tab}`) })
    renderBest()
    renderTabs()
  }

  $('#lang-toggle').addEventListener('click', () => opts.onLangChange(lang === 'ja' ? 'en' : 'ja'))
  root.querySelector('.tabs')!.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tab]')
    if (!b) return
    tab = b.dataset.tab as Tab
    renderTabs()
  })

  render()
  return {
    setLang(next) { lang = next; render() },
    setSave(next) { save = next; renderBest(); render() },
  }
}
