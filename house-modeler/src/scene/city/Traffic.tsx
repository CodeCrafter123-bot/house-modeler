import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, Matrix4, Quaternion, Vector3, type InstancedMesh, type MeshStandardMaterial } from 'three'
import { OUTDOOR_GROUND_Y } from '../constants'
import { ROAD_WIDTH, SIDEWALK_TOP_Y } from '../builders/cityBuilder'
import type { CityLayout } from '../types'
import { InstancedBoxes, type BoxInstance } from './InstancedBoxes'

// ---------------- Signal timing (shared by every intersection) ----------------

type Light = 'green' | 'yellow' | 'red'
type Axis = 'x' | 'z'

const CYCLE = 25

/** Which light each direction of travel sees at time t (seconds). */
function signalAt(t: number): Record<Axis, Light> {
  const p = t % CYCLE
  if (p < 9) return { x: 'green', z: 'red' }
  if (p < 11.5) return { x: 'yellow', z: 'red' }
  if (p < 12.5) return { x: 'red', z: 'red' }
  if (p < 21.5) return { x: 'red', z: 'green' }
  if (p < 24) return { x: 'red', z: 'yellow' }
  return { x: 'red', z: 'red' }
}

// ---------------- Cars ----------------

const CARS_PER_LANE = 3
const CAR_LENGTH = 4.2
const ACCEL = 2.6
const BRAKE = 6
const MIN_GAP = 2.5
/** Cars stop this far before the centre of the crossing street (behind the crosswalk). */
const STOP_OFFSET = ROAD_WIDTH / 2 + 3.4

const CAR_COLORS = [
  '#d64545', '#f3f4f6', '#1f2937', '#2563eb', '#f2b705', '#10b981',
  '#9ca3af', '#7c3aed', '#e5e7eb', '#111827', '#b45309', '#0ea5e9',
]

type Car = { s: number; v: number; maxV: number }

type Lane = {
  axis: Axis
  dir: 1 | -1
  /** Position on the other axis (the lane's centre line). */
  fixed: number
  min: number
  max: number
  /** Centres of the streets this lane crosses. */
  crossings: number[]
  cars: Car[]
}

/** Parts of a car in its own frame (length along +x), as [center, size]. */
const CAR_PARTS = {
  body: [[0, 0.62, 0], [CAR_LENGTH, 0.75, 1.9]],
  cabin: [[-0.25, 1.28, 0], [2.3, 0.6, 1.7]],
  wheels: [[0, 0.32, 0], [0.72, 0.64, 2.0]],
  headlights: [[CAR_LENGTH / 2 + 0.01, 0.68, 0], [0.06, 0.18, 1.5]],
  taillights: [[-CAR_LENGTH / 2 - 0.01, 0.68, 0], [0.06, 0.18, 1.5]],
} as const

function partMatrix([center, size]: readonly [readonly number[], readonly number[]], offsetX = 0) {
  return new Matrix4().compose(
    new Vector3(center[0] + offsetX, center[1], center[2]),
    new Quaternion(),
    new Vector3(size[0], size[1], size[2]),
  )
}

const PART_MATRICES = {
  body: partMatrix(CAR_PARTS.body),
  cabin: partMatrix(CAR_PARTS.cabin),
  frontWheels: partMatrix(CAR_PARTS.wheels, 1.35),
  rearWheels: partMatrix(CAR_PARTS.wheels, -1.35),
  headlights: partMatrix(CAR_PARTS.headlights),
  taillights: partMatrix(CAR_PARTS.taillights),
}

/** Two lanes per street, driving on the right. */
function laneCount(city: CityLayout) {
  return (city.streetsX.length + city.streetsZ.length) * 2
}

function createLanes(city: CityLayout): Lane[] {
  const lanes: Lane[] = []
  const offset = ROAD_WIDTH / 4
  let seed = 42
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  // Streets running along x (fixed z). Moving +x, the right-hand side is +z.
  for (const z of city.streetsZ) {
    for (const dir of [1, -1] as const) {
      lanes.push({
        axis: 'x', dir, fixed: z + dir * offset,
        min: city.extent.x1, max: city.extent.x2, crossings: city.streetsX, cars: [],
      })
    }
  }
  // Streets running along z (fixed x). Moving +z, the right-hand side is -x.
  for (const x of city.streetsX) {
    for (const dir of [1, -1] as const) {
      lanes.push({
        axis: 'z', dir, fixed: x - dir * offset,
        min: city.extent.z1, max: city.extent.z2, crossings: city.streetsZ, cars: [],
      })
    }
  }

  for (const lane of lanes) {
    const length = lane.max - lane.min
    for (let i = 0; i < CARS_PER_LANE; i += 1) {
      const slot = (i + 0.2 + random() * 0.6) / CARS_PER_LANE
      lane.cars.push({ s: lane.min + slot * length, v: 0, maxV: 7 + random() * 5 })
    }
  }
  return lanes
}

/** Moves every car one step: accelerate, keep distance, stop for red lights, wrap at the edge. */
function stepTraffic(lanes: Lane[], dt: number, signal: Record<Axis, Light>) {
  for (const lane of lanes) {
    const { dir } = lane
    // Leader first (furthest along the direction of travel).
    lane.cars.sort((a, b) => (b.s - a.s) * dir)

    lane.cars.forEach((car, index) => {
      let target = car.maxV
      const front = car.s + (dir * CAR_LENGTH) / 2

      // Nearest stop line still ahead of the car's front bumper.
      let distToStop = Number.POSITIVE_INFINITY
      for (const crossing of lane.crossings) {
        const d = (crossing - dir * STOP_OFFSET - front) * dir
        if (d >= 0 && d < distToStop) distToStop = d
      }

      const light = signal[lane.axis]
      const canStopInTime = (car.v * car.v) / (2 * BRAKE) < distToStop
      const mustStop = light === 'red' || (light === 'yellow' && canStopInTime)
      if (mustStop && distToStop < 40) {
        target = Math.min(target, Math.sqrt(2 * BRAKE * Math.max(0, distToStop - 0.3)))
      }

      if (index > 0) {
        const leader = lane.cars[index - 1]
        const gap = (leader.s - car.s) * dir - CAR_LENGTH
        target = Math.min(target, Math.sqrt(2 * BRAKE * Math.max(0, gap - MIN_GAP)))
      }

      car.v = Math.max(0, Math.min(car.v + ACCEL * dt, target))
      car.s += dir * car.v * dt

      // Leave on one side, come back on the other (both ends are hidden in the fog).
      if (dir === 1 && car.s > lane.max) car.s = lane.min
      if (dir === -1 && car.s < lane.min) car.s = lane.max
    })
  }
}

function Cars({ city }: { city: CityLayout }) {
  const count = laneCount(city) * CARS_PER_LANE
  const lanesRef = useRef<Lane[]>([])
  const bodyRef = useRef<InstancedMesh>(null)
  const cabinRef = useRef<InstancedMesh>(null)
  const wheelsRef = useRef<InstancedMesh>(null)
  const headRef = useRef<InstancedMesh>(null)
  const tailRef = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    lanesRef.current = createLanes(city)
    const body = bodyRef.current
    if (!body) return
    const color = new Color()
    for (let i = 0; i < count; i += 1) {
      body.setColorAt(i, color.set(CAR_COLORS[(i * 7) % CAR_COLORS.length]))
    }
    if (body.instanceColor) body.instanceColor.needsUpdate = true
  }, [city, count])

  const scratch = useMemo(
    () => ({ car: new Matrix4(), part: new Matrix4(), pos: new Vector3(), rot: new Quaternion(), one: new Vector3(1, 1, 1), up: new Vector3(0, 1, 0) }),
    [],
  )

  useFrame(({ clock }, delta) => {
    const lanes = lanesRef.current
    const meshes = [bodyRef.current, cabinRef.current, wheelsRef.current, headRef.current, tailRef.current]
    if (lanes.length === 0 || meshes.some((m) => !m)) return
    const [body, cabin, wheels, head, tail] = meshes as InstancedMesh[]

    stepTraffic(lanes, Math.min(delta, 0.05), signalAt(clock.elapsedTime))

    const { car: carM, part, pos, rot, one, up } = scratch
    let i = 0
    for (const lane of lanes) {
      // Car model points along +x; turn it to face the direction of travel.
      const heading = lane.axis === 'x' ? (lane.dir === 1 ? 0 : Math.PI) : lane.dir === 1 ? -Math.PI / 2 : Math.PI / 2
      rot.setFromAxisAngle(up, heading)

      for (const c of lane.cars) {
        if (lane.axis === 'x') pos.set(c.s, OUTDOOR_GROUND_Y, lane.fixed)
        else pos.set(lane.fixed, OUTDOOR_GROUND_Y, c.s)
        carM.compose(pos, rot, one)

        body.setMatrixAt(i, part.multiplyMatrices(carM, PART_MATRICES.body))
        cabin.setMatrixAt(i, part.multiplyMatrices(carM, PART_MATRICES.cabin))
        wheels.setMatrixAt(i * 2, part.multiplyMatrices(carM, PART_MATRICES.frontWheels))
        wheels.setMatrixAt(i * 2 + 1, part.multiplyMatrices(carM, PART_MATRICES.rearWheels))
        head.setMatrixAt(i, part.multiplyMatrices(carM, PART_MATRICES.headlights))
        tail.setMatrixAt(i, part.multiplyMatrices(carM, PART_MATRICES.taillights))
        i += 1
      }
    }
    for (const mesh of meshes as InstancedMesh[]) mesh.instanceMatrix.needsUpdate = true
  })

  // frustumCulled is off because the cars move far from where the meshes' bounds were measured.
  return (
    <group key={count}>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, count]} frustumCulled={false} castShadow>
        <boxGeometry />
        <meshStandardMaterial color="#ffffff" roughness={0.35} metalness={0.4} />
      </instancedMesh>
      <instancedMesh ref={cabinRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial color="#1e293b" roughness={0.15} metalness={0.6} />
      </instancedMesh>
      <instancedMesh ref={wheelsRef} args={[undefined, undefined, count * 2]} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial color="#fff7d6" emissive="#fff3c4" emissiveIntensity={1.2} />
      </instancedMesh>
      <instancedMesh ref={tailRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial color="#7f1d1d" emissive="#ef4444" emissiveIntensity={0.9} />
      </instancedMesh>
    </group>
  )
}

// ---------------- Traffic lights ----------------

const LAMP_COLORS: Record<Light, string> = { red: '#ff3b30', yellow: '#ffcc00', green: '#34c759' }
const LAMP_ORDER: Light[] = ['red', 'yellow', 'green']

function TrafficLights({ city }: { city: CityLayout }) {
  const lampRefs = useRef<Partial<Record<`${Axis}-${Light}`, MeshStandardMaterial | null>>>({})

  const parts = useMemo(() => {
    const poles: BoxInstance[] = []
    const heads: BoxInstance[] = []
    const lamps: Record<`${Axis}-${Light}`, BoxInstance[]> = {
      'x-red': [], 'x-yellow': [], 'x-green': [], 'z-red': [], 'z-yellow': [], 'z-green': [],
    }
    const corner = ROAD_WIDTH / 2 + 0.7
    const top = SIDEWALK_TOP_Y + 4.4

    for (const sx of city.streetsX) {
      for (const sz of city.streetsZ) {
        // Two poles per intersection, on opposite corners.
        for (const sign of [1, -1]) {
          const px = sx + sign * corner
          const pz = sz + sign * corner
          poles.push({ center: [px, SIDEWALK_TOP_Y + 2.4, pz], size: [0.16, 4.8, 0.16] })

          // Upper head controls traffic moving along x, lower head traffic moving along z.
          // Lamps poke out of both faces so drivers from either side can see them.
          const headSpecs: [Axis, number][] = [['x', top], ['z', top - 1.25]]
          for (const [axis, y] of headSpecs) {
            heads.push({ center: [px, y, pz], size: [0.34, 1.05, 0.34] })
            LAMP_ORDER.forEach((light, k) => {
              const ly = y + 0.32 - k * 0.32
              const size: [number, number, number] = axis === 'x' ? [0.4, 0.22, 0.22] : [0.22, 0.22, 0.4]
              lamps[`${axis}-${light}`].push({ center: [px, ly, pz], size })
            })
          }
        }
      }
    }
    return { poles, heads, lamps }
  }, [city])

  useFrame(({ clock }) => {
    const signal = signalAt(clock.elapsedTime)
    for (const axis of ['x', 'z'] as const) {
      for (const light of LAMP_ORDER) {
        const material = lampRefs.current[`${axis}-${light}`]
        if (!material) continue
        const on = signal[axis] === light
        material.emissiveIntensity = on ? 2.4 : 0
        material.color.set(on ? LAMP_COLORS[light] : '#2a2a2a')
      }
    }
  })

  return (
    <>
      <InstancedBoxes items={parts.poles} castShadow>
        <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.5} />
      </InstancedBoxes>
      <InstancedBoxes items={parts.heads}>
        <meshStandardMaterial color="#1f2328" roughness={0.7} />
      </InstancedBoxes>
      {(['x', 'z'] as const).flatMap((axis) =>
        LAMP_ORDER.map((light) => (
          <InstancedBoxes key={`${axis}-${light}`} items={parts.lamps[`${axis}-${light}`]}>
            <meshStandardMaterial
              ref={(material) => {
                lampRefs.current[`${axis}-${light}`] = material
              }}
              color="#2a2a2a"
              emissive={LAMP_COLORS[light]}
              emissiveIntensity={0}
              toneMapped={false}
            />
          </InstancedBoxes>
        )),
      )}
    </>
  )
}

export function Traffic({ city }: { city: CityLayout }) {
  return (
    <>
      <Cars city={city} />
      <TrafficLights city={city} />
    </>
  )
}
