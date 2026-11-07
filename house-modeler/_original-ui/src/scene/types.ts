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
  trees: BoxPrimitive[]
  colliders: Collider[]
  walkables: WalkableSurface[]
  bounds: Rect
}

export type OpeningKind = 'door' | 'window'
