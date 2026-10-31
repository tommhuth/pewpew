import { useFrame, useThree } from "@react-three/fiber"
import { useLayoutEffect, useMemo } from "react"
import { OrthographicCamera, Vector2, Vector3 } from "three"
import { damp } from "three/src/math/MathUtils.js"
import { useStore } from "@lib/store"
import { CAMERA_DIRECTION, CAMERA_OFFSET } from "@lib/const"
import { ndelta } from "@lib/helpers/utils"
import { getCanvasOffset, snapToPixelGrid } from "@lib/viewport"

const _remainder = new Vector2()

function getTargetZ(z: number) {
    return z + CAMERA_DIRECTION.z + CAMERA_OFFSET.z
}

export default function Camera() {
    const camera = useThree(i => i.camera) as OrthographicCamera
    const canvas = useThree(i => i.gl.domElement)
    // unsnapped position, damping has to run on this and not the snapped one
    const position = useMemo(() => new Vector3(), [])

    useLayoutEffect(() => {
        const { player } = useStore.getState()

        camera.position.copy(CAMERA_DIRECTION)
        camera.lookAt(0, 0, 0)
        camera.position.x = CAMERA_DIRECTION.x + CAMERA_OFFSET.x
        camera.position.z = getTargetZ(player.object?.position.z ?? 0)

        position.copy(camera.position)
        snapToPixelGrid(position, camera.position, camera)
    }, [camera, position])

    useFrame((_, delta) => {
        const { player } = useStore.getState()

        if (!player.object) {
            return
        }

        position.z = damp(position.z, getTargetZ(player.object.position.z), 2, ndelta(delta))
        position.x = CAMERA_DIRECTION.x + CAMERA_OFFSET.x - 3

        snapToPixelGrid(position, camera.position, camera, _remainder)

        // pixels stay locked to the grid, the canvas moves smoothly
        const [x, y] = getCanvasOffset(_remainder)

        canvas.style.transform = `translate(${x}px, ${y}px)`
    })

    return null
}
