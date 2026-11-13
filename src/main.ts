import './style.css'
import { BALANCE } from './game/balance'
import { applyResult, finishRun, isOver, startRun, stepRun, type RunResult, type RunState } from './game/run'
import { tryBuy, UPGRADE_IDS, UPGRADES, upgradeCost } from './game/upgrades'
import { detectLang, t } from './i18n/i18n'
import { createInput } from './input/input'
import { createRenderer } from './render/renderer'
import { getStorage, loadSave, writeSave, type Lang, type SaveData } from './save/storage'
import { buildShareUrl } from './site/share'

type Screen = 'title' | 'playing' | 'gameover' | 'shop'

const storage = getStorage()
let save: SaveData = loadSave(storage)
let lang: Lang = detectLang(save.lang, navigator.language)
let screen: Screen = 'title'
let run: RunState | null = null
let lastResult: RunResult | null = null

const canvas = document.querySelector<HTMLCanvasElement>('#game canvas')!
const overlay = document.querySelector<HTMLDivElement>('#overlay')!
const stage = document.querySelector<HTMLDivElement>('#stage')!
const renderer = createRenderer(canvas)
const input = createInput(stage, () => screen === 'playing')
new ResizeObserver(() => { renderer.resize(); if (run) renderer.draw(run, null, performance.now() / 1000) }).observe(canvas)

export function pageUrl(): string {
  return document.querySelector<HTMLLinkElement>('link[rel=canonical]')?.href ?? location.origin + location.pathname
}

function persist() {
  writeSave(storage, save)
  window.dispatchEvent(new CustomEvent('yamisoko:save', { detail: save }))
}

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

function renderOverlay() {
  overlay.hidden = screen === 'playing'
  if (screen === 'title') {
    overlay.innerHTML = `
      <h1 class="ov-title">${esc(t(lang, 'title'))}</h1>
      <p class="ov-sub">${esc(t(lang, 'tagline'))}</p>
      ${save.bestDepth > 0 ? `<p>${esc(t(lang, 'best.depth', { depth: save.bestDepth }))}</p>` : ''}
      <div class="ov-buttons">
        <button class="primary" data-action="play">${esc(t(lang, 'play'))}</button>
        <button data-action="shop">${esc(t(lang, 'upgrades'))}</button>
      </div>`
  } else if (screen === 'gameover' && lastResult) {
    overlay.innerHTML = `
      <h2 class="ov-title">${esc(t(lang, 'gameOver'))}</h2>
      <p class="ov-depth">${esc(t(lang, 'depthReached', { depth: lastResult.depth }))}</p>
      <p>${esc(t(lang, `cause.${lastResult.deathCause}`))}</p>
      <p class="ov-coins">${esc(t(lang, 'coinsEarned', { coins: lastResult.coinsEarned }))}</p>
      <div class="ov-buttons">
        <a class="button share" target="_blank" rel="noopener" href="${esc(buildShareUrl(lang, lastResult.depth, pageUrl()))}">${esc(t(lang, 'share.button'))}</a>
        <button data-action="shop">${esc(t(lang, 'upgrades'))}</button>
        <button class="primary" data-action="play">${esc(t(lang, 'retry'))}</button>
      </div>`
  } else if (screen === 'shop') {
    const rows = UPGRADE_IDS.map(id => {
      const lv = save.upgrades[id]
      const max = lv >= UPGRADES[id].maxLevel
      const cost = upgradeCost(id, lv)
      return `<li>
        <span class="up-name">${esc(t(lang, `upgrade.${id}`))}</span>
        <span class="up-level">${esc(t(lang, 'level', { level: lv }))}</span>
        <button data-action="buy" data-id="${id}" ${max || save.coins < cost ? 'disabled' : ''}>
          ${esc(max ? t(lang, 'max') : t(lang, 'buy', { cost }))}</button>
      </li>`
    }).join('')
    overlay.innerHTML = `
      <h2 class="ov-title">${esc(t(lang, 'upgrades'))}</h2>
      <p class="ov-coins">${esc(t(lang, 'coinsOwned', { coins: save.coins }))}</p>
      <ul class="shop">${rows}</ul>
      <div class="ov-buttons"><button class="primary" data-action="play">${esc(t(lang, 'play'))}</button></div>`
  }
}

function go(next: Screen) {
  screen = next
  renderOverlay()
  overlay.querySelector<HTMLButtonElement>('button.primary')?.focus({ preventScroll: true })
}

overlay.addEventListener('click', e => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')
  if (!btn) return
  const action = btn.dataset.action
  if (action === 'play') {
    run = startRun(save.upgrades, Date.now() >>> 0)
    last = null
    go('playing')
  } else if (action === 'shop') {
    go('shop')
  } else if (action === 'buy') {
    const r = tryBuy(save.upgrades, save.coins, btn.dataset.id as (typeof UPGRADE_IDS)[number])
    if (r) {
      save = { ...save, upgrades: r.levels, coins: r.coins }
      persist()
      renderOverlay()
    }
  }
})

let last: number | null = null
function frame(now: number) {
  requestAnimationFrame(frame)
  if (!run) return
  if (screen === 'playing' && !document.hidden) {
    const dt = last === null ? 0 : Math.min((now - last) / 1000, BALANCE.maxDt)
    last = now
    stepRun(run, input.getDir(), dt)
    if (isOver(run)) {
      lastResult = finishRun(run)
      save = applyResult(save, lastResult)
      persist()
      go('gameover')
    }
  }
  renderer.draw(run, screen === 'playing' ? input.getStick() : null, now / 1000)
}
document.addEventListener('visibilitychange', () => { last = null })

export function setLang(next: Lang) {
  lang = next
  save = { ...save, lang }
  persist()
  renderOverlay()
}
export function getLang(): Lang { return lang }
export function getSave(): SaveData { return save }

renderer.resize()
go('title')
requestAnimationFrame(frame)
