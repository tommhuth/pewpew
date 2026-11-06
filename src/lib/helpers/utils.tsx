import { Tuple2, Tuple3, Tuple4 } from "@src/types/global"
import { BufferAttribute, BufferGeometry, Color, ColorRepresentation, Euler, InstancedMesh, Matrix4, Quaternion, Vector3 } from "three"
import { clamp as threeClamp, mapLinear } from "three/src/math/MathUtils.js"

export function map(x: number, a1: number, a2: number, b1: number, b2: number) {
    const min = Math.min(a1, a2)
    const max = Math.max(a1, a2)

    return mapLinear(clamp(x, min, max), a1, a2, b1, b2)
}

export function ndelta(delta: number) {
    const nDelta = clamp(delta, 0, 1 / 15)

    return nDelta
}

export function clamp(value: number, min = 0, max = 1) {
    return threeClamp(value, min, max)
}

const _matrix = new Matrix4()
const _quaternion = new Quaternion()
const _position = new Vector3(0, 0, 0)
const _scale = new Vector3(1, 1, 1)
const _euler = new Euler()

// defaults live out here so an omitted argument does not allocate a fresh tuple
// on every call. read only, never written to
const _defaultPosition: Tuple3 = [0, 0, 0]
const _defaultRotation: Tuple3 = [0, 0, 0]
const _defaultScale: Tuple3 = [1, 1, 1]

interface SetMatrixAtParams {
    instance: InstancedMesh
    index: number
    position?: Tuple3 | Vector3
    rotation?: Tuple3 | Tuple4 | Vector3
    scale?: Tuple3 | Vector3 | number
}

export function setMatrixAt({
    instance,
    index,
    position = _defaultPosition,
    rotation = _defaultRotation,
    scale = _defaultScale,
}: SetMatrixAtParams) {
    if (Array.isArray(position)) {
        _position.set(position[0], position[1], position[2])
    } else {
        _position.copy(position)
    }

    if (typeof scale === "number") {
        _scale.setScalar(scale)
    } else if (Array.isArray(scale)) {
        _scale.set(scale[0], scale[1], scale[2])
    } else {
        _scale.copy(scale)
    }

    if (!Array.isArray(rotation)) {
        _quaternion.setFromEuler(_euler.set(rotation.x, rotation.y, rotation.z, "XYZ"))
    } else if (rotation.length === 3) {
        _quaternion.setFromEuler(_euler.set(rotation[0], rotation[1], rotation[2], "XYZ"))
    } else {
        _quaternion.set(rotation[0], rotation[1], rotation[2], rotation[3])
    }

    instance.setMatrixAt(index, _matrix.compose(_position, _quaternion, _scale))
    instance.instanceMatrix.needsUpdate = true
}

export function setMatrixNullAt(instance: InstancedMesh, index: number) {
    setMatrixAt({
        instance,
        index,
        position: [0, 0, 100_000],
        scale: [0, 0, 0],
        rotation: [0, 0, 0]
    })
}

const _color = new Color()

export function setColorAt(instance: InstancedMesh, index: number, color: ColorRepresentation) {
    instance.setColorAt(index, _color.set(color))

    if (instance.instanceColor) {
        instance.instanceColor.needsUpdate = true
    } else {
        console.warn("Instance is not initialized with instanceColor: setColorAt will do nothing.")
    }
}

export function setBufferAttribute(
    geometry: BufferGeometry,
    name: string,
    value: number | Tuple2 | Tuple3,
    index: number
) {
    const attribute = geometry.getAttribute(name) as BufferAttribute

    attribute.set(Array.isArray(value) ? value : [value], index * attribute.itemSize)
    attribute.needsUpdate = true
}

/**
 * Frame-rate independent damping factor.
 *
 * @param lambda decay rate, same convention as three's `MathUtils.damp` (higher = faster)
 * @param delta seconds since last frame
 * @returns scalar to multiply by, eg `velocity.multiplyScalar(dampFactor(4, delta))`
 */
export function dampFactor(lambda: number, delta: number) {
    return Math.exp(-lambda * delta)
}

/**
 * In place `out += v * scale`, eg `addScaled(position, velocity, delta)`.
 */
export function addScaled(out: Tuple3, v: Tuple3, scale: number) {
    out[0] += v[0] * scale
    out[1] += v[1] * scale
    out[2] += v[2] * scale

    return out
}

/**
 * In place scale of x and z only, y is left as is.
 */
export function scaleXZ(v: Tuple3, scale: number) {
    v[0] *= scale
    v[2] *= scale

    return v
}
