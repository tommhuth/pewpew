import { useGLTF } from "@react-three/drei"
import { useEffect, useLayoutEffect, useRef } from "react"
import { InstancedMesh, Mesh } from "three"
import groundModel from "@assets/models/ground.glb"
import { d, getCellPosition, GroundType, w } from "@lib/terrain"
import { useStore } from "@lib/store"
import { setMatrixAt } from "@lib/helpers/utils"
import GroundMaterial from "./ground-material"

const MAX_PARTS = 12
const CAPACITY = MAX_PARTS * w * d
const types = Object.values(GroundType)

export default function WorldGround() {
    const { nodes } = useGLTF(groundModel) as unknown as { nodes: Record<GroundType, Mesh> }
    const parts = useStore(i => i.world.parts)
    const meshes = useRef<Partial<Record<GroundType, InstancedMesh>>>({})

    useEffect(() => {
        const counts = Object.fromEntries(types.map(type => [type, 0])) as Record<GroundType, number>

        for (const part of parts) {
            for (let z = 0; z < part.terrain.length; z++) {
                for (let x = 0; x < part.terrain[z].length; x++) {
                    const cell = part.terrain[z][x]
                    const instance = meshes.current[cell.type]

                    if (!instance || counts[cell.type] >= CAPACITY) {
                        continue
                    }

                    setMatrixAt({
                        instance,
                        index: counts[cell.type]++,
                        position: getCellPosition(x, z, part.position),
                        rotation: [0, cell.rotation * Math.PI / 2, 0],
                    })
                }
            }
        }
    }, [parts])

    return types.map(type => (
        <instancedMesh
            key={type}
            ref={(instance: InstancedMesh | null) => {
                if (instance) {
                    meshes.current[type] = instance
                } else {
                    delete meshes.current[type]
                }
            }}
            args={[nodes[type].geometry, undefined, CAPACITY]}
            castShadow
            frustumCulled={false}
            receiveShadow
        >
            <GroundMaterial />
        </instancedMesh>
    ))
}

useGLTF.preload(groundModel)
