import { BALANCE } from '../game/balance'
import { inBeam, isLit } from '../game/light'
import { isWall } from '../game/maze'
import type { RunState } from '../game/run'
import type { Vec } from '../game/types'
import type { Stick } from '../input/input'

const VIEW = 11 // tiles visible across the square canvas
const WALL_SPILL = 0.3
const C = {
  floor: '#2b2e38', wall: '#141620', wallEdge: '#3a3f4f', exit: '#7fd1ff',
  player: '#ffd36b', coin: '#ffcc33', battery: '#6ee7a8', trap: '#ff5d5d',
  enemy: '#c04bff', enemyFrozen: '#7aa8ff', hud: '#f2f2f2', hudDim: 'rgba(255,255,255,0.25)', batteryLow: '#ff6b6b',
}

/** Casts rays from origin and returns the visible polygon (tile coords), stopping at walls. */
function visibilityPolygon(run: RunState, origin: Vec, from: number, to: number, range: number, rays: number): Vec[] {
  const maze = run.floor.maze
  const pts: Vec[] = []
  for (let i = 0; i <= rays; i++) {
    const a = from + ((to - from) * i) / rays
    const cx = Math.cos(a), cy = Math.sin(a)
    let d = 0
    while (d < range) {
      const nd = Math.min(range, d + 0.05)
      if (isWall(maze, Math.floor(origin.x + cx * nd), Math.floor(origin.y + cy * nd))) {
        d = Math.min(range, nd + WALL_SPILL) // let the light touch the wall face
        break
      }
      d = nd
    }
    pts.push({ x: origin.x + cx * d, y: origin.y + cy * d })
  }
  return pts
}

export interface Renderer { resize(): void; draw(run: RunState, stick: Stick | null, timeSec: number): void }

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const ctx = canvas.getContext('2d')!
  const dark = document.createElement('canvas')
  const dctx = dark.getContext('2d')!
  let dpr = 1

  function resize() {
    dpr = window.devicePixelRatio || 1
    const size = Math.max(1, Math.round(canvas.clientWidth * dpr))
    if (canvas.width !== size) { canvas.width = size; canvas.height = size }
    if (dark.width !== size) { dark.width = size; dark.height = size }
  }

  function draw(run: RunState, stick: Stick | null, time: number) {
    const W = canvas.width
    const ts = W / VIEW
    const f = run.floor
    const p = f.player
    const maze = f.maze
    const sx = (x: number) => (x - p.pos.x) * ts + W / 2
    const sy = (y: number) => (y - p.pos.y) * ts + W / 2

    ctx.fillStyle = C.wall
    ctx.fillRect(0, 0, W, W)
    const x0 = Math.floor(p.pos.x - VIEW / 2) - 1, x1 = Math.ceil(p.pos.x + VIEW / 2) + 1
    const y0 = Math.floor(p.pos.y - VIEW / 2) - 1, y1 = Math.ceil(p.pos.y + VIEW / 2) + 1
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) {
        if (isWall(maze, tx, ty)) {
          ctx.fillStyle = C.wallEdge
          ctx.fillRect(sx(tx), sy(ty), ts + 1, ts + 1)
          ctx.fillStyle = C.wall
          ctx.fillRect(sx(tx) + ts * 0.08, sy(ty) + ts * 0.08, ts * 0.84, ts * 0.84)
        } else {
          ctx.fillStyle = C.floor
          ctx.fillRect(sx(tx), sy(ty), ts + 1, ts + 1)
        }
      }

    // Exit: stairs going down.
    ctx.fillStyle = C.exit
    for (let i = 0; i < 4; i++) {
      const w = ts * (0.8 - i * 0.15)
      ctx.globalAlpha = 1 - i * 0.2
      ctx.fillRect(sx(maze.exit.x + 0.5) - w / 2, sy(maze.exit.y) + ts * (0.15 + i * 0.18), w, ts * 0.12)
    }
    ctx.globalAlpha = 1

    const lit = (q: Vec) => isLit(maze, p.pos, p.facing, run.stats.lightRange, run.stats.lightHalfAngle, q)
    for (const t of f.traps) {
      if (t.triggered || !lit(t.pos)) continue
      ctx.fillStyle = C.trap
      for (let i = -1; i <= 1; i++) {
        const bx = sx(t.pos.x) + i * ts * 0.22, by = sy(t.pos.y) + ts * 0.2
        ctx.beginPath()
        ctx.moveTo(bx - ts * 0.1, by); ctx.lineTo(bx, by - ts * 0.4); ctx.lineTo(bx + ts * 0.1, by)
        ctx.fill()
      }
    }
    for (const it of f.items) {
      if (it.taken || !lit(it.pos)) continue
      const bob = Math.sin(time * 4 + it.pos.x) * ts * 0.04
      if (it.kind === 'coin') {
        ctx.fillStyle = C.coin
        ctx.beginPath(); ctx.arc(sx(it.pos.x), sy(it.pos.y) + bob, ts * 0.16, 0, Math.PI * 2); ctx.fill()
      } else {
        ctx.fillStyle = C.battery
        ctx.fillRect(sx(it.pos.x) - ts * 0.12, sy(it.pos.y) - ts * 0.2 + bob, ts * 0.24, ts * 0.4)
        ctx.fillRect(sx(it.pos.x) - ts * 0.05, sy(it.pos.y) - ts * 0.26 + bob, ts * 0.1, ts * 0.06)
      }
    }
    for (const e of f.enemies) {
      if (!lit(e.pos)) continue
      const frozen = inBeam(maze, p.pos, p.facing, run.stats.lightRange, run.stats.lightHalfAngle, e.pos)
      const r = BALANCE.enemy.radius * ts
      const a = Math.atan2(p.pos.y - e.pos.y, p.pos.x - e.pos.x)
      ctx.fillStyle = frozen ? C.enemyFrozen : C.enemy
      ctx.beginPath()
      for (let i = 0; i < 3; i++) {
        const ang = a + (i * Math.PI * 2) / 3
        const px = sx(e.pos.x) + Math.cos(ang) * r * 1.3, py = sy(e.pos.y) + Math.sin(ang) * r * 1.3
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath(); ctx.fill()
    }

    const blink = p.invulnTimer > 0 && Math.floor(time * 12) % 2 === 0
    if (!blink) {
      ctx.fillStyle = C.player
      ctx.beginPath(); ctx.arc(W / 2, W / 2, BALANCE.player.radius * ts, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#2b2e38'
      ctx.beginPath()
      ctx.arc(W / 2 + Math.cos(p.facing) * ts * 0.14, W / 2 + Math.sin(p.facing) * ts * 0.14, ts * 0.06, 0, Math.PI * 2)
      ctx.fill()
    }

    // Darkness with light cut out, respecting walls.
    const low = p.battery / run.stats.maxBattery < 0.2
    const flicker = 1 + Math.sin(time * 13) * 0.015 + Math.sin(time * 31) * (low ? 0.05 : 0.01)
    dctx.globalCompositeOperation = 'source-over'
    dctx.fillStyle = '#000'
    dctx.fillRect(0, 0, W, W)
    dctx.globalCompositeOperation = 'destination-out'
    const cut = (poly: Vec[], radiusTiles: number, withOrigin: boolean) => {
      const g = dctx.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, radiusTiles * ts)
      g.addColorStop(0, 'rgba(0,0,0,1)')
      g.addColorStop(0.6, 'rgba(0,0,0,0.85)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      dctx.fillStyle = g
      dctx.beginPath()
      if (withOrigin) dctx.moveTo(W / 2, W / 2)
      poly.forEach((q, i) => (i === 0 && !withOrigin ? dctx.moveTo(sx(q.x), sy(q.y)) : dctx.lineTo(sx(q.x), sy(q.y))))
      dctx.closePath()
      dctx.fill()
    }
    const range = run.stats.lightRange * flicker
    const half = run.stats.lightHalfAngle
    cut(visibilityPolygon(run, p.pos, p.facing - half, p.facing + half, range, 60), range, true)
    const aura = BALANCE.light.auraRadius * 1.15
    cut(visibilityPolygon(run, p.pos, 0, Math.PI * 2, aura, 48), aura, false)
    ctx.drawImage(dark, 0, 0)

    // Warm glow inside the beam.
    const beam = visibilityPolygon(run, p.pos, p.facing - half, p.facing + half, range, 60)
    const glow = ctx.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, range * ts)
    glow.addColorStop(0, 'rgba(255,210,120,0.22)')
    glow.addColorStop(1, 'rgba(255,210,120,0)')
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.moveTo(W / 2, W / 2)
    for (const q of beam) ctx.lineTo(sx(q.x), sy(q.y))
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // HUD
    const u = W / 100
    ctx.font = `bold ${5 * u}px system-ui, sans-serif`
    ctx.textBaseline = 'top'
    ctx.fillStyle = C.hud
    ctx.fillText(`B${f.depth}`, 3 * u, 3 * u)
    const bw = 30 * u, bx = W - bw - 3 * u, by = 4 * u
    ctx.fillStyle = C.hudDim
    ctx.fillRect(bx, by, bw, 3 * u)
    const ratio = p.battery / run.stats.maxBattery
    ctx.fillStyle = ratio < 0.2 ? C.batteryLow : C.battery
    ctx.fillRect(bx, by, bw * ratio, 3 * u)
    ctx.font = `${4 * u}px system-ui, sans-serif`
    ctx.fillStyle = C.coin
    ctx.fillText(`● ${run.coins}`, 3 * u, 10 * u)
    ctx.fillStyle = C.enemyFrozen
    for (let i = 0; i < p.shields; i++) {
      ctx.beginPath(); ctx.arc(bx + i * 5 * u + 2 * u, by + 7 * u, 1.6 * u, 0, Math.PI * 2); ctx.fill()
    }

    if (stick) {
      const k = dpr
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 2 * k
      ctx.beginPath(); ctx.arc(stick.origin.x * k, stick.origin.y * k, 50 * k, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.beginPath(); ctx.arc(stick.knob.x * k, stick.knob.y * k, 20 * k, 0, Math.PI * 2); ctx.fill()
    }
  }

  return { resize, draw }
}
