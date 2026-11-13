/** Tile-unit coordinates. Tile centers are integer + 0.5. */
export interface Vec { x: number; y: number }

/** walls[y * width + x] */
export interface Maze { width: number; height: number; walls: boolean[]; start: Vec; exit: Vec }

export interface PlayerStats {
  speed: number
  lightRange: number
  lightHalfAngle: number
  maxBattery: number
  shields: number
}

/** facing is in radians. */
export interface Player { pos: Vec; facing: number; battery: number; shields: number; invulnTimer: number }

export interface Enemy { pos: Vec; mode: 'wander' | 'chase'; target: Vec | null }

export interface Item { kind: 'coin' | 'battery'; pos: Vec; taken: boolean }

export interface Trap { pos: Vec; triggered: boolean }

export type FloorStatus = 'playing' | 'cleared' | 'dead'
export type DeathCause = 'battery' | 'enemy'

export interface FloorState {
  depth: number
  maze: Maze
  player: Player
  enemies: Enemy[]
  items: Item[]
  traps: Trap[]
  coinsCollected: number
  status: FloorStatus
  deathCause: DeathCause | null
}

export type FloorEvent = 'coin' | 'battery' | 'trap' | 'shield' | 'cleared' | 'dead'
