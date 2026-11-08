export type Wall = 'FRONT' | 'BACK' | 'RIGHT' | 'LEFT'
export type StairDirection = 'LEFT_RIGHT' | 'FRONT_BACK' | 'RIGHT_LEFT' | 'BACK_FRONT'

export type CoordPair = [number, number]

export type WallPlacement = {
  WALL: Wall
}

export type RoomItem = {
  POSITION: [CoordPair, CoordPair]
  DOORS: WallPlacement[]
  WINDOWS?: WallPlacement[]
}

export type StairItem = {
  DIRECTION: StairDirection
  POSITION: [CoordPair, CoordPair]
}

export type FloorItem = {
  HEIGHT: number
  // Optional wall color: a name like "red" or a hex code like "#4a90d9".
  COLOR?: string
  ROOMS: RoomItem[]
  STAIR: StairItem | null
}

export type HouseModel = {
  FLOORS: FloorItem[]
}

export const wallValues: Wall[] = ['FRONT', 'BACK', 'RIGHT', 'LEFT']
export const stairDirectionValues: StairDirection[] = [
  'LEFT_RIGHT',
  'FRONT_BACK',
  'RIGHT_LEFT',
  'BACK_FRONT',
]
