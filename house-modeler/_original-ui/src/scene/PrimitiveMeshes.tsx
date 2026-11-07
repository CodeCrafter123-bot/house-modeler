import { useTexture } from '@react-three/drei'
import { useEffect } from 'react'
import { RepeatWrapping, SRGBColorSpace } from 'three'
import type { BoxPrimitive } from './types'

type PrimitiveMeshesProps = {
  items: BoxPrimitive[]
  roughness: number
  metalness: number
  textureUrl?: string
  textureRepeat?: [number, number]
}

export function PrimitiveMeshes({
  items,
  roughness,
  metalness,
  textureUrl,
  textureRepeat = [2, 2],
}: PrimitiveMeshesProps) {
  const texture = useTexture(textureUrl ?? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5hR3sAAAAASUVORK5CYII=')

  useEffect(() => {
    if (!textureUrl) {
      return
    }

    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(textureRepeat[0], textureRepeat[1])
    texture.colorSpace = SRGBColorSpace
    texture.needsUpdate = true
  }, [texture, textureRepeat, textureUrl])

  return (
    <>
      {items.map((item) => (
        <mesh
          key={item.id}
          position={item.center}
          castShadow={item.castShadow}
          receiveShadow={item.receiveShadow}
        >
          <boxGeometry args={item.size} />
          <meshStandardMaterial
            color={item.color}
            map={textureUrl ? texture : undefined}
            roughness={roughness}
            metalness={metalness}
          />
        </mesh>
      ))}
    </>
  )
}
