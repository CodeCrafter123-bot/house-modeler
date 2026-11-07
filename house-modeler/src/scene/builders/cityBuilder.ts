import { OUTDOOR_GROUND_Y } from '../constants'
import { makeCollider } from '../math'
import type { CityBuilding, CityLayout, Collider, Rect } from '../types'

/** Width of every street (two lanes, one per direction). */
export const ROAD_WIDTH = 9
/** Sidewalk strip along the edge of every block. */
export const SIDEWALK_WIDTH = 2.5
/** Top of the raised sidewalk/block slabs. */
export const SIDEWALK_TOP_Y = OUTDOOR_GROUND_Y + 0.06

// Free space kept around the compiled house, and the smallest lot we allow.
const LOT_MARGIN = 6
const MIN_LOT_HALF = 12
const BLOCK_SIZE = 28
/** Rings of city blocks on each side of the house lot. */
const RINGS = 3
/** How far the streets keep going past the last blocks (fades into the fog). */
const STREET_OVERRUN = 60

const OFFICE_COLORS = ['#dfe7ef', '#cdd8e3', '#e6e9ee', '#c9d3dc', '#d8e2ea']
const RESIDENTIAL_COLORS = ['#f1e4d0', '#e8d2c0', '#d9c3a9', '#efe9df', '#e3cfc4', '#d6d0c4']
const ROOF_COLORS = ['#4b5563', '#57534e', '#475569', '#3f3f46']

/** Small seeded random generator so the city looks the same every time. */
function createRandom(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Span = { min: number; max: number; ring: number }

/** Cell spans along one axis: outer blocks, the house block in the middle, outer blocks. */
function buildSpans(houseMin: number, houseMax: number): { spans: Span[]; streets: number[] } {
  const spans: Span[] = [{ min: houseMin, max: houseMax, ring: 0 }]
  const streets: number[] = []

  for (let k = 0; k < RINGS; k += 1) {
    const step = k * (BLOCK_SIZE + ROAD_WIDTH)

    streets.push(houseMin - ROAD_WIDTH / 2 - step)
    streets.push(houseMax + ROAD_WIDTH / 2 + step)

    const westMax = houseMin - ROAD_WIDTH - step
    spans.push({ min: westMax - BLOCK_SIZE, max: westMax, ring: k + 1 })
    const eastMin = houseMax + ROAD_WIDTH + step
    spans.push({ min: eastMin, max: eastMin + BLOCK_SIZE, ring: k + 1 })
  }

  spans.sort((a, b) => a.min - b.min)
  streets.sort((a, b) => a - b)
  return { spans, streets }
}

/** Splits a block into 1, 2 or 4 parcels and puts a building on each. */
function fillBlock(
  block: Rect,
  ring: number,
  random: () => number,
  idPrefix: string,
): CityBuilding[] {
  const inner: Rect = {
    x1: block.x1 + SIDEWALK_WIDTH + 0.5,
    x2: block.x2 - SIDEWALK_WIDTH - 0.5,
    z1: block.z1 + SIDEWALK_WIDTH + 0.5,
    z2: block.z2 - SIDEWALK_WIDTH - 0.5,
  }
  const gap = 2
  const roll = random()
  const cols = roll < 0.2 ? 1 : 2
  const rows = roll < 0.2 ? 1 : roll < 0.45 ? 1 : 2

  const parcelW = (inner.x2 - inner.x1 - gap * (cols - 1)) / cols
  const parcelD = (inner.z2 - inner.z1 - gap * (rows - 1)) / rows
  const buildings: CityBuilding[] = []

  // Blocks next to the house stay low so the house remains the focus; the skyline rises outward.
  const [minH, maxH] = ring === 1 ? [6, 14] : ring === 2 ? [10, 30] : [16, 48]

  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      const setbackX = 0.3 + random() * 1.4
      const setbackZ = 0.3 + random() * 1.4
      const w = Math.max(4, parcelW - setbackX * 2)
      const d = Math.max(4, parcelD - setbackZ * 2)
      const h = Math.round(minH + random() * (maxH - minH))
      const x = inner.x1 + c * (parcelW + gap) + parcelW / 2
      const z = inner.z1 + r * (parcelD + gap) + parcelD / 2
      const style = h >= 18 ? 'office' : 'residential'
      const palette = style === 'office' ? OFFICE_COLORS : RESIDENTIAL_COLORS

      buildings.push({
        id: `${idPrefix}-${c}-${r}`,
        center: [x, SIDEWALK_TOP_Y + h / 2, z],
        size: [w, h, d],
        style,
        color: palette[Math.floor(random() * palette.length)],
        roofColor: ROOF_COLORS[Math.floor(random() * ROOF_COLORS.length)],
      })
    }
  }

  return buildings
}

/**
 * Lays out a small city around the compiled house: the house gets its own lawn lot in the
 * middle block, surrounded by streets and blocks of generated buildings.
 */
export function buildCity(houseBounds: Rect): { city: CityLayout; colliders: Collider[] } {
  const random = createRandom(1337)
  const cx = (houseBounds.x1 + houseBounds.x2) / 2
  const cz = (houseBounds.z1 + houseBounds.z2) / 2
  const halfX = Math.max(MIN_LOT_HALF, (houseBounds.x2 - houseBounds.x1) / 2 + LOT_MARGIN)
  const halfZ = Math.max(MIN_LOT_HALF, (houseBounds.z2 - houseBounds.z1) / 2 + LOT_MARGIN)

  const lot: Rect = { x1: cx - halfX, x2: cx + halfX, z1: cz - halfZ, z2: cz + halfZ }
  const houseBlock: Rect = {
    x1: lot.x1 - SIDEWALK_WIDTH,
    x2: lot.x2 + SIDEWALK_WIDTH,
    z1: lot.z1 - SIDEWALK_WIDTH,
    z2: lot.z2 + SIDEWALK_WIDTH,
  }

  const alongX = buildSpans(houseBlock.x1, houseBlock.x2)
  const alongZ = buildSpans(houseBlock.z1, houseBlock.z2)

  const blocks: Rect[] = []
  const buildings: CityBuilding[] = []

  alongX.spans.forEach((sx, ix) => {
    alongZ.spans.forEach((sz, iz) => {
      const block: Rect = { x1: sx.min, x2: sx.max, z1: sz.min, z2: sz.max }
      blocks.push(block)

      const ring = Math.max(sx.ring, sz.ring)
      if (ring === 0) return // the house's own block
      buildings.push(...fillBlock(block, ring, random, `b${ix}-${iz}`))
    })
  })

  const first = (spans: Span[]) => spans[0].min
  const last = (spans: Span[]) => spans[spans.length - 1].max

  const city: CityLayout = {
    lot,
    blocks,
    buildings,
    streetsX: alongX.streets,
    streetsZ: alongZ.streets,
    extent: {
      x1: first(alongX.spans) - STREET_OVERRUN,
      x2: last(alongX.spans) + STREET_OVERRUN,
      z1: first(alongZ.spans) - STREET_OVERRUN,
      z2: last(alongZ.spans) + STREET_OVERRUN,
    },
  }

  return { city, colliders: buildings.map((b) => makeCollider(b.center, b.size)) }
}
