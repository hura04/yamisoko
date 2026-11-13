import { BALANCE } from './balance'
import { createFloor, stepFloor } from './floor'
import { createRng, type Rng } from './rng'
import { computeStats, type UpgradeLevels } from './upgrades'
import type { SaveData } from '../save/storage'
import type { DeathCause, FloorEvent, FloorState, PlayerStats, Vec } from './types'

export interface RunState { seed: number; rng: Rng; stats: PlayerStats; floor: FloorState; coins: number }
export interface RunResult { depth: number; coinsEarned: number; deathCause: DeathCause }

export function startRun(levels: UpgradeLevels, seed: number): RunState {
  const rng = createRng(seed)
  const stats = computeStats(levels)
  return { seed, rng, stats, floor: createFloor(1, rng, stats), coins: 0 }
}

export function stepRun(run: RunState, dir: Vec, dt: number): FloorEvent[] {
  const events = stepFloor(run.floor, dir, run.stats, dt, run.rng)
  for (const e of events) if (e === 'coin') run.coins++
  if (run.floor.status === 'cleared') {
    const p = run.floor.player
    run.floor = createFloor(run.floor.depth + 1, run.rng, run.stats, { battery: p.battery, shields: p.shields })
  }
  return events
}

export function isOver(run: RunState): boolean {
  return run.floor.status === 'dead'
}

export function finishRun(run: RunState): RunResult {
  const depth = run.floor.depth
  return { depth, coinsEarned: run.coins + depth * BALANCE.depthBonusCoins, deathCause: run.floor.deathCause ?? 'battery' }
}

export function applyResult(save: SaveData, r: RunResult): SaveData {
  return {
    ...save,
    upgrades: { ...save.upgrades },
    coins: save.coins + r.coinsEarned,
    bestDepth: Math.max(save.bestDepth, r.depth),
    plays: save.plays + 1,
  }
}
