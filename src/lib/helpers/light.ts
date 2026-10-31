
import { Color, Vector3 } from "three"
import { damp } from "three/src/math/MathUtils.js"

export class Light {
    radius = 1
    decay = 1
    intensity = 0
    position = new Vector3()
    color = new Color()

    update(delta: number) {
        this.radius = damp(this.radius, 0, this.decay, delta)
        this.intensity = damp(this.intensity, 0, this.decay, delta)
    }
}