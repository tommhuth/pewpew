import { useGLTF } from "@react-three/drei"
import { useEffect, useRef } from "react"
import { InstancedMesh, Mesh } from "three"
import terrainModel from "@assets/models/terrain.glb"
import { d, getCellPosition, TerrainType, w } from "@lib/world/terrain"
import { useStore } from "@lib/store"
import { setMatrixAt } from "@lib/helpers/utils"
import TerrainMaterial from "./terrain-material"

const MAX_PARTS = 12
const CAPACITY = MAX_PARTS * w * d
const types = Object.values(TerrainType)

export default function WorldTerrain() {
    const { nodes } = useGLTF(terrainModel) as unknown as { nodes: Record<TerrainType, Mesh> }
    const parts = useStore(i => i.world.parts)
    const meshes = useRef<Partial<Record<TerrainType, InstancedMesh>>>({})

    useEffect(() => {
        const counts = Object.fromEntries(types.map(type => [type, 0])) as Record<TerrainType, number>

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
            <TerrainMaterial />
        </instancedMesh>
    ))
}

useGLTF.preload(terrainModel)
