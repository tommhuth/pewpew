import { useTransitionedState } from "@src/hooks/use-transitioned-state"
import { useFrame } from "@react-three/fiber"
import { InstancedMesh } from "three"
import { SMOKE_COUNT } from "@lib/const"
import { depthIgnoreLayers } from "@components/effects/depth/depth-layers"
import { addScaled, clamp, ndelta, setBufferAttribute, setMatrixAt } from "@lib/helpers/utils"
import LoopCounter from "@lib/helpers/loop-counter"
import { useInstanceClear } from "@src/hooks/use-instance-clear"
import { Smoke } from "@src/types/explosion"
import { Tuple2, Tuple3 } from "@src/types/global"
import { damp } from "three/src/math/MathUtils.js"
import random from "@huth/random"
import { useDepth } from "@components/effects/depth/use-depth"
import { SmokeMaterial } from "./smoke-material"

export const smokes: Smoke[] = []

const smokeIndex = new LoopCounter(SMOKE_COUNT)

interface CreateSmokeParams {
    position: Tuple3
    normal?: Tuple3 // drift direction, normalized
    offset?: [x: Tuple2, y: Tuple2, z: Tuple2] // additional position offset
    count?: number
    scale?: Tuple2
    speed?: Tuple2 // drift along normal, units per second
    damping?: Tuple2 // scale shrink rate, higher is faster
    duration?: Tuple2 // ms
}

export function createSmoke({
    position: [x, y, z],
    normal = [0, 1, 0],
    offset = [[-1, 1], [0, 0], [-1, 1]],
    count = random.integer(7, 10),
    scale = [.85, 1.5],
    speed = [1, 4],
    damping = [1, 7],
    duration = [1000, 2000],
}: CreateSmokeParams) {
    for (let i = 0; i < count; i++) {
        const size = random.float(...scale)
        // bigger puffs stay closer to the middle
        const closeness = 1 - (size - scale[0]) / (scale[1] - scale[0] || 1)

        smokes.push({
            // doubles as the instance slot
            id: smokeIndex.next(),
            position: [
                x + random.float(...offset[0]) * closeness,
                y + random.float(...offset[1]) * closeness,
                z + random.float(...offset[2]) * closeness,
            ],
            normal,
            scale: size,
            speed: random.float(...speed) * clamp(closeness, .4, 1),
            damping: random.float(...damping),
            time: 0,
            duration: random.integer(...duration),
        })
    }
}

const times = new Float32Array(SMOKE_COUNT)

export default function SmokeMesh() {
    const [smokeInstance, setSmokeInstance] = useTransitionedState<InstancedMesh | null>(null)
    const [material, setMaterial] = useTransitionedState<SmokeMaterial | null>(null)

    useInstanceClear(smokeInstance, SMOKE_COUNT)
    useDepth(material?.uniforms)

    useFrame((_, delta) => {
        if (!smokeInstance || !material) {
            return
        }

        const nd = ndelta(delta)
        let alive = 0

        material.uniforms.uTime.value += nd

        for (let i = 0; i < smokes.length; i++) {
            const smoke = smokes[i]

            smoke.time += nd * 1000
            smoke.scale = damp(smoke.scale, 0, smoke.damping, nd)

            addScaled(smoke.position, smoke.normal, smoke.speed * nd)

            if (smoke.time >= smoke.duration) {
                continue
            }

            setBufferAttribute(smokeInstance.geometry, "aTime", smoke.time / smoke.duration, smoke.id)
            setMatrixAt({
                instance: smokeInstance,
                index: smoke.id,
                position: smoke.position,
                scale: smoke.scale,
            })

            // compact in place, keeps spawn order so newer puffs win a shared slot
            smokes[alive++] = smoke
        }

        smokes.length = alive
    })

    return (
        <instancedMesh
            ref={setSmokeInstance}
            args={[undefined, undefined, SMOKE_COUNT]}
            layers={depthIgnoreLayers}
            frustumCulled={false}
            castShadow
        >
            <sphereGeometry args={[1, 18, 18]}>
                <instancedBufferAttribute
                    attach="attributes-aTime"
                    args={[times, 1]}
                />
            </sphereGeometry>
            <smokeMaterial depthWrite={false} ref={setMaterial} />
        </instancedMesh>
    )
}
