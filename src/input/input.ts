import type { Vec } from '../game/types'

export interface Stick { origin: Vec; knob: Vec }
export interface Input { getDir(): Vec; getStick(): Stick | null; dispose(): void }

const STICK_RADIUS = 50
const DEADZONE = 6
const KEYS: Record<string, Vec> = {
  ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
  KeyW: { x: 0, y: -1 }, KeyS: { x: 0, y: 1 }, KeyA: { x: -1, y: 0 }, KeyD: { x: 1, y: 0 },
}

/**
 * Keyboard (arrows / WASD) and a floating virtual stick on `target`.
 * Key presses only call preventDefault while `isActive()` so the page scrolls normally otherwise.
 */
export function createInput(target: HTMLElement, isActive: () => boolean): Input {
  const held = new Set<string>()
  let stick: Stick | null = null
  let pointerId: number | null = null

  const local = (e: PointerEvent): Vec => {
    const r = target.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (!(e.code in KEYS)) return
    held.add(e.code)
    if (isActive()) e.preventDefault()
  }
  const onKeyUp = (e: KeyboardEvent) => { held.delete(e.code) }
  const onBlur = () => { held.clear(); stick = null; pointerId = null }
  const onDown = (e: PointerEvent) => {
    if (!isActive() || pointerId !== null) return
    e.preventDefault()
    pointerId = e.pointerId
    target.setPointerCapture?.(e.pointerId)
    const p = local(e)
    stick = { origin: p, knob: p }
  }
  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId || !stick) return
    e.preventDefault()
    const p = local(e)
    const dx = p.x - stick.origin.x, dy = p.y - stick.origin.y
    const len = Math.hypot(dx, dy)
    const k = len > STICK_RADIUS ? STICK_RADIUS / len : 1
    stick.knob = { x: stick.origin.x + dx * k, y: stick.origin.y + dy * k }
  }
  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return
    pointerId = null
    stick = null
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)
  target.addEventListener('pointerdown', onDown)
  target.addEventListener('pointermove', onMove)
  target.addEventListener('pointerup', onUp)
  target.addEventListener('pointercancel', onUp)

  return {
    getDir() {
      if (stick) {
        const dx = stick.knob.x - stick.origin.x, dy = stick.knob.y - stick.origin.y
        if (Math.hypot(dx, dy) < DEADZONE) return { x: 0, y: 0 }
        return { x: dx / STICK_RADIUS, y: dy / STICK_RADIUS }
      }
      const d = { x: 0, y: 0 }
      for (const code of held) { d.x += KEYS[code].x; d.y += KEYS[code].y }
      return { x: Math.sign(d.x), y: Math.sign(d.y) }
    },
    getStick: () => stick,
    dispose() {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      target.removeEventListener('pointerdown', onDown)
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
      target.removeEventListener('pointercancel', onUp)
    },
  }
}
