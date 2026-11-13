import type { Maze } from '../../src/game/types'

/** 11x11 maze with only the outer border as walls. */
export function openMaze(size = 11): Maze {
  const walls: boolean[] = []
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      walls.push(x === 0 || y === 0 || x === size - 1 || y === size - 1)
  return { width: size, height: size, walls, start: { x: 1, y: 1 }, exit: { x: size - 2, y: size - 2 } }
}

/** openMaze plus a full wall column at x = 5 (except border handled anyway). */
export function wallMaze(): Maze {
  const m = openMaze()
  for (let y = 0; y < m.height; y++) m.walls[y * m.width + 5] = true
  return m
}
