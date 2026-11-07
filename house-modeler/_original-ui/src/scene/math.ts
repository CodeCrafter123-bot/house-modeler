import type { Collider } from './types'

export function midpoint(a: number, b: number): number {
  return (a + b) / 2
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function makeCollider(
  center: [number, number, number],
  size: [number, number, number],
): Collider {
  return {
    minX: center[0] - size[0] / 2,
    maxX: center[0] + size[0] / 2,
    minY: center[1] - size[1] / 2,
    maxY: center[1] + size[1] / 2,
    minZ: center[2] - size[2] / 2,
    maxZ: center[2] + size[2] / 2,
  }
}
