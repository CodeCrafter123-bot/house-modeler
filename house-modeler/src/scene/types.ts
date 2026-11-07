export type Rect = {
  x1: number
  x2: number
  z1: number
  z2: number
}

export type BoxPrimitive = {
  id: string
  center: [number, number, number]
  size: [number, number, number]
  color: string
  castShadow?: boolean
  receiveShadow?: boolean
}

export type Collider = {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

export type WalkableSurface = {
  rect: Rect
  topY: number
}

export type SceneData = {
  walls: BoxPrimitive[]
  floors: BoxPrimitive[]
  stairs: BoxPrimitive[]
  colliders: Collider[]
  walkables: WalkableSurface[]
  bounds: Rect
  city: CityLayout
}

export type CityBuilding = {
  id: string
  center: [number, number, number]
  size: [number, number, number]
  style: 'office' | 'residential'
  color: string
  roofColor: string
}

export type CityLayout = {
  /** Lawn reserved for the compiled house. */
  lot: Rect
  /** Raised sidewalk blocks, including the house's own block. */
  blocks: Rect[]
  buildings: CityBuilding[]
  /** x positions of the streets that run along the z axis. */
  streetsX: number[]
  /** z positions of the streets that run along the x axis. */
  streetsZ: number[]
  /** How far the streets (and traffic) reach. */
  extent: Rect
}

export type OpeningKind = 'door' | 'window'
