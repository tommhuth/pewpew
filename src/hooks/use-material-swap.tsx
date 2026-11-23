import type { SpacebitsMaterial } from "@components/entities/spacebits-material"
import { getHitMaterial, getMeshes, hitMaterial, MaterialPool } from "@components/entities/material-pool"
import { ndelta } from "@lib/helpers/utils"
import { useFrame } from "@react-three/fiber"
import { RefObject, useCallback } from "react"
import { Group, Mesh } from "three"

export function useMaterialSwap<T extends SpacebitsMaterial>(
    ref: RefObject<Mesh | Group | null>,
    pool: MaterialPool<T>
) {
    useFrame((state, delta) => {
        if (!ref.current) {
            return
        }

        let meshes = getMeshes(ref.current)
        let material = getHitMaterial(meshes, pool)

        if (!material) {
            return
        }

        // shared by all the meshes, so damp it once
        material.update(ndelta(delta))

        if (material.uHit.value < .01) {
            material.uHit.value = 0

            for (let i = 0; i < meshes.length; i++) {
                meshes[i].material = pool.base
            }
        }
    })

    return useCallback(() => hitMaterial(ref.current, pool), [ref, pool])
}
