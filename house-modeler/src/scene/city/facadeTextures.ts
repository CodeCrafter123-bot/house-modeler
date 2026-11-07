import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

/** One window "bay" in world units (width and storey height). */
export const BAY_SIZE = 3
/** Bays drawn on one texture tile, in each direction. */
export const BAYS_PER_TILE = 8

const TILE_PX = 512
const BAY_PX = TILE_PX / BAYS_PER_TILE

/** Same pseudo-random sequence every time so the windows don't flicker between reloads. */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function makeTexture(draw: (ctx: CanvasRenderingContext2D, random: () => number) => void, seed: number) {
  const canvas = document.createElement('canvas')
  canvas.width = TILE_PX
  canvas.height = TILE_PX
  const ctx = canvas.getContext('2d')!
  draw(ctx, seeded(seed))

  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/** Glass office tower: tall windows with thin light frames and a few lit offices. */
export function createOfficeFacade() {
  return makeTexture((ctx, random) => {
    ctx.fillStyle = '#e5e9ee'
    ctx.fillRect(0, 0, TILE_PX, TILE_PX)

    for (let row = 0; row < BAYS_PER_TILE; row += 1) {
      for (let col = 0; col < BAYS_PER_TILE; col += 1) {
        const x = col * BAY_PX
        const y = row * BAY_PX
        const lit = random() < 0.12
        const shade = 70 + Math.floor(random() * 40)

        ctx.fillStyle = lit ? '#f4e6b5' : `rgb(${shade - 30}, ${shade + 5}, ${shade + 50})`
        ctx.fillRect(x + 4, y + 5, BAY_PX - 8, BAY_PX - 14)

        // Sky reflection on the glass.
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
        ctx.fillRect(x + 4, y + 5, (BAY_PX - 8) / 2, BAY_PX - 14)
      }
      // Floor slab line.
      ctx.fillStyle = '#b9c2cc'
      ctx.fillRect(0, row * BAY_PX + BAY_PX - 6, TILE_PX, 4)
    }
  }, 7)
}

/** Apartment block: plain wall with smaller windows and sills. */
export function createResidentialFacade() {
  return makeTexture((ctx, random) => {
    ctx.fillStyle = '#f2efe9'
    ctx.fillRect(0, 0, TILE_PX, TILE_PX)

    for (let row = 0; row < BAYS_PER_TILE; row += 1) {
      for (let col = 0; col < BAYS_PER_TILE; col += 1) {
        const x = col * BAY_PX
        const y = row * BAY_PX
        const lit = random() < 0.18
        const w = BAY_PX * 0.46
        const h = BAY_PX * 0.52
        const wx = x + (BAY_PX - w) / 2
        const wy = y + BAY_PX * 0.2

        ctx.fillStyle = '#c9c2b6'
        ctx.fillRect(wx - 3, wy - 3, w + 6, h + 6)
        ctx.fillStyle = lit ? '#f3d98b' : '#3a4757'
        ctx.fillRect(wx, wy, w, h)
        // Window cross.
        ctx.fillStyle = '#d9d3c8'
        ctx.fillRect(wx + w / 2 - 1.5, wy, 3, h)
        // Sill.
        ctx.fillStyle = '#b8b0a3'
        ctx.fillRect(wx - 5, wy + h + 3, w + 10, 4)
      }
    }
  }, 11)
}
