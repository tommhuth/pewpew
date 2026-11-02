import { Ref } from "react"
import { useTransitionedState } from "@src/hooks/use-transitioned-state"
import { InstancedMesh, Vector3 } from "three"
import random from "@huth/random"
import { FIREBALL_COUNT } from "@lib/const"
import { depthIgnoreLayers } from "@components/effects/depth/depth-layers"
import { clamp, setBufferAttribute, setMatrixAt } from "@lib/helpers/utils"
import { easeOutQuart, piecewiseLerp } from "@lib/helpers/shaping"
import LoopCounter from "@lib/helpers/loop-counter"
import { useDepth } from "@components/effects/depth/use-depth"
import { FireballMaterial } from "./fireball-material"
import { Fireball } from "@src/types/explosion"
import { Tuple2, Tuple3 } from "@src/types/global"

const times = new Float32Array(FIREBALL_COUNT)

const fireballIndex = new LoopCounter(FIREBALL_COUNT)

interface CreateFireballsParams {
    position: Tuple3
    count: number
    radius: Tuple2 // start radius, spread from first to last fireball
    growth: Tuple2 // max radius as a multiple of the start radius
    spread: [xz: number, y: number] // offset from position, xz either side, y upwards
    lifetime: Tuple2
}

export function createFireballs({
    position,
    count,
    radius,
    growth,
    spread,
    lifetime,
}: CreateFireballsParams) {
    return Array.from({ length: count }, (_, i): Fireball => {
        const startRadius = (i / count) * (radius[1] - radius[0]) + radius[0]
        // later ones are bigger, pull them in so the biggest sit in the middle
        const reach = 1 - i / count

        return {
            index: fireballIndex.next(),
            position: [
                random.float(-spread[0], spread[0]) * reach + position[0],
                random.float(0, spread[1]) + position[1],
                random.float(-spread[0], spread[0]) * reach + position[2],
            ],
            startRadius,
            maxRadius: startRadius * random.float(...growth),
            time: random.integer(-200, 0),
            lifetime: random.integer(...lifetime),
        }
    })
}

const _fireballPosition = new Vector3()
const _fireballBlend: Tuple3 = [0, 0, 0]

export function updateFireball(
    instance: InstancedMesh,
    fireball: Fireball
) {
    const t = clamp(fireball.time / fireball.lifetime)

    _fireballBlend[0] = fireball.startRadius
    _fireballBlend[1] = fireball.maxRadius

    _fireballPosition.set(
        fireball.position[0],
        fireball.position[1] + t * (fireball.index % 6),
        fireball.position[2]
    )

    setMatrixAt({
        instance,
        index: fireball.index,
        position: _fireballPosition,
        scale: fireball.time < 0 ? 0 : piecewiseLerp(_fireballBlend, easeOutQuart(t)),
    })
    setBufferAttribute(instance.geometry, "aTime", t, fireball.index)
}

export default function FireballMesh({ ref }: { ref: Ref<InstancedMesh> }) {
    const [material, setMaterial] = useTransitionedState<FireballMaterial | null>(null)

    useDepth(material?.uniforms)

    return (
        <instancedMesh
            ref={ref}
            args={[undefined, undefined, FIREBALL_COUNT]}
            layers={depthIgnoreLayers}
            frustumCulled={false}
        >
            <sphereGeometry args={[1, 8, 8]}>
                <instancedBufferAttribute
                    attach="attributes-aTime"
                    args={[times, 1]}
                />
            </sphereGeometry>
            <fireballMaterial ref={setMaterial} />
        </instancedMesh>
    )
}
