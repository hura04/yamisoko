import { BALANCE } from './balance'
import type { Rng } from './rng'
import type { Maze, Vec } from './types'

export function cellsForDepth(depth: number): number {
  const f = BALANCE.floor
  return Math.min(f.baseCells + f.cellsStep * Math.floor((depth - 1) / f.floorsPerStep), f.maxCells)
}

export function isWall(maze: Maze, tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= maze.width || ty >= maze.height) return true
  return maze.walls[ty * maze.width + tx]
}

const DIRS: Vec[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]

/** Iterative depth-first carving. Cell (cx, cy) maps to tile (2cx+1, 2cy+1). */
export function generateMaze(cells: number, rng: Rng): Maze {
  const size = 2 * cells + 1
  const walls = new Array<boolean>(size * size).fill(true)
  const visited = new Array<boolean>(cells * cells).fill(false)
  const open = (tx: number, ty: number) => { walls[ty * size + tx] = false }

  const stack: Vec[] = [{ x: 0, y: 0 }]
  visited[0] = true
  open(1, 1)
  while (stack.length > 0) {
    const cur = stack[stack.length - 1]
    const options = DIRS.filter(d => {
      const nx = cur.x + d.x, ny = cur.y + d.y
      return nx >= 0 && ny >= 0 && nx < cells && ny < cells && !visited[ny * cells + nx]
    })
    if (options.length === 0) { stack.pop(); continue }
    const d = options[Math.floor(rng() * options.length)]
    const nx = cur.x + d.x, ny = cur.y + d.y
    visited[ny * cells + nx] = true
    open(2 * cur.x + 1 + d.x, 2 * cur.y + 1 + d.y)
    open(2 * nx + 1, 2 * ny + 1)
    stack.push({ x: nx, y: ny })
  }

  const maze: Maze = { width: size, height: size, walls, start: { x: 1, y: 1 }, exit: { x: 1, y: 1 } }
  const dist = bfsDistances(maze, maze.start)
  let best = 0
  for (let i = 0; i < dist.length; i++) if (dist[i] > dist[best]) best = i
  maze.exit = { x: best % size, y: Math.floor(best / size) }
  return maze
}

export function bfsDistances(maze: Maze, from: Vec): number[] {
  const dist = new Array<number>(maze.width * maze.height).fill(-1)
  if (isWall(maze, from.x, from.y)) return dist
  const queue: Vec[] = [from]
  dist[from.y * maze.width + from.x] = 0
  for (let head = 0; head < queue.length; head++) {
    const c = queue[head]
    const base = dist[c.y * maze.width + c.x]
    for (const d of DIRS) {
      const nx = c.x + d.x, ny = c.y + d.y
      if (isWall(maze, nx, ny) || dist[ny * maze.width + nx] >= 0) continue
      dist[ny * maze.width + nx] = base + 1
      queue.push({ x: nx, y: ny })
    }
  }
  return dist
}
