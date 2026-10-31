import { useState } from "react"
import { useFrame } from "@react-three/fiber"
import { InstancedMesh, LinearFilter, PlaneGeometry, TextureLoader } from "three"
import random from "@huth/random"
import { DECAL_COUNT } from "@lib/const"
import { depthIgnoreLayers } from "@lib/depth"
import { setMatrixAt } from "@lib/helpers/utils"
import LoopCounter from "@lib/helpers/loop-counter"
import { useInstanceClear } from "@src/hooks/use-instance-clear"
import { Decal } from "@src/types/explosion"
import { Tuple3 } from "@src/types/global"
import decalTextureUrl from "@assets/textures/decal.png"

// waiting to be placed, drained every frame
export const decals: Decal[] = []

const decalIndex = new LoopCounter(DECAL_COUNT)

// impact decal, position is on the ground, stays until its slot is reused
export function createDecal(position: Tuple3, scale = random.float(2, 3)) {
    decals.push({
        index: decalIndex.next(),
        // lifted a bit so it doesnt fight the ground
        position: [position[0], position[1] + random.float(.01, .02), position[2]],
        rotation: random.float(0, Math.PI * 2),
        scale,
    })
}

const geometry = new PlaneGeometry(1.5, 1.5, 1, 1)
const texture = new TextureLoader().load(decalTextureUrl)

texture.magFilter = LinearFilter
texture.minFilter = LinearFilter

export default function DecalMesh() {
    const [decalInstance, setDecalInstance] = useState<InstancedMesh | null>(null)

    useInstanceClear(decalInstance, DECAL_COUNT)

    useFrame(() => {
        if (!decalInstance) {
            return
        }

        for (const decal of decals) {
            setMatrixAt({
                instance: decalInstance,
                index: decal.index,
                position: decal.position,
                // flat, spun around its own normal
                rotation: [-Math.PI * .5, 0, decal.rotation],
                scale: decal.scale,
            })
        }

        decals.length = 0
    })

    return (
        <instancedMesh
            ref={setDecalInstance}
            args={[geometry, undefined, DECAL_COUNT]}
            receiveShadow
            layers={depthIgnoreLayers}
            frustumCulled={false}
            visible={false}
        >
            <meshLambertMaterial
                color="#333"
                map={texture}
                transparent
                depthWrite={false}
            />
        </instancedMesh>
    )
}
