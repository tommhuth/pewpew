import { useTransitionedState } from "@src/hooks/use-transitioned-state"
import { BufferGeometry, DoubleSide, Float32BufferAttribute, InstancedMesh, Vector3 } from "three"
import random from "@huth/random"
import { LEAF_COUNT } from "@lib/const"
import { useStore } from "@lib/store"
import { addScaled, ndelta, scaleXZ, setMatrixAt } from "@lib/helpers/utils"
import { getWorldTerrainHeightAt } from "@lib/world/terrain"
import LoopCounter from "@lib/helpers/loop-counter"
import { useInstanceClear } from "@src/hooks/use-instance-clear"
import { Leaf } from "@src/types/explosion"
import { Tuple2, Tuple3 } from "@src/types/global"
import { useFrame } from "@react-three/fiber"
import { useLights } from "@components/effects/lights/lights"
import type { LeafMaterial } from "./leaf-material"

export const leaves: Leaf[] = []

const leafIndex = new LoopCounter(LEAF_COUNT)

export interface CreateLeavesParams {
    position: Tuple3 // center of the spawn box
    size?: Tuple3 // spawn box
    spread?: Tuple3 // extra jitter on top of size
    velocity?: Tuple3 // each leaf gets 50-100% of this
    count?: Tuple2 | number
}

export function createLeaves({
    position,
    size = [1, 1, 1],
    spread = [.5, .5, .5],
    velocity = [0, 0, 0],
    count = 8,
}: CreateLeavesParams) {
    const amount = Array.isArray(count) ? random.integer(...count) : count

    for (let i = 0; i < amount; i++) {
        leaves.push({
            index: leafIndex.next(),
            position: [
                position[0] + random.float(-size[0] / 2, size[0] / 2) + random.float(-spread[0] / 2, spread[0] / 2),
                position[1] + random.float(-size[1] / 2, size[1] / 2) + random.float(-spread[1] / 2, spread[1] / 2),
                position[2] + random.float(-size[2] / 2, size[2] / 2) + random.float(-spread[2] / 2, spread[2] / 2),
            ],
            velocity: [
                random.float(velocity[0] * .5, velocity[0]),
                random.float(velocity[1] * .5, velocity[1]),
                random.float(velocity[2] * .5, velocity[2]),
            ],
            scale: random.float(.85, 2),
            phase: random.float(0, Math.PI * 2),
        })
    }
}

// rounded leaf with pointy tip and small stem-end point
const geometry = new BufferGeometry()

geometry.setAttribute("position", new Float32BufferAttribute([
    0, 0, 0, // 0 center
    0, .11, 0, // 1 tip
    -.04, .06, 0, // 2
    -.07, 0, 0, // 3 widest left
    -.05, -.06, 0, // 4
    0, -.09, 0, // 5 base point
    .05, -.06, 0, // 6
    .07, 0, 0, // 7 widest right
    .04, .06, 0, // 8
], 3))
geometry.setIndex([
    0, 1, 2,
    0, 2, 3,
    0, 3, 4,
    0, 4, 5,
    0, 5, 6,
    0, 6, 7,
    0, 7, 8,
    0, 8, 1,
])
geometry.computeVertexNormals()

const GRAVITY = 1
const _position = new Vector3()
const _rotation: Tuple3 = [0, 0, 0]

export default function LeafMesh() {
    const [leafInstance, setLeafInstance] = useTransitionedState<InstancedMesh | null>(null)
    const [material, setMaterial] = useTransitionedState<LeafMaterial | null>(null)

    useInstanceClear(leafInstance, LEAF_COUNT)
    useLights(material?.uLights)

    useFrame((state, delta) => {
        const { world, player } = useStore.getState()

        if (!leafInstance || !player.object) {
            return
        }

        const nd = ndelta(delta)
        const damping = Math.pow(.98, nd * 60)
        const diagonal = 10

        // backwards so removing while looping is safe
        for (let i = leaves.length - 1; i >= 0; i--) {
            const leaf = leaves[i]
            const { position, velocity } = leaf

            if (position[2] < player.object.position.z - diagonal) {
                leaves.splice(i, 1)
                continue
            }

            velocity[1] -= GRAVITY * nd

            leaf.phase += nd * 5
            addScaled(position, velocity, nd)
            // flutter
            position[0] += Math.sin(leaf.phase) * 2 * nd
            position[2] += Math.cos(leaf.phase * .7) * 2 * nd

            scaleXZ(velocity, damping)

            // landed, the instance is left where it is until the slot is reused
            if (position[1] <= getWorldTerrainHeightAt(world.parts, _position.set(...position))) {
                leaves.splice(i, 1)
                continue
            }

            _rotation[0] = leaf.phase * .5
            _rotation[1] = leaf.phase * .3
            _rotation[2] = leaf.phase * .7

            setMatrixAt({
                instance: leafInstance,
                index: leaf.index,
                position,
                rotation: _rotation,
                scale: leaf.scale,
            })
        }
    })

    return (
        <instancedMesh
            ref={setLeafInstance}
            args={[geometry, undefined, LEAF_COUNT]}
            frustumCulled={false}
        >
            <leafMaterial
                ref={setMaterial}
                side={DoubleSide}
                shininess={87}
            />
        </instancedMesh>
    )
}
