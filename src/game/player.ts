import { BALANCE } from './balance'
import { isWall } from './maze'
import type { Maze, Player, PlayerStats, Vec } from './types'

const EPS = 1e-6

export function createPlayer(start: Vec, stats: PlayerStats, battery?: number, shields?: number): Player {
  return {
    pos: { x: start.x + 0.5, y: start.y + 0.5 },
    facing: 0,
    battery: battery ?? stats.maxBattery,
    shields: shields ?? stats.shields,
    invulnTimer: 0,
  }
}

export function normalizeDir(dir: Vec): Vec {
  const len = Math.hypot(dir.x, dir.y)
  if (len <= 1) return { x: dir.x, y: dir.y }
  return { x: dir.x / len, y: dir.y / len }
}

/**
 * Moves a body (treated as a square of half-size `radius`) by `delta`,
 * resolving x then y separately so it slides along walls.
 */
export function moveCircle(maze: Maze, pos: Vec, delta: Vec, radius: number): void {
  if (delta.x !== 0) {
    pos.x += delta.x
    const y0 = Math.floor(pos.y - radius + EPS), y1 = Math.floor(pos.y + radius - EPS)
    const col = delta.x > 0 ? Math.floor(pos.x + radius) : Math.floor(pos.x - radius)
    for (let ty = y0; ty <= y1; ty++) {
      if (isWall(maze, col, ty)) {
        pos.x = delta.x > 0 ? col - radius : col + 1 + radius
        break
      }
    }
  }
  if (delta.y !== 0) {
    pos.y += delta.y
    const x0 = Math.floor(pos.x - radius + EPS), x1 = Math.floor(pos.x + radius - EPS)
    const row = delta.y > 0 ? Math.floor(pos.y + radius) : Math.floor(pos.y - radius)
    for (let tx = x0; tx <= x1; tx++) {
      if (isWall(maze, tx, row)) {
        pos.y = delta.y > 0 ? row - radius : row + 1 + radius
        break
      }
    }
  }
}

export function movePlayer(maze: Maze, p: Player, dir: Vec, speed: number, dt: number): void {
  const d = normalizeDir(dir)
  if (d.x === 0 && d.y === 0) return
  p.facing = Math.atan2(d.y, d.x)
  moveCircle(maze, p.pos, { x: d.x * speed * dt, y: d.y * speed * dt }, BALANCE.player.radius)
}

export function drainBattery(p: Player, dt: number): void {
  p.battery = Math.max(0, p.battery - BALANCE.player.drainPerSec * dt)
}

export function addBattery(p: Player, amount: number, max: number): void {
  p.battery = Math.max(0, Math.min(max, p.battery + amount))
}

export function hitPlayer(p: Player): 'shield' | 'dead' | 'ignored' {
  if (p.invulnTimer > 0) return 'ignored'
  if (p.shields > 0) {
    p.shields--
    p.invulnTimer = BALANCE.player.invulnSec
    return 'shield'
  }
  return 'dead'
}

export function tickPlayer(p: Player, dt: number): void {
  p.invulnTimer = Math.max(0, p.invulnTimer - dt)
}
