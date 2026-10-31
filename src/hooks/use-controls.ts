import { useFrame, useThree } from "@react-three/fiber"
import { useEffect } from "react"
import { Camera, Plane, Raycaster, Vector2, Vector3 } from "three"
import { State, useStore } from "@lib/store"
import { EDGE_MAX, EDGE_MIN, WORLD_BOTTOM_EDGE, WORLD_LEFT_EDGE, WORLD_TOP_EDGE } from "@lib/const"
import { clamp, ndelta } from "@lib/helpers/utils"
import { Tuple2, Tuple3 } from "@src/types/global"

// movement only (no shooting, gamepad or touch height slider)

const xSpeed = 12
const ySpeed = 10

const _floor = new Plane(new Vector3(0, 1, 0), 0)
const _mouse = new Vector2()
const _raycaster = new Raycaster()
const _point = new Vector3()

function toWorldCoords([x, y]: Tuple2, camera: Camera): Tuple3 {
    _mouse.set(
        (x / window.innerWidth) * 2 - 1,
        -(y / window.innerHeight) * 2 + 1
    )
    _raycaster.setFromCamera(_mouse, camera)
    _raycaster.ray.intersectPlane(_floor, _point)

    // ignore camera z translation
    _point.z -= camera.position.z

    return _point.toArray()
}

function isActive() {
    return useStore.getState().state === State.READY
}

export function useControls() {
    const keys = useStore(i => i.player.keys)
    const targetPosition = useStore(i => i.player.targetPosition)
    const camera = useThree(i => i.camera)
    const get = useThree(i => i.get)

    // keyboard
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            keys[e.code.replace("Key", "").toLowerCase()] = true
        }
        const onKeyUp = (e: KeyboardEvent) => {
            keys[e.code.replace("Key", "").toLowerCase()] = false
        }

        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("keyup", onKeyUp)

        return () => {
            window.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("keyup", onKeyUp)
        }
    }, [keys])

    useFrame((_, delta) => {
        const nd = ndelta(delta)

        if (!isActive()) {
            return
        }

        if (keys.a || keys.arrowleft) {
            targetPosition.x += xSpeed * nd
        } else if (keys.d || keys.arrowright) {
            targetPosition.x -= xSpeed * nd
        }

        if (keys.w || keys.arrowup) {
            targetPosition.y += ySpeed * nd
        } else if (keys.s || keys.arrowdown) {
            targetPosition.y -= ySpeed * nd
        }

        targetPosition.clamp(EDGE_MIN, EDGE_MAX)
    })

    // pointer: mouse maps screen position to target, touch drags relative
    useEffect(() => {
        let movementPointerId: number | null = null
        let previous: Tuple3 | null = null

        const onPointerDown = ({ pointerType, pointerId, clientX, clientY }: PointerEvent) => {
            if (pointerType === "touch" && movementPointerId === null) {
                movementPointerId = pointerId
                previous = toWorldCoords([clientX, clientY], camera)
            }
        }
        const onPointerMove = ({ pointerId, pointerType, clientX, clientY }: PointerEvent) => {
            if (!isActive()) {
                return
            }

            const [currentX, , currentZ] = toWorldCoords([clientX, clientY], camera)

            if (pointerType === "touch" && movementPointerId === pointerId) {
                if (previous === null) {
                    previous = [currentX, 0, currentZ]
                }

                targetPosition.x += (currentX - previous[0]) * 1.2
                targetPosition.y += (currentZ - previous[2])
                previous = [currentX, 0, currentZ]
            } else if (pointerType === "mouse") {
                const center = [0, WORLD_BOTTOM_EDGE, 26]
                const { viewport } = get()
                const diagonal = Math.hypot(viewport.width, viewport.height)

                targetPosition.x = clamp((currentX - center[0]) / 5, -1, 1) * WORLD_LEFT_EDGE
                targetPosition.y = clamp((currentZ - center[2]) / (diagonal * .25), 0, 1)
                    * (WORLD_TOP_EDGE - WORLD_BOTTOM_EDGE)
                    + WORLD_BOTTOM_EDGE
            }

            targetPosition.clamp(EDGE_MIN, EDGE_MAX)
        }
        const onPointerUp = ({ pointerId }: PointerEvent) => {
            if (movementPointerId === pointerId) {
                movementPointerId = null
                previous = null
            }
        }

        window.addEventListener("pointerdown", onPointerDown)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerUp)
        window.addEventListener("pointercancel", onPointerUp)

        return () => {
            window.removeEventListener("pointerdown", onPointerDown)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)
            window.removeEventListener("pointercancel", onPointerUp)
        }
    }, [camera, targetPosition, get])
}
