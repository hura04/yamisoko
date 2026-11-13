import { BALANCE } from './balance'
import { isWall } from './maze'
import type { Maze, Vec } from './types'

const STEP = 0.1

export function hasLineOfSight(maze: Maze, a: Vec, b: Vec): boolean {
  const dx = b.x - a.x, dy = b.y - a.y
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / STEP))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    if (isWall(maze, Math.floor(a.x + dx * t), Math.floor(a.y + dy * t))) return false
  }
  return true
}

function angleDiff(a: number, b: number): number {
  let d = (a - b) % (2 * Math.PI)
  if (d > Math.PI) d -= 2 * Math.PI
  if (d < -Math.PI) d += 2 * Math.PI
  return Math.abs(d)
}

export function inBeam(maze: Maze, origin: Vec, facing: number, range: number, halfAngle: number, p: Vec): boolean {
  const dx = p.x - origin.x, dy = p.y - origin.y
  const dist = Math.hypot(dx, dy)
  if (dist > range) return false
  if (dist > 1e-9 && angleDiff(Math.atan2(dy, dx), facing) > halfAngle) return false
  return hasLineOfSight(maze, origin, p)
}

export function inAura(maze: Maze, origin: Vec, p: Vec): boolean {
  if (Math.hypot(p.x - origin.x, p.y - origin.y) > BALANCE.light.auraRadius) return false
  return hasLineOfSight(maze, origin, p)
}

export function isLit(maze: Maze, origin: Vec, facing: number, range: number, halfAngle: number, p: Vec): boolean {
  return inAura(maze, origin, p) || inBeam(maze, origin, facing, range, halfAngle, p)
}
