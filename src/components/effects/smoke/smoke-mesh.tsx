import { useTransitionedState } from "@src/hooks/use-transitioned-state"
import { useFrame } from "@react-three/fiber"
import { InstancedMesh, Vector3 } from "three"
import random from "@huth/random"
import { SMOKE_COUNT, WORLD_LEFT_EDGE, WORLD_RIGHT_EDGE } from "@lib/const"
import { useStore } from "@lib/store"
import { depthIgnoreLayers } from "@components/effects/depth/depth-layers"
import { clamp, map, ndelta, setMatrixAt } from "@lib/helpers/utils"
import { getWorldTerrainHeightAt } from "@lib/world/terrain"
import LoopCounter from "@lib/helpers/loop-counter"
import { useInstanceClear } from "@src/hooks/use-instance-clear"
import { Tuple2, Tuple3 } from "@src/types/global"
import { useDepth } from "@components/effects/depth/use-depth"
import { useLights } from "@components/effects/lights/lights"
import { SmokeMaterial } from "./smoke-material"
import { damp } from "three/src/math/MathUtils.js"

export interface Smoke {
    position: Tuple3
    velocity: Tuple3
    radius: number
    maxRadius: number
    damping: number
    index: number
}

export const smokes: Smoke[] = []

const smokeIndex = new LoopCounter(SMOKE_COUNT)

export interface CreateSmokeParams {
    position: Tuple3
    offset?: [x: Tuple2, y: Tuple2, z: Tuple2] // additional position offset
    count?: Tuple2 | number
    radius?: Tuple2 // start radius
    maxRadius?: Tuple2
    grow?: Tuple2 // extra growth rate while spreading on the ground
    speed?: Tuple2 // falling speed
    spread?: Tuple2 // outwards speed along the ground
    damping?: number // ms spreading on the ground
}

export function createSmoke({
    position,
    offset = [[-.1, .1], [-.3, -.1], [-.1, .1]],
    count = 1,
    radius = [.05, .2],
    maxRadius = [.5, 2],
    speed = [4, 6],
    spread = [0, 1],
}: CreateSmokeParams) {
    const amount = Array.isArray(count) ? random.integer(...count) : count

    for (let i = 0; i < amount; i++) {
        const angle = random.float(0, Math.PI * 2)

        smokes.push({
            index: smokeIndex.next(),
            position: [
                position[0] + random.float(...offset[0]),
                position[1] + random.float(...offset[1]),
                position[2] + random.float(...offset[2]),
            ],
            velocity: [
                Math.cos(angle) * random.float(...spread),
                -random.float(...speed),
                Math.sin(angle) * random.float(...spread),
            ],
            radius: random.float(...radius),
            maxRadius: random.float(...maxRadius),
            damping: random.boolean(.1) ? 2 : random.float(.1, .4),
        })
    }
}

const times = new Float32Array(SMOKE_COUNT)
const _position = new Vector3()

export default function SmokeMesh() {
    const [smokeInstance, setSmokeInstance] = useTransitionedState<InstancedMesh | null>(null)
    const [material, setMaterial] = useTransitionedState<SmokeMaterial | null>(null)

    useInstanceClear(smokeInstance, SMOKE_COUNT)
    useDepth(material?.uniforms)
    useLights(material?.uniforms.uLights)

    useFrame((_, delta) => {
        const { world, player } = useStore.getState()

        if (!smokeInstance || !material || !player.object) {
            return
        }

        const nd = ndelta(delta)
        const diagonal = 12

        material.uniforms.uTime.value += nd

        for (let i = smokes.length - 1; i >= 0; i--) {
            const smoke = smokes[i]
            const { position, velocity } = smoke

            if (position[2] < player.object.position.z - diagonal) {
                smokes.splice(i, 1)
                continue
            }

            const groundAt = Math.max(0, getWorldTerrainHeightAt(world.parts, _position.set(...position)))
            // relative to the ground so tall terrain spreads and grows like low terrain
            const nearGround = map(position[1] - groundAt, 0, .5, 1, 0)

            position[0] += velocity[0] * nd * nearGround
            position[2] += velocity[2] * nd * nearGround

            smoke.radius += (nearGround) * 1 * nd

            if (position[1] <= groundAt) {
                velocity[0] = damp(velocity[0], 0, smoke.damping, nd)
                position[1] = damp(position[1], groundAt - smoke.maxRadius, smoke.damping * 1.2, nd)
                velocity[2] = damp(velocity[2], 0, smoke.damping, nd)
            } else {
                position[1] = Math.max(position[1] + velocity[1] * nd, groundAt)
                smoke.radius += Math.min(smoke.damping, .5) * 2 * nd
            }

            smoke.radius = Math.min(smoke.radius, smoke.maxRadius)
            smoke.position[0] = clamp(smoke.position[0], WORLD_RIGHT_EDGE + smoke.radius * .5, WORLD_LEFT_EDGE - smoke.radius * .5)

            setMatrixAt({
                instance: smokeInstance,
                index: smoke.index,
                position,
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
            castShadow
            receiveShadow
        >
            <sphereGeometry args={[1, 12, 12]}>
                <instancedBufferAttribute
                    attach="attributes-aTime"
                    args={[times, 1]}
                />
            </sphereGeometry>
            <smokeMaterial ref={setMaterial} />
        </instancedMesh>
    )
}
