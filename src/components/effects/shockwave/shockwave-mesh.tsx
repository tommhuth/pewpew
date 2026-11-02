import { Ref } from "react"
import { useTransitionedState } from "@src/hooks/use-transitioned-state"
import { InstancedBufferAttribute, InstancedMesh, SphereGeometry } from "three"
import random from "@huth/random"
import { SHOCKWAVE_COUNT } from "@lib/const"
import { depthIgnoreLayers } from "@components/effects/depth/depth-layers"
import { clamp, setBufferAttribute, setMatrixAt } from "@lib/helpers/utils"
import { easeOutCubic } from "@lib/helpers/shaping"
import LoopCounter from "@lib/helpers/loop-counter"
import { useDepth } from "@components/effects/depth/use-depth"
import { ShockwaveMaterial } from "./shockwave-material"
import { Shockwave } from "@src/types/explosion"
import { Tuple3 } from "@src/types/global"

const geometry = new SphereGeometry(1, 10, 10)

geometry.setAttribute("aTime", new InstancedBufferAttribute(new Float32Array(SHOCKWAVE_COUNT), 1))

const shockwaveIndex = new LoopCounter(SHOCKWAVE_COUNT)

export function createShockwave(radius: number): Shockwave {
    return {
        lifetime: random.float(700, 800),
        radius,
        time: 0,
        index: shockwaveIndex.next(),
    }
}

// ring grows out from the explosion center
export function updateShockwave(instance: InstancedMesh, shockwave: Shockwave, position: Tuple3) {
    const t = clamp(shockwave.time / shockwave.lifetime)

    setBufferAttribute(instance.geometry, "aTime", t, shockwave.index)
    setMatrixAt({
        instance,
        index: shockwave.index,
        position: [position[0], position[1] + 1, position[2]],
        scale: easeOutCubic(t) * shockwave.radius,
    })
}

export default function ShockwaveMesh({ ref }: { ref: Ref<InstancedMesh> }) {
    const [material, setMaterial] = useTransitionedState<ShockwaveMaterial | null>(null)

    useDepth(material?.uniforms)

    return (
        <instancedMesh
            ref={ref}
            args={[geometry, undefined, SHOCKWAVE_COUNT]}
            layers={depthIgnoreLayers}
            frustumCulled={false}
        >
            <shockwaveMaterial ref={setMaterial} />
        </instancedMesh>
    )
}
