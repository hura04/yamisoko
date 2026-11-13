/** All tunable numbers. Units: tiles, seconds, radians. */
export const BALANCE = {
  maxDt: 0.1,
  player: { radius: 0.3, baseSpeed: 3, baseMaxBattery: 100, drainPerSec: 2, invulnSec: 1.5 },
  light: { baseRange: 4, baseHalfAngle: Math.PI / 6, auraRadius: 1.2 },
  pickups: { battery: 30, exitRestore: 15, trapDamage: 25, pickupRadius: 0.5 },
  enemy: { radius: 0.35, baseSpeed: 1.6, speedPerFloor: 0.05, maxSpeed: 3.0, chaseRadius: 5, minSpawnDist: 6 },
  trap: { minSpawnDist: 3 },
  floor: { baseCells: 6, cellsStep: 2, floorsPerStep: 10, maxCells: 16, coins: 5, batteries: 2 },
  count: {
    enemies: (d: number) => Math.min(1 + Math.floor(d / 2), 8),
    traps: (d: number) => Math.min(1 + Math.floor(d / 3), 4),
  },
  depthBonusCoins: 2,
} as const
