import { useTransitionedState } from "@src/hooks/use-transitioned-state"
import { useFrame } from "@react-three/fiber"
import { InstancedBufferAttribute, InstancedMesh, PlaneGeometry } from "three"
import random from "@huth/random"
import { DECAL_COUNT } from "@lib/const"
import { depthIgnoreLayers } from "@components/effects/depth/depth-layers"
import { clamp, ndelta, setBufferAttribute, setMatrixAt } from "@lib/helpers/utils"
import LoopCounter from "@lib/helpers/loop-counter"
import { useInstanceClear } from "@src/hooks/use-instance-clear"
import { useLights } from "@components/effects/lights/lights"
import { useDepth } from "@components/effects/depth/use-depth"
import { DecalMaterial } from "./decal-material"
import { Decal } from "@src/types/explosion"
import { Tuple3 } from "@src/types/global"

export const decals: Decal[] = []

const decalIndex = new LoopCounter(DECAL_COUNT)

export function createDecal(position: Tuple3, scale = 3) {
    decals.push({
        index: decalIndex.next(),
        // lifted a bit so it doesnt fight the ground
        position: [position[0], position[1] + random.float(.01, .02), position[2]],
        rotation: random.float(0, Math.PI * 2),
        scale,
        time: 0,
        lifetime: random.integer(1500, 2500)
    })
}

const geometry = new PlaneGeometry(1, 1, 1, 1)

geometry.rotateX(-Math.PI * .5)
geometry.setAttribute("aTime", new InstancedBufferAttribute(new Float32Array(DECAL_COUNT), 1))

export default function DecalMesh() {
    const [decalInstance, setDecalInstance] = useTransitionedState<InstancedMesh | null>(null)
    const [material, setMaterial] = useTransitionedState<DecalMaterial | null>(null)

    useInstanceClear(decalInstance, DECAL_COUNT)
    useLights(material?.uniforms.uLights)
    useDepth(material?.uniforms)

    useFrame((state, delta) => {
        if (!decalInstance) {
            return
        }

        // backwards so removing while looping is safe
        for (let i = decals.length - 1; i >= 0; i--) {
            const decal = decals[i]
            const t = clamp(decal.time / decal.lifetime, 0, 1)

            decal.time += ndelta(delta) * 1_000

            setBufferAttribute(geometry, "aTime", t, decal.index)
            setMatrixAt({
                instance: decalInstance,
                index: decal.index,
                position: decal.position,
                rotation: [0, decal.rotation, 0],
                scale: decal.scale,
            })

            // fully grown, the slot keeps its last matrix and time until reused
            if (t >= 1) {
                decals.splice(i, 1)
            }
        }
    })

    return (
        <instancedMesh
            ref={setDecalInstance}
            args={[geometry, undefined, DECAL_COUNT]}
            layers={depthIgnoreLayers}
            frustumCulled={false}
            renderOrder={-1}
        >
            <decalMaterial ref={setMaterial} />
        </instancedMesh>
    )
}
