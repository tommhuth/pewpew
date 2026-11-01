import { lerp } from "three/src/math/MathUtils.js"
import { clamp } from "./utils"

export function easeOutQuart(x: number) {
    return 1 - Math.pow(1 - x, 4)
}

export function easeOutCubic(x: number) {
    return 1 - Math.pow(1 - x, 3)
}

export function easeInOutCubic(x: number) {
    return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

// lerp through any number of values, evenly spaced over t 0-1
export function piecewiseLerp(values: number[], t: number) {
    const x = clamp(t) * (values.length - 1)
    const i = Math.min(Math.floor(x), values.length - 2)

    return lerp(values[i], values[i + 1], x - i)
}

export function easeOutExpo(x: number): number {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
}