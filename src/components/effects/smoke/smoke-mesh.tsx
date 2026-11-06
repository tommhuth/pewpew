import { useTransitionedState } from "@src/hooks/use-transitioned-state"
import { useFrame } from "@react-three/fiber"
import { Color, ColorRepresentation, InstancedMesh } from "three"
import { SMOKE_COUNT } from "@lib/const"
import { depthIgnoreLayers } from "@components/effects/depth/depth-layers"
import { clamp, ndelta, setBufferAttribute, setMatrixAt } from "@lib/helpers/utils"
import LoopCounter from "@lib/helpers/loop-counter"
import { useInstanceClear } from "@src/hooks/use-instance-clear"
import { Smoke } from "@src/types/explosion"
import { Tuple3 } from "@src/types/global"
import { damp } from "three/src/math/MathUtils.js"
import random from "@huth/random"
import { useDepth } from "@components/effects/depth/use-depth"
import { SmokeMaterial } from "./smoke-material"

export const smokes: Smoke[] = []

const smokeIndex = new LoopCounter(SMOKE_COUNT)

const _color = new Color()

export function createSmoke(position: Tuple3, radius: number, color: ColorRepresentation, delay = 0) {
    smokes.push({
        // doubles as the instance slot
        id: smokeIndex.next(),
        position,
        targetRadius: radius,
        radius: radius * .25,
        time: -delay,
        lifetime: random.integer(2_500, 3_500),
        color
    })
}

const times = new Float32Array(SMOKE_COUNT)
const colors = new Float32Array(SMOKE_COUNT * 3).fill(1)

export default function SmokeMesh() {
    const [smokeInstance, setSmokeInstance] = useTransitionedState<InstancedMesh | null>(null)
    const [material, setMaterial] = useTransitionedState<SmokeMaterial | null>(null)

    useInstanceClear(smokeInstance, SMOKE_COUNT)
    useDepth(material?.uniforms)

    useFrame((state, delta) => {
        if (!smokeInstance || !material) {
            return
        }

        let nd = ndelta(delta)

        material.uniforms.uTime.value += nd

        for (let i = 0; i < smokes.length; i++) {
            const smoke = smokes[i]

            smoke.radius = damp(smoke.radius, smoke.targetRadius, 6, nd)
            smoke.time += nd * 1000

            setBufferAttribute(smokeInstance.geometry, "aTime", clamp(smoke.time / smoke.lifetime), smoke.id)
            setBufferAttribute(smokeInstance.geometry, "aColor", _color.set(smoke.color).toArray(), smoke.id)
            setMatrixAt({
                instance: smokeInstance,
                index: smoke.id,
                position: smoke.position,
                scale: smoke.radius,
            })
        }
    })

    return (
        <instancedMesh
            ref={setSmokeInstance}
            args={[undefined, undefined, SMOKE_COUNT]}
            layers={depthIgnoreLayers}
            frustumCulled={false}
        >
            <sphereGeometry args={[1, 18, 18]}>
                <instancedBufferAttribute
                    attach="attributes-aTime"
                    args={[times, 1]}
                />
                <instancedBufferAttribute
                    attach="attributes-aColor"
                    args={[colors, 3]}
                />
            </sphereGeometry>
            <smokeMaterial depthWrite={false} ref={setMaterial} />
        </instancedMesh>
    )
}
