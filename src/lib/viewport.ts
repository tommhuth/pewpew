import { OrthographicCamera, Vector2, Vector3 } from "three"
import { Tuple2 } from "@src/types/global"
import { clamp } from "./helpers/utils"

const _right = new Vector3()
const _up = new Vector3()

// pixelated render: render at 1/pixelSize resolution and
// let the browser upscale with image-rendering: pixelated
export function getPixelSize() {
    return 3

    return Math.min(window.innerWidth, window.innerHeight) < 800 ? 2 : 2
}

export function getDpr() {
    return 1 / getPixelSize()
}

// round up to full pixel so the upscale stays an integer, plus a pixel of
// overscan on each side so shifting by the snap remainder never shows an edge
export function getCanvasSize(): Tuple2 {
    const pixelSize = getPixelSize()

    return [
        Math.ceil(window.innerWidth / pixelSize) * pixelSize + pixelSize * 2,
        Math.ceil(window.innerHeight / pixelSize) * pixelSize + pixelSize * 2,
    ]
}

// round a position to whole render pixels along the camera's right/up axes so
// static geometry rasterizes the same every frame, depth is left as is. the
// rounded off part goes into remainder, in render pixels
export function snapToPixelGrid(
    position: Vector3,
    targetPosition: Vector3,
    camera: OrthographicCamera,
    remainder?: Vector2,
) {
    // 3d units per px 
    const unit = getPixelSize() / camera.zoom

    _right.set(1, 0, 0).applyQuaternion(camera.quaternion)
    _up.set(0, 1, 0).applyQuaternion(camera.quaternion)

    // where the position sits along screen-right/up, in render px
    const x = position.dot(_right) / unit
    const y = position.dot(_up) / unit
    const snappedX = Math.round(x) // round to nearest px
    const snappedY = Math.round(y)

    // add in the diff to world pos, to snap to whole px
    targetPosition.copy(position)
        .addScaledVector(_right, (snappedX - x) * unit)
        .addScaledVector(_up, (snappedY - y) * unit)

    remainder?.set(x - snappedX, y - snappedY)
}

// css translation that puts a snapped render back where the unsnapped camera
// would have it, rounded to device pixels so the upscaled pixels stay even
export function getCanvasOffset(remainder: Vector2): Tuple2 {
    const pixelSize = getPixelSize()
    const ratio = window.devicePixelRatio

    return [
        Math.round(-remainder.x * pixelSize * ratio) / ratio,
        Math.round(remainder.y * pixelSize * ratio) / ratio,
    ]
}

export function getZoom() {
    return 80 - clamp(1 - (Math.min(window.innerWidth, window.innerHeight) - 400) / 600, 0, 1) * 30
}
