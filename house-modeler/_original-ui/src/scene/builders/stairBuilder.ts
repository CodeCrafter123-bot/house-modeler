import { STAIRS_STEPS } from '../constants'
import { midpoint } from '../math'
import type { Rect } from '../types'
import type { FloorMeta, SceneCollector } from './core'

type AddStairsArgs = {
  floorMeta: FloorMeta[]
  floorIndex: number
  floorY: number
  collector: SceneCollector
  updateBounds: (rect: Rect) => void
}

export function addStairsForFloor({
  floorMeta,
  floorIndex,
  floorY,
  collector,
  updateBounds,
}: AddStairsArgs) {
  const stair = floorMeta[floorIndex].floor.STAIR
  if (!stair || floorIndex >= floorMeta.length - 1) {
    return
  }

  const nextBase = floorMeta[floorIndex + 1].base
  const [start, end] = stair.POSITION
  const x1 = Math.min(start[0], end[0])
  const x2 = Math.max(start[0], end[0])
  const z1 = Math.min(start[1], end[1])
  const z2 = Math.max(start[1], end[1])

  updateBounds({ x1, x2, z1, z2 })

  // Swap LEFT/RIGHT and FRONT/BACK logic
  // Now: LEFT_RIGHT <-> FRONT_BACK, RIGHT_LEFT <-> BACK_FRONT
  const alongX =
    stair.DIRECTION === 'LEFT_RIGHT' || stair.DIRECTION === 'RIGHT_LEFT'
  const isReverse =
    stair.DIRECTION === 'RIGHT_LEFT' || stair.DIRECTION === 'FRONT_BACK'
  const rise = (nextBase - floorY) / STAIRS_STEPS

  for (let step = 0; step < STAIRS_STEPS; step += 1) {
    const progress = isReverse ? STAIRS_STEPS - 1 - step : step
    const bottom = floorY + rise * step
    const top = floorY + rise * (step + 1)
    const stepHeight = Math.max(0.02, top - bottom)

    const rect: Rect = alongX
      ? {
        x1: x1 + ((x2 - x1) / STAIRS_STEPS) * progress,
        x2: x1 + ((x2 - x1) / STAIRS_STEPS) * (progress + 1),
        z1,
        z2,
      }
      : {
        x1,
        x2,
        z1: z1 + ((z2 - z1) / STAIRS_STEPS) * progress,
        z2: z1 + ((z2 - z1) / STAIRS_STEPS) * (progress + 1),
      }

    collector.stairs.push({
      id: `stair-${floorIndex}-${step}`,
      center: [midpoint(rect.x1, rect.x2), bottom + stepHeight / 2, midpoint(rect.z1, rect.z2)],
      size: [Math.max(0.05, rect.x2 - rect.x1), stepHeight, Math.max(0.05, rect.z2 - rect.z1)],
      color: '#9ca3af',
      castShadow: true,
      receiveShadow: true,
    })

    collector.walkables.push({ rect, topY: top })
  }
}
