import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MAX_STEP_UP, OUTDOOR_GROUND_Y, PLAYER_HEIGHT, PLAYER_RADIUS } from './constants'
import { clamp } from './math'
import { collidesWithWall, queryGroundHeight } from './physics'
import type { SceneData } from './types'

export function FirstPersonController({ data }: { data: SceneData }) {
  const { camera } = useThree()
  const keysRef = useRef<Set<string>>(new Set())
  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  const feetRef = useRef({ x: 0, y: 0, z: 0 })
  const verticalVelocityRef = useRef(0)

  useEffect(() => {
    // Compute spawn just outside the house bounding box
    const margin = PLAYER_RADIUS + 3
    const spawnX = data.bounds.x2 + margin
    const spawnZ = data.bounds.z2 + margin
    const spawnY = queryGroundHeight(
      spawnX,
      spawnZ,
      data.walkables,
      OUTDOOR_GROUND_Y,
      MAX_STEP_UP,
    )

    feetRef.current = { x: spawnX, y: spawnY, z: spawnZ }
    verticalVelocityRef.current = 0

    // Compute yaw and pitch to look at (0,0,0) from (spawnX, spawnY + PLAYER_HEIGHT, spawnZ)
    const dx = 0 - spawnX;
    const dz = 0 - spawnZ;
    const dy = 0 - (spawnY + PLAYER_HEIGHT);
    const distanceXZ = Math.sqrt(dx * dx + dz * dz);
    yawRef.current = Math.atan2(-dx, -dz);
    pitchRef.current = Math.atan2(dy, distanceXZ);

    camera.position.set(spawnX, spawnY + PLAYER_HEIGHT, spawnZ)
    // Set initial rotation using Euler (YXZ)
    camera.rotation.set(0, yawRef.current, 0, 'YXZ')

    const onKeyDown = (event: KeyboardEvent) => keysRef.current.add(event.code)
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.code)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [camera, data.bounds.x1, data.bounds.x2, data.bounds.z1, data.bounds.z2, data.walkables])

  useFrame((_, delta) => {
    const turnSpeed = 1.8
    const moveSpeed = 3.4
    const gravity = 14

    if (keysRef.current.has('ArrowLeft')) yawRef.current += turnSpeed * delta
    if (keysRef.current.has('ArrowRight')) yawRef.current -= turnSpeed * delta
    if (keysRef.current.has('ArrowUp')) pitchRef.current += turnSpeed * 0.6 * delta
    if (keysRef.current.has('ArrowDown')) pitchRef.current -= turnSpeed * 0.6 * delta

    pitchRef.current = clamp(pitchRef.current, -1.25, 1.25)

    const forwardX = -Math.sin(yawRef.current)
    const forwardZ = -Math.cos(yawRef.current)
    const rightX = Math.cos(yawRef.current)
    const rightZ = -Math.sin(yawRef.current)

    let moveX = 0
    let moveZ = 0

    if (keysRef.current.has('KeyW')) {
      moveX += forwardX
      moveZ += forwardZ
    }
    if (keysRef.current.has('KeyS')) {
      moveX -= forwardX
      moveZ -= forwardZ
    }
    if (keysRef.current.has('KeyD')) {
      moveX += rightX
      moveZ += rightZ
    }
    if (keysRef.current.has('KeyA')) {
      moveX -= rightX
      moveZ -= rightZ
    }

    const magnitude = Math.hypot(moveX, moveZ)
    if (magnitude > 0) {
      moveX = (moveX / magnitude) * moveSpeed * delta
      moveZ = (moveZ / magnitude) * moveSpeed * delta
    }

    const feet = feetRef.current
    const prevX = feet.x
    const prevZ = feet.z
    if (!collidesWithWall(feet.x + moveX, feet.y, feet.z, data.colliders)) feet.x += moveX
    if (!collidesWithWall(feet.x, feet.y, feet.z + moveZ, data.colliders)) feet.z += moveZ

    const groundY = queryGroundHeight(
      feet.x,
      feet.z,
      data.walkables,
      feet.y,
      MAX_STEP_UP,
    )
    const grounded = feet.y <= groundY + 0.001

    if (grounded) {
      feet.y = groundY
      verticalVelocityRef.current = 0
    } else {
      verticalVelocityRef.current -= gravity * delta
      feet.y += verticalVelocityRef.current * delta
      if (feet.y < groundY) {
        feet.y = groundY
        verticalVelocityRef.current = 0
      }
    }

    if (collidesWithWall(feet.x, feet.y, feet.z, data.colliders)) {
      // Falling can move the capsule into a lower wall; restore last non-penetrating horizontal position.
      const canUsePrevX = !collidesWithWall(prevX, feet.y, feet.z, data.colliders)
      const canUsePrevZ = !collidesWithWall(feet.x, feet.y, prevZ, data.colliders)

      if (canUsePrevX) feet.x = prevX
      if (canUsePrevZ) feet.z = prevZ

      if (!canUsePrevX && !canUsePrevZ && !collidesWithWall(prevX, feet.y, prevZ, data.colliders)) {
        feet.x = prevX
        feet.z = prevZ
      }

      if (collidesWithWall(feet.x, feet.y, feet.z, data.colliders)) {
        const escapeAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4]
        let escaped = false

        for (let distance = 0.05; distance <= 0.8 && !escaped; distance += 0.05) {
          for (const angle of escapeAngles) {
            const testX = feet.x + Math.cos(angle) * distance
            const testZ = feet.z + Math.sin(angle) * distance
            if (!collidesWithWall(testX, feet.y, testZ, data.colliders)) {
              feet.x = testX
              feet.z = testZ
              escaped = true
              break
            }
          }
        }
      }
    }

    camera.position.set(feet.x, feet.y + PLAYER_HEIGHT, feet.z)
    // Set rotation using Euler (YXZ)
    camera.rotation.set(pitchRef.current, yawRef.current, 0, 'YXZ')
  })

  return null
}
