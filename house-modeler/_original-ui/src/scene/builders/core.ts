import type { HouseModel } from '../../types'
import { FLOOR_HEIGHT_SCALE } from '../constants'
import type { BoxPrimitive, Collider, Rect, SceneData, WalkableSurface } from '../types'

export type FloorMeta = {
  floor: HouseModel['FLOORS'][number]
  base: number
  height: number
}

export type SceneCollector = {
  walls: BoxPrimitive[]
  floors: BoxPrimitive[]
  stairs: BoxPrimitive[]
  trees: BoxPrimitive[]
  colliders: Collider[]
  walkables: WalkableSurface[]
}

export function createCollector(): SceneCollector {
  return {
    walls: [],
    floors: [],
    stairs: [],
    trees: [],
    colliders: [],
    walkables: [],
  }
}

export function computeFloorMeta(house: HouseModel): FloorMeta[] {
  let runningBase = 0
  return house.FLOORS.map((floor) => {
    const height = Math.max(0.25, floor.HEIGHT * FLOOR_HEIGHT_SCALE)
    const current: FloorMeta = { floor, base: runningBase, height }
    runningBase += height
    return current
  })
}

export function collectStairHoles(floorMeta: FloorMeta[]): Map<number, Rect[]> {
  const holesByFloor = new Map<number, Rect[]>()

  floorMeta.forEach(({ floor }, floorIndex) => {
    if (!floor.STAIR || floorIndex >= floorMeta.length - 1) {
      return
    }

    const [from, to] = floor.STAIR.POSITION
    const holeRect: Rect = {
      x1: Math.min(from[0], to[0]) - 0.05,
      x2: Math.max(from[0], to[0]) + 0.05,
      z1: Math.min(from[1], to[1]) - 0.05,
      z2: Math.max(from[1], to[1]) + 0.05,
    }

    // Hole belongs to the slab between this floor and the next one.
    holesByFloor.set(floorIndex, [...(holesByFloor.get(floorIndex) ?? []), holeRect])
  })

  return holesByFloor
}

export function createBoundsTracker() {
  const bounds: Rect = {
    x1: Number.POSITIVE_INFINITY,
    x2: Number.NEGATIVE_INFINITY,
    z1: Number.POSITIVE_INFINITY,
    z2: Number.NEGATIVE_INFINITY,
  }

  return {
    update(rect: Rect) {
      bounds.x1 = Math.min(bounds.x1, rect.x1)
      bounds.x2 = Math.max(bounds.x2, rect.x2)
      bounds.z1 = Math.min(bounds.z1, rect.z1)
      bounds.z2 = Math.max(bounds.z2, rect.z2)
    },
    getSafeBounds(): SceneData['bounds'] {
      return Number.isFinite(bounds.x1)
        ? bounds
        : { x1: -10, x2: 10, z1: -10, z2: 10 }
    },
  }
}
