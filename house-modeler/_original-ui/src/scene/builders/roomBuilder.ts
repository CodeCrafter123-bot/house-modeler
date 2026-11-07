import { midpoint } from '../math'
import type { Rect } from '../types'
import type { SceneCollector } from './core'
import { addFloorPieces } from './floorBuilder'
import { addRoomWall, buildOpenings, buildRoomRect } from './wallBuilder'

type AddRoomGeometryArgs = {
  room: Parameters<typeof buildOpenings>[0]
  floorIndex: number
  roomIndex: number
  floorY: number
  wallRoofY: number
  slabY: number
  addBaseFloor: boolean
  baseFloorHoles: Rect[]
  roofHoles: Rect[]
  collector: SceneCollector
  updateBounds: (rect: Rect) => void
}

export function addRoomGeometry({
  room,
  floorIndex,
  roomIndex,
  floorY,
  wallRoofY,
  slabY,
  addBaseFloor,
  baseFloorHoles,
  roofHoles,
  collector,
  updateBounds,
}: AddRoomGeometryArgs) {
  const rect = buildRoomRect(room)
  updateBounds(rect)

  if (addBaseFloor) {
    addFloorPieces(rect, floorY, baseFloorHoles, `floor-${floorIndex}-${roomIndex}`, collector)
  }

  addFloorPieces(rect, slabY, roofHoles, `roof-${floorIndex}-${roomIndex}`, collector)

  const openings = buildOpenings(room)
  const idPrefix = `wall-${floorIndex}-${roomIndex}`

  // Swap FRONT<->BACK and LEFT<->RIGHT for wall logic
  addRoomWall({
    wall: 'BACK',
    length: rect.x2 - rect.x1,
    centerX: midpoint(rect.x1, rect.x2),
    centerZ: rect.z1,
    floorY,
    roofY: wallRoofY,
    openingKind: openings.get('BACK'),
    idPrefix,
    collector,
  })

  addRoomWall({
    wall: 'FRONT',
    length: rect.x2 - rect.x1,
    centerX: midpoint(rect.x1, rect.x2),
    centerZ: rect.z2,
    floorY,
    roofY: wallRoofY,
    openingKind: openings.get('FRONT'),
    idPrefix,
    collector,
  })

  addRoomWall({
    wall: 'RIGHT',
    length: rect.z2 - rect.z1,
    centerX: rect.x1,
    centerZ: midpoint(rect.z1, rect.z2),
    floorY,
    roofY: wallRoofY,
    openingKind: openings.get('RIGHT'),
    idPrefix,
    collector,
  })

  addRoomWall({
    wall: 'LEFT',
    length: rect.z2 - rect.z1,
    centerX: rect.x2,
    centerZ: midpoint(rect.z1, rect.z2),
    floorY,
    roofY: wallRoofY,
    openingKind: openings.get('LEFT'),
    idPrefix,
    collector,
  })
}
