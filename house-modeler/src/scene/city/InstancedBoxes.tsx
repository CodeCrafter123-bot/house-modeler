import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Color, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three'

export type BoxInstance = {
  center: [number, number, number]
  size: [number, number, number]
  /** Optional per-box color (multiplied with the material color, so keep that white). */
  color?: string
}

type InstancedBoxesProps = {
  items: BoxInstance[]
  castShadow?: boolean
  receiveShadow?: boolean
  /** The material to draw with, e.g. <meshStandardMaterial />. */
  children: ReactNode
}

/** Draws many static boxes in a single draw call. */
export function InstancedBoxes({ items, castShadow, receiveShadow, children }: InstancedBoxesProps) {
  const meshRef = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const matrix = new Matrix4()
    const rotation = new Quaternion()
    const position = new Vector3()
    const scale = new Vector3()
    const color = new Color()

    items.forEach((item, index) => {
      matrix.compose(position.set(...item.center), rotation, scale.set(...item.size))
      mesh.setMatrixAt(index, matrix)
      if (item.color) mesh.setColorAt(index, color.set(item.color))
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])

  if (items.length === 0) return null

  return (
    // Remount when the count changes: an InstancedMesh can't grow after creation.
    <instancedMesh
      key={items.length}
      ref={meshRef}
      args={[undefined, undefined, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <boxGeometry />
      {children}
    </instancedMesh>
  )
}
