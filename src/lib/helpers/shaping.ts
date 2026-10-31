import { Tuple3 } from "@src/types/global"

export function easeOutQuart(x: number) {
    return 1 - Math.pow(1 - x, 4)
}

export function easeOutCubic(x: number) {
    return 1 - Math.pow(1 - x, 3)
}

export function easeInOutCubic(x: number) {
    return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

// piecewise lerp across 3 values, values[1] is hit at threshold
export function blend(values: Tuple3, t = 0, threshold = .5) {
    const left = t >= threshold ? 1 : 0
    const right = left + 1

    if (t <= threshold) {
        return (1 - t / (1 - threshold)) * values[left] + t / (1 - threshold) * values[right]
    }

    return (1 - (t - threshold) / (1 - threshold)) * values[left] + (t - threshold) / (1 - threshold) * values[right]
}

export function easeOutExpo(x: number): number {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
}