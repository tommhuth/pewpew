import { spacebits, SpacebitsMaterial } from "@components/world/spacebits-material"
import { getHitMaterial, getSpacebitsMeshes } from "@components/world/spacebits-material-pool"
import { ndelta } from "@lib/helpers/utils"
import { useFrame } from "@react-three/fiber"
import { RefObject } from "react"
import { BufferGeometry, Group, Mesh } from "three"

export function useSpacebitsMaterialSwap(ref: RefObject<Mesh<BufferGeometry, SpacebitsMaterial> | Group | null>) {
    useFrame((state, delta) => {
        if (!ref.current) {
            return
        }

        let meshes = getSpacebitsMeshes(ref.current)
        let material = getHitMaterial(meshes)

        if (!material) {
            return
        }

        // shared by all the meshes, so damp it once
        material.update(ndelta(delta))

        if (material.uHit.value < .01) {
            material.uHit.value = 0

            for (let i = 0; i < meshes.length; i++) {
                meshes[i].material = spacebits
            }
        }
    })
}
