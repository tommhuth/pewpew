import { useGLTF } from "@react-three/drei"
import { useEffect } from "react"
import { BufferGeometry, InstancedMesh, Mesh } from "three"
import terrainModel from "@assets/models/terrain.glb"
import { MAP_DEPTH, getCellPosition, TerrainType, MAP_WIDTH } from "@lib/world/terrain"
import { useStore } from "@lib/store"
import { setMatrixAt } from "@lib/helpers/utils"
import { useTransitionedState } from "@src/hooks/use-transitioned-state"
import { useInstanceClear } from "@src/hooks/use-instance-clear"
import { WorldPart } from "@src/types/world"
import { terrainMaterial } from "./terrain-material"

const MAX_PARTS = 12
const types = Object.values(TerrainType)
// most cells of a type per part, base types can fill a whole part
const cellsPerPart: Partial<Record<TerrainType, number>> = {
    [TerrainType.HOLE]: 10,
    [TerrainType.TALL_HOLE]: 10,
}

function getCapacity(type: TerrainType) {
    return MAX_PARTS * (cellsPerPart[type] ?? MAP_WIDTH * MAP_DEPTH)
}

type TerrainMeshProps = {
    type: TerrainType
    geometry: BufferGeometry
    parts: WorldPart[]
}

function TerrainMesh({ type, geometry, parts }: TerrainMeshProps) {
    const [instance, setInstance] = useTransitionedState<InstancedMesh | null>(null)
    const capacity = getCapacity(type)

    useInstanceClear(instance, capacity)

    useEffect(() => {
        if (!instance) {
            return
        }

        let index = 0

        for (const part of parts) {
            for (let z = 0; z < part.terrain.length; z++) {
                for (let x = 0; x < part.terrain[z].length; x++) {
                    const cell = part.terrain[z][x]

                    if (cell.type !== type || index >= capacity) {
                        continue
                    }

                    setMatrixAt({
                        instance,
                        index: index++,
                        position: getCellPosition(x, z, part.position),
                        rotation: [0, cell.rotation * Math.PI / 2, 0],
                    })
                }
            }
        }
    }, [instance, parts, type, capacity])

    return (
        <instancedMesh
            ref={setInstance}
            args={[geometry, terrainMaterial, capacity]}
            castShadow
            frustumCulled={false}
            renderOrder={-2}
            receiveShadow
        />
    )
}

export default function WorldTerrain() {
    const { nodes } = useGLTF(terrainModel) as unknown as { nodes: Record<TerrainType, Mesh> }
    const parts = useStore(i => i.world.parts)

    return types.map(type => (
        <TerrainMesh
            key={type}
            type={type}
            geometry={nodes[type].geometry}
            parts={parts}
        />
    ))
}

useGLTF.preload(terrainModel)
