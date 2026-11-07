import type { HouseModel } from '../types'
import {
  collectStairHoles,
  computeFloorMeta,
  createBoundsTracker,
  createCollector,
} from './builders/core'
import { decorateTrees } from './builders/natureBuilder'
import { addRoomGeometry } from './builders/roomBuilder'
import { addStairsForFloor } from './builders/stairBuilder'
import { mergeOverlappingWalls } from './builders/wallBuilder'
import { FLOOR_THICKNESS } from './constants'
import { makeCollider } from './math'
import type { SceneData } from './types'

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
  collector.trees = decorateTrees(bounds)

  return {
    ...collector,
    bounds,
  }
}
