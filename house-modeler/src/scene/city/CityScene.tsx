import { useEffect, useMemo } from 'react'
import { ROAD_WIDTH, SIDEWALK_TOP_Y } from '../builders/cityBuilder'
import { OUTDOOR_GROUND_Y } from '../constants'
import type { CityBuilding, CityLayout } from '../types'
import { BAY_SIZE, BAYS_PER_TILE, createOfficeFacade, createResidentialFacade } from './facadeTextures'
import { InstancedBoxes, type BoxInstance } from './InstancedBoxes'
import { Traffic } from './Traffic'

const MARKING_Y = OUTDOOR_GROUND_Y + 0.012
const SLAB_BOTTOM_Y = OUTDOOR_GROUND_Y - 0.04

/** Sidewalk slabs for every block, and the lawn the compiled house stands on. */
function useGroundPieces(city: CityLayout) {
  return useMemo(() => {
    const slabHeight = SIDEWALK_TOP_Y - SLAB_BOTTOM_Y
    const slabs: BoxInstance[] = city.blocks.map((b) => ({
      center: [(b.x1 + b.x2) / 2, SLAB_BOTTOM_Y + slabHeight / 2, (b.z1 + b.z2) / 2],
      size: [b.x2 - b.x1, slabHeight, b.z2 - b.z1],
    }))
    const { lot } = city
    const lawn: BoxInstance[] = [
      {
        center: [(lot.x1 + lot.x2) / 2, SIDEWALK_TOP_Y + 0.005, (lot.z1 + lot.z2) / 2],
        size: [lot.x2 - lot.x1, 0.02, lot.z2 - lot.z1],
      },
    ]
    return { slabs, lawn }
  }, [city])
}

/** Dashed centre lines, crosswalks and stop lines. */
function useRoadMarkings(city: CityLayout) {
  return useMemo(() => {
    const centerLines: BoxInstance[] = []
    const white: BoxInstance[] = []
    const half = ROAD_WIDTH / 2
    const nearCrossing = (v: number, crossings: number[]) =>
      crossings.some((c) => Math.abs(v - c) < half + 4.2)

    for (const z of city.streetsZ) {
      for (let x = city.extent.x1; x < city.extent.x2; x += 6) {
        if (!nearCrossing(x, city.streetsX)) centerLines.push({ center: [x, MARKING_Y, z], size: [3, 0.02, 0.18] })
      }
    }
    for (const x of city.streetsX) {
      for (let z = city.extent.z1; z < city.extent.z2; z += 6) {
        if (!nearCrossing(z, city.streetsZ)) centerLines.push({ center: [x, MARKING_Y, z], size: [0.18, 0.02, 3] })
      }
    }

    for (const sx of city.streetsX) {
      for (const sz of city.streetsZ) {
        for (const side of [1, -1]) {
          // Zebra stripes on each of the four arms of the intersection.
          for (let k = -half + 0.7; k < half - 0.4; k += 1.1) {
            white.push({ center: [sx + side * (half + 1.6), MARKING_Y, sz + k], size: [2.2, 0.02, 0.55] })
            white.push({ center: [sx + k, MARKING_Y, sz + side * (half + 1.6)], size: [0.55, 0.02, 2.2] })
          }
          // Stop lines, only across the lane that approaches the intersection.
          white.push({
            center: [sx + side * (half + 3.1), MARKING_Y, sz - side * (ROAD_WIDTH / 4)],
            size: [0.35, 0.02, half - 0.3],
          })
          white.push({
            center: [sx + side * (ROAD_WIDTH / 4), MARKING_Y, sz + side * (half + 3.1)],
            size: [half - 0.3, 0.02, 0.35],
          })
        }
      }
    }
    return { centerLines, white }
  }, [city])
}

function Buildings({ buildings }: { buildings: CityBuilding[] }) {
  // One shared window texture per style; each building gets a copy with its own tiling
  // so windows keep the same real-world size whatever the building's size.
  const textures = useMemo(() => {
    const base = { office: createOfficeFacade(), residential: createResidentialFacade() }
    const perBuilding = buildings.map((b) => {
      const texture = base[b.style].clone()
      const [w, h, d] = b.size
      texture.repeat.set(Math.max(w, d) / BAY_SIZE / BAYS_PER_TILE, h / BAY_SIZE / BAYS_PER_TILE)
      texture.needsUpdate = true
      return texture
    })
    return { base, perBuilding }
  }, [buildings])

  useEffect(
    () => () => {
      textures.perBuilding.forEach((texture) => texture.dispose())
      textures.base.office.dispose()
      textures.base.residential.dispose()
    },
    [textures],
  )

  const roofs = useMemo(() => {
    const items: BoxInstance[] = []
    for (const b of buildings) {
      const [x, y, z] = b.center
      const [w, h, d] = b.size
      const top = y + h / 2
      items.push({ center: [x, top + 0.25, z], size: [w + 0.3, 0.5, d + 0.3], color: b.roofColor })
      if (b.style === 'office') {
        // Rooftop machine room.
        items.push({ center: [x, top + 1.3, z], size: [w * 0.35, 1.6, d * 0.35], color: '#9ca3af' })
      }
    }
    return items
  }, [buildings])

  return (
    <>
      {buildings.map((b, index) => (
        <mesh key={b.id} position={b.center} receiveShadow>
          <boxGeometry args={b.size} />
          <meshStandardMaterial
            map={textures.perBuilding[index]}
            color={b.color}
            roughness={b.style === 'office' ? 0.35 : 0.8}
            metalness={b.style === 'office' ? 0.25 : 0.02}
          />
        </mesh>
      ))}
      <InstancedBoxes items={roofs} receiveShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.85} />
      </InstancedBoxes>
    </>
  )
}

/** Streets, sidewalks, buildings and traffic around the compiled house. */
export function CityScene({ city }: { city: CityLayout }) {
  const { slabs, lawn } = useGroundPieces(city)
  const { centerLines, white } = useRoadMarkings(city)

  return (
    <>
      <InstancedBoxes items={slabs} receiveShadow>
        <meshStandardMaterial color="#b4b8be" roughness={0.95} />
      </InstancedBoxes>
      <InstancedBoxes items={lawn} receiveShadow>
        <meshStandardMaterial color="#5f8f52" roughness={0.95} />
      </InstancedBoxes>
      <InstancedBoxes items={centerLines}>
        <meshStandardMaterial color="#f2c200" roughness={0.6} />
      </InstancedBoxes>
      <InstancedBoxes items={white}>
        <meshStandardMaterial color="#f5f5f5" roughness={0.6} />
      </InstancedBoxes>

      <Buildings buildings={city.buildings} />
      <Traffic city={city} />
    </>
  )
}
