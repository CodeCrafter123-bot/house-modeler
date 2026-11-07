import type { RoomItem, Wall } from '../../types'
import { WALL_THICKNESS } from '../constants'
import { makeCollider } from '../math'
import type { BoxPrimitive, OpeningKind, Rect } from '../types'
import type { SceneCollector } from './core'

type WallSectionArgs = {
  wall: Wall
  length: number
  centerX: number
  centerZ: number
  floorY: number
  roofY: number
  openingKind: OpeningKind | undefined
  idPrefix: string
  collector: SceneCollector
}

function addWallSection(
  collector: SceneCollector,
  id: string,
  center: [number, number, number],
  size: [number, number, number],
) {
  if (size[0] <= 0.03 || size[1] <= 0.03 || size[2] <= 0.03) {
    return
  }

  collector.walls.push({
    id,
    center,
    size,
    color: '#e2e8f0',
    castShadow: true,
    receiveShadow: true,
  })
  collector.colliders.push(makeCollider(center, size))
}

export function buildOpenings(room: RoomItem): Map<Wall, OpeningKind> {
  const byWall = new Map<Wall, OpeningKind>()

  room.WINDOWS?.forEach((windowItem) => {
    if (!byWall.has(windowItem.WALL)) {
      byWall.set(windowItem.WALL, 'window')
    }
  })

  room.DOORS.forEach((door) => {
    byWall.set(door.WALL, 'door')
  })

  return byWall
}

export function addRoomWall({
  wall,
  length,
  centerX,
  centerZ,
  floorY,
  roofY,
  openingKind,
  idPrefix,
  collector,
}: WallSectionArgs) {
  const alongX = wall === 'FRONT' || wall === 'BACK'

  if (!openingKind) {
    addWallSection(
      collector,
      `${idPrefix}-${wall}-full`,
      [centerX, (floorY + roofY) / 2, centerZ],
      alongX ? [length, roofY - floorY, WALL_THICKNESS] : [WALL_THICKNESS, roofY - floorY, length],
    )
    return
  }

  const openingWidth = Math.min(openingKind === 'door' ? 1.2 : 1.4, length * 0.72)
  const openingBottom = openingKind === 'door' ? floorY : floorY + 1.0
  const openingTop = Math.min(openingKind === 'door' ? floorY + 2.1 : floorY + 2.0, roofY - 0.2)
  const sideWidth = Math.max(0, (length - openingWidth) / 2)

  const addSegment = (
    suffix: string,
    segmentLength: number,
    segmentBottom: number,
    segmentTop: number,
    axisOffset: number,
  ) => {
    const segmentHeight = segmentTop - segmentBottom
    const center = alongX
      ? ([centerX + axisOffset, segmentBottom + segmentHeight / 2, centerZ] as [number, number, number])
      : ([centerX, segmentBottom + segmentHeight / 2, centerZ + axisOffset] as [number, number, number])
    const size = alongX
      ? ([segmentLength, segmentHeight, WALL_THICKNESS] as [number, number, number])
      : ([WALL_THICKNESS, segmentHeight, segmentLength] as [number, number, number])

    addWallSection(collector, `${idPrefix}-${wall}-${suffix}`, center, size)
  }

  addSegment('left', sideWidth, floorY, roofY, -(length / 2 - sideWidth / 2))
  addSegment('right', sideWidth, floorY, roofY, length / 2 - sideWidth / 2)
  addSegment('bottom', openingWidth, floorY, openingBottom, 0)
  addSegment('top', openingWidth, openingTop, roofY, 0)
}

export function buildRoomRect(room: RoomItem): Rect {
  const [start, end] = room.POSITION
  return {
    x1: Math.min(start[0], end[0]),
    x2: Math.max(start[0], end[0]),
    z1: Math.min(start[1], end[1]),
    z2: Math.max(start[1], end[1]),
  }
}

type WallGroup = {
  alongX: boolean
  fixedAxis: number
  yMin: number
  yMax: number
  thickness: number
  color: string
  castShadow?: boolean
  receiveShadow?: boolean
  intervals: Array<{ start: number; end: number }>
}

function roundKey(value: number): string {
  return value.toFixed(4)
}

export function mergeOverlappingWalls(walls: BoxPrimitive[]): BoxPrimitive[] {
  const groups = new Map<string, WallGroup>()

  walls.forEach((wall) => {
    const alongX = wall.size[0] >= wall.size[2]
    const fixedAxis = alongX ? wall.center[2] : wall.center[0]
    const yMin = wall.center[1] - wall.size[1] / 2
    const yMax = wall.center[1] + wall.size[1] / 2
    const thickness = alongX ? wall.size[2] : wall.size[0]
    const axisMin = (alongX ? wall.center[0] : wall.center[2]) - (alongX ? wall.size[0] : wall.size[2]) / 2
    const axisMax = (alongX ? wall.center[0] : wall.center[2]) + (alongX ? wall.size[0] : wall.size[2]) / 2

    const key = [
      alongX ? 'x' : 'z',
      roundKey(fixedAxis),
      roundKey(yMin),
      roundKey(yMax),
      roundKey(thickness),
      wall.color,
    ].join('|')

    const existing = groups.get(key)
    if (existing) {
      existing.intervals.push({ start: axisMin, end: axisMax })
      return
    }

    groups.set(key, {
      alongX,
      fixedAxis,
      yMin,
      yMax,
      thickness,
      color: wall.color,
      castShadow: wall.castShadow,
      receiveShadow: wall.receiveShadow,
      intervals: [{ start: axisMin, end: axisMax }],
    })
  })

  const mergedWalls: BoxPrimitive[] = []
  const overlapEpsilon = 0.0001

  groups.forEach((group, groupIndex) => {
    const sorted = [...group.intervals].sort((a, b) => a.start - b.start)
    const mergedIntervals: Array<{ start: number; end: number }> = []

    sorted.forEach((interval) => {
      const last = mergedIntervals[mergedIntervals.length - 1]
      if (!last || interval.start > last.end + overlapEpsilon) {
        mergedIntervals.push({ ...interval })
        return
      }

      last.end = Math.max(last.end, interval.end)
    })

    mergedIntervals.forEach((interval, intervalIndex) => {
      const length = interval.end - interval.start
      const yCenter = (group.yMin + group.yMax) / 2
      const center = group.alongX
        ? ([
          (interval.start + interval.end) / 2,
          yCenter,
          group.fixedAxis,
        ] as [number, number, number])
        : ([
          group.fixedAxis,
          yCenter,
          (interval.start + interval.end) / 2,
        ] as [number, number, number])
      const size = group.alongX
        ? ([length, group.yMax - group.yMin, group.thickness] as [number, number, number])
        : ([group.thickness, group.yMax - group.yMin, length] as [number, number, number])

      mergedWalls.push({
        id: `wall-merged-${groupIndex}-${intervalIndex}`,
        center,
        size,
        color: group.color,
        castShadow: group.castShadow,
        receiveShadow: group.receiveShadow,
      })
    })
  })

  return mergedWalls
}
