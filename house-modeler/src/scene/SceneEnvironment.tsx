import { Sky } from '@react-three/drei'
import { OUTDOOR_GROUND_Y } from './constants'

type SceneEnvironmentProps = {
  centerX: number
  centerZ: number
}

export function SceneEnvironment({ centerX, centerZ }: SceneEnvironmentProps) {
  // Place sun and directional light behind the player (spawn at x=5, z=5), projecting toward house center
  // Sun and light position: behind player, slightly elevated
  const sunPos = [5, 6, 10] // behind spawn, up and back
  const lightPos = [5, 5.71, 10]
  // Target is house center
  const targetPos = [centerX, 0, centerZ]
  return (
    <>
      <color attach="background" args={['#cfe7ff']} />
      <fog attach="fog" args={['#cfe7ff', 60, 190]} />

      <Sky distance={450000} sunPosition={sunPos} inclination={0.53} azimuth={0.23} />

      <hemisphereLight intensity={0.5} groundColor="#6b7280" color="#f8fafc" />
      <ambientLight intensity={0.25} />
      <directionalLight
        castShadow
        position={lightPos}
        intensity={1.05}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      >
        <object3D attach="target" position={targetPos} />
      </directionalLight>

      <mesh receiveShadow position={[centerX, OUTDOOR_GROUND_Y - 0.08, centerZ]}>
        {/* Asphalt everywhere; sidewalks, the house lawn and markings sit on top (see city/CityScene). */}
        <boxGeometry args={[700, 0.16, 700]} />
        <meshStandardMaterial color="#3a3d42" roughness={0.95} metalness={0.02} />
      </mesh>
    </>
  )
}
