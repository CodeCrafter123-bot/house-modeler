import type { HouseModel } from '../types'
import {
  collectStairHoles,
  computeFloorMeta,
  createBoundsTracker,
  createCollector,
} from './builders/core'
import { buildCity } from './builders/cityBuilder'
import { addRoomGeometry } from './builders/roomBuilder'
import { addStairsForFloor } from './builders/stairBuilder'
import { mergeOverlappingWalls } from './builders/wallBuilder'
import { FLOOR_THICKNESS } from './constants'
import { makeCollider } from './math'
import type { SceneData } from './types'

// Pure named colors look harsh on walls, so names map to softer paint shades.
// Hex codes are used exactly as written.
const PAINT_SHADES: Record<string, string> = {
  red: '#c0473a',
  blue: '#4a78b8',
  green: '#5e9a55',
  yellow: '#e8c94f',
  orange: '#e08a3c',
  purple: '#8461a8',
  pink: '#e39ab0',
  brown: '#8a5a3b',
  white: '#f4f2ee',
  black: '#2e2e30',
  gray: '#9a9a9a',
  grey: '#9a9a9a',
  beige: '#e4d5b7',
}

function toWallColor(color: string): string {
  const key = color.toLowerCase()
  return PAINT_SHADES[key] ?? key
}

export function buildSceneData(house: HouseModel): SceneData {
  const collector = createCollector()
  const floorMeta = computeFloorMeta(house)
  const stairHolesByFloor = collectStairHoles(floorMeta)
  const boundsTracker = createBoundsTracker()

  floorMeta.forEach(({ floor, base, height }, floorIndex) => {
    const floorY = base
    const roofY = base + height
    const wallRoofY = floorIndex < floorMeta.length - 1
      ? Math.max(floorY + 0.25, roofY - FLOOR_THICKNESS)
      : roofY
    const roofHoles = stairHolesByFloor.get(floorIndex) ?? []
    const firstWallOfFloor = collector.walls.length

    floor.ROOMS.forEach((room, roomIndex) => {
      addRoomGeometry({
        room,
        floorIndex,
        roomIndex,
        floorY,
        wallRoofY,
        slabY: roofY,
        addBaseFloor: floorIndex === 0,
        baseFloorHoles: [],
        roofHoles,
        collector,
        updateBounds: boundsTracker.update,
      })
    })

    // Paint this floor's walls with its COLOR, if the code gave one.
    if (floor.COLOR) {
      const wallColor = toWallColor(floor.COLOR)
      for (let i = firstWallOfFloor; i < collector.walls.length; i++) {
        collector.walls[i].color = wallColor
      }
    }

    addStairsForFloor({
      floorMeta,
      floorIndex,
      floorY,
      collector,
      updateBounds: boundsTracker.update,
    })
  })

  collector.walls = mergeOverlappingWalls(collector.walls)
  collector.colliders = collector.walls.map((wall) => makeCollider(wall.center, wall.size))

  const bounds = boundsTracker.getSafeBounds()
  const { city, colliders: buildingColliders } = buildCity(bounds)
  collector.colliders.push(...buildingColliders)

  return {
    ...collector,
    bounds,
    city,
  }
}
