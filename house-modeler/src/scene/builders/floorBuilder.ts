import { FLOOR_THICKNESS } from '../constants'
import { splitRectByHole } from '../geometry'
import { midpoint } from '../math'
import type { Rect } from '../types'
import type { SceneCollector } from './core'

export function addFloorPieces(
  roomRect: Rect,
  floorY: number,
  holes: Rect[],
  idPrefix: string,
  collector: SceneCollector,
) {
  let pieces: Rect[] = [roomRect]

  for (const hole of holes) {
    const nextPieces: Rect[] = []
    for (const piece of pieces) {
      nextPieces.push(...splitRectByHole(piece, hole))
    }
    pieces = nextPieces
  }

  pieces.forEach((piece, index) => {
    collector.floors.push({
      id: `${idPrefix}-piece-${index}`,
      center: [
        midpoint(piece.x1, piece.x2),
        floorY - FLOOR_THICKNESS / 2,
        midpoint(piece.z1, piece.z2),
      ],
      size: [piece.x2 - piece.x1, FLOOR_THICKNESS, piece.z2 - piece.z1],
      color: '#c7d2fe',
      receiveShadow: true,
    })

    collector.walkables.push({ rect: piece, topY: floorY })
  })
}
