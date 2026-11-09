import { useFrame } from "@react-three/fiber"
import { Color, Vector3 } from "three"
import { Light } from "./light"
import type { LightUniforms } from "./light-shader"
import LoopCounter from "@lib/helpers/loop-counter"
import { ndelta } from "@lib/helpers/utils"

export const LIGHT_INDEX = 10
export const lightIndex = new LoopCounter(LIGHT_INDEX)
export const lights = Array.from({ length: LIGHT_INDEX }).map(() => new Light())

let lastTime = performance.now()

function fade(time: number) {
    const delta = ndelta((time - lastTime) / 1000)

    lastTime = time

    for (let i = 0; i < lights.length; i++) {
        lights[i].update(delta)
    }

    requestAnimationFrame(fade)
}

requestAnimationFrame(fade)

export function syncLights(uniform: LightUniforms) {
    for (let i = 0; i < lights.length; i++) {
        let light = lights[i]
        let current = uniform.value[i]

        current.position.copy(light.position)
        current.innerColor.copy(light.innerColor)
        current.outerColor.copy(light.outerColor)
        current.radius = light.radius
        current.intensity = light.intensity
    }
}

// undefined until the material is mounted
export function useLights(uniform: LightUniforms | undefined) {
    useFrame(() => {
        if (uniform) {
            syncLights(uniform)
        }
    })
}

export function updateLight(
    index: number,
    radius: number,
    decay: number,
    intensity: number,
    position: Vector3,
    innerColor: Color,
    outerColor: Color
) {
    const light = lights[index]

    if (!light) {
        console.warn("Light index out of bounds")
        return
    }

    light.radius = radius
    light.decay = decay
    light.intensity = intensity
    light.position.copy(position)
    light.innerColor.copy(innerColor)
    light.outerColor.copy(outerColor)
}
