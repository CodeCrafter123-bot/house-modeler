import { midpoint } from '../math'
import type { BoxPrimitive, Rect } from '../types'

export function decorateTrees(bounds: Rect): BoxPrimitive[] {
  const trees: BoxPrimitive[] = []
  const radius = Math.max(22, Math.max(bounds.x2 - bounds.x1, bounds.z2 - bounds.z1) * 1.5)

  for (let index = 0; index < 24; index += 1) {
    const angle = (Math.PI * 2 * index) / 24
    const jitter = ((index % 5) - 2) * 0.9
    const x = midpoint(bounds.x1, bounds.x2) + Math.cos(angle) * (radius + jitter)
    const z = midpoint(bounds.z1, bounds.z2) + Math.sin(angle) * (radius + jitter)

    trees.push({
      id: `trunk-${index}`,
      center: [x, 1, z],
      size: [0.7, 2, 0.7],
      color: '#7c4a2b',
      castShadow: true,
      receiveShadow: true,
    })

    trees.push({
      id: `crown-${index}`,
      center: [x, 2.9, z],
      size: [2.2, 2.2, 2.2],
      color: '#2f855a',
      castShadow: true,
      receiveShadow: true,
    })
  }

  return trees
}
