import { GizmoHelper, GizmoViewport } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import type { HouseModel } from '../types'
import { CityScene } from './city/CityScene'
import { FirstPersonController } from './FirstPersonController'
import { midpoint } from './math'
import { PrimitiveMeshes } from './PrimitiveMeshes'
import { buildSceneData } from './sceneDataBuilder'
import { SceneEnvironment } from './SceneEnvironment'

// Served locally from public/textures so the scene doesn't depend on an internet download.
const FLOOR_TEXTURE_URL = '/textures/hardwood2_diffuse.jpg'
const WALL_TEXTURE_URL = '/textures/brick_diffuse.jpg'
const STAIR_TEXTURE_URL = '/textures/grasslight-big.jpg'

// const FLOOR_TEXTURE_URL = ''
// const WALL_TEXTURE_URL = ''
// const STAIR_TEXTURE_URL = ''

export function HouseScene({ house }: { house: HouseModel }) {
  const data = useMemo(() => buildSceneData(house), [house])
  const centerX = midpoint(data.bounds.x1, data.bounds.x2)
  const centerZ = midpoint(data.bounds.z1, data.bounds.z2)

  return (
    <Canvas shadows camera={{ position: [0, 1.7, 8], fov: 68 }}>
      <SceneEnvironment centerX={centerX} centerZ={centerZ} />

      {/* Each textured group loads on its own, so the rest of the scene shows right away. */}
      <Suspense fallback={null}>
      <PrimitiveMeshes
        items={data.floors}
        roughness={0.86}
        metalness={0.02}
        textureUrl={FLOOR_TEXTURE_URL}
        textureRepeat={[3, 3]}
      />
      </Suspense>
      <Suspense fallback={null}>
      <PrimitiveMeshes
        items={data.walls}
        roughness={0.82}
        metalness={0.03}
        textureUrl={WALL_TEXTURE_URL}
        textureRepeat={[2, 2]}
      />
      </Suspense>
      <Suspense fallback={null}>
      <PrimitiveMeshes
        items={data.stairs}
        roughness={0.92}
        metalness={0.02}
        textureUrl={STAIR_TEXTURE_URL}
        textureRepeat={[4, 4]}
      />
      </Suspense>
      <CityScene city={data.city} />

      <FirstPersonController data={data} />

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['red', 'green', 'blue']} labelColor="white" />
      </GizmoHelper>
    </Canvas>
  )
}
