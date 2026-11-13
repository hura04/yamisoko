import { BALANCE } from './balance'
import { hasLineOfSight } from './light'
import { isWall } from './maze'
import { moveCircle } from './player'
import type { Rng } from './rng'
import type { Enemy, Maze, Vec } from './types'

const ARRIVE = 0.2

export function enemySpeed(depth: number): number {
  const e = BALANCE.enemy
  return Math.min(e.baseSpeed + e.speedPerFloor * (depth - 1), e.maxSpeed)
}

function stepToward(maze: Maze, e: Enemy, to: Vec, speed: number, dt: number): number {
  const dx = to.x - e.pos.x, dy = to.y - e.pos.y
  const d = Math.hypot(dx, dy)
  if (d < 1e-9) return 0
  const s = Math.min(d, speed * dt)
  const before = { ...e.pos }
  moveCircle(maze, e.pos, { x: (dx / d) * s, y: (dy / d) * s }, BALANCE.enemy.radius)
  return Math.hypot(e.pos.x - before.x, e.pos.y - before.y)
}

function pickWanderTarget(maze: Maze, e: Enemy, rng: Rng): Vec {
  const tx = Math.floor(e.pos.x), ty = Math.floor(e.pos.y)
  const options = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dy]) => ({ x: tx + dx, y: ty + dy }))
    .filter(t => !isWall(maze, t.x, t.y))
  if (options.length === 0) return { x: tx + 0.5, y: ty + 0.5 }
  const t = options[Math.floor(rng() * options.length)]
  return { x: t.x + 0.5, y: t.y + 0.5 }
}

export function stepEnemy(maze: Maze, e: Enemy, playerPos: Vec, frozen: boolean, speed: number, dt: number, rng: Rng): void {
  if (frozen) return
  const dist = Math.hypot(playerPos.x - e.pos.x, playerPos.y - e.pos.y)
  if (dist <= BALANCE.enemy.chaseRadius && hasLineOfSight(maze, e.pos, playerPos)) {
    e.mode = 'chase'
    e.target = null
    stepToward(maze, e, playerPos, speed, dt)
    return
  }
  e.mode = 'wander'
  if (!e.target || Math.hypot(e.target.x - e.pos.x, e.target.y - e.pos.y) < ARRIVE) {
    e.target = pickWanderTarget(maze, e, rng)
  }
  const moved = stepToward(maze, e, e.target, speed, dt)
  if (moved < 1e-6) e.target = null
}

export function touchesPlayer(e: Enemy, playerPos: Vec): boolean {
  return Math.hypot(playerPos.x - e.pos.x, playerPos.y - e.pos.y) < BALANCE.player.radius + BALANCE.enemy.radius
}
