import { BALANCE } from './balance'
import { enemySpeed, stepEnemy, touchesPlayer } from './enemy'
import { inBeam } from './light'
import { bfsDistances, cellsForDepth, generateMaze } from './maze'
import { addBattery, createPlayer, drainBattery, hitPlayer, movePlayer, tickPlayer } from './player'
import type { Rng } from './rng'
import type { FloorEvent, FloorState, Item, PlayerStats, Vec } from './types'

export function tileOf(p: Vec): Vec {
  return { x: Math.floor(p.x), y: Math.floor(p.y) }
}

const center = (t: Vec): Vec => ({ x: t.x + 0.5, y: t.y + 0.5 })

export function createFloor(depth: number, rng: Rng, stats: PlayerStats, carry?: { battery: number; shields: number }): FloorState {
  const maze = generateMaze(cellsForDepth(depth), rng)
  const dist = bfsDistances(maze, maze.start)
  const distOf = (t: Vec) => dist[t.y * maze.width + t.x]

  // Candidate tiles: every cell tile except start and exit, shuffled.
  const pool: Vec[] = []
  for (let y = 1; y < maze.height; y += 2)
    for (let x = 1; x < maze.width; x += 2) {
      if ((x === maze.start.x && y === maze.start.y) || (x === maze.exit.x && y === maze.exit.y)) continue
      pool.push({ x, y })
    }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  /** Takes n tiles at least minDist from start; falls back to the farthest remaining ones. */
  const take = (n: number, minDist: number): Vec[] => {
    const out: Vec[] = []
    for (let i = 0; i < pool.length && out.length < n; ) {
      if (distOf(pool[i]) >= minDist) out.push(pool.splice(i, 1)[0])
      else i++
    }
    while (out.length < n && pool.length > 0) {
      let best = 0
      for (let i = 1; i < pool.length; i++) if (distOf(pool[i]) > distOf(pool[best])) best = i
      out.push(pool.splice(best, 1)[0])
    }
    return out
  }

  const enemies = take(BALANCE.count.enemies(depth), BALANCE.enemy.minSpawnDist)
    .map(t => ({ pos: center(t), mode: 'wander' as const, target: null }))
  const traps = take(BALANCE.count.traps(depth), BALANCE.trap.minSpawnDist)
    .map(t => ({ pos: center(t), triggered: false }))
  const items: Item[] = [
    ...take(BALANCE.floor.coins, 0).map(t => ({ kind: 'coin' as const, pos: center(t), taken: false })),
    ...take(BALANCE.floor.batteries, 0).map(t => ({ kind: 'battery' as const, pos: center(t), taken: false })),
  ]

  return {
    depth,
    maze,
    player: createPlayer(maze.start, stats, carry?.battery, carry?.shields),
    enemies,
    items,
    traps,
    coinsCollected: 0,
    status: 'playing',
    deathCause: null,
  }
}

export function stepFloor(s: FloorState, dir: Vec, stats: PlayerStats, dt: number, rng: Rng): FloorEvent[] {
  if (s.status !== 'playing') return []
  const events: FloorEvent[] = []
  const p = s.player
  dt = Math.min(dt, BALANCE.maxDt)

  tickPlayer(p, dt)
  movePlayer(s.maze, p, dir, stats.speed, dt)
  drainBattery(p, dt)

  for (const item of s.items) {
    if (item.taken) continue
    if (Math.hypot(item.pos.x - p.pos.x, item.pos.y - p.pos.y) > BALANCE.pickups.pickupRadius) continue
    item.taken = true
    if (item.kind === 'coin') {
      s.coinsCollected++
      events.push('coin')
    } else {
      addBattery(p, BALANCE.pickups.battery, stats.maxBattery)
      events.push('battery')
    }
  }

  const pt = tileOf(p.pos)
  for (const trap of s.traps) {
    if (trap.triggered) continue
    const tt = tileOf(trap.pos)
    if (tt.x !== pt.x || tt.y !== pt.y) continue
    trap.triggered = true
    p.battery = Math.max(0, p.battery - BALANCE.pickups.trapDamage)
    events.push('trap')
  }

  const speed = enemySpeed(s.depth)
  for (const e of s.enemies) {
    const frozen = inBeam(s.maze, p.pos, p.facing, stats.lightRange, stats.lightHalfAngle, e.pos)
    stepEnemy(s.maze, e, p.pos, frozen, speed, dt, rng)
    if (!touchesPlayer(e, p.pos)) continue
    const hit = hitPlayer(p)
    if (hit === 'shield') events.push('shield')
    if (hit === 'dead') {
      s.status = 'dead'
      s.deathCause = 'enemy'
      events.push('dead')
      return events
    }
  }

  if (p.battery <= 0) {
    s.status = 'dead'
    s.deathCause = 'battery'
    events.push('dead')
    return events
  }

  if (pt.x === s.maze.exit.x && pt.y === s.maze.exit.y) {
    s.status = 'cleared'
    addBattery(p, BALANCE.pickups.exitRestore, stats.maxBattery)
    events.push('cleared')
  }
  return events
}
