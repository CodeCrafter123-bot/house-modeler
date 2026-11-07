import { OUTDOOR_GROUND_Y, PLAYER_HEIGHT, PLAYER_RADIUS } from './constants'
import type { Collider, WalkableSurface } from './types'

export function queryGroundHeight(
  x: number,
  z: number,
  walkables: WalkableSurface[],
  currentY: number,
  maxStepUp: number,
): number {
  let best = OUTDOOR_GROUND_Y
  const maxAllowedY = currentY + maxStepUp

  for (const surface of walkables) {
    if (
      x >= surface.rect.x1 &&
      x <= surface.rect.x2 &&
      z >= surface.rect.z1 &&
      z <= surface.rect.z2 &&
      surface.topY <= maxAllowedY &&
      surface.topY > best
    ) {
      best = surface.topY
    }
  }

  return best
}

export function collidesWithWall(
  x: number,
  feetY: number,
  z: number,
  colliders: Collider[],
): boolean {
  const minX = x - PLAYER_RADIUS
  const maxX = x + PLAYER_RADIUS
  const minZ = z - PLAYER_RADIUS
  const maxZ = z + PLAYER_RADIUS
  const minY = feetY + 0.05
  const maxY = feetY + PLAYER_HEIGHT

  for (const collider of colliders) {
    const overlapX = maxX > collider.minX && minX < collider.maxX
    const overlapY = maxY > collider.minY && minY < collider.maxY
    const overlapZ = maxZ > collider.minZ && minZ < collider.maxZ

    if (overlapX && overlapY && overlapZ) {
      return true
    }
  }

  return false
}
