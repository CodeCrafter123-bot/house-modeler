import type { Rect } from './types'

export function splitRectByHole(rect: Rect, hole: Rect): Rect[] {
  const ix1 = Math.max(rect.x1, hole.x1)
  const ix2 = Math.min(rect.x2, hole.x2)
  const iz1 = Math.max(rect.z1, hole.z1)
  const iz2 = Math.min(rect.z2, hole.z2)

  if (ix1 >= ix2 || iz1 >= iz2) {
    return [rect]
  }

  const fragments: Rect[] = []

  if (rect.x1 < ix1) {
    fragments.push({ x1: rect.x1, x2: ix1, z1: rect.z1, z2: rect.z2 })
  }
  if (ix2 < rect.x2) {
    fragments.push({ x1: ix2, x2: rect.x2, z1: rect.z1, z2: rect.z2 })
  }
  if (rect.z1 < iz1) {
    fragments.push({ x1: ix1, x2: ix2, z1: rect.z1, z2: iz1 })
  }
  if (iz2 < rect.z2) {
    fragments.push({ x1: ix1, x2: ix2, z1: iz2, z2: rect.z2 })
  }

  return fragments.filter(
    (fragment) => fragment.x2 - fragment.x1 > 0.03 && fragment.z2 - fragment.z1 > 0.03,
  )
}
